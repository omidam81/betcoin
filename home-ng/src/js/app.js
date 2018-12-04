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
    'routeInterceptor',
    'pasvaz.bindonce',
    'ui.bootstrap'
];

var run = function($rootScope, $cookies, $location, BCSession, BCPlayer, CacheServer, RouteInterceptor) {
    $rootScope.copyDialog = function(text) {
        window.prompt('Press CTRL+C, then ENTER', text);
        googleanalytics('send', 'event', 'bitcoin', 'send', 'clipboard dialog');
        return false;
    };
    $rootScope.appName = "home";
    $rootScope.CacheServer = CacheServer;
    $rootScope.user = null;
    $rootScope.$on('$routeChangeSuccess', function() {
        var path = $location.path();
        if(!BCPlayer.isPublic(path)){
            if(BCSession.token) {
                $rootScope.$on('login error', function() {
                    $location.path('/');
                });
            } else {
                $location.path('/');
            }
        }
        RouteInterceptor.enforceRoutes();
    });
};

var config = function($routeProvider, $locationProvider, $compileProvider, BCPlayerProvider, PlayerApi, SocketServer) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|bitcoin):/);
    $locationProvider.html5Mode(true).hashPrefix('!');

    // set up routes
    $routeProvider
        .when('/', {templateUrl: 'tpl/index.html', controller: 'HomeController'})
        .when('/home', {templateUrl: 'tpl/index.html', controller: 'HomeController'})
        .when('/password/reset', {templateUrl: 'tpl/password-recovery.html', controller: 'PasswordController'})
        .when('/terms-conditions', {templateUrl: 'tpl/terms.html'})
        .when('/new-to-bitcoin', {templateUrl: 'tpl/newtobitcoin.html'})
        .when('/confirmation', {templateUrl: 'tpl/registration/confirmation.html', controller: 'ConfirmationWalletController'})
        .when('/confirm/:code', {templateUrl: 'tpl/registration/emailconfirm.html', controller: 'EmailConfirmationController'})
        .when('/affiliates', {templateUrl: 'tpl/account/affiliate.html', controller: 'AffiliateController'})
        .when('/affiliate/:affiliateId/associate/:associateId', {templateUrl: 'tpl/account/associate-transactions.html', controller: 'AssociateTransactionsController'})
        .when('/account/', {templateUrl: 'tpl/account/home.html', controller: 'BCAccountController'})
        .when('/account/:target/', {templateUrl: 'tpl/account/home.html', controller: 'BCAccountController'})
        .when('/support/:ticketId?', {templateUrl: 'tpl/support/index.html', controller: 'SupportController'})
        .when('/welcome-bonus', {templateUrl: 'tpl/welcome-bonus.html', controller: 'WelcomeBonusController'})
        .when('/verify/wallet', {templateUrl: 'tpl/verify-wallet.html', controller: 'VerifyController'})
        // .when('/success', {templateUrl: 'tpl/login-success.html', controller: 'LoginController', reloadOnSearch: false})
        .when('/signup', {templateUrl: 'tpl/registration/signup.html', controller: 'SignupController'})
        .when('/login', {templateUrl: 'tpl/login.html', controller: 'LoginController'})
        .otherwise({templateUrl: 'tpl/404.html'});
    // bcPlayer module config
    BCPlayerProvider.cookieName('player-api-token');
    BCPlayerProvider.privatePaths([
        '/account',
        '/messages',
        '/verify',
        '/welcome-bonus'
    ]);

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

angular.module('application', appDeps).config([
    '$routeProvider',
    '$locationProvider',
    '$compileProvider',
    'BCPlayerProvider',
    // 'RouteInterceptorProvider',
    'PlayerApi',
    'SocketServer',
    config
]).run([
    '$rootScope',
    '$cookies',
    '$location',
    'BCSession',
    'BCPlayer',
    'CacheServer',
    'RouteInterceptor',
    run
]);


