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
            controller: 'GameDetailsController'
        }).when('/home', {
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
        BCPlayerProvider.setCreditDelay(8000);

        BCPlayerProvider.serverConfig({
            hostname: PlayerApi.hostname,
            port: PlayerApi.port,
            scheme: PlayerApi.protocol,
            base: PlayerApi.base
        });
        BCPlayerProvider.socketConfig({
            hostname: SocketServer.hostname,
            port: SocketServer.port,
            scheme: SocketServer.protocol,
            base: SocketServer.base
        });
    };

    var appRun = function($rootScope, DiceNewSocket) {
        // Set up socket listeners
        // use $scope.$on in controllers to listen to these
        // additionally, the active player object is available on all scopes as
        // $scope.player
        // the amount of time the game animation lasts
        $rootScope.gameTime = 8000;

        $rootScope.secrets = {};
        $rootScope.loadingSecret = false;
        $rootScope.games = [];
        DiceNewSocket.on('player dice added', function(game) {
            setTimeout(function() {
                $rootScope.$broadcast('player game added', game);
                $rootScope.$broadcast('global game added', game);
            }, $rootScope.gameTime);
        });

        DiceNewSocket.on('dice added', function(game) {
            $rootScope.$broadcast('global game added', game);
        });

    };

    bcGame.config([
        '$routeProvider',
        '$locationProvider',
        '$compileProvider',
        'BCPlayerProvider',
        // 'RouteInterceptorProvider',
        'PlayerApi',
        'SocketServer',
        appConfig
    ]).run([
        '$rootScope',
        'DiceNewSocket',
        'CacheServer',
        'RouteInterceptor',
        appRun
    ]);

})(window,angular);
