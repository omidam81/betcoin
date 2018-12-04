(function(angular) {
	'use strict';
    var module;
    try {
        module = angular.module('app.controllers');
    } catch (e) {
        module = angular.module('app.controllers', []);
    }

    var LoginModalController = function($scope, $location, $modalInstance, BCSession) {
        $scope.requireOneTimePass = false;

        $scope.login = function() {
            var loginProimise = BCSession.login($scope.username, $scope.password, $scope.otp);
            loginProimise.then(function() {
                $modalInstance.close();
                $location.path('/account');
            }, function(error) {
                if (!$scope.otp && error.data.message === "invalid one time password for 2 factor auth") {
                    $scope.requireOneTimePass = true;
                } else {
                    $scope.error = error;
                }
            });
        };
    };

	module.controller('LoginModalController', [
        '$scope',
        '$location',
        '$modalInstance',
        'BCSession',
        LoginModalController
	]);

})(window.angular);
