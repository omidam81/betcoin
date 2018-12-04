(function(define) {
    'use strict';
    define(['angular', 'units/circle/templates', 'units/circle/controllers'], function(angular) {
        return angular.module('app.circle', ['circle.templates', 'app.circle.controllers']);
    });
})(window.define);
