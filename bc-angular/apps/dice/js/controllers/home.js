'use strict';

/* global BaseGameHomeController */

var HomeController = function($scope, $cookies, BCPlayer, BCSession, DiceNewSocket) {
    HomeController.super_.apply(this, [$scope, $cookies, BCPlayer, BCSession, DiceNewSocket]);
};
    
angular.inherits(HomeController, BaseGameHomeController);

Application.Controllers.controller('HomeController', ['$scope', '$cookies','BCPlayer','BCSession','DiceNewSocket', HomeController]);
