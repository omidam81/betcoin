

(function(window, angular) {
    'use strict';

    if (window.io === undefined) {
        throw "No socket.io found!";
    }

    var bcGame = angular.module('bcGame', ['ng', 'ngResource']);

    var appConfig = function($routeProvider, $locationProvider, $compileProvider, BCPlayerProvider, PlayerApi, SocketServer) {


        $routeProvider.when('/', {
            templateUrl: 'tpl/history.html',
            controller: 'HistoryController'
        }).when('/history/details/:id', {
            templateUrl: 'tpl/gameDetails.html',
            controller: 'KenoGameDetailsController'
        }).when('/home', {
            templateUrl: 'tpl/history.html',
            controller: 'HistoryController'
        }).when('/draws/:type?', {
            templateUrl: 'tpl/history.html',
            controller: 'HistoryController'
        }).when('/leaderboard/:type?', {
            templateUrl: 'tpl/leaderboard.html',
            controller: 'LeaderboardController'
        }).when('/howtoplay', {
            templateUrl: 'tpl/howtoplay.html'
        }).otherwise({
            templateUrl: 'tpl/history.html',
            controller: 'HistoryController'
        });
        // bcPlayer module config
        BCPlayerProvider.setCreditDelay(10000);


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

    var appRun = function($rootScope, GameSocket) {


        $rootScope.gameTime = 10000;

        $rootScope._ = window._; //bind underscore.js


        GameSocket.on('player keno added', function(game) {
            setTimeout(function() {
                $rootScope.$broadcast('player game added', game);
                $rootScope.$broadcast('global game added', game);
            }, $rootScope.gameTime);
        });

        GameSocket.on('keno added', function(game) { //@TODO
            $rootScope.$broadcast('global game added', game);
        });


    };

    bcGame.config(['$routeProvider', '$locationProvider', '$compileProvider', 'BCPlayerProvider', 'PlayerApi', 'SocketServer', appConfig])
        .run(["$rootScope", "GameSocket", appRun]);
})(window,angular);