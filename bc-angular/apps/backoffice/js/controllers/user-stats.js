(function(window, angular, Application) {
    'use strict';

    var UserStatsController = function($scope, $location, MongoQuery) {

        $scope.query = $location.search();
        var DEFAULT_QUERY = {
            q_ignore: false,
            pageSize: 10000
        };
        $scope.range = {};
        if ($scope.query.start) {
            $scope.range.start = new Date($scope.query.start);
        }
        if ($scope.query.end) {
            $scope.range.end = new Date($scope.query.end);
        }

        $scope.warning = "";

        $scope.buttonClass = function(term, value) {
            if ($scope.query[term] !== undefined && $scope.query[term] === value) {
                return 'btn-success';
            } else {
                return 'btn-primary';
            }
        };

        $scope.toggleSearch = function(term, value) {
            if ($scope.query[term] !== undefined && $scope.query[term] === value) {
                delete $scope.query[term];
            } else {
                $scope.query[term] = value;
            }
            $location.search($scope.query);
        };

        var groupByIp = function(users) {
            var ips = {};
            users.forEach(function(user) {
                if (ips[user.ip]) {
                    var record = ips[user.ip];
                    record.username += ', ' + user.username;
                } else {
                    ips[user.ip] = user;
                }
            });
            var response = {
                total: 0,
                result: []
            };
            for(var ip in ips) {
                if (ips.hasOwnProperty(ip)) {
                    response.total += 1;
                    response.result.push(ips[ip]);
                }
            }
            response.result.sort(function(a, b) {
                var acount = a.username.split(', ').length;
                var bcount = b.username.split(', ').length;
                if (acount > bcount) {
                    return -1;
                } else {
                    return 1;
                }
            });
            return response;
        };

        $scope.getCreatedUsers = function(range) {
            range = range || $scope.range;
            var query = angular.extend({}, DEFAULT_QUERY);
            query = angular.extend(query, $scope.query);
            query = angular.extend(query, {
                collection: 'user',
                q_createdAt: [
                    '__gte_' + range.start.toISOString(),
                    '__lt_' + range.end.toISOString()
                ],
                q_anonymous: false
            });
            MongoQuery.get(query, function(data) {
                $scope.usersCreated = data;
                if (data.total > DEFAULT_QUERY.pageSize) {
                    $scope.warning = "More than " + DEFAULT_QUERY.pageSize + " users created, the unique IP numbers will be off";
                } else {
                    $scope.warning = "";
                }
                $scope.uniqueIps = groupByIp(data.result);
                var userIds = data.result.map(function(user) {
                    return user._id;
                });
                var query = {
                    collection: 'transaction',
                    type: 'aggregate',
                    m_type: 'deposit',
                    m_createdAt: [
                        '__gte_' + range.start.toISOString(),
                        '__lt_' + range.end.toISOString()
                    ],
                    m_userId: '__in_' + userIds.join('||'),
                    g__id: '$userId',
                    g_userId: '__first_$userId',
                    g_count: '__sum_1',
                    g_amount: '__sum_$credit',
                    mapUsers: true
                };
                MongoQuery.query(query, function(data) {
                    data.forEach(function(record) {
                        record.username = record.user.username;
                        record.email = record.user.email || record.user.pendingEmail;
                        record.ip = record.user.ip;
                        record.locale = record.user.locale;
                        record.updatedAt = record.user.updatedAt;
                    });
                    $scope.newUsersWithDeposits = {
                        result: data,
                        total: data.length
                    };
                });
            });
        };

        $scope.getCreatedAnonymousUsers = function(range) {
            range = range || $scope.range;
            var query = angular.extend({}, DEFAULT_QUERY);
            query = angular.extend(query, $scope.query);
            query = angular.extend(query, {
                collection: 'user',
                q_createdAt: [
                    '__gte_' + range.start.toISOString(),
                    '__lt_' + range.end.toISOString()
                ],
                q_anonymous: true
            });
            MongoQuery.get(query, function(data) {
                $scope.anonymousUsersCreated = data;
                $scope.anonymousUniqueIps = groupByIp(data.result);
                var userIds = data.result.map(function(user) {
                    return user._id;
                });
                var query = {
                    collection: 'transaction',
                    type: 'aggregate',
                    m_type: 'deposit',
                    m_createdAt: [
                        '__gte_' + range.start.toISOString(),
                        '__lt_' + range.end.toISOString()
                    ],
                    m_userId: '__in_' + userIds.join('||'),
                    g__id: '$userId',
                    g_userId: '__first_$userId',
                    g_count: '__sum_1',
                    g_amount: '__sum_$credit',
                    mapUsers: true
                };
                MongoQuery.query(query, function(data) {
                    data.forEach(function(record) {
                        record.username = record.user.username;
                        record.email = record.user.email || record.user.pendingEmail;
                        record.ip = record.user.ip;
                        record.locale = record.user.locale;
                        record.updatedAt = record.user.updatedAt;
                    });
                    $scope.anonymousNewUsersWithDeposits = {
                        result: data,
                        total: data.length
                    };
                });
            });
        };

        $scope.getVerifiedUsers = function(range) {
            range = range || $scope.range;
            var query = angular.extend({}, DEFAULT_QUERY);
            query = angular.extend(query, $scope.query);
            query = angular.extend(query, {
                collection: 'user',
                q_email: '__exists_true',
                q_verifiedAt: [
                    '__gte_' + range.start.toISOString(),
                    '__lt_' + range.end.toISOString()
                ],
                q_anonymous: false
            });
            MongoQuery.get(query, function(data) {
                $scope.usersVerified = data;
            });
        };

        $scope.getActiveUsers = function(range) {
            range = range || $scope.range;
            var query = angular.extend({}, DEFAULT_QUERY);
            query = angular.extend(query, $scope.query);
            query = angular.extend(query, {
                collection: 'user',
                q_updatedAt: [
                    '__gte_' + range.start.toISOString(),
                    '__lt_' + range.end.toISOString()
                ],
                q_anonymous: false
            });
            MongoQuery.get(query, function(data) {
                $scope.usersActive = data;
            });
        };

        $scope.getActiveAnonymousUsers = function(range) {
            range = range || $scope.range;
            var query = angular.extend({}, DEFAULT_QUERY);
            query = angular.extend(query, $scope.query);
            query = angular.extend(query, {
                collection: 'user',
                q_updatedAt: [
                    '__gte_' + range.start.toISOString(),
                    '__lt_' + range.end.toISOString()
                ],
                q_anonymous: true
            });
            MongoQuery.get(query, function(data) {
                $scope.anonymousUsersActive = data;
            });
        };

        $scope.getUsersWithDeposits = function(range) {
            range = range || $scope.range;
            var query = {
                collection: 'transaction',
                type: 'aggregate',
                m_type: 'deposit',
                m_createdAt: [
                    '__gte_' + range.start.toISOString(),
                    '__lt_' + range.end.toISOString()
                ],
                g__id: '$userId',
                g_userId: '__first_$userId',
                g_count: '__sum_1',
                g_amount: '__sum_$credit',
                mapUsers: true
            };
            MongoQuery.query(query, function(data) {
                data.forEach(function(record) {
                    record.username = record.user.username;
                    record.email = record.user.email || record.user.pendingEmail;
                    record.ip = record.user.ip;
                    record.locale = record.user.locale;
                    record.updatedAt = record.user.updatedAt;
                });
                $scope.usersWithDeposits = {
                    result: data,
                    total: data.length
                };
            });
        };

        $scope.getVerifiedWallets = function(range) {
            range = range || $scope.range;
            var query = {
                collection: 'wallet',
                type: 'aggregate',
                m_withdrawAddress: '__exists_true',
                m_verifiedAt: [
                    '__gte_' + range.start.toISOString(),
                    '__lt_' + range.end.toISOString()
                ],
                g__id_user: '$userId',
                g__id_currency: '$currency',
                g_userId: '__first_$userId',
                g_count: '__sum_1',
                mapUsers: true
            };
            MongoQuery.query(query, function(data) {
                data.forEach(function(record) {
                    record.username = record.user.username;
                    record.email = record.user.email || record.user.pendingEmail;
                    record.ip = record.user.ip;
                    record.locale = record.user.locale;
                    record.updatedAt = record.user.updatedAt;
                    record._id = record._id.user;
                });
                $scope.verifiedWallets = {
                    result: data,
                    total: data.length
                };
            });
        };

        $scope.getCashflow = function(range) {
            range = range || $scope.range;
            var query = {
                collection: 'transaction',
                type: 'aggregate',
                m_type: '__or_deposit||withdraw',
                m_createdAt: [
                    '__gte_' + range.start.toISOString(),
                    '__lt_' + range.end.toISOString()
                ],
                g__id_type: '$type',
                g__id_currency: '$currency',
                g_count: '__sum_1',
                g_credit: '__sum_$credit',
                g_debit: '__sum_$debit'
            };
            MongoQuery.query(query, function(datum) {
                var cashflow = {};
                datum.forEach(function(data) {
                    var currency = data._id.currency;
                    var type = data._id.type;
                    if (!cashflow[currency]) {
                        cashflow[currency] = {
                            deposited: 0,
                            withdrawn: 0,
                            depositCount: 0,
                            withdrawCount: 0,
                            houseProfit: 0
                        };
                    }
                    cashflow[currency].deposited += data.credit;
                    cashflow[currency].withdrawn += data.debit;
                    cashflow[currency].houseProfit += data.credit;
                    cashflow[currency].houseProfit -= data.debit;
                    cashflow[currency][type+"Count"] += data.count;
                });
                $scope.cashflow = cashflow;
            });
        };

        $scope.rangeChanged = function(range) {
            $scope.range = range;
            $scope.getCreatedUsers();
            $scope.getActiveUsers();
            $scope.getCreatedAnonymousUsers();
            $scope.getActiveAnonymousUsers();
            $scope.getVerifiedUsers();
            $scope.getUsersWithDeposits();
            $scope.getVerifiedWallets();

            $scope.getCashflow();
        };
    };

    Application.Controllers.controller('UserStatsController', [
        '$scope',
        '$location',
        'MongoQuery',
        UserStatsController
    ]);

})(window, window.angular, window.Application);
