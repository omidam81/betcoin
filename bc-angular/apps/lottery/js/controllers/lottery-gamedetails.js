'use strict';

/* global BaseGameDetailsController */

var LotteryGameDetailsController = function($scope, $routeParams, $window, BCSession, BCPlayer, Game) {
    var controller = this;
    controller.loadGame = function() {
        return Game.getLottery(controller.getLoadGameDetailsParams(), controller.loadGame_OnSuccess.bind(controller));
    };
    LotteryGameDetailsController.super_.call(this, $scope, $routeParams, $window, BCSession, BCPlayer, Game);
    Game.query({lottery_id: $scope.gameID, limit: 9999}, function(data){
        $scope.bets = data;
    });
};

angular.inherits(LotteryGameDetailsController, BaseGameDetailsController);
Application.Controllers.controller('LotteryGameDetailsController', [
    "$scope",
    "$routeParams",
    "$window",
    "BCSession",
    "BCPlayer",
    "Game",
    LotteryGameDetailsController
]);

