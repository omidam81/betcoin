(function(angular) {
    'use strict';

    var module;
    module = angular.module('app.routes');

    var routeConfig = function($stateProvider, BCRouteProvider) {
        // set up routing
        BCRouteProvider.setupRoutes({
            unit: 'account',
            abstract: true,
            resolve: {
                user: [
                    '$location',
                    'BCSession',
                    function($location, BCSession) {
                        console.debug("getting a user");
                        if (!BCSession.authenticated) {
                            console.debug("not authenticated, logging in");
                            return BCSession.login().catch(function(error) {
                                console.error(error);
                                $location.path('/');
                            });
                        }
                    }
                ]
            },
            children: {
                games: {
                    url: '{_:(?:/games)?}',
                },
                deposit: {
                    url: '/deposit'
                }
            }
        });
    };

    module.config([
        '$stateProvider',
        'BCRouteProvider',
        routeConfig
    ]);
})(window.angular);
