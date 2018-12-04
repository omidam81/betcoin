(function(angular) {
    'use strict';
    var module;
    module = angular.module('app.routes');

    var routeConfig = function(BCRouteProvider) {
        // set up routing
        console.debug(BCRouteProvider.setupRoutes({
            name: 'home',
            url: '/',
            controller: 'HomeController'
        }));
        console.debug(BCRouteProvider.setupRoutes({
            unit: 'home',
            url: '/logout',
            template: 'logout',
            name: 'logout',
            controller: 'LogoutController'
        }));
    };

    module.config([
        'BCRouteProvider',
        routeConfig
    ]);

})(window.angular);
