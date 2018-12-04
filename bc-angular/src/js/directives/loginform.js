'use strict';
/* global bitcoin */
Application.Directives.directive('bcLogin', ['BCPlayer', 'ngToast', function(BCPlayer, ngToast) {
    return {
        restrict: 'E',
        scope: {
            urlPath: '@path',
            onLogin: '&',
            onLoginError: '&'
        },
        templateUrl: 'tpl/directives/loginform.html',
        link: function(scope,element,attrs) {
            scope.loginUsername = BCPlayer.getCookie('lastAlias') || '';
            scope.loginAddress = BCPlayer.getCookie('lastAddress');
            BCPlayer.removeCookie('lastAddress');
            scope.loginPassword = "";
            scope.inline = attrs.inline;
            scope.submitting = false;

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
                scope.submitting = true;
                BCPlayer.login(scope.loginAddress||scope.loginUsername,
                               scope.loginPassword, method,
                               scope.oneTimePass, scope.urlPath)
                    .then(function(player) {
                        scope.loginPassword = "";
                        scope.newPlayerPending = false;
                        scope.submitting = false;
                        ngToast.create('login-success');
                        $("#loginModal").modal("hide");
                        scope.player = player;
                        console.debug('logged in');
                        window.localStorage.setItem("betcoin_session_value", "login");
                        scope.onLogin({player: player});
                    }, function(err) {
                        if(err.message === 'invalid one time password for 2 factor auth'){
                            scope.requireOneTimePass = true;
                            return;
                        }
                        scope.error = err;
                        scope.submitting = false;
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

Application.Directives.directive('bcLoginAnon', ['$cookies', 'BCPlayer', function($cookies, BCPlayer) {
    return {
        restrict: 'E',
        scope: {
            onLogin: '&',
            onLoginError: '&'
        },
        templateUrl: 'tpl/directives/loginanonform.html',
        link: function(scope, element, attrs) {
            scope.inline = attrs.inline;
            scope.anonAddress = $cookies.lastAnon || "";
            // HIVE AUTO LOGIN
            try {
                bitcoin.getUserInfo(function(info) {
                    scope.anonAddress = info.address;
                });
            } catch(e) {
                // wtf ever
            }
            scope.loginAnon = function() {
                scope.error = null;
                BCPlayer.registerAnonymous(scope.anonAddress).then(function(player) {
                    scope.player = player;
                    scope.onLogin({player: player});
                }, function(err) {
                    scope.player = false;
                    console.error(err);
                    scope.error = err;
                    scope.onLoginError({err: err});
                });
            };
        }
    };
}]);
