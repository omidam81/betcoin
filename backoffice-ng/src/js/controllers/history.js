'use strict';

var HistoryController = function($scope, $routeParams, PlayerStats, CircleApi, ReelsApi, Games, DataQuery) {
    $scope.type = $routeParams.type;
    $scope.data = {
        datapoints: {
            transaction_userid: {
                name: 'User Id',
                lookup: {
                    operator: 'eq',
                    value: $routeParams.playerId
                }
            },
            transaction_refId: {
                name: 'Transaction refId'
            },
            transaction_meta: {
                name: 'Transaction Meta'
            },
            transaction_date: {
                name: 'Date'
            },
            transaction_amount: {
                name: 'Amount'
            },
            transaction_game_type: {
                name: 'Game Type'
            },
            transaction_game_action: {
                name: 'Game Type'
            },
            transaction_is_game: {
                name: 'Is Game Type',
                lookup: {
                    operator: 'eq',
                    value: true
                }
            }
        }
    };

    $scope.loadTransactions = function(page) {
        $scope.type = 'transaction';
        $scope.transactionList = PlayerStats.getTransactions({
            page: page
        }, $routeParams, function(result) {
            $scope.total = result.total;
        });
    };
    $scope.loadGameHistory = function() {
        $scope.type = 'game';
        // $scope.gameList = PlayerStats.getGameHistory({
        //     page: page
        // }, $routeParams, function(games) {
        //     $scope.total = games.total;
        // });
    };
    $scope.loadMessageHistory = function() {
        $scope.type = 'message';
        PlayerStats.getMessages({}, $routeParams, function(messages) {
            $scope.messages = messages;
        });
    };
    $scope.loadAffiliates = function() {
        $scope.type = 'affiliates';
        $scope.associates = PlayerStats.getAssociatesTotals({}, {affiliateId: $routeParams.playerId});
    };
    $scope.onSelectPage = function(page) {
        if ($scope.type === 'transaction') {
            $scope.loadTransactions(page);
        }
    };
    $scope.loadGameDetails = function(gameId, gameType) {
        if (gameType === 'circle') {
            $scope.gameDetails = CircleApi.get({
                id: gameId
            });
        }
        if (gameType === 'reel') {
            $scope.gameDetails = ReelsApi.get({
                id: gameId
            });
        }
    };
    $scope.loadUnplayedGames = function() {
        $scope.type = 'unplayed';
        $scope.unplayedGames = Games.getUnplayedGames({target: $routeParams.playerId});
    };
    $scope.loadIPHistory = function() {
        $scope.type = 'iphistory';
        $scope.ips = PlayerStats.getIPHistory({target: $routeParams.playerId});
    };
    $scope.hasProperty = function(obj) {
        if(!obj){
            return false;
        }
        return Object.keys(obj).length > 0;
    };

    $scope.totalsData = {
        datapoints:[{
            transaction_userid: {
                pre_match: {
                    operator: 'eq',
                    value: $routeParams.playerId
                }
            },
            transaction_date: {
                pre_match: {
                    operator: 'gte'
                }
            },
            transaction_game_type: {
                pre_match:{
                    operator: 'contains'
                }
            },
            transaction_game_won_total: {},
            transaction_game_wager_total: {}
        }]
    };
    $scope.totalsInDateRange = function(range) {
        $scope.type = 'game';

        if(!range){
            range = {
                start: new Date(),
                end: new Date()
            };
        }
        $scope.range = range;
        range.since = range.start.toISOString();
        range.until = range.end.toISOString();
        $scope.data.datapoints.transaction_date.lookup = {operator:'gte', value:range.since};

        $scope.totalsData.datapoints[0].transaction_date.pre_match.value = range.since;
        var gameTypeLookup = $scope.data.datapoints.transaction_game_type.lookup.value;
        if(gameTypeLookup !== 'any'){
            $scope.totalsData.datapoints[0].transaction_game_type = {
                pre_match:{
                    value: gameTypeLookup,
                    operator: 'contains'
                }
            };
        }else{
            delete $scope.totalsData.datapoints[0].transaction_game_type;
        }
        var dataQuery = DataQuery.generate($scope.totalsData.datapoints[0], -1, undefined, -1);
        console.log(JSON.stringify(dataQuery));
        var dataQueries = [dataQuery[0]];
        $scope.totals = PlayerStats.genericFilter({
            q: JSON.stringify(dataQueries)
        }, function(data){
            $scope.totals = data.results;
        });
    };
    $scope.player = PlayerStats.getPlayer({}, $routeParams);
    if ($scope.type === 'transaction') {
        $scope.loadTransactions();
    }
    if ($scope.type === 'game') {
        $scope.loadGameHistory();
    }
    if ($scope.type === 'message') {
        $scope.loadMessageHistory();
    }
    if ($scope.type === 'affiliates') {
        $scope.loadAffiliates();
    }
    if ($scope.type === 'unplayed') {
        $scope.loadUnplayedGames();
    }
    if ($scope.type === 'iphistory') {
        $scope.loadIPHistory();
    }
    if (!$scope.type) {
        $scope.type = 'playerDetails';
    }
};

Application.Controllers.controller('HistoryController', ['$scope', '$routeParams', 'PlayerStats', 'CircleApi', 'ReelsApi', 'Games', 'DataQuery', HistoryController]);