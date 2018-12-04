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
            var configs = {
                field: {
                    width: 5,
                    height: 3,
                    symbols: 8
                },
                specialLines: [
                    [
                        [0, 0],
                        [1, 1],
                        [2, 2],
                        [1, 3],
                        [0, 4]
                    ],
                    [
                        [2, 0],
                        [1, 1],
                        [0, 2],
                        [1, 3],
                        [2, 4]
                    ]
                ],
                reels: [
                    [3, 6, 2, 4, 1, 2, 5, 5, 7, 6, 4, 5, 5, 4, 6, 3, 3, 6, 6, 3, 2, 1, 6, 6, 4, 5, 6, 0, 5, 5, 4, 6],
                    [4, 3, 4, 6, 6, 5, 6, 4, 6, 4, 0, 3, 6, 6, 3, 5, 3, 2, 4, 5, 5, 2, 1, 1, 5, 5, 2, 6, 7, 6, 5, 7],
                    [7, 6, 4, 5, 1, 2, 5, 6, 4, 4, 6, 3, 5, 5, 5, 3, 3, 4, 7, 3, 4, 0, 5, 2, 6, 5, 6, 1, 6, 2, 6, 6],
                    [6, 7, 1, 3, 0, 5, 4, 3, 5, 2, 5, 7, 5, 3, 4, 6, 6, 4, 4, 5, 2, 5, 6, 6, 6, 6, 3, 4, 2, 1, 6, 5],
                    [1, 5, 0, 2, 2, 3, 5, 4, 5, 5, 3, 4, 5, 3, 3, 6, 4, 6, 2, 5, 5, 6, 6, 4, 6, 4, 7, 1, 6, 6, 7, 6]
                ],
                // index of scatter tile
                scatter: 7,
                payouts: {
                    0: {
                        3: 88,
                        4: 288,
                        5: 888
                    }, // seven (silver coin)
                    1: {
                        2: 1,
                        3: 55,
                        4: 118,
                        5: 288
                    }, // melon (prize cup)
                    2: {
                        2: 1,
                        3: 55,
                        4: 118,
                        5: 288
                    }, // grape (cherry)
                    3: {
                        3: 18,
                        4: 88,
                        5: 128
                    }, // cherry (dice)
                    4: {
                        3: 18,
                        4: 88,
                        5: 128
                    }, // plum (bell)
                    5: {
                        3: 8,
                        4: 25,
                        5: 58
                    }, // orange (clover)
                    6: {
                        3: 8,
                        4: 25,
                        5: 58
                    }, // lemon (gold coin)
                    7: {
                        3: 8,
                        4: 25,
                        5: 58
                    }, // scatter (ruby)
                }
            };

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

            scope.verify = function(){
                scope.clientSeed = '' + scope.clientSeed;
                var matrixSeed = sha512hmac(scope.clientSeed, scope.serverSeed);
                console.log('client seed', scope.clientSeed, scope.serverSeed);
                console.log('server seed', scope.serverSeed);
                console.log('matrix seed', matrixSeed);
                var centerMatrix = seededMatrix(matrixSeed, {
                    height: 1,
                    width: configs.field.width,
                    min: 0,
                    max: 31
                });
                console.log(JSON.stringify(centerMatrix));
                var centerRow = centerMatrix[0];
                var reelMatrix = new Array(configs.field.height);
                for (var i = 0; i < configs.field.height; i++) {
                    reelMatrix[i] = [];
                }
                var addedRows = Math.floor(configs.field.height / 2);
                var centerRowIndex = addedRows;
                centerRow.forEach(function(centerIndex, reelIndex) {
                    for (var above = addedRows; above > 0; above--) {
                        // get top row
                        var topIndex = centerIndex - above;
                        // detect wrap
                        if (topIndex < 0) {
                            topIndex += 32;
                        }
                        reelMatrix[centerRowIndex - above].push(configs.reels[reelIndex][topIndex]);
                    }
                    reelMatrix[centerRowIndex].push(configs.reels[reelIndex][centerIndex]);
                    for (var below = 1; below < (addedRows + 1); below++) {
                        // get bottom row
                        var bottomIndex = centerIndex + below;
                        // detect wrap
                        if (bottomIndex > 31) {
                            bottomIndex -= 32;
                        }
                        reelMatrix[centerRowIndex + below].push(configs.reels[reelIndex][bottomIndex]);
                    }
                });
                scope.initialHash = sha256sum(scope.serverSeed);
                scope.finalArray = JSON.stringify(reelMatrix);
            };
        }
    };
};
Application.Directives.directive('provablyFair', [provablyFair]);