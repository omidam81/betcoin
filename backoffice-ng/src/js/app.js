'use strict';

/* global angular */
var Application = Application || {};
Application.Services = angular.module('application.services', []);
Application.Controllers = angular.module('application.controllers', []);
Application.Filters = angular.module('application.filters', []);
Application.Directives = angular.module('application.directives', []);


var appDeps = [
    'ngResource',
    'ngRoute',
    'ngCookies',
    'application.filters',
    'application.services',
    'application.directives',
    'application.controllers',
    'ui.date',
    'bcAdmin',
    'ui.bootstrap',
];

var run = function($rootScope, $location, BTCExchangeRate, BCAuth, BCAdminSession) {
    console.log(BCAdminSession);
    if (!BCAdminSession.token) {
        $rootScope.hasLogin = false;
        $location.path('/login');
    } else {
        $rootScope.exchange = BTCExchangeRate.get();
    }
    $rootScope.$on('$routeChangeSuccess', function() {
        var path = $location.path();
        if(BCAdminSession.token){
            $rootScope.hasLogin = true;
        }
        if (path === '/login' && BCAdminSession.token) {
            $location.path('/dashboard');
        } else if(!BCAuth.isPublic(path)){
            if (!BCAdminSession.token) {
                $rootScope.hasLogin = false;
                $location.path('/login');
            }
        }
    });
};

var config = function($routeProvider, $locationProvider, $compileProvider, BCAuthProvider, Api) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|bitcoin):/);
    $locationProvider.html5Mode(true).hashPrefix('!');
    BCAuthProvider.cookieName('office-api-token');
    BCAuthProvider.serverConfig(Api);
    $routeProvider
    .when('/', {
        templateUrl: 'tpl/dashboard.html',
        controller: 'DashboardController'
    }).when('/dashboard', {
        templateUrl: 'tpl/dashboard.html',
        controller: 'DashboardController'
    }).when('/totals', {
        templateUrl: 'tpl/gametotals.html',
        controller: "GameTotalsController"
    }).when('/bankroll', {
        templateUrl: 'tpl/bankroll.html',
        controller: 'BankrollController'
    }).when('/circle', {
        templateUrl: 'tpl/circle.html',
        controller: 'CircleController'
    }).when('/dice', {
        templateUrl: 'tpl/dice.html',
        controller: 'DiceController'
    }).when('/prize', {
        templateUrl: 'tpl/prize.html',
        controller: 'PrizeController'
    }).when('/players', {
        templateUrl: 'tpl/players.html',
        controller: 'PlayersController'
    }).when('/player/:playerId', {
        templateUrl: 'tpl/player.html',
        controller: 'PlayerController'
    }).when('/player/:playerId/cashflow', {
        templateUrl: 'tpl/cashflows.html',
        controller: 'PlayerCashflowController'
    }).when('/player/:playerId/history', {
        templateUrl: 'tpl/history.html',
        controller: 'HistoryController'
    }).when('/player/:playerId/history/:type', {
        templateUrl: 'tpl/history.html',
        controller: 'HistoryController'
    }).when('/player/:game/:playerId', {
        templateUrl: 'tpl/playergame.html',
        controller: 'PlayerGameController'
    }).when('/transactions', {
        templateUrl: 'tpl/transaction.html',
        controller: 'TransactionController'
    }).when('/login', {
        templateUrl: 'tpl/admin-login.html',
        controller: 'LoginController'
    }).when('/support/:type?/:id?', {
        templateUrl: 'tpl/support.html',
        controller: 'SupportController'
    }).when('/security', {
        templateUrl: 'tpl/security.html',
        controller: 'SecurityController'
    }).when('/games/:game/unplayed/players', {
        templateUrl: 'tpl/unplayed_players.html',
        controller: 'UnplayedPlayersController'
    }).otherwise({
        reditectTo: '/dashboard'
    });
};

angular.module('application', appDeps)
    .config(['$routeProvider', '$locationProvider', '$compileProvider', 'BCAuthProvider', 'Api', config])
    .run(['$rootScope', '$location', 'BTCExchangeRate', 'BCAuth', 'BCAdminSession', run]);

