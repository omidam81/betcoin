'use strict';

/* global BaseGameHomeController */

var HomeController = function($scope, $cookies, BCPlayer, BCSession, CircleSocket) {
    HomeController.super_.call(this, $scope, $cookies, BCPlayer, BCSession, CircleSocket);
};

angular.inherits(HomeController, BaseGameHomeController);
Application.Controllers.controller('HomeController', [
    "$scope",
    "$cookies",
    "BCPlayer",
    "BCSession",
    "CircleSocket",
    HomeController
]);
