(function(define) {
    'use strict';
    define(['angular', 'units/home/templates', 'units/home/controllers'], function(angular) {
        return angular.module('app.home', ['home.templates', 'home.controllers']);
    });
})(window.define);
