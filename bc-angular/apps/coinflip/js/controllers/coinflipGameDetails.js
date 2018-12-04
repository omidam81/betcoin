'use strict';

/* global BaseGameDetailsController */

var CoinflipGameDetailsController = function($scope, $routeParams, $window, BCSession, BCPlayer, Game) {
    var coinToText = function(coin) {
        return (coin === 1) ? "Tails" : "Heads";
    };
    
    CoinflipGameDetailsController.super_.call(this, $scope, $routeParams, $window, BCSession, BCPlayer, Game);

    $scope.$on('gameResultLoaded', function() {

        $scope.game.c1 = "";
        $scope.game.c2 = "";
        $scope.game.rc2 = "";
        $scope.game.rc2 = "";
        $scope.game.doubleCoins = ($scope.game.bet.sides.length === 2);

        var a = $scope.game.result.split(',');
        $scope.game.rc1 = coinToText(+a[0]);
        if ($scope.game.doubleCoins) {
            $scope.game.rc2 = coinToText(+a[1]);
        }
        $scope.game.c1 = coinToText($scope.game.bet.sides[0]);
        if ($scope.game.doubleCoins) {
            $scope.game.c2 = coinToText($scope.game.bet.sides[1]);
        }

    });
};

angular.inherits(CoinflipGameDetailsController, BaseGameDetailsController);
Application.Controllers.controller('CoinflipGameDetailsController', ["$scope", "$routeParams", "$window", "BCSession", "BCPlayer", "Game", CoinflipGameDetailsController]);

