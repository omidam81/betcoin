
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
        }).otherwise({
            controller: 'HomeController'
        });

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

    var appRun = function($rootScope, Tracker) {
        $rootScope.appName = "replanding";
        Tracker.landingPage();
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
        "$rootScope",
        "Tracker",
        appRun
    ]);

})(window,angular);
