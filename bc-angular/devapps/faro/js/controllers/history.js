'use strict';

/* global BaseGameHistoryController */

var HistoryController = function($scope, $routeParams, BCSession, BCPlayer, Game) {
    $scope.tableType = $routeParams.type || 'global';
    HistoryController.super_.call(this, $scope, $routeParams, BCSession, BCPlayer, Game);
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