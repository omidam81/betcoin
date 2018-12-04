'use strict';

var HomeController = function($scope, $location) {
    $scope.loginSuccess = function(player) {
        $scope.user = player;
        // console.debug('logged in home, redirecting', player.alias);
        $location.path('/account');
    };
};

Application.Controllers.controller("HomeController", [
    "$scope",
    "$location",
    HomeController
]);

