(function(define) {
    'use strict';
    define(['angular', './templates.js', './controllers.js'], function(angular) {
        return angular.module('app.agent', ['agent.templates', 'agent.controllers']);
    });
})(window.define);
