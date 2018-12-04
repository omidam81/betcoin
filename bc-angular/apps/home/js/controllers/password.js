'use strict';

var PasswordController = function($scope, $rootScope, $location, $AccountFactory, BCPlayer, ngToast) {
    $scope.resetting = false;
    $AccountFactory.getChallengeStringForPassword(function(res) {
        $scope.challenge = res.challenge;
    });

    $scope.verifyAddress = function() {
        $scope.username = null;
        BCPlayer.verifyAddress($scope.walletAddress).then(function(data){
            if(data.exist === true){
                $scope.username = data.username;
                BCPlayer.saveCookie('lastAlias', $scope.username);
                $scope.error = null;
            }else{
                $scope.error = 'The address is not existing in our system';
            }
        }, function(err){
            $scope.error = err.message;
        });
    };

    $scope.verifyWallet = function() {
        var params = {
            address: $scope.walletAddress,
            signature: $scope.textSigned,
            challenge: $scope.challenge,
            password: $scope.passwordForm.password.$modelValue,
            passwordConfirm: $scope.passwordForm.confirm_password.$viewValue
        };
	$scope.resetting = true;
        $AccountFactory.resetPassword(params, function() {
	    $scope.resetting = false;
	    ngToast.create("pwd-reset-success");
            $location.path('/login');
        }, function(err) {
	    $scope.resetting = false;
            $scope.error = err.message;
        });
    };
    $scope.validatePassword = function() {
        $scope.invalidPassword = false;
        $scope.isNotEqual = false;
        console.log(" password!",$scope.passwordForm.password.$modelValue);
        if($scope.passwordForm.password.$modelValue) {
            var transformedInput = $scope.passwordForm.password.$modelValue.replace(/[^A-Za-z0-9]/g, '');
            if (transformedInput !== $scope.passwordForm.password.$modelValue) {
                console.log("invalid password!",$scope.passwordForm.password.$modelValue);
                $scope.invalidPassword = true;
                return false;
            }
        }
        $scope.isNotEqual = ($scope.passwordForm.password.$modelValue !== $scope.passwordForm.confirm_password.$modelValue) ? true : false;
    };
};

Application.Controllers.controller('PasswordController', [
    "$scope",
    "$rootScope",
    "$location",
    "AccountFactory",
    "BCPlayer",
    "ngToast",
    PasswordController
]);
