(function(window, angular) {
    'use strict';

    if (window.io === undefined) {
        throw "No socket.io found!";
    }

    var bcGame = angular.module('bcGame', ['ng', 'ngResource','restangular','textAngular']);

    var appConfig = function($routeProvider, $locationProvider, $compileProvider, RestangularProvider, Api, $anchorScrollProvider, BCPlayerProvider, PlayerApi) {
        RestangularProvider.setBaseUrl(Api.url);
        RestangularProvider.setResponseInterceptor(function(data){
            return data;
        });
        RestangularProvider.setRequestInterceptor(function(element){
            return element;
        });
        $anchorScrollProvider.disableAutoScrolling();



        $routeProvider
            .when('/', {templateUrl: 'tpl/wiki.html', controller: 'WikiController'})
            .when('/read/:id', {templateUrl: 'tpl/view-wiki.html', controller: 'ViewWikiController'})
            .otherwise({redirectTo: '/'});

        BCPlayerProvider.serverConfig({
            hostname: PlayerApi.hostname,
            port: PlayerApi.port,
            scheme: PlayerApi.protocol,
            base: PlayerApi.base
        });
        BCPlayerProvider.socketConfig({
            hostname: PlayerApi.hostname,
            port: 8443,
            scheme: PlayerApi.protocol,
            base: PlayerApi.base
        });
    };

    // var appRun = function($rootScope) {


    // };

    bcGame.config([
            '$routeProvider',
            '$locationProvider',
            '$compileProvider',
            'RestangularProvider',
            'Api',
            '$anchorScrollProvider',
            'BCPlayerProvider',
            'PlayerApi',
            appConfig
        ]);
        // .run([
        //     appRun
        // ]);
})(window,angular);
