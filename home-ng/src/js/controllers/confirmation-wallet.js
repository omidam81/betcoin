'use strict';

var ConfirmationWalletController = function($scope, BCPlayer) {
    // $scope.user = {};
    // $scope.alias = "";
    // $scope.password = "";
    // $rootScope.register = false;
    // $rootScope.home = false;
    // $rootScope.account = true;
    // $scope.user = AccountFactory.user;
    $scope.user = BCPlayer.User.get({});
    $scope.getTextToCopy = function(){
        return $scope.user.deposit.btc.address;
    };
};

Application.Controllers.controller('ConfirmationWalletController', [
    "$scope",
    "BCPlayer",
    ConfirmationWalletController
]);
