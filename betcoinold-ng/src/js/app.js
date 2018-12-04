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
    'ngClipboard'
];

var run = function($rootScope, $cookies, $location, CacheServer) {
    $rootScope.copyDialog = function(text) {
        window.prompt('Press CTRL+C, then ENTER', text);
        googleanalytics('send', 'event', 'bitcoin', 'send', 'clipboard dialog');
        return false;
    };
    $rootScope.CacheServer = CacheServer;
    $rootScope.user = null;
};

var config = function($routeProvider, $locationProvider, $compileProvider, ngClipProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|bitcoin):/);
    $locationProvider.html5Mode(true).hashPrefix('!');
    ngClipProvider.setPath("ZeroClipboard.swf");
    // set up routes
    $routeProvider.otherwise({templateUrl: 'tpl/404.html'});
};

angular.module('application', appDeps).config([
    '$routeProvider',
    '$locationProvider',
    '$compileProvider',
    'ngClipProvider',
    config
]).run([
    '$rootScope',
    '$cookies',
    '$location',
    'CacheServer',
    run
]);


