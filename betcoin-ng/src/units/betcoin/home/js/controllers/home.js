(function(angular) {
    'use strict';
    var module;
    try {
        module = angular.module('home.controllers');
    } catch (e) {
        module = angular.module('home.controllers', []);
    }

    module.controller('HomeController', ['$scope', function() {
    }]);
})(window.angular);
