'use strict';

/* global BaseGameHomeController */

var HomeController = function($scope, User) {
    $scope.userdata = new User();
};

angular.inherits(HomeController, BaseGameHomeController);
Application.Controllers.controller('HomeController', [
    '$scope',
    'User',
    HomeController
]);
