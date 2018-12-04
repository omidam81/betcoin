(function(window, angular) {
    'use strict';

    if (window.io === undefined) {
        throw "No socket.io found!";
    }
    var bcGame = angular.module('bcGame', ['ng', 'ngResource','restangular','textAngular','bcAdmin', 'ui.bootstrap', 'ui.date']);



    var appRun = function($rootScope, $location, BTCExchangeRate, BCAuth, BCAdminSession) {
        if (!BCAdminSession.token) {
            $rootScope.hasLogin = false;
            $location.path('/login');
        } else {
            // $rootScope.exchange = BTCExchangeRate.get();
        }
        $rootScope.ACCESS_NORMAL = 2;
        $rootScope.ACCESS_ADMIN = 1;
        $rootScope.ACCESS_SUPER_ADMIN = 0;
        $rootScope.DATE_FORMAT = 'MM/dd HH:mm:ss';
        $rootScope.LOCALES = ['en_US', 'zh_CN'];
        $rootScope.CURRENCIES = [
            'bitcoin',
            'litecoin',
            'dogecoin',
            'ppcoin',
            'namecoin'
        ];
        $rootScope.GAMES = [
            'baccarat',
            'baccpo',
            'blackjack',
            'caribbean',
            'circle',
            'coinflip',
            'craps',
            'dice',
            'fantan',
            'fortune',
            'hilo',
            'keno',
            'lottery',
            'mahjong',
            'paigow',
            'reels',
            'roulette',
            'sicbo',
            'threecard',
            'tigerdragon',
            'tiles',
            'ultimatepoker',
            'videopoker',
            'war',
        ];

        $rootScope.logout = function(){
            BCAuth.logout();
        };
        $rootScope.toBitcoin = function(value) {
            return parseInt(value, 10).toBitcoin();
        };
        $rootScope.toSatoshi = function(value) {
            return parseFloat(value).toSatoshi();
        };
        $rootScope.$on('$routeChangeSuccess', function() {

            var path = $location.path();
            if(BCAdminSession.token){
                $rootScope.hasLogin = true;
            }
            if (path === '/login' && BCAdminSession.token) {
                $location.path('/');
            } else if(!BCAuth.isPublic(path)){
                if (!BCAdminSession.token) {
                    $rootScope.hasLogin = false;
                    $location.path('/login');
                }
            }
        });

        $rootScope.error = null;

        $rootScope.setMessage = function(message) {
            $rootScope.message = message;
            setTimeout($rootScope.$apply.bind($rootScope), 3000, function() {
                $rootScope.message = "";
            });
        };


    };

    var appConfig = function($routeProvider, $locationProvider,
                             $compileProvider, BCAuthProvider,
                             Api, BCPlayerProvider, PlayerApi,
                             SocketServer) {

        $routeProvider
            .when('/search/:searchType?', {
                templateUrl: 'tpl/search.html',
                controller: 'SearchController'
            }).when('/saved-searches', {
                templateUrl: 'tpl/saved-searches.html',
                controller: 'SavedSearchController'
            }).when('/login', {
                templateUrl: 'tpl/admin-login.html',
                controller: 'LoginController'
            }).when('/security', {
                templateUrl: 'tpl/security.html',
                controller: 'SecurityController'
            }).when('/user-stats', {
                templateUrl: 'tpl/user-stats.html',
                controller: 'UserStatsController'
            }).when('/agents/:section?/:id?', {
                templateUrl: 'tpl/agents.html',
                controller: 'AgentsController'
            }).when('/reps/:section?/:id?', {
                templateUrl: 'tpl/reps.html',
                controller: 'RepsController'
            }).when('/gametotals', {
                templateUrl: 'tpl/gametotals.html',
                controller: 'GameTotalsController'
            }).when('/gamesearch', {
                templateUrl: 'tpl/gamesearch.html'
            }).when('/bonustotals', {
                templateUrl: 'tpl/bonustotals.html',
                controller: 'BonusTotalsController'
            }).when('/bankroll', {
                templateUrl: 'tpl/bankroll.html',
                controller: 'BankrollController'
            }).when('/reports/:type?', {
                templateUrl: 'tpl/reports.html',
                controller: 'ReportController'
            }).when('/support/:status?', {
                templateUrl: 'tpl/support.html',
                controller: 'SupportController'
            }).when('/ticket/:ticketId?', {
                templateUrl: 'tpl/ticket.html',
                controller: 'TicketController'
            }).when('/user/:userId/:pane?', {
                templateUrl: 'tpl/user.html',
                controller: 'UserController'
            }).when('/cashouts', {
                templateUrl: 'tpl/cashouts.html',
                controller: 'CashoutController'
            }).when('/alerts', {
                templateUrl: 'tpl/alerts.html',
                controller: 'EmailAlertController'
            }).when('/cashbacks', {
                templateUrl: 'tpl/cashbacks.html',
                controller: 'CashbackController'
            }).when('/send-crypto', {
                templateUrl: 'tpl/send-crypto.html',
                controller: 'SendCryptoController'
            }).when('/vip', {
                templateUrl: 'tpl/vip.html',
                controller: 'VipStatusController'
            }).when('/promotions/:promoId?', {
                templateUrl: 'tpl/promotions.html',
                controller: 'PromotionsController'
            }).when('/contacts/:listId?', {
                templateUrl: 'tpl/contacts.html',
                controller: 'ContactsController'
            }).when('/logs', {
                templateUrl: 'tpl/logs.html',
                controller: 'LogController'
            }).when('/config/:type?', {
                templateUrl: 'tpl/configs.html',
                controller: 'ConfigurationController'
            }).otherwise({
                redirectTo: '/search'
            });

        BCAuthProvider.cookieName('office-api-token');
        BCAuthProvider.serverConfig({
            hostname: Api.hostname,
            port: Api.port,
            scheme: Api.protocol
        });
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

        BCPlayerProvider.isBackoffice(true);
    };

    bcGame.config([
        '$routeProvider',
        '$locationProvider',
        '$compileProvider',
        'BCAuthProvider',
        'Api',
        'BCPlayerProvider',
        'PlayerApi',
        'SocketServer',
        appConfig
    ]).run([
        '$rootScope',
        '$location',
        'BTCExchangeRate',
        'BCAuth',
        'BCAdminSession',
        appRun
    ]);

})(window,angular);
