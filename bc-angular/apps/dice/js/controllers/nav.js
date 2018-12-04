'use strict';

/* global Application */

var NavController = function($scope, $location) {
    $scope.getTabClass = function(path) {
        if(path === $location.path()){
            return 'active';
        } else if (path.indexOf('/spins') > -1 && (/\/spins/).test($location.path())) {
            return 'active';
        } else if (path.indexOf('/classic') > -1 && (/\/classic/).test($location.path())) {
            return 'active';
        } else {
            return '';
        }
    };
};

Application.Controllers.controller('NavController', ['$scope', '$location', NavController]);
