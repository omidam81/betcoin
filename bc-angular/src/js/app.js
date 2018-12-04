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
    'angular-ladda',
    'ngToast',
    'ng.deviceDetector',
    'routeInterceptor',
    'pasvaz.bindonce',
    'ui.bootstrap',
    'bcGame'
];

var run = function($rootScope, $location, $filter, BCSession, BCPlayer,
                   CacheServer, RouteInterceptor, exchangeRate, deviceDetector) {
    $rootScope.copyDialog = function(text) {
        window.prompt('Press CTRL+C, then ENTER', text);
        return false;
    };

    $rootScope.error = null;
    $rootScope.CacheServer = CacheServer;
    $rootScope.currencyAbbr = "฿";

    $rootScope.maintnenanceError = null;

    $rootScope.$watch('maintenanceError', function(newVal) {
        if (newVal) {
            $('#maintenance').modal('show');
        }
    });

    $rootScope.deviceInfo = deviceDetector;
    $rootScope.autospin = false;
    $rootScope.user = null;

    $rootScope.BCSession = BCSession;

    $rootScope.sendBitcoins = function(address) {
        if(window.bitcoin) {
            /* global bitcoin */
            bitcoin.sendMoney(address);
        } else {
            window.open('bitcoin:'+address, '_self');
        }
    };

    $rootScope.clipboard = function(text) {
        window.prompt('Press CTRL+C, then ENTER', text);
        return false;
    };


    $rootScope.logout = function(anonFlag) {
        BCPlayer.logout();
        if(anonFlag) {
            setTimeout(function() { window.location.href = '/anonymous'; }, 3000);
        } else {
            setTimeout(function() { window.location.reload(); }, 3000);
        }
    };
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
            // get all the google trackers and send a screeenview to
            // them. a screen view is different than a page view, as
            // it implies the event happened wiothout reloading the
            // page in our single page app
            googleanalytics.getAll().forEach(function(tracker) {
                var params = {
                    screenName: path
                };
                tracker.send('screenview', params);
            });
        RouteInterceptor.enforceRoutes();
    });

    $rootScope.currencies = ['bitcoin', 'litecoin', 'dogecoin', 'ppcoin', 'namecoin'];
    var changeCurrencySymbol = function(currency) {
        if(currency === 'bitcoin'){
            $rootScope.currencyAbbr = '฿';
        }
        if(currency === 'litecoin'){
            $rootScope.currencyAbbr = 'Ł';
        }
        if(currency === 'dogecoin'){
            $rootScope.currencyAbbr = "Ð";
        }
        if(currency === 'ppcoin'){
            $rootScope.currencyAbbr = "Ᵽ";
        }
        if(currency === 'namecoin'){
            $rootScope.currencyAbbr = "ℕ";
        }
    };

    $rootScope.fiatSymbols = {
        USD: "$",
        CNY: "¥"
    };

    $rootScope.fiat = BCSession.lang = 'en_US' ? 'USD' : 'CNY';

    $rootScope.fiatValue = function(amount, currency) {
        var btcValue = exchangeRate.bitcoinValue(amount, currency);
        return exchangeRate.convert(btcValue, $rootScope.fiat);
    };

    $rootScope.$on('currencyChange', function(event, currency){
        changeCurrencySymbol(currency);
        RouteInterceptor.enforceRoutes();
    });

    changeCurrencySymbol(BCSession.currency);
};

var config = function($routeProvider, $locationProvider, $compileProvider, BCPlayerProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|bitcoin|litecoin|dogecoin|peercoin|ppcoin|namecoin|primecoin):/);
    $locationProvider.html5Mode(true).hashPrefix('!');
    BCPlayerProvider.cookieName('player-api-token');

};

angular.module('application', appDeps).config([
    '$routeProvider',
    '$locationProvider',
    '$compileProvider',
    'BCPlayerProvider',
    config
]).run([
    '$rootScope',
    '$location',
    '$filter',
    'BCSession',
    'BCPlayer',
    'CacheServer',
    'RouteInterceptor',
    'exchangeRate',
    'deviceDetector',
    run
]);
