'use strict';

/* global Application */

var NavController = function($scope, $location) {
    $scope.getTabClass = function(path) {
        if(path === $location.path()){
            return 'active';
        } else if (path === '/games' && (/\/games\/(player|global)/).test($location.path())) {
            return 'active';
        } else {
            return '';
        }
    };
};

Application.Controllers.controller('NavController', ['$scope', '$location', NavController]);
