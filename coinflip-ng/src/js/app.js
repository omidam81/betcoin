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
    BCPlayerProvider.cookieName('player-api-token');
    BCPlayerProvider.privatePaths([
        '/account',
        '/messages'
    ]);

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

var run = function($rootScope, CircleSocket, CacheServer, RouteInterceptor) {
    // Set up socket listeners
    // use $scope.$on in controllers to listen to these
    // additionally, the active player object is available on all scopes as
    // $scope.player
    $rootScope.error = null;
    $rootScope.autospin = false;
    $rootScope.CacheServer = CacheServer;
    $rootScope.currencyAbbr = "฿";
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
    $rootScope.$on('$routeChangeSuccess', function() {
        RouteInterceptor.enforceRoutes();
    });
};

angular.module('application', appDeps)
    .config(['$routeProvider', '$locationProvider', '$compileProvider', 'BCPlayerProvider', 'PlayerApi', 'SocketServer', config])
    .run(["$rootScope", "CircleSocket", 'CacheServer', 'RouteInterceptor',  run]);
