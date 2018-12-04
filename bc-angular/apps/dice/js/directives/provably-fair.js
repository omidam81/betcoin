'use strict';

var provablyFair = function() {
    return {
        restrict: 'E',
        scope:{
            serverSeed: '@',
            clientSeed: '@'
        },
        templateUrl: 'tpl/directives/provably-fair.html',
        link: function(scope) {

            var sha256sum = function(data) {
                var hashObj = new window.jsSHA(data, "TEXT");
                return hashObj.getHash("SHA-256", "HEX");
            };

            var sha512hmac = function(data, key) {
                var hashObj = new window.jsSHA(data, "TEXT");
                console.log(hashObj);
                var checkHash = hashObj.getHMAC(key, "TEXT", "SHA-512", "HEX");
                return checkHash;
            };

            scope.verify = function(){
                scope.clientSeed = '' + scope.clientSeed;
                var resultHash = sha512hmac(scope.clientSeed, scope.serverSeed);
                var partial = resultHash.substring(0,4);
                var result = parseInt(partial, 16);
                scope.initialHash = sha256sum(scope.serverSeed);
                scope.lucky = JSON.stringify(result);
            };
        }
    };
};
Application.Directives.directive('provablyFair', [provablyFair]);
