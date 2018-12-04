(function(define) {
    'use strict';
    define(['angular', 'units/bc-route', 'modules/bc-gameroute'], function(angular) {
        var module = angular.module('app.routes', ['ng', 'bc.route', 'bc.gameroute']);
        return module;
    });
})(window.define);
