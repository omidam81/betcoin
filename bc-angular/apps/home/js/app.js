(function(window, angular) {
    'use strict';

    if (window.io === undefined) {
        throw "No socket.io found!";
    }

    var bcGame = angular.module('bcGame', ['ng', 'ngResource']);
    var appRun = function($rootScope) {
        $rootScope.appName = "home";
    };

    var appConfig = function($routeProvider, $locationProvider, $compileProvider, BCPlayerProvider, PlayerApi, SocketServer) {

        // set up routes
        $routeProvider
            .when('/', {templateUrl: 'tpl/index.html', controller: 'HomeController'})
            .when('/home', {templateUrl: 'tpl/index.html', controller: 'HomeController'})
            .when('/anonymous', {templateUrl: 'tpl/anonymous.html'})
            .when('/password/reset', {templateUrl: '/home/tpl/password-recovery.html', controller: 'PasswordController'})
            .when('/terms-conditions', {templateUrl: 'tpl/terms.html'})
            .when('/responsible-gaming', {templateUrl: 'tpl/responsible-gaming.html'})
            .when('/new-to-bitcoin', {templateUrl: 'tpl/newtobitcoin.html'})
            .when('/confirmation', {templateUrl: 'tpl/registration/confirmation.html', controller: 'ConfirmationWalletController'})
            .when('/confirm/:code', {templateUrl: 'tpl/registration/emailconfirm.html', controller: 'EmailConfirmationController'})
            .when('/affiliates', {templateUrl: 'tpl/account/affiliate.html', controller: 'AffiliateController'})
            .when('/affiliate/:affiliateId/associate/:associateId', {templateUrl: '/home/tpl/account/associate-transactions.html', controller: 'AssociateTransactionsController'})
            .when('/account/', {templateUrl: '/home/tpl/account/home.html', controller: 'BCAccountController'})
            .when('/account/:target/', {templateUrl: '/home/tpl/account/home.html', controller: 'BCAccountController'})
            .when('/support/:ticketId?', {templateUrl: '/home/tpl/support/index.html', controller: 'SupportController'})
            .when('/welcome-bonus', {templateUrl: 'tpl/welcome-bonus.html', controller: 'WelcomeBonusController'})
            .when('/verify/wallet', {templateUrl: 'tpl/verify-wallet.html', controller: 'VerifyController'})
            // .when('/success', {templateUrl: 'tpl/login-success.html', controller: 'LoginController', reloadOnSearch: false})
            .when('/signup', {templateUrl: 'tpl/registration/signup.html', controller: 'SignupController'})
            .when('/login', {templateUrl: 'tpl/login.html', controller: 'LoginController'})
            .otherwise({templateUrl: 'tpl/404.html'});

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
        appRun
    ]);
})(window,angular);
