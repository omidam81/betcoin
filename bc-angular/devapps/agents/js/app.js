
(function(window, angular) {
    'use strict';

    if (window.io === undefined) {
        throw "No socket.io found!";
    }

    var bcGame = angular.module('bcGame', ['ng', 'ngResource']);

    var appConfig = function($routeProvider, $locationProvider, $compileProvider,
                             BCPlayerProvider, PlayerApi, SocketServer) {

        $routeProvider.when('/', {
            controller: 'HomeController'
        }).when('/dashboard', {
            templateUrl: 'tpl/dashboard.html',
            controller: 'DashboardController'
        }).when('/account', {
            templateUrl: 'tpl/account.html',
            controller: 'BCAccountController'
        }).when('/rep/:id?', {
            templateUrl: 'tpl/rep.html',
            controller: 'RepController'
        }).when('/affiliate/:id?', {
            templateUrl: 'tpl/affiliate.html',
            controller: 'AffiliateController'
        }).otherwise({
            controller: 'HomeController'
        });

        BCPlayerProvider.privatePaths([
            '/dashboard'
        ]);

        BCPlayerProvider.serverConfig({
            hostname: PlayerApi.hostname,
            port: PlayerApi.port,
            scheme: PlayerApi.protocol,
            base: SocketServer.base,
        });
        BCPlayerProvider.socketConfig({
            hostname: SocketServer.hostname,
            port: SocketServer.port,
            scheme: SocketServer.protocol,
            base: SocketServer.base,
        });

    };

    var appRun = function($location, BCSession) {
        if (!BCSession.token) {
            var path = $location.path();
            if (path !== '/') {
                $location.path('/');
            }
        }
    };

    bcGame.config([
        '$routeProvider',
        '$locationProvider',
        '$compileProvider',
        'BCPlayerProvider',
        'PlayerApi',
        'SocketServer',
        appConfig
    ]).run([
        '$location',
        'BCSession',
        appRun
    ]);

})(window,angular);
