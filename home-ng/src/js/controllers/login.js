'use strict';

var LoginController = function($scope, $location, $routeParams) {
    $scope.loginSuccess = function(player) {
        if($routeParams.s) {
            window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+"/"+$routeParams.s+"/";
        } else {
            $scope.user = player;
            $location.path("/account");
        }
    };
};

Application.Controllers.controller("LoginController", [
    "$scope",
    "$location",
    "$routeParams",
    LoginController
]);

