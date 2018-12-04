(function(angular) {
    'use strict';
    var module;
    try {
        module = angular.module('app.controllers');
    } catch (e) {
        module = angular.module('app.controllers', []);
    }

    var LogoutController = function($scope, $location, $timeout, BCSession) {
        $scope.tokenExpired = $location.search().type === 'token';

        var setTimer = function() {
            $timeout(function() {
                window.location = window.location.origin;
            }, 3000);
        };

        if (BCSession.user) {
            BCSession.logout().then(setTimer, setTimer);
        } else {
            setTimer();
        }
    };

    module.controller('LogoutController', [
        '$scope',
        '$location',
        '$timeout',
        'BCSession',
        LogoutController
    ]);

})(window.angular);
