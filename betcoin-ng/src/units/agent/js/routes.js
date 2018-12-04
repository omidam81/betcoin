(function(angular) {
    'use strict';
    var module;
    module = angular.module('app.routes');

    var routeConfig = function(BCRouteProvider) {
        // set up routing
        console.debug(BCRouteProvider.setupRoutes({
            name: 'agent',
            url: '/agent',
            controller: 'AgentController'
        }));
    };

    module.config([
        'BCRouteProvider',
        routeConfig
    ]);

})(window.angular);
