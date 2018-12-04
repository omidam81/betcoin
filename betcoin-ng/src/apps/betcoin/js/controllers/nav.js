(function(angular) {
    'use strict';
    var module;
    try {
        module = angular.module('app.controllers');
    } catch (e) {
        module = angular.module('app.controllers', []);
    }

    var NavController = function($scope, $location) {

        $scope.getClass = function() {
            var possiblePaths = [].slice.apply(arguments);
            var partToMatch = 1;
            if ('number' === typeof possiblePaths[possiblePaths.length - 1]) {
                partToMatch = possiblePaths.pop();
            }
            var parts = $location.path().split('/');
            var part = parts[partToMatch] || '';
            var classStr = '';
            possiblePaths.forEach(function(path) {
                if (path === part) {
                    classStr = 'active';
                }
            });
            return classStr;
        };
    };

    module.controller('NavController', [
        '$scope',
        '$location',
        '$modal',
        NavController
    ]);

})(window.angular);
