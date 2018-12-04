(function(angular) {
    'use strict';
    var module;
    try {
        module = angular.module('app.circle.controllers');
    } catch (e) {
        module = angular.module('app.circle.controllers', ['']);
    }

    var CircleController = function($scope, BCSession) {
        $scope.fiat = BCSession.fiat;
        $scope.user = BCSession.user;
        $scope.wallets = BCSession.wallets;

    };

    module.controller('CircleController', [
        '$scope',
        'BCSession',
        CircleController
    ]);

})(window.angular);
