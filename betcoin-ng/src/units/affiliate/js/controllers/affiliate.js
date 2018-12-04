(function(angular) {
    'use strict';
    var module;
    try {
        module = angular.module('affiliate.controllers');
    } catch (e) {
        module = angular.module('affiliate.controllers', []);
    }

    var AffiliateController = function() {
    };

    module.controller('AffiliateController', [
        '$scope',
        AffiliateController
    ]);
})(window.angular);
