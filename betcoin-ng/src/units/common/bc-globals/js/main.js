(function(define) {
    'use strict';
    define(['angular'], function(angular) {
        var module = angular.module('bc.globals', ['ng']);
        module.constant('FIAT_CURRENCIES', ['USD', 'CNY']);
        module.constant('CURRENCIES', ['bitcoin', 'dogecoin', 'litecoin', 'ppcoin', 'namecoin']);
        return module;
    });
})(window.define);
