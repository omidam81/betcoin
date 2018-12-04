'use strict';

/* global BaseGameHomeController */

var HomeController = function($scope, $cookies, $location, BCPlayer, BCSession) {
    HomeController.super_.call(this, $scope, $cookies, BCPlayer, BCSession);
    $scope.loginSuccess = function() {
        $location.path("/dashboard");
    };
    $scope.init = function() {
        if(BCSession.user) {
            $location.path("/dashboard");
        }
    };
    BCPlayer.$on('user update', $scope.init);
};

angular.inherits(HomeController, BaseGameHomeController);
Application.Controllers.controller('HomeController', [
    "$scope",
    "$cookies",
    "$location",
    "BCPlayer",
    "BCSession",
    HomeController
]);
