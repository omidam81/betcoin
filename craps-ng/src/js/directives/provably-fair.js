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
            var sha256sum = function(data) {
                var hashObj = new window.jsSHA(data, "TEXT");
                return hashObj.getHash("SHA-256", "HEX");
            };

            var getHashRand = function(seed, characters) {
                // default to 4 characters 0 - 65535
                if (characters === undefined) {
                    characters = 4;
                }
                // get the max (array hack to repeat 'f')
                var partialDivisor = parseInt((new Array(characters + 1)).join('f'), 16);

                // hash the seed and get the first 4 characters
                var partial = sha256sum(seed).substring(0, characters);
                // divide the result by the max to get a random "percentage"
                return parseInt(partial, 16) / partialDivisor;
            };

            var randToValue = function(rand, min, max) {
                // standard random "percent" to int given min/max
                return Math.floor(rand * (max - min + 1) + min);
            };

            var sha512hmac = function(data, key) {
                var hashObj = new window.jsSHA(data, "TEXT");
                console.log(hashObj);
                var checkHash = hashObj.getHMAC(key, "TEXT", "SHA-512", "HEX");
                return checkHash;
            };
            var seededMatrix = function(seed, config) {
                // get config options
                var width = config.width;
                if (width === undefined) {
                    throw "missing width from matrix config";
                }
                var height = config.height;
                if (height === undefined) {
                    throw "missing height from matrix config";
                }
                var max = config.max;
                if (max === undefined) {
                    throw "missing max from matrix config";
                }
                var min = config.min;
                if (width === undefined) {
                    min = 0;
                }
                // make matrix
                var matrix = new Array(height);
                for (var row = 0; row < height; row++) {
                    for (var column = 0; column < width; column++) {
                        var rand = getHashRand("" + row + column + seed);
                        var result = randToValue(rand, min, max);
                        if (matrix[row] === undefined) {
                            matrix[row] = new Array(width);
                        }
                        matrix[row][column] = result;
                    }
                }
                return matrix;
            };

            scope.verifyFair = function(){
                scope.clientSeed = '' + scope.clientSeed;
                var matrixSeed = sha512hmac(scope.clientSeed, scope.serverSeed);
                console.log('client seed', scope.clientSeed, scope.serverSeed);
                console.log('server seed', scope.serverSeed);
                console.log('matrix seed', matrixSeed);
                var centerMatrix = seededMatrix(matrixSeed, {
                    height: 1,
                    width: 3,
                    min: 1,
                    max: 6
                });
                scope.testInitialHash = sha256sum(scope.serverSeed);
                scope.testFinalArray = JSON.stringify(centerMatrix[0]);
            };
        }
    };
};
Application.Directives.directive('provablyFair', [provablyFair]);