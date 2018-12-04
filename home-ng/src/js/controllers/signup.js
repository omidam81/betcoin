'use strict';

var SignupController = function($scope, $location, $window, BCPlayer) {
    $scope.userdata = {
        alias: BCPlayer.getCookie('lastAlias')||'',
        password: "",
        createWallet: true,
        email: "",
        withdrawAddress: "",
        signupSite: $window.location.host
    };
    $scope.isNotEqual = false;
    $scope.invalidPassword = false;
    $scope.copied = false;
    BCPlayer.clearUserCache();
    $scope.getTextToCopy = function() {
        return $scope.btcAddress;
    };
    $scope.showTooltip = function () {
        $scope.copied = true;
    };
    $scope.checkAlias = function () {
        BCPlayer.verifyAlias($scope.userdata.alias, function(response){
            $scope.isExist = response;
        });
    };

    $scope.signup = function() {
        $scope.error = null;
        $scope.userdata.alias = $scope.userdata.alias;

        BCPlayer.User.save($scope.userdata, function() {
            BCPlayer.login($scope.userdata.alias, $scope.userdata.password).then(function(){
                $location.path('/welcome-bonus');
            });
        }, function(err) {
            $scope.error = err.data;
        });
    };

    $scope.validatePassword = function () {
        $scope.isNotEqual = ($scope.userdata.password !== $scope.userdata.confirm_password) ? true : false;
    };
};

Application.Controllers.controller('SignupController', [
    "$scope",
    "$location",
    "$window",
    "BCPlayer",
    SignupController
]);
