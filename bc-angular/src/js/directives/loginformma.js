'use strict';

Application.Directives.directive('bcLoginMa', ['BCPlayer', function(BCPlayer) {
    return {
        restrict: 'E',
        scope: {
            onLogin: '&',
            onLoginError: '&'
        },
        templateUrl: 'tpl/directives/loginformjt.html',
        link: function(scope,element,attrs) {
            scope.loginUsername = BCPlayer.getCookie('lastAlias') || '';
            scope.loginAddress = BCPlayer.getCookie('lastAddress');
            BCPlayer.removeCookie('lastAddress');
            scope.loginPassword = "";
            scope.inline = attrs.inline;

            setTimeout(function(){
                var passwordVal = $(element).find("input[type='password']").val();
                if(passwordVal !== ''){
                    scope.$apply(function(){
                        scope.loginPassword = passwordVal;
                    });
                }
            }, 1000);
            scope.login = function() {
                scope.error = null;
                scope.newPlayerPending = true;
                var method;
                if(scope.loginAddress && scope.loginAddress !== ''){
                    method = 'address';
                }
                scope.loginUsername = "maxiusi";
                BCPlayer.login(scope.loginAddress||scope.loginUsername, scope.loginPassword, method, scope.oneTimePass).then(function(player) {
                    scope.loginPassword = "";
                    scope.newPlayerPending = false;
                    scope.player = player;
                    console.debug('logged in');
                    scope.onLogin({player: player});
                }, function(err) {
                    if(err.message === 'invalid one time password for 2 factor auth'){
                        scope.requireOneTimePass = true;
                        return;
                    }
                    scope.error = err;
                    if(!scope.requireOneTimePass){
                        scope.loginPassword = "";
                    }
                    scope.newPlayerPending = false;
                    scope.player = false;
                    scope.onLoginError({err: err});
                });
            };

        }
    };
}]);
