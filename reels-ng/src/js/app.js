'use strict';

var Application = {};

Application.Constants = angular.module('application.constants', []);
Application.Services = angular.module('application.services', []);
Application.Controllers = angular.module('application.controllers', []);
Application.Filters = angular.module('application.filters', []);
Application.Directives = angular.module('application.directives', []);

var appDeps = [
    'ngCookies',
    'ngRoute',
    'ngResource',
    'application.filters',
    'application.services',
    'application.directives',
    'application.constants',
    'application.controllers',
    'bcPlayer',
    'routeInterceptor'
];

var config = function($routeProvider, $locationProvider, $compileProvider, BCPlayerProvider, PlayerApi, SocketServer) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|bitcoin):/);
    $locationProvider.html5Mode(true).hashPrefix('!');
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
    BCPlayerProvider.setCreditDelay(5200);
    BCPlayerProvider.cookieName('player-api-token');
    BCPlayerProvider.privatePaths([
        '/account',
        '/messages'
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

var run = function($rootScope, ReelsSocket, CacheServer, RouteInterceptor) {
    // Set up socket listeners
    // use $scope.$on in controllers to listen to these
    // additionally, the active player object is available on all scopes as
    // $scope.player
    $rootScope.error = null;
    $rootScope.reelsLayout =           [  [3,6,2,4,1,2,5,5,7,6,4,5,5,4,6,3,3,6,6,3,2,1,6,6,4,5,6,0,5,5,4,6],
            [4,3,4,6,6,5,6,4,6,4,0,3,6,6,3,5,3,2,4,5,5,2,1,1,5,5,2,6,7,6,5,7],
            [7,6,4,5,1,2,5,6,4,4,6,3,5,5,5,3,3,4,7,3,4,0,5,2,6,5,6,1,6,2,6,6],
            [6,7,1,3,0,5,4,3,5,2,5,7,5,3,4,6,6,4,4,5,2,5,6,6,6,6,3,4,2,1,6,5],
            [1,5,0,2,2,3,5,4,5,5,3,4,5,3,3,6,4,6,2,5,5,6,6,4,6,4,7,1,6,6,7,6]];
    $rootScope.CacheServer = CacheServer;
    $rootScope.currencyAbbr = "฿";
    // the amount of time the reels spins for
    $rootScope.gameTime = 5200;

    ReelsSocket.on('player reel added', function(game) {
        setTimeout(function() {
            $rootScope.$broadcast('player game added', game);
            $rootScope.$broadcast('global game added', game);
        }, $rootScope.gameTime);
    });

    ReelsSocket.on('reel added', function(game) {
        $rootScope.$broadcast('global game added', game);
    });
    $rootScope.$on('$routeChangeSuccess', function() {
        RouteInterceptor.enforceRoutes();
    });
};

angular.module('application', appDeps)
    .config(['$routeProvider', '$locationProvider', '$compileProvider', 'BCPlayerProvider', 'PlayerApi', 'SocketServer', config])
    .run(["$rootScope", "ReelsSocket", 'CacheServer', 'RouteInterceptor',  run]);
