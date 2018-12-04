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
                BCPlayer.verifyAddress(address).then(function(){
                    BCPlayer.saveCookie('lastAddress', address);
                    if(scope.redirect_path) {
                        window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/login?s='+scope.redirect_path;
                    } else {
                        window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/login';
                    }
                }).catch(function(){
                    if(address.substring(0, 1) === '1' && address.length > 26){
                        BCPlayer.saveCookie('lastAddress', address);
                        BCPlayer.removeCookie('lastAlias');
                    }
                    window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/signup';
                });
            };
            scope.checkAlias = function() {
                if (BCSession.user && BCSession.user.username === scope.identity) {
                    if(scope.redirect_path) {
                        window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/'+scope.redirect_path;
                    } else {
                        $location.path('/');
                    }
                }
                scope.error = null;
                BCPlayer.saveCookie('lastAlias', scope.identity);
                BCPlayer.removeCookie('lastAddress');
                BCPlayer.verifyAlias(scope.identity).then(function(data) {
                    if (data && data.anonymous) {
                        BCSession.user = data;
                        $location.path("/account");
                    } else {
                        verifyAddress(scope.identity);
                    }
                }).catch(function(data){
                    if(data.status === 409){
                        if(scope.redirect_path) {
                            window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/login?s='+scope.redirect_path;
                        } else {
                            window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/login';
                        }
                    }
                });
            };
        }
    };
}]);
