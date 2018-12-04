'use strict';
/* global BaseGameHistoryController */

var HistoryController = function($scope, $routeParams, BCSession, BCPlayer, Game) {
    $scope.tableType = $routeParams.type || 'global';
    $scope.wheelSpinning = false;
    $scope.gameNames = ["?", "3x", "5x", "10x", "2x", "15x", "25x"];

    HistoryController.super_.call(this, $scope, $routeParams, BCSession, BCPlayer, Game);
};

angular.inherits(HistoryController, BaseGameHistoryController);
Application.Controllers.controller('HistoryController', ["$scope", "$routeParams", "BCSession", "BCPlayer", "Game", HistoryController]);
