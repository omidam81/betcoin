'use strict';

/* global Application */

var NavController = function($scope, $location) {
    $scope.showHistoryNav = false;
    $scope.getActive = function(path) {
        if(path === $location.path()){
            return 'active';
        } else {
            return '';
        }
    };
};

Application.Controllers.controller('NavController', ['$scope', '$location', NavController]);
