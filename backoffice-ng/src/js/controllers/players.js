'use strict';

var PlayersController = function($scope, $location, $window, PlayerStats, HouseBalance, UserNotification, Api, DataQuery, Bonus) {
    $scope.type = 'users';
    $scope.bonus = {
        type: "match",
        // initial: 0.5,
        max: 1.8
    };
    $scope.data = {
        datapoints: {
            userid: {
                name: 'User Id'
            },
            username: {
                name: 'Username'
            },
            email: {
                name: 'Email'
            },
            balance_btc: {
                name: 'BTC Balance'
            },
            deposit_address: {
                name: 'Deposit Address'
            },
            withdraw_address: {
                name: 'Withdraw Address'
            },
            last_activity_time: {
                name: 'Last Activity Time',
                lookupTransform: function(datapoint) {
                    var stripTime = function(date) {
                        var newDate = new Date();
                        newDate.setUTCDate(date.getDate());
                        newDate.setUTCMonth(date.getMonth());
                        newDate.setUTCFullYear(date.getFullYear());
                        newDate.setUTCHours(0);
                        newDate.setUTCMinutes(0);
                        newDate.setUTCSeconds(0);
                        newDate.setUTCMilliseconds(0);
                        return newDate;
                    };

                    var now = new Date();
                    datapoint.lookup = {
                        operator: 'lt',
                        value: stripTime(new Date(now - (datapoint.lookup.value * 24 * 60 * 60 * 1000))).toISOString()
                    };
                    return datapoint;
                }
            },
            email_verified: {
                name: 'Email Verified'
            },
            user_status: {
                name: 'User Status'
            },
            user_created_datetime: {
                name: 'User Created Datetime'
            },
            is_online: {
                name: 'Is Online'
            },
            signin_num: {
                name: '# of Sign In'
            },
            anonymous_upgraded_datetime: {
                name: 'Anonymous Upgraded Datetime'
            },
            is_omitted: {
                name: 'Is Omitted',
                lookup: {
                    value: 'false'
                }
            }
        }
    };
    $scope.sort = {
        datapoint: 'last_activity_time',
        order: -1
    };
    $scope.totalsSort = {
        datapoint: 'transaction_deposited_total',
        order: -1
    };
    $scope.showSearch = function() {
        $scope.type = 'search';
        $scope.total = 0;
    };
    $scope.searchTransactions = function(range, page) {
        $scope.loading = true;
        $scope.range = range;
        $scope.page = page || 1;
        var criteria = {
            lifetimeField: $scope.data.lifetimeField,
            lifetimeCompare: $scope.data.lifetimeCompare,
            lifetimeValue: $scope.data.lifetimeValue,
            rangeField: $scope.data.rangeField,
            rangeCompare: $scope.data.rangeCompare,
            rangeValue: $scope.data.rangeValue,
            since: range.start.toISOString(),
            until: range.end.toISOString(),
            page: page
        };
        $scope.playerList = PlayerStats.searchTransactions(criteria, function(playerList) {
            $scope.loading = false;
            $scope.total = playerList.total;
        });
    };
    $scope.getSelectedUserIds = function(){
        if(!$scope.data.return.results){
            return 0;
        }
        var selectedUserIds = [];
        $scope.data.return.results.forEach(function(player){
            if(player.selected){
                selectedUserIds.push(player.userid);
            }
        });
        return selectedUserIds;
    };
    $scope.sendBonus = function() {
        $scope.sendingBonus = true;
        $scope.sendBonusError = null;
        $scope.data.datapoints.userid.lookup = {
            operator: 'in',
            value: $scope.getSelectedUserIds()
        };
        var queries = DataQuery.generate($scope.data.datapoints);
        delete queries[0].page;
        delete queries[0].size;
        var bonusData = {};
        if ($scope.bonus.type === "match") {
            bonusData.bonusName = "match";
            bonusData.max = parseFloat($scope.bonus.max).toSatoshi();
        } else if ($scope.bonus.type === "straight") {
            bonusData.bonusName = "straight";
            // bonusData.initial = parseFloat($scope.bonus.initial).toSatoshi();
        } else {
            throw "invalid bonus type " + $scope.bonus.type;
        }
        bonusData.dataQueries = queries;
        Bonus.give(bonusData, function(res) {
            $scope.bonus.type = "match";
            if(!res.failedIds || res.failedIds.length === 0){
                $('#bonus-form').collapse('hide');
            }
            if(res.failedIds && res.failedIds.length > 0){
                $scope.sendBonusError = "Failed User Ids: " + res.failedIds.join(',');
            }
            $scope.sendingBonus = false;
        }, function(res){
            $scope.sendBonusError = "Internal Error: " + res.data.code;
            $scope.sendingBonus = false;
        });
        delete $scope.data.datapoints.userid.lookup;
    };
    $scope.sendMessage = function() {
        $scope.sendMessageError = null;
        $scope.data.datapoints.userid.lookup = {
            operator: 'in',
            value: $scope.getSelectedUserIds()
        };
        var queries = DataQuery.generate($scope.data.datapoints);
        delete queries[0].page;
        delete queries[0].size;
        UserNotification.save({
            dataQueries: queries,
            subject: $scope.data.notification.subject,
            message: $scope.data.notification.message,
            sendEmail: $scope.data.notification.sendEmail
        }, function(res) {
            $scope.data.notification.subject = null;
            $scope.data.notification.message = null;
            $scope.data.notification.sendEmail = false;
            if(!res.failedIds || res.failedIds.length === 0){
                $('#message-body').collapse('hide');
            }
            if(res.failedIds && res.failedIds.length !== 0){
                $scope.sendMessageError = 'Failed User Ids: ' + res.failedIds.join(',');
            }
        }, function(res) {
            $scope.sendMessageError = 'Internal Error Code: ' + res.data.code;
        });
        delete $scope.data.datapoints.userid.lookup;
    };
    $scope.getPlayerStats = function(playerId) {
        $scope.loading = true;
        $scope.playerStats = PlayerStats.getPlayer({}, {
            playerId: playerId
        }, function() {
            $scope.loading = false;
        });
    };
    $scope.export = function() {
        $scope.data.datapoints.userid.lookup = {
            operator: 'in',
            value: $scope.getSelectedUserIds()
        };
        var dataQueries = DataQuery.generate($scope.data.datapoints, undefined, $scope.sort);
        delete dataQueries[0].page;
        $scope.loadingCSV = true;
        PlayerStats.getCSV({q: JSON.stringify(dataQueries)}, function(data){
            $scope.loadingCSV = false;
            var objectUrl = encodeURI('data:text/csv;charset=utf-8,'+data.csv);
            window.open(objectUrl);
        });
        delete $scope.data.datapoints.userid.lookup;
    };
    $scope.loadOnlineUsers = function() {
        $scope.type = 'users';
        $scope.data.datapoints.is_online.lookup.value = 'true';
        $scope.data.datapoints.is_omitted.lookup = {value:'false'};
        var dataQueries = DataQuery.generate($scope.data.datapoints, undefined, $scope.sort);
        $scope.data.return = PlayerStats.genericFilter({
            q: JSON.stringify(dataQueries)
        });
    };
    $scope.toggleSelection = function() {
        if(!$scope.data.allSelection){
            $scope.data.allSelection = true;
        }else{
            $scope.data.allSelection = !$scope.data.allSelection;
        }
        $scope.data.return.results.forEach(function(player){
            if($scope.data.allSelection === true){
                player.selected = true;
            }else{
                player.selected = false;
            }
        });
    };
    $scope.totalsData = {
        datapoints:[{
            userid: {},
            is_omitted: {
                lookup:{
                    value: 'false'
                }
            }
        }, {
            transaction_userid: {
                result_match: {
                    operator: 'in',
                    value: 'userid'
                }
            },
            transaction_date: {
                pre_match: {
                    operator: 'gte'
                }
            },
            transaction_deposited_total: {},
            transaction_withdrawn_total: {},
            transaction_game_won_total: {},
            transaction_game_wager_total: {},
            transaction_bonus_total: {},
            NGR: {},
            GGR: {}
        }]};
    $scope.totalsInDateRange = function(range) {
        $scope.type = 'totals';
        if(!range){
            range = {
                start: new Date(),
                end: new Date()
            };
        }
        $scope.range = range;
        range.since = range.start.toISOString();
        range.until = range.end.toISOString();
        $scope.totalsData.datapoints[1].transaction_date.pre_match.value = range.since;
        var omittedUserQuery = DataQuery.generate($scope.totalsData.datapoints[0], -1, undefined, -1);
        var dataQuery = DataQuery.generate($scope.totalsData.datapoints[1], -1, $scope.totalsSort, -1);
        var dataQueries = [omittedUserQuery[0], dataQuery[0]];
        $scope.totals = PlayerStats.genericFilter({
            q: JSON.stringify(dataQueries)
        }, function(data){
            $scope.totals = data.results;
        });
    };
    $scope.searchUsersByIP = function(ip) {
        $scope.type = 'ips';
        $scope.playersByIp = PlayerStats.getUsersByIP({target: ip});
    };
    $scope.hasProperty = function(val) {
        if(!val) {
            return false;
        }
        return Object.keys(val).length > 0;
    };
    $scope.$watch('data.return.results', function(){
        $scope.data.allSelection = false;
    });

    $scope.totalRegistered = PlayerStats.getTotal({}, {
        type: 'registered'
    });
    $scope.totalAnonymous = PlayerStats.getTotal({}, {
        type: 'anonymous'
    });
    $scope.totalNotVerified = PlayerStats.getTotal({}, {
        type: 'notverified'
    });
    $scope.totalOnline = PlayerStats.getTotal({}, {
        type: 'online'
    });
};

Application.Controllers.controller('PlayersController', [
    '$scope',
    '$location',
    '$window',
    'PlayerStats',
    'HouseBalance',
    'UserNotification',
    'Api',
    'DataQuery',
    'Bonus',
    PlayersController
]);
