'use strict';

/* global BaseGameLeaderboardController */

var LeaderboardController = function($scope, Game) {
    LeaderboardController.super_.apply(this, [$scope, Game]);
};

angular.inherits(LeaderboardController, BaseGameLeaderboardController);

Application.Controllers.controller('LeaderboardController', ['$scope', 'Game', LeaderboardController]);
