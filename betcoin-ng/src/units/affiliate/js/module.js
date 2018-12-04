(function(define) {
    'use strict';
    define(['angular', './templates.js', './controllers.js'], function(angular) {
        return angular.module('app.affiliate', ['affiliate.templates', 'affiliate.controllers']);
    });
})(window.define);
