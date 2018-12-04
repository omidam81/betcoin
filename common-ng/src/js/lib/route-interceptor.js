(function(window, angular) {
    'use strict';
    var routeInterceptor = angular.module('routeInterceptor', ['ng']);
    var RouteInterceptor = function($rootScope, $location, $window, BCPlayer, BCSession) {
        return {
            enforceRoutes: function() {
                var checkWallet = function(user) {
                    if((path === "/" || path === "/login") && $rootScope.appName === "home") {
                        return $location.path('/account');
                    }
                    var withdrawAddress;
                    try {
                        withdrawAddress = user.withdraw.btc.address;
                    } catch (ex) {
                        withdrawAddress = null;
                    }

                    // user with no wallet address
                    if (user && withdrawAddress === null && !user.anonymous) {
                        if(user.bonusOffers && Object.keys(user.bonusOffers.btc).length > 0) {
                            if(path !== "/welcome-bonus") {
                                window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/welcome-bonus';
                            }
                        }
                        else if (path !== "/verify/wallet") {
                            window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/verify/wallet';
                        }

                    }
                    if(path === "/signup") {
                        return $location.path('/account');
                    }
                };
                var path = $location.path();
                // console.log("new path: ", path, "user: ",BCSession.user);
                if (BCSession.user) {
                    checkWallet(BCSession.user);
                } else {
                    BCPlayer.$on('user update', function(event, user) {
                        checkWallet(user,event);
                    });
                }
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
