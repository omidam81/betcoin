'use strict';

/* global BaseGameDetailsController */

var GameDetailsController = function($scope, $routeParams, $window, BCSession, BCPlayer, Game) {

    GameDetailsController.super_.call(this, $scope, $routeParams, $window, BCSession, BCPlayer, Game);

};

angular.inherits(GameDetailsController, BaseGameDetailsController);
Application.Controllers.controller('GameDetailsController', [
    "$scope",
    "$routeParams",
    "$window",
    "BCSession",
    "BCPlayer",
    "Game",
    GameDetailsController
]);

