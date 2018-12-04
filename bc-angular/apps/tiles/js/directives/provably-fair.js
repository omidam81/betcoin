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
            

            var getUnShuffledTiles = function() {
                return [
                    {red: 2, white: 0, rank: 2},
                    {red: 2, white: 0, rank: 2},
                    {red: 1, white: 3, rank: 4},
                    {red: 1, white: 3, rank: 4},
                    {red: 0, white: 4, rank: 7},
                    {red: 0, white: 4, rank: 7},
                    {red: 1, white: 5, rank: 11},
                    {red: 1, white: 5, rank: 11},
                    {red: 1, white: 6, rank: 10},
                    {red: 1, white: 6, rank: 10},
                    {red: 8, white: 0, rank: 3},
                    {red: 8, white: 0, rank: 3},
                    {red: 0, white: 6, rank: 6},
                    {red: 0, white: 6, rank: 6},
                    {red: 4, white: 6, rank: 9},
                    {red: 4, white: 6, rank: 9},
                    {red: 0, white: 10, rank: 5},
                    {red: 0, white: 10, rank: 5},
                    {red: 0, white: 11, rank: 8},
                    {red: 0, white: 11, rank: 8},
                    {red: 6, white: 6, rank: 1},
                    {red: 6, white: 6, rank: 1},
                    {red: 4, white: 5, rank: 12},
                    {red: 0, white: 9, rank: 12},
                    {red: 0, white: 8, rank: 13},
                    {red: 0, white: 8, rank: 13},
                    {red: 4, white: 3, rank: 14},
                    {red: 0, white: 7, rank: 14},
                    {red: 5, white: 0, rank: 15},
                    {red: 0, white: 5, rank: 15},
                    {red: 4, white: 2, rank: 16},
                    {red: 1, white: 2, rank: 16}
                ];
            };

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
                    var checkHash = sha256sum("" + counter + seed, "TEXT");
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

            var getShuffledCards = function (seed) {
                return seededShuffle(getUnShuffledTiles(), seed);
            };

            scope.verify = function(){
                scope.initialHash = sha256sum(scope.serverSeed);
                var finalArray = getShuffledCards(scope.clientSeed + scope.serverSeed);
                scope.finalArray = JSON.stringify(finalArray);
            };
        }
    };
};
Application.Directives.directive('provablyFair', [provablyFair]);