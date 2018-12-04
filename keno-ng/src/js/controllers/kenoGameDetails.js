'use strict';

/* global BaseGameDetailsController */

var KenoGameDetailsController = function($scope, $routeParams, $window, BCSession, BCPlayer, Game) {
    KenoGameDetailsController.super_.call(this, $scope, $routeParams, $window, BCSession, BCPlayer, Game);

};

angular.inherits(KenoGameDetailsController, BaseGameDetailsController);
Application.Controllers.controller('KenoGameDetailsController', ["$scope", "$routeParams", "$window", "BCSession", "BCPlayer", "Game", KenoGameDetailsController]);

