'use strict';

var PlayerController = function($scope, $routeParams, PlayerStats, PlayerModifier) {
    $scope.lockUser = function(){
        PlayerModifier.lockUser({}, {playerId: $routeParams.playerId}, function(){
            $scope.playerDetails.lock = true;
        });
    };

    $scope.unlockUser = function(){
        PlayerModifier.unlockUser({}, {playerId: $routeParams.playerId}, function(){
            $scope.playerDetails.lock = false;
        });
    };

    $scope.trustUser = function(){
        PlayerModifier.trustUser({}, {playerId: $routeParams.playerId}, function(){
            $scope.playerDetails.trusted = true;
        });
    };

    $scope.untrustUser = function(){
        PlayerModifier.untrustUser({}, {playerId: $routeParams.playerId}, function(){
            $scope.playerDetails.trusted = false;
        });
    };
    $scope.omitUser = function(){
        PlayerModifier.omitUser({}, {playerId: $routeParams.playerId}, function(){
            $scope.playerDetails.omitted = true;
        });
    };

    $scope.unomitUser = function(){
        PlayerModifier.unomitUser({}, {playerId: $routeParams.playerId}, function(){
            $scope.playerDetails.omitted = false;
        });
    };

    $scope.playerDetails = PlayerStats.getPlayer({}, {
        playerId: $routeParams.playerId
    });
    var query = [{
        datapoints: [{
            name: 'transaction_userid',
            lookup:{
                operator: 'eq',
                value: $routeParams.playerId
            }
        },{
            name: 'transaction_type',
            lookup:{
                operator: 'in',
                value: ['withdraw', 'deposit']
            }
        },{
            name: 'transaction_amount'
        },{
            name: 'transaction_date'
        }],
        sort: {datapoint:'transaction_date', order: -1},
        page: 1,
        size: 1
    }];

    $scope.transactions = PlayerStats.genericFilter({q:JSON.stringify(query)});
    $scope.gameStats = [];

    $scope.getPlayerGameStats = function(games) {
        games.forEach(function(gameParam){
            PlayerStats.getPlayerGameStats({},{playerId: $routeParams.playerId, game: gameParam.game}, function(data){
                if(!data[0]){
                    return;
                }
                $scope.gameStats.push({type: gameParam.name, data: data});
            });
        });
    };
    $scope.getPlayerGameStats([
        {
            game:'circle', name: 'CIRCLE'
        },
        {
            game:'reel', name: 'REEL'
        },
        {
            game:'roulette', name: 'ROULETTE'
        },
        {
            game:'sicbo', name: 'SICBO'
        },
        {
            game:'fortune', name: 'FORTUNE'
        },
        {
            game:'war', name: 'WAR'
        },
        {
            game:'hilo', name: 'HILO'
        },
        {
            game:'bj', name: 'BLACKJACK'
        },
        {
            game:'baccarat', name: 'BACCARAT'
        },
        {
            game:'paigow', name: 'PAIGOW'
        },
        {
            game:'keno', name: 'KENO'
        },
        {
            game:'coinflip', name: 'COINFLIP'
        }
    ]);

    $scope.$watch('gameStats.length', function(){
        $scope.totalHouseEdge = $scope.getAccountHouseEdge();
    });

    $scope.getAccountHouseEdge = function(){
        var totalHouseEdge, totalWinningAmount = 0, totalLossAmount = 0;
        $scope.gameStats.forEach(function(stats){
            totalWinningAmount += stats.data[0].winningAmountTotal;
            totalLossAmount += stats.data[0].lossAmountTotal;
        });
        totalHouseEdge = ((totalWinningAmount - totalLossAmount)/totalLossAmount)*100;
        return totalHouseEdge;
    };
};

Application.Controllers.controller('PlayerController', ['$scope', '$routeParams', 'PlayerStats', 'PlayerModifier', PlayerController]);
