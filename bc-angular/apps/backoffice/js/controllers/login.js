'use strict';

/* global Application */

var LoginController = function($scope, $http, $location, BCAuth, BCAdminSession) {
    $scope.login = function() {
        BCAuth.login($scope.username, $scope.password, $scope.oneTimePass).success(function(data) {
            BCAdminSession.user = data;
            $location.path('/');
        }).error(function(error) {
            console.error(error);
            if(/one time password/.test(error.message)){
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


Application.Controllers.controller('LoginController', [
    '$scope',
    '$http',
    '$location',
    'BCAuth',
    'BCAdminSession',
    LoginController]);
