(function(angular) {
    'use strict';
    var module;
    try {
        module = angular.module('account.controllers');
    } catch (e) {
        module = angular.module('account.controllers', []);
    }

    module.controller('WalletController', ['$scope', function() {
    }]);
})(window.angular);
