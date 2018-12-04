(function(angular) {
    'use strict';
    var module;
    try {
        module = angular.module('account.controllers');
    } catch (e) {
        module = angular.module('account.controllers', []);
    }

    var AccountController = function($scope, BCSession) {
        $scope.fiat = BCSession.fiat;
        $scope.user = BCSession.user;
        $scope.wallets = BCSession.wallets;
    };

    module.controller('AccountController', [
        '$scope',
        'BCSession',
        AccountController
    ]);

})(window.angular);
