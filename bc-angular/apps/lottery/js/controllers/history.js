'use strict';

/* global BaseGameHistoryController */

var HistoryController = function($scope, $routeParams, BCSession, BCPlayer, Game) {
    $scope.tableType = $routeParams.type || 'global';
    HistoryController.super_.call(this, $scope, $routeParams, BCSession, BCPlayer, Game);
    $scope.lotteries = Game.getLotteries();
    $scope.updateGames = function(newGame) {
        if(!newGame){
            return;
        }
        for(var i=0; i<$scope.lotteries.length; i++){
            if($scope.lotteries[i]._id === newGame._id){
                $scope.lotteries[i] = newGame;
                return;
            }
        }
        if($scope.lotteries.length >= 30){
            $scope.lotteries.pop();
        }
        $scope.lotteries.unshift(newGame);
    };

    $scope.$on('winner selected', function(event, data){
        var game = data.lottery;
        $scope.updateGames(game);
    });
};

angular.inherits(HistoryController, BaseGameHistoryController);
Application.Controllers.controller('HistoryController', [
    "$scope",
    "$routeParams",
    "BCSession",
    "BCPlayer",
    "Game",
    HistoryController
]);