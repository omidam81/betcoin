(function(define) {
    'use strict';
    define(['angular', 'units/account/templates', 'units/account/controllers'], function(angular) {
        return angular.module('app.account', ['account.templates', 'account.controllers']);
    });
})(window.define);
