'use strict';

/* global BaseGameHistoryController */

var HistoryController = function($scope, $rootScope, $routeParams, BCSession, BCPlayer, Game) {
    HistoryController.super_.call(this, $scope, $routeParams, BCSession, BCPlayer, Game);
};

angular.inherits(HistoryController, BaseGameHistoryController);
Application.Controllers.controller('HistoryController', ["$scope", "$rootScope", "$routeParams", "BCSession", "BCPlayer", "Game", HistoryController]);
