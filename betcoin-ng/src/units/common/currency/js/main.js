(function(define) {
    'use strict';
    define([
        'angular',
        'units/bc-socket',
        'units/bc-globals',
        'units/currency/services',
        'units/currency/filters'
    ], function(angular) {
        return angular.module('common.currency', ['currency.services', 'currency.filters']);
    });
})(window.define);
