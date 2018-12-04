'use strict';

var SignupController = function($scope, $location, $window, BCPlayer, ipCookie, ngToast) {
    $scope.userdata = {
        username: BCPlayer.getCookie('lastAlias')||'',
        password: "",
        createWallet: true,
        email: "",
        withdrawAddress: "",
        signupSite: $window.location.host,
        passwordConfirm: "",
        affiliateToken: ipCookie('aff-token') || undefined
    };
    $scope.legalcheckbox = false;
    $scope.termscheckbox = false;
    $scope.copied = false;
    $scope.registering = false;

    $scope.errorVisible = {
        isNotEqual: false,
        usernameExist: false
    };

    if ($scope.userdata.affiliateToken) {
        $scope.affiliate = BCPlayer.Affiliate.get({
            target: $scope.userdata.affiliateToken
        });
    }

    BCPlayer.clearUserCache();
    $scope.getTextToCopy = function() {
        return $scope.btcAddress;
    };
    $scope.showTooltip = function () {
        $scope.copied = true;
    };
    $scope.checkAlias = function () {
        BCPlayer.verifyAlias($scope.userdata.username)
            .then(function(response){
                $scope.errorVisible.usernameExist = response.exist;
                if ($scope.errorVisible.usernameExist) {
                    $('.username-taken').removeClass('hide');
                } else {
                    $('.username-taken').addClass('hide');
                }
                $scope.usernamePopup = $scope.errorVisible.usernameExist || ($scope.signUpForm.username.$dirty&&$scope.signUpForm.username.$invalid);
            });
        $scope.usernamePopup = $scope.errorVisible.usernameExist || ($scope.signUpForm.username.$dirty&&$scope.signUpForm.username.$invalid);
    };

    var LANDING_REGEXP = new RegExp("https?://[^/]+/(.*)");
    $scope.signup = function() {
        $scope.error = null;
        $scope.userdata.username = $scope.userdata.username;

        if(!$scope.legalcheckbox || !$scope.termscheckbox) {
            $scope.termsError = true;
            return false;
        }
        $scope.registering = true;
        var matches = LANDING_REGEXP.exec($location.absUrl());
        $scope.userdata.landingPage = "/" + matches[1];
        BCPlayer.User.save($scope.userdata, function() {
            $('#signupModal').modal('hide');
            $scope.registering = false;
            ngToast.create('account-creation-success');
            BCPlayer.login($scope.userdata.username, $scope.userdata.password).then(function(user){
                var wallet = new BCPlayer.Wallet({userId: user._id});
                wallet.$save(function() {
                    console.log(arguments);
                    window.location.reload();
                }, function(err) {
                    console.error(err);
                    window.location.reload();
                });
            });
        }, function(err) {
            $scope.error = err.data;
            $scope.registering = false;
        });
    };

    $scope.validatePassword = function () {
        if ($scope.errorVisible.isNotEqual) {
            $('.password-notmatch').removeClass('hide');
        } else {
            $('.password-notmatch').addClass('hide');
        }
        $scope.errorVisible.isNotEqual = ($scope.userdata.password !== $scope.userdata.passwordConfirm) ? true : false;
        $scope.passwordPopup = ($scope.signUpForm.password.$invalid&&$scope.signUpForm.password.$dirty);
        $scope.confirmPasswordPopup = $scope.signUpForm.passwordConfirm.$dirty&&$scope.errorVisible.isNotEqual;
    };

    $scope.checkEmail = function() {
        $scope.emailPopup = $scope.signUpForm.email.$invalid&&$scope.signUpForm.email.$dirty;
    };
};

Application.Controllers.controller('SignupController', [
    "$scope",
    "$location",
    "$window",
    "BCPlayer",
    "ipCookie",
    "ngToast",
    SignupController
]);
