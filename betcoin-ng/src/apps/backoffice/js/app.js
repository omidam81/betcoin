(function(define) {
    'use strict';

    var config = function($stateProvider, $locationProvider, $compileProvider,
                          $ocLazyLoadProvider, $urlMatcherFactoryProvider) {
        // allow extra url schemes for cryptocoins
        var hrefRegexp = /^\s*(https?|ftp|mailto|file|bitcoin|litecoin|dogecoin|peercoin|ppcoin|namecoin|primecoin):/;
        $compileProvider.aHrefSanitizationWhitelist(hrefRegexp);
        // use html5 mode path handling
        $locationProvider.html5Mode(true).hashPrefix('!');
        // do not be strict about matching a trailing slash
        $urlMatcherFactoryProvider.strictMode(false);
        // redirect to home if the route is not found
        // $urlRouterProvider.otherwise('/');
        // configure lazy loader
        $ocLazyLoadProvider.config({
            loadedModules: ['app'],
            asyncLoader: require
        });
    };

    var run = function() {
    };

    define([
        'angular',
        'uiBootstrap',
        'uiRouter',
        'ngResource',
        'ocLazyLoad',
        'routes',
        'server',
        'units/bc-route',
        'units/currency',
    ], function(angular) {
        console.debug('app deps loaded, creating app module');
        return angular.module('app', [
            'ui.router',
            'ui.bootstrap',
            'ngResource',
            'oc.lazyLoad',
            'app.routes',
            'common.currency'
        ]).config([
            '$stateProvider',
            '$locationProvider',
            '$compileProvider',
            '$ocLazyLoadProvider',
            '$urlMatcherFactoryProvider',
            '$urlRouterProvider',
            config
        ]).run([
            run
        ]);
    });

})(window.define);
