(function(window, moment, Application) {
    'use strict';

    var ConfigurationController = function($scope, $routeParams, Config) {
        $scope.loading = true;

        $scope.types = {
            bonusLevel: {
                path: 'bonus',
                label: 'Bonus Levels'
            },
            CashoutLimit: {
                path: 'cashout',
                label: 'Cashout Limits'
            },
            Confirmations: {
                path: 'confirmations',
                label: 'Deposit Confirmations'
            },
            MaxMatchBonus: {
                path: 'max-match',
                label: 'Match Bonus Max'
            },
            BetLimits: {
                path: 'bet-limits',
                label: 'Bet Limits'
            },
            welcomeBonus: {
                path: 'welcome-bonus',
                label: 'Welcome Bonus'
            },
            repWelcomeBonus: {
                path: 'rep-welcome-bonus',
                label: 'Rep Welcome Bonus'
            },
            jackpots: {
                path: 'jackpots',
                label: 'Jackpots'
            },
            maintenanceApps: {
                path: 'maintenance-apps',
                label: 'Maintenance Apps'
            },
            associateBonus: {
                path: 'associate-bonus',
                label: 'Associate Bonuses Enhancements'
            }
        };

        $scope.updateLimit = function(limit) {
            console.log(limit);
            limit.$save(function() {
                $scope.setMessage("Update Saved!");
            });
        };

        $scope.loadOptions = function() {
            $scope.loading = true;
            Config.query({
                search: $scope.type
            }, function(data) {
                $scope.options = data;
                if (data.length === 1) {
                    $scope.config = data[0];
                }
                $scope.$broadcast('options loaded', data);
                $scope.error = false;
                $scope.loading = false;
            }, function(err) {
                $scope.error = err;
            });
        };

        for (var type in $scope.types) {
            if ($scope.types.hasOwnProperty(type)) {
                if ($routeParams.type === $scope.types[type].path) {
                    $scope.type = type;
                    $scope.template = "tpl/configs/" + $scope.types[type].path + ".html";
                }
            }
        }
        $scope.loadOptions();
    };

    Application.Controllers.controller('ConfigurationController', [
        '$scope',
        '$routeParams',
        'Config',
        ConfigurationController
    ]);

    var CashoutLimitController = function($scope, MongoQuery) {
        $scope.getTotalsForToday = function() {
            MongoQuery.query({
                type: 'aggregate',
                collection: 'transaction',
                // match
                m_type: 'withdraw',
                m_createdAt: [
                    '__gte_' + moment.utc().startOf('day').valueOf(),
                    '__lt_' + moment.utc().add(1, 'day').startOf('day').valueOf()
                ],
                // grouping
                g__id: '$currency',
                g_total: '__sum_$debit',
                g_count: '__sum_1'
            }, function(data) {
                $scope.totals = data;
            });
        };
        $scope.getTotalsForToday();
    };

    Application.Controllers.controller('CashoutLimitController', [
        '$scope',
        'MongoQuery',
        CashoutLimitController
    ]);

    var BonusConfigurationController = function($scope) {
        $scope.maps = ['NONE','BRONZE','SILVER','GOLD','DIAMOND','PLATINUM'];

        $scope.updateBonusLevel = function(level) {
            delete level.status;
            if(level.level === undefined && !level._id){
                return;
            }
            level.$save({
                confId: level._id || 'bonusLevel' + level.level
            }, function(data){
                level = data;
                level.status = 'Accepted';
            });
        };

        $scope.addBonusLevel = function() {
            $scope.options = $scope.options || [];
            var level = {};
            ['match','straight'].forEach(function(type){
                level[type] = {};
                $scope.CURRENCIES.forEach(function(cny){
                    level[type][cny] = {amount: 0, rollover: 0};
                });
            });
            $scope.options.push({
                _id: undefined,
                value: level
            });
        };
    };

    Application.Controllers.controller('BonusConfigurationController', [
        '$scope',
        'Config',
        BonusConfigurationController
    ]);

    var MaintenanceAppsController = function($scope) {
        $scope.$on('options loaded', function() {
            $scope.options = $scope.$parent.$parent.options;
            $scope.maintenanceApps = $scope.options[0].value;
            $scope.availableGames = $scope.GAMES.filter(function(game) {
                return $scope.maintenanceApps.indexOf(game) < 0;
            });
        });

        $scope.blockGame = function(game) {
            var index = $scope.availableGames.indexOf(game);
            if (index < 0) {
                console.error(game, "is not available to block!");
                return;
            }
            var spliced = $scope.availableGames.splice(index, 1);
            $scope.maintenanceApps.push(spliced[0]);
            $scope.options[0].$save();
        };

        $scope.unblockGame = function(game) {
            var index = $scope.maintenanceApps.indexOf(game);
            if (index < 0) {
                console.error(game, "is not available to unblock!");
                return;
            }
            var spliced = $scope.maintenanceApps.splice(index, 1);
            $scope.availableGames.push(spliced[0]);
            $scope.options[0].$save();
        };
    };

    Application.Controllers.controller('MaintenanceAppsController', [
        '$scope',
        MaintenanceAppsController
    ]);

    var AssociateBonusController = function($scope, Config) {
        Config.query({
            search: 'vipLevels'
        }, function(data) {
            $scope.vipLevels = data[0].value;
        }, function(err) {
            $scope.error = err;
        });
        $scope.updateLimit = function(limit) {
            limit.value.matchMultipliers.forEach(function(val, index) {
                val = parseFloat(val);
                if (isNaN(val)) {
                    throw "Invalild value used for a multiplier";
                }
                limit.value.matchMultipliers[index] = val;
            });
            if (limit.value.startingVipLevel) {
                limit.value.startingVipLevel = parseInt(limit.value.startingVipLevel, 10);
            }
            limit.$save(function() {
                $scope.setMessage("Update Saved!");
            });
        };
    };

    Application.Controllers.controller('AssociateBonusController', [
        '$scope',
        'Config',
        AssociateBonusController
    ]);

})(window, window.moment, window.Application);
