
(function(window, angular) {
    'use strict';

    if (window.io === undefined) {
        throw "No socket.io found!";
    }

    var bcGame = angular.module('bcGame', ['ng', 'ngResource','restangular','textAngular']);

    var appConfig = function($routeProvider, $locationProvider, $compileProvider, RestangularProvider, Api, BCPlayerProvider, PlayerApi) {
        RestangularProvider.setBaseUrl(Api.url);
        RestangularProvider.setResponseInterceptor(function(data){
            return data;
        });
        RestangularProvider.setRequestInterceptor(function(element){
            return element;
        });

        $routeProvider
            .when('/', {templateUrl: 'tpl/blog.html', controller: 'BlogController'})
            .when('/read/:id', {templateUrl: 'tpl/view-blog.html', controller: 'ViewBlogController'})
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

// ;    var appRun = function() {


//     }
    bcGame.config([
            '$routeProvider',
            '$locationProvider',
            '$compileProvider',
            'RestangularProvider',
            'Api',
            'BCPlayerProvider',
            'PlayerApi',
            appConfig
        ]);
        // .run([
        //     appRun
        // ]);
})(window,angular);