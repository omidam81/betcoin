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
            var betmap = {
                '1': {
                    numbers: [0,3,6,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,40,42,45,47,50],
                    payout: 2
                },
                '2': {
                    numbers: [1,4,7,10,18,22,26,30,32,38,41,44,49],
                    payout: 4
                },
                '5': {
                    numbers: [2,8,14,20,28,36,43,48],
                    payout: 6
                },
                '10': {
                    numbers: [5,16,34,46],
                    payout: 11
                },
                '20': {
                    numbers: [12,39],
                    payout: 21
                },
                '45': {
                    numbers: [24,51],
                    payout: 46
                }
            };
            var getLuckyNumberByResult = function(result) {
                var luckyNumber;
                Object.keys(betmap).forEach(function(key){
                    if(betmap[key].numbers.indexOf(parseInt(result)) >= 0){
                        luckyNumber = key;
                    }
                });
                return luckyNumber;
            };
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
                    final_array: finalArray.join(',')
                };
            };
            var seededShuffle = function(items, seed) {
                var counter = items.length;
                var partialDivisor = (parseInt('ffff', 16) + 1);
                var spinMin = 0;
                var spinMax = items.length - 1;
                while (counter > 0) {
                    var hashObj = new window.jsSHA("" + counter + seed, "TEXT");
                    var checkHash = hashObj.getHash("SHA-256", "HEX");
                    var partial = checkHash.substring(0, 4);
                    var rand = parseInt(partial, 16) / partialDivisor;
                    var randIndex = Math.floor(rand * (spinMax - spinMin + 1) + spinMin);
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
                scope.luckyNumber = getLuckyNumberByResult(scope.testFinalArray.split(',')[0]);
            };
        }
    };
};
Application.Directives.directive('provablyFair', [provablyFair]);