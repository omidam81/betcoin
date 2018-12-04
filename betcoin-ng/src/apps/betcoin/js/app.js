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

    var run = function($rootScope, $location, BCSession) {
        $rootScope.BCSession = BCSession;
        if (BCSession.token) {
            BCSession.login().then(function() {
                if ($location.path() === '/') {
                    $location.path('/account');
                }
            });
        }
    };

    define([
        'angular',
        'uiBootstrap',
        'uiRouter',
        'ngResource',
        'ocLazyLoad',
        'modules/bc-gameroute',
        'routes',
        'server',
        'controllers',
        'resources',
        'directives',
        'templates',
        'modals',
        'units/bc-globals',
        'units/bc-socket',
        'modules/bc-user',
        'modules/bc-session',
        'units/currency',
    ], function(angular) {
        console.debug('app deps loaded, creating app module');
        return angular.module('app', [
            'ui.router',
            'ui.bootstrap',
            'ngResource',
            'oc.lazyLoad',
            'app.routes',
            'app.controllers',
            'app.resources',
            'app.directives',
            'app.templates',
            'bc.server',
            'bc.globals',
            'bc.socket',
            'bc.user',
            'bc.session',
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
            '$rootScope',
            '$location',
            'BCSession',
            'exchangeRate',
            run
        ]);
    });

})(window.define);
