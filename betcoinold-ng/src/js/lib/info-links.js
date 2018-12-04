(function(window, angular) {
    "use strict";
    var bcInfoLinks = angular.module('bcInfoLinks', ['ng']);
    bcInfoLinks.config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/new-to-bitcoin', {
            templateUrl: 'tpl/newtobitcoin.html'
        }).when('/terms-conditions', {
            templateUrl: 'tpl/terms.html'
        }).when('/press', {
            templateUrl: 'tpl/press.html'
        });
    }]);
})(window, window.angular);
