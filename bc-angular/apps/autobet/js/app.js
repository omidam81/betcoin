(function(window, angular) {
    'use strict';

    if (window.io === undefined) {
        throw "No socket.io found!";
    }
    var bcGame = angular.module('bcGame', ['ng', 'ngResource','restangular','textAngular', 'ui.bootstrap', 'ui.date', 'ui.ace', 'ui.sortable']);



    var appRun = function($rootScope, AutobetSocket) {
        AutobetSocket.on('new autobet action result', function(result) {
            $rootScope.$broadcast('new action result', result);
        });
        AutobetSocket.on('new autobet totals', function(result) {
            $rootScope.$broadcast('new autobet totals', result);
        });
        AutobetSocket.on('autobet game error', function(result) {
            $rootScope.$broadcast('autobet game error', result);
        });
    };

    var appConfig = function($routeProvider, $locationProvider, $compileProvider, PlayerApi, BCPlayerProvider, SocketServer) {

        $routeProvider
            .when('/', {
                templateUrl: 'tpl/dashboard.html',
                controller: 'DashboardController'
            }).otherwise({
                reditectTo: '/dashboard'
            });

        // BCAuthProvider.cookieName('player-api-token');
        // BCAuthProvider.serverConfig({
        //     hostname: Api.hostname,
        //     port: Api.port,
        //     scheme: Api.protocol
        // });
        BCPlayerProvider.serverConfig({
            hostname: PlayerApi.hostname,
            port: PlayerApi.port,
            scheme: PlayerApi.protocol,
            base: SocketServer.base
        });
        BCPlayerProvider.socketConfig({
            hostname: SocketServer.hostname,
            port: SocketServer.port,
            scheme: SocketServer.protocol,
            base: SocketServer.base
        });
    };

    bcGame.config(['$routeProvider', '$locationProvider', '$compileProvider', 'PlayerApi', 'BCPlayerProvider', 'SocketServer', appConfig])
        .run(['$rootScope', 'AutobetSocket', appRun]);
})(window,angular);

