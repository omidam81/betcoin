'use strict';

var provablyFair = function() {
    return {
        restrict: 'E',
        scope:{
            serverSeed: '@',
            clientSeed: '@',
            initArray: '='
        },
        templateUrl: 'tpl/directives/provably-fair.html',
        link: function(scope) {
            var sha256sum = function(data) {
                var hashObj = new window.jsSHA(data, "TEXT");
                return hashObj.getHash("SHA-256", "HEX");
            };
            var seededShuffle = function(items, seed) {
                var counter = items.length;
                var partialDivisor = (parseInt('ffff', 16) + 1);
                var spinMin = 0;
                var spinMax = items.length - 1;
                while (counter > 0) {
                    var hashObj = new window.jsSHA("" + counter + seed, "TEXT");
                    var partial = hashObj.getHash("SHA-256", "HEX").substring(0, 4);
                    var rand = parseInt(partial, 16) / partialDivisor;
                    var randIndex = Math.floor(rand * (spinMax - spinMin + 1) + spinMin);
                    counter--;
                    var tmp = items[counter];
                    items[counter] = items[randIndex];
                    items[randIndex] = tmp;
                }
                return items;
            };

            scope.verify = function(){
                scope.clientSeed = '' + scope.clientSeed;
                scope.initialHash = sha256sum(scope.serverSeed);
                var serverArray = seededShuffle(scope.initArray, scope.serverSeed);
                var finalArray = seededShuffle(serverArray, scope.clientSeed);
                scope.finalArray = JSON.stringify(finalArray);
            };
        }
    };
};
Application.Directives.directive('provablyFair', [provablyFair]);