'use strict';

Application.Directives.directive('bcRedirectLogin', ['$location', 'BCPlayer', 'BCSession', function($location, BCPlayer, BCSession) {
    return {
        restrict: 'E',
        templateUrl: 'tpl/directives/redirect_loginform.html',
        link: function(scope, element, attrs) {
            scope.identity = BCPlayer.getCookie('lastAlias') || '';
            scope.inline = attrs.inline;
            scope.home_description = attrs.homeDescription;
            scope.redirect_path = attrs.redirectPath;
            var verifyAddress = function(address){
                BCPlayer.verifyAddress(address).then(function(data){
                    if(data.exist === true){
                        BCPlayer.saveCookie('lastAddress', address);
                        if(scope.redirect_path) {
                            window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/login?s='+scope.redirect_path;
                        } else {
                            window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/login';
                        }
                    }else{
                        if(address.substring(0, 1) === '1' && address.length > 26){
                            BCPlayer.saveCookie('lastAddress', address);
                            BCPlayer.removeCookie('lastAlias');
                        }
                        window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/signup';
                    }
                });
            };
            scope.checkAlias = function() {
                if (BCSession.user && BCSession.user.alias === scope.identity) {
                    if(scope.redirect_path) {
                        window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/'+scope.redirect_path;
                    } else {
                        $location.path('/account');
                    }
                }
                scope.error = null;
                BCPlayer.verifyAlias(scope.identity).then(function(data) {
                    BCPlayer.saveCookie('lastAlias', scope.identity);
                    BCPlayer.removeCookie('lastAddress');
                    if(data.exist === true){
                        if(data.isAnonymous){
                            BCPlayer.registerAnonymous(scope.identity, 'btc').then(function() {
                                window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/account';
                            }, function(err) {
                                scope.error = err;
                            });
                            return;
                        }
                        if(scope.redirect_path) {
                            window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/login?s='+scope.redirect_path;
                        } else {
                            window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/login';
                        }
                    }else{
                        verifyAddress(scope.identity);
                    }
                });
            };
        }
    };
}]);
