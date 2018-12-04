(function(angular) {
    'use strict';
    var module;
    module = angular.module('app.routes');

    var routeConfig = function(BCRouteProvider) {
        // set up routing
        console.debug(BCRouteProvider.setupRoutes({
            name: 'affiliate',
            url: '/affiliate',
            controller: 'AffiliateController'
        }));
    };

    module.config([
        'BCRouteProvider',
        routeConfig
    ]);

})(window.angular);
