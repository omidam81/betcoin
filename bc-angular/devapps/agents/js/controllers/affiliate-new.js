'use strict';


var AffiliateNewController = function($scope, $location, BCPlayer, BCSession, $window, ngToast, Rep) {


    $scope.affData = {
        username: '',
        password: "",
        passwordConfirm: "",
        createWallet: true,
        email: '',
        address:'',
        notes:'',
        serials:'',
        signupSite: $window.location.host
    };

    $scope.registering = false;

    $scope.errorVisible = {
        isNotEqual: false,
        usernameExist: false,
        badSerials: false
    };

    $scope.$watch('affData.serials', function(serials) {

        $scope.badSerialsPopup = false;
        $scope.errorVisible.badSerials = false;
        var serialsArr = serials.split("\n");
        for(var i=0;i<serialsArr.length;i++) {
            var serial = serialsArr[i];

            var re = new RegExp("8[0135689]{6,}-888");
              var m = re.exec(serial);
              if (serial.toString().length > 0 && m === null) {
                $scope.badSerialsPopup = true;
                $scope.errorVisible.badSerials = true;
              } else {
                // ok
                // console.log("OK",serial);
              }
        }
    });

    $scope.checkAlias = function () {
    };

    $scope.signup = function() {
        $scope.error = null;
        $scope.registering = true;
        var rep = new Rep($scope.affData);
        rep.save(function() {
            $scope.registering = false;
            ngToast.create('account-creation-success');
            $location.path('/');
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
        $scope.errorVisible.isNotEqual = ($scope.affData.password !== $scope.affData.passwordConfirm) ? true : false;
        $scope.passwordPopup = ($scope.affForm.password.$invalid&&$scope.affForm.password.$dirty);
        $scope.confirmPasswordPopup = $scope.affForm.passwordConfirm.$dirty&&$scope.errorVisible.isNotEqual;
    };
};

Application.Controllers.controller('AffiliateNewController', [
    "$scope",
    "$location",
    "BCPlayer",
    "BCSession",
    "$window",
    "ngToast",
    "Rep",
    AffiliateNewController
]);
