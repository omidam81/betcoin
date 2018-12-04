'use strict';

var NavController = function($scope, $location) {
    $scope.getActive = function(path) {
        var location = $location.path();
        if(path === location){
            return 'active';
        } else if (path === '/' && location === '/home') {
            return 'active';
        } else {
            return '';
        }
    };
};

Application.Controllers.controller('NavController', ['$scope', '$location', NavController]);
