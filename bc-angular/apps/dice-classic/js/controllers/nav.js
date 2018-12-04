'use strict';

/* global Application */

var NavController = function($scope, $location) {
    $scope.getActive = function(path) {
        if(path === $location.path()){
            return 'active';
        } else if (path === '/recent' && (/\/recent\/(unconfirmed|big|rare)/).test($location.path())) {
            return 'active';
        } else if (path === '/leaderboard' && (/\/leaderboard\/(bronze|silver|gold|platinum|diamond)/).test($location.path())) {
            return 'active';
        } else {
            return '';
        }
    };
};

Application.Controllers.controller('NavController', ['$scope', '$location', NavController]);
