(function(window, angular) {
    'use strict';
    var routeInterceptor = angular.module('routeInterceptor', ['ng']);
    var RouteInterceptor = function($rootScope, $location, $window, BCPlayer, BCSession) {
        return {
            enforceRoutes: function() {
                var checkWallet = function() {
                    if((path === "/" || path === "/login"  || path === "/signup")) {
                        if( $rootScope.appName === "home") { return $location.path('/account'); }
                        if( $rootScope.appName === "replanding") { window.location.href = '/account'; }
                    }
                };
                var path = $location.path();
                if(BCSession.user){
                    checkWallet(BCSession.user);
                }
                BCPlayer.$on('valid wallet', function(event, user){
                    checkWallet(user);
                });
                BCPlayer.$on('invalid wallet', function(event, user){
                    checkWallet(user);
                });
            }
        };
    };
    routeInterceptor.provider('RouteInterceptor', function() {
        this.$get = [
            '$rootScope',
            '$location',
            '$window',
            'BCPlayer',
            'BCSession',
            RouteInterceptor
        ];
    });

    return routeInterceptor;
})(window, window.angular);
