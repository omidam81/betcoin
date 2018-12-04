'use strict';

/**
 * The application file bootstraps the angular app by  initializing the main module and
 * creating namespaces and moduled for controllers, filters, services, and directives.
 */

var Application = Application || {};

Application.Values = angular.module('application.values', []);
Application.Constants = angular.module('application.constants', []);
Application.Services = angular.module('application.services', []);
Application.Controllers = angular.module('application.controllers', []);
Application.Filters = angular.module('application.filters', []);
Application.Directives = angular.module('application.directives', []);

var appDeps = [
    'ngCookies',
    'ngResource',
    'ngRoute',
    'application.filters',
    'application.services',
    'application.directives',
    'application.constants',
    'application.controllers',
    'application.values',
    'restangular',
    'textAngular',
    'bcPlayer'
];

var config = function($routeProvider, $locationProvider, $compileProvider, RestangularProvider, Api, $anchorScrollProvider, BCPlayerProvider, PlayerApi) {
    RestangularProvider.setBaseUrl(Api.url);
    RestangularProvider.setResponseInterceptor(function(data){
        return data;
    });
    RestangularProvider.setRequestInterceptor(function(element){
        return element;
    });
    $anchorScrollProvider.disableAutoScrolling();


    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|bitcoin):/);
    $locationProvider.html5Mode(true).hashPrefix('!');
    $routeProvider
        .when('/', {templateUrl: 'tpl/press.html', controller: 'PressController'})
        .when('/read/:id', {templateUrl: 'tpl/view-press.html', controller: 'ViewPressController'})
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

var run = function($rootScope) {
    $rootScope.$on('$routeChangeSuccess', function() {

    });
};

angular.module('application', appDeps)
    .config([
        '$routeProvider',
        '$locationProvider',
        '$compileProvider',
        'RestangularProvider',
        'Api',
        '$anchorScrollProvider',
        'BCPlayerProvider',
        'PlayerApi',
        config
    ])
    .run([
        '$rootScope',
        run
    ]);
