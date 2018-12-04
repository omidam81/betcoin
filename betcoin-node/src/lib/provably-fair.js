'use strict';

var crypto = require('crypto');

var getRandomSeed = function() {
    return crypto.randomBytes(16).toString('hex');
};

var sha256sum = function(data, returnType) {
    if (returnType === undefined) {
        returnType = 'hex';
    }
    var sha = crypto.createHash('sha256');
    sha.update("" + data);
    return sha.digest(returnType);
};

var sha512hmac = function(data, key, returnType) {
    if (returnType === undefined) {
        returnType = 'hex';
    }
    var hmac = crypto.createHmac('sha512', "" + key);
    hmac.update("" + data);
    return hmac.digest(returnType);
};

var getHashRand = function(seed, characters) {
    // default to 4 characters 0 - 65535
    if (characters === undefined) characters = 4;
    // get the max (array hack to repeat 'f')
    var partialDivisor = parseInt(Array(characters + 1).join('f'), 16) + 1;
    // hash the seed and get the first 4 characters
    var partial = sha256sum(seed).substring(0, characters);
    // divide the result by the max to get a random "percentage"
    return parseInt(partial, 16) / partialDivisor;
};

var randToValue = function(rand, min, max) {
    // standard random "percent" to int given min/max
    return Math.floor(rand * (max - min + 1) + min);
};

var seededShuffle = function(seed, items) {
    // I changed the order of the arguments (for consistency), this is
    // here for the older app that use the old order
    if (Array.isArray(seed)) {
        var trueSeed = items;
        items = seed;
        seed = trueSeed;
    }
    // don't clobber the original array!
    var itemsCopy = items.slice();
    var counter = itemsCopy.length;
    var spinMin = 0;
    var spinMax = itemsCopy.length - 1;
    while (counter > 0) {
        var rand = getHashRand("" + counter + seed);
        var randIndex = randToValue(rand, spinMin, spinMax);
        counter--;
        var tmp = itemsCopy[counter];
        itemsCopy[counter] = itemsCopy[randIndex];
        itemsCopy[randIndex] = tmp;
    }
    return itemsCopy;
};

var seededMatrix = function(seed, config) {
    // get config options
    var width = config.width;
    if (width === undefined) throw "missing width from matrix config";
    var height = config.height;
    if (height === undefined) throw "missing height from matrix config";
    var max = config.max;
    if (max === undefined) throw "missing max from matrix config";
    var min = config.min;
    if (width === undefined) min = 0;
    // make matrix
    var matrix = new Array(height);
    for (var row = 0; row < height; row++) {
        for (var column = 0; column < width; column++) {
            var rand = getHashRand("" + row + column + seed);
            var result = randToValue(rand, min, max);
            if (matrix[row] === undefined) matrix[row] = new Array(width);
            matrix[row][column] = result;
        }
    }
    return matrix;
};

module.exports = {
    getRandomSeed: getRandomSeed,
    sha256sum: sha256sum,
    sha512hmac: sha512hmac,
    seededShuffle: seededShuffle,
    seededMatrix: seededMatrix
};
