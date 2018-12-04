'use strict';

var provablyFair = function() {
    return {
        restrict: 'E',
        scope: {
            serverSeed: '@',
            clientSeed: '@',
            initialHash: '@',
            initArray: '@',
            finalArray: '@'
        },
        templateUrl: 'tpl/directives/provably-fair.html',
        link: function(scope) {
            var checkGame = function(gameInit) {
                var hashObj = new window.jsSHA(JSON.stringify({
                    initialArray: gameInit.init_array,
                    serverSeed: gameInit.server_seed
                }), "TEXT");
                var checkHash = hashObj.getHash("SHA-256", "HEX");
                var initArray = gameInit.init_array.split(',');
                var serverArray = seededShuffle(initArray, gameInit.server_seed);
                var finalArray = seededShuffle(serverArray, gameInit.client_seed);
                return {
                    initial_hash: checkHash,
                    final_array: finalArray
                };
            };
            var seededShuffle = function(items, seed) {
                var counter = items.length;
                var partialDivisor = (parseInt('ffff', 16) + 1);
                var drawMin = 0;
                var drawMax = items.length - 1;
                while (counter > 0) {
                    var hashObj = new window.jsSHA("" + counter + seed, "TEXT");
                    var checkHash = hashObj.getHash("SHA-256", "HEX");
                    var partial = checkHash.substring(0, 4);
                    var rand = parseInt(partial, 16) / partialDivisor;
                    var randIndex = Math.floor(rand * (drawMax - drawMin + 1) + drawMin);
                    counter--;
                    var tmp = items[counter];
                    items[counter] = items[randIndex];
                    items[randIndex] = tmp;
                }
                return items;
            };
            scope.verifyFair = function() {
                var calculatedResult = checkGame({
                    server_seed: scope.serverSeed,
                    init_array: scope.initArray,
                    client_seed: scope.clientSeed + '',
                    final_array: scope.finalArray
                });
                scope.testInitialHash = calculatedResult.initial_hash;
                scope.testFinalArray = calculatedResult.final_array;
            };
        }
    };
};
Application.Directives.directive('provablyFair', [provablyFair]);