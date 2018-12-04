(function(angular) {
    'use strict';

    var module;
    module = angular.module('app.routes');

    var routeConfig = function(BCGameRouteProvider) {
        // set up routing
        BCGameRouteProvider.setupRoutes({
            name: 'circle',
            children: {
                spins: {
                    url: '{_:(?:/spins)?}',
                }
            }
        });
    };

    module.config([
        'BCGameRouteProvider',
        routeConfig
    ]);

})(window.angular);
