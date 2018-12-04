(function(window, angular) {
    'use strict';

    if (window.io === undefined) {
        throw "No socket.io found!";
    }

    var bcGame = angular.module('bcGame', ['ng', 'ngResource']);


    var appConfig = function($routeProvider, $locationProvider, $compileProvider, BCPlayerProvider, PlayerApi, SocketServer) {

        $routeProvider.when('/', {
            templateUrl: 'tpl/spins.html',
            controller: 'HistoryController'
        }).when('/history/details/:id', {
            templateUrl: 'tpl/gameDetails.html',
            controller: 'CoinflipGameDetailsController'
        }).when('/home', {
            templateUrl: 'tpl/spins.html',
            controller: 'HistoryController'
        }).when('/circle-hive', {
            templateUrl: 'tpl/spins.html',
            controller: 'HistoryController'
        }).when('/spins/:type?', {
            templateUrl: 'tpl/spins.html',
            controller: 'HistoryController'
        }).when('/leaderboard/:type?', {
            templateUrl: 'tpl/leaderboard.html',
            controller: 'LeaderboardController'
        }).when('/howtoplay', {
            templateUrl: 'tpl/howtoplay.html'
        }).otherwise({
            templateUrl: 'tpl/spins.html',
            controller: 'HistoryController'
        });
        // bcPlayer module config
        BCPlayerProvider.setCreditDelay(5400);

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

    var appRun = function($rootScope, CircleSocket) {

        // the amount of time the circle spins for
        $rootScope.circleSpinTime = 5400;

        CircleSocket.on('player coinflip added', function(circle) {
            setTimeout(function() {
                $rootScope.$broadcast('player game added', circle);
                $rootScope.$broadcast('global game added', circle);
            }, $rootScope.circleSpinTime);
        });

        CircleSocket.on('coinflip added', function(circle) {
            $rootScope.$broadcast('global game added', circle);
        });
    };

    bcGame.config(['$routeProvider', '$locationProvider', '$compileProvider', 'BCPlayerProvider', 'PlayerApi', 'SocketServer', appConfig])
        .run(["$rootScope", "CircleSocket",   appRun]);
})(window,angular);
