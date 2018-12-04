(function(window, angular, async, Application) {
    'use strict';

    var UserController = function($scope, $routeParams, MongoQuery, Config) {
        $scope.userId = $routeParams.userId;
        $scope.pane = $routeParams.pane || 'account';
        $scope.template = 'tpl/user/' + $scope.pane + '.html';

        $scope.loadUser = function() {
            MongoQuery.get({
                collection: 'user',
                id: $scope.userId
            }, function(data) {
                $scope.user = data;
                if (!$scope.user.cashoutLimits) {
                    $scope.user.cashoutLimits = {
                        total: (0.01).toSatoshi(),
                        count: 10
                    };
                }
                $scope.wallets = data.wallets;
                Config.query({
                    search: 'vipLevel'
                }, function(data) {
                    $scope.vipLevels = data[0].value;
                    $scope.newLevel = $scope.user.vipLevel || 0;
                });
            });
        };
        $scope.loadUser();

        $scope.showGames = function(gameName) {
            $scope.activeGame = gameName;
        };
    };

    var UserHistoryController = function($scope, MongoQuery) {
        $scope.gameData = {};
        $scope.getGameData = function() {
            MongoQuery.query({
                type: 'aggregate',
                collection: 'transaction',
                // match
                m_type: '__contains_(wager|winnings)',
                m_userId: $scope.userId,
                m_createdAt: [
                    '__gte_' + $scope.range.start.toISOString(),
                    '__lt_' + $scope.range.end.toISOString()
                ],
                // group
                g__id_currency: '$currency',
                g__id_type: '$type',
                g_wagered: '__sum_$debit',
                g_won: '__sum_$credit',
                g_count: '__sum_1'
            }, function(data) {
                var gameData = {};
                data.forEach(function(grouping) {
                    var gameName = grouping._id.type.split(":")[0];
                    var currency = grouping._id.currency;
                    if (!gameData[gameName]) {
                        gameData[gameName] = {};
                    }
                    var currencyData = gameData[gameName][currency];
                    if (!currencyData) {
                        currencyData = gameData[gameName][currency] = {
                            count: 0,
                            wagered: 0,
                            won: 0,
                            _id: currency
                        };
                    }
                    currencyData.count += grouping.count;
                    currencyData.wagered += grouping.wagered;
                    currencyData.won += grouping.won;
                });
                Object.keys(gameData).forEach(function(game) {
                    $scope.gameData[game] = [];
                    Object.keys(gameData[game]).forEach(function(currency) {
                        $scope.gameData[game].push(gameData[game][currency]);
                    });
                });
            });
        };


        $scope.cashflow = [];
        $scope.getCashflow = function() {
            $scope.cashflow = MongoQuery.query({
                type: 'aggregate',
                collection: 'transaction',
                // match
                m_type: '__or_deposit||withdraw',
                m_userId: $scope.userId,
                m_createdAt: [
                    '__gte_' + $scope.range.start.toISOString(),
                    '__lt_' + $scope.range.end.toISOString()
                ],
                // project
                p_credit: '$credit',
                p_debit: '$debit',
                p_currency: '$currency',
                p_isCredit: '__cmp_$credit_to_0',
                p_isDebit: '__cmp_$debit_to_0',
                // group
                g__id: '$currency',
                g_totalWithdraw: '__sum_$debit',
                g_totalDeposit: '__sum_$credit',
                g_withdrawCount: '__sum_$isDebit',
                g_depositCount: '__sum_$isCredit'
            });
        };

        $scope.rangeChanged = function(range) {
            $scope.range = range;
            $scope.getCashflow();
            $scope.getGameData();
        };
    };

    var UserAccountController = function($scope, $http, Api, MongoQuery) {


        $scope.bonuses = {};
        $scope.getBonuses = function() {
            $scope.bonuses = MongoQuery.get({
                collection: 'bonus',
                q_userId: $scope.userId,
                __sort: 'offeredAt__asc'
            });
        };

        $scope.getBonuses();

        $scope.getCashflowOverview = function() {
            async.parallel([
                function getDepositInfo(done) {
                    MongoQuery.query({
                        type: 'aggregate',
                        collection: 'transaction',
                        // match
                        m_type: 'deposit',
                        m_userId: $scope.userId,
                        // group
                        g__id: '$currency',
                        g_total: '__sum_$credit',
                        g_count: '__sum_1',
                        g_first: '__min_$createdAt',
                        g_last: '__max_$createdAt',
                        g_type: '__first_$type'
                    }, function(data) {
                        return done(undefined, data);
                    });
                },
                function getWithdrawInfo(done) {
                    MongoQuery.query({
                        type: 'aggregate',
                        collection: 'transaction',
                        // match
                        m_type: 'withdraw',
                        m_userId: $scope.userId,
                        // group
                        g__id: '$currency',
                        g_total: '__sum_$debit',
                        g_count: '__sum_1',
                        g_first: '__min_$createdAt',
                        g_last: '__max_$createdAt',
                        g_type: '__first_$type'
                    }, function(data) {
                        return done(undefined, data);
                    });
                }
            ], function(err, data) {
                $scope.cashflowOverview = data;
            });
        };

        $scope.getCashflowOverview();

        $scope.currencyOptions = angular.copy($scope.CURRENCIES);

        $scope.creditForm = {
            currency: $scope.currencyOptions[0],
            amountDecimal: 0,
            reason: 'adjustment',
            memo: '',
            action: 'credit',
            userId: $scope.userId
        };

        $scope.creditUser = function() {
            var creditData = angular.copy($scope.creditForm);
            creditData.amount = parseFloat(creditData.amountDecimal).toSatoshi();
            delete creditData.amountDecimal;
            var creditConfirm = window.confirm(creditData.action[0].toUpperCase() + creditData.action.slice(1) + "ing " +
                                               creditData.amount.toBitcoin() + " " +
                                               creditData.currency + " to " + $scope.user.username);
            if (creditConfirm) {
                $http.post(Api.httpUrl + '/transaction/' + creditData.action, creditData)
                    .success(function() {
                        $scope.creditForm = {
                            currency: $scope.currencyOptions[0],
                            amountDecimal: 0,
                            reason: 'adjustment',
                            memo: '',
                            action: 'credit',
                            userId: $scope.userId
                        };
                        $scope.error = undefined;
                        $scope.loadUser();
                    })
                    .error(function(err) {
                        $scope.error = err;
                    });
            }
        };

        $scope.lockForm = {
            reason: "suspicious"
        };

        $scope.lockUser = function(reason) {
            if (reason === undefined) {
                reason = $scope.lockForm.reason || true;
            }
            $http.post(Api.httpUrl + '/user/' + $scope.userId + '/lock', {
                lock: reason
            }).success(function() {
                $scope.lockForm = {
                    reason: "suspicious"
                };
                $scope.lockError = undefined;
                $scope.loadUser();
            }).error(function(err) {
                $scope.lockError = err;
            });
        };

        $scope.ignoreForm = {
            reason: "developer"
        };

        $scope.ignoreUser = function(reason) {
            if (reason === undefined) {
                reason = $scope.ignoreForm.reason || true;
            }
            $http.post(Api.httpUrl + '/user/' + $scope.userId + '/ignore', {
                ignore: reason
            }).success(function() {
                $scope.ignoreForm = {
                    reason: "developer"
                };
                $scope.ignoreError = undefined;
                $scope.loadUser();
            }).error(function(err) {
                $scope.ignoreError = err;
            });
        };

        $scope.disableForm = {
            reason: "suspicious"
        };

        $scope.disableUser = function(reason) {
            if (reason === undefined) {
                reason = $scope.disableForm.reason || true;
            }
            $http.post(Api.httpUrl + '/user/' + $scope.userId + '/disable', {
                disable: reason
            }).success(function() {
                $scope.disableForm = {
                    reason: "suspicious"
                };
                $scope.disableError = undefined;
                $scope.loadUser();
            }).error(function(err) {
                $scope.disableError = err;
            });
        };

        $scope.cashoutUser = function(currency) {
            $http.post(Api.httpUrl + '/user/' + $scope.userId + '/cashout', {
                currency: currency
            }).success(function() {
                $scope.error = undefined;
                $scope.loadUser();
            }).error(function(err) {
                $scope.error = err;
            });
        };

        $scope.changeWithdraw = function(currency) {
            $http.post(Api.httpUrl + '/user/' + $scope.userId + '/withdraw', {
                currency: currency,
                address: $scope.wallets[currency].withdrawAddress
            }).success(function() {
                $scope.error = undefined;
                $scope.setMessage("Withdraw address changed for " + currency);
                $scope.loadUser();
            }).error(function(err) {
                $scope.error = err;
            });

        };

        $scope.passwordForm = {
            password: ""
        };

        $scope.changePassword = function(password) {
            if (password === undefined) {
                password = $scope.passwordForm.password || true;
            }
            $http.post(Api.httpUrl + '/user/' + $scope.userId + '/password', {
                password: password
            }).success(function() {
                $scope.passwordForm = {
                    password: ""
                };
                $scope.passwordError = undefined;
                $scope.setMessage("Password changed");
                $scope.loadUser();
            }).error(function(err) {
                $scope.passwordError = err;
            });
        };

        $scope.updateCashoutLimits = function() {
            $http.post(Api.httpUrl +
                       '/user/' + $scope.userId + '/cashout-limits',
                       $scope.user.cashoutLimits).success(function() {
                $scope.setMessage("Cashout limits changed");
                $scope.loadUser();
            }).error(function(err) {
                console.error(err);
            });
        };

        $scope.bonusForm = {
            isMatch: true,
            amountDecimal: 0,
            currency: $scope.currencyOptions[0],
            rollover: 58
        };

        // use default rollover values for match/straight bonuses
        $scope.$watch('bonusForm.isMatch', function(newVal) {
            if (newVal === false && $scope.bonusForm.rollover === 58) {
                $scope.bonusForm.rollover = 38;
            } else if (newVal === true && $scope.bonusForm.rollover === 38) {
                $scope.bonusForm.rollover = 58;
            }
        });

        $scope.giveBonus = function() {
            var postData = {};
            if ($scope.bonusForm.isMatch) {
                postData.type = 'match';
                postData.rollover = parseInt($scope.bonusForm.rollover);
            } else {
                postData.type = 'straight';
                postData.rollover = parseInt($scope.bonusForm.rollover, 10);
                postData.currency = $scope.bonusForm.currency;
                postData.amount = parseFloat($scope.bonusForm.amountDecimal).toSatoshi();
            }
            console.debug(postData);
            $http.post(Api.httpUrl + '/user/' + $scope.userId + '/bonus', postData).success(function() {
                $scope.bonusForm = {
                    isMatch: true,
                    amountDecimal: 0,
                    currency: $scope.currencyOptions[0],
                    rollover: 58
                };
                $scope.bonusError = null;
                $scope.getBonuses();
            }).error(function(err) {
                $scope.bonusError = err;
            });
        };

        $scope.messageForm = {
            subject: '',
            message: '',
            sendEmail: true
        };

        $scope.sendMessage = function() {
            var message = angular.copy($scope.messageForm);
            message.userIds = [$scope.user._id];
            $http.post(Api.httpUrl + '/message', message)
                .success(function() {
                    $scope.setMessage("Message sent");
                    $scope.error = null;
                    $scope.messageForm = {
                        subject: '',
                        message: '',
                        sendEmail: true
                    };
                })
                .error(function(error) {
                    $scope.error = error;
                });
        };

        $scope.lockVip = function(unlock) {
            var action = unlock ? 'unblock' : 'block';
            $http.post(Api.httpUrl + '/user/' + $scope.userId + '/vip/' + action, {}).success(function() {
                $scope.vipLockError = null;
                $scope.loadUser();
            }).error(function(err) {
                $scope.vipLockError = err;
            });
        };

        $scope.changeVipLevel = function(level) {
            $http.post(Api.httpUrl + '/user/' + $scope.userId + '/vip-level', {
                level: level
            }).success(function() {
                $scope.vipLevelError = null;
                $scope.loadUser();
            }).error(function(err) {
                $scope.vipLevelError = err;
            });
        };
    };

    var UserAffiliateController = function($scope, MongoQuery) {
        $scope.getAssociates = function() {
            $scope.associates = MongoQuery.get({
                collection: 'user',
                q_affiliate: '__oid_' + $scope.userId
            });
        };

        $scope.getAffiliateReport = function() {
            $scope.affiliateReport = MongoQuery.query({
                type: 'aggregate',
                collection: 'transaction',
                mapUsers: true,
                // match
                m_type: 'affiliate',
                m_userId: $scope.userId,
                // project
                p_credit: '$credit',
                p_currency: '$currency',
                p_userId: '$meta.associate',
                // group
                g__id_currency: '$currency',
                g__id_associate: '$userId',
                g_userId: '__first_$userId',
                g_total: '__sum_$credit',
                g_count: '__sum_1',
            }, function(data) {
                var totals = {};
                data.forEach(function(record) {
                    var currency = record._id.currency;
                    if (totals[currency] === undefined) {
                        totals[currency] = 0;
                    }
                    totals[currency] += record.total;
                });
                console.debug(totals);
                $scope.affiliateTotals = totals;
            });
        };

        $scope.getAssociates();
        $scope.getAffiliateReport();
    };

    Application.Controllers.controller('UserController', [
        '$scope',
        '$routeParams',
        'MongoQuery',
        'Config',
        UserController
    ]);

    Application.Controllers.controller('UserHistoryController', [
        '$scope',
        'MongoQuery',
        UserHistoryController
    ]);

    Application.Controllers.controller('UserAccountController', [
        '$scope',
        '$http',
        'Api',
        'MongoQuery',
        UserAccountController
    ]);

    Application.Controllers.controller('UserAffiliateController', [
        '$scope',
        'MongoQuery',
        UserAffiliateController
    ]);

})(window, window.angular, window.async, window.Application);
