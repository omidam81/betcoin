'use strict';

/* global Application */

var LoginController = function($scope, $http, $location, BCAuth) {
    $scope.login = function() {
        BCAuth.login($scope.username, $scope.password, $scope.oneTimePass).success(function() {
            $location.path('/');
        }).error(function(error) {
            console.error(error);
            if(error.errCode === '079'){
                $scope.requireOneTimePass = true;
                return;
            }
            $scope.error = error;
            if(!$scope.requireOneTimePass){
                $scope.password = "";
            }
        });
    };
};


Application.Controllers.controller('LoginController', ['$scope', '$http', '$location', 'BCAuth', LoginController]);
