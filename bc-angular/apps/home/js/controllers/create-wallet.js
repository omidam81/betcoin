'use strict';

var CreateWalletController = function($scope, BCPlayer, $rootScope) {
    $scope.user = {};
    $scope.username = "";
    $scope.password = "";
    $rootScope.register = true;
    $rootScope.home = false;
    $scope.login = function() {
        BCPlayer.login($scope.username, $scope.password).then(function(user) {
            $scope.user = user;
        }, function(error) {
            console.error(error);
        });
    };
};

Application.Controllers.controller('CreateWalletController', [
    "$scope",
    "BCPlayer",
    "$rootScope",
    CreateWalletController
]);
