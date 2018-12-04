'use strict';
/*
 * Utilities for managing a game of mahjong.
 */
var _ = require('underscore');

var util = function() {};

var vals = {
    // id = value + (9 * color);
    // (buffered values have two extra spaces
    // on either side of the pins and sous
    // name     id      buffered
    // character      00-08   02-10
    // circle      09-17   13-21
    // bamboo      18-26   24-32
    // honors   27-33   35-43

    id_min: 0,
    color_beg: 0,
    character_beg: 0,
    character_end: 8,
    circle_beg: 9,
    circle_end: 17,
    bamboo_beg: 18,
    bamboo_end: 26,
    color_end: 26,
    honor_beg: 27,
    wind_beg: 27,
    wind_end: 30,
    dragon_beg: 31,
    dragon_end: 33,
    honor_end: 33,
    bonus_beg: 34,
    flower_beg: 34,
    flower_end: 37,
    season_beg: 38,
    season_end: 41,
    bonus_end: 41,
    id_max: 41,
    count: 41 + 1,
    buf_beg: 2,
    buf_end_no_honors: 32,
    buf_end: 43
};
var tileNames = [
    /* Color */
    'character1',
    'character2',
    'character3',
    'character4',
    'character5',
    'character6',
    'character7',
    'character8',
    'character9',
    'circle1',
    'circle2',
    'circle3',
    'circle4',
    'circle5',
    'circle6',
    'circle7',
    'circle8',
    'circle9',
    'bamboo1',
    'bamboo2',
    'bamboo3',
    'bamboo4',
    'bamboo5',
    'bamboo6',
    'bamboo7',
    'bamboo8',
    'bamboo9',
    /* Honor */
    'windeast',
    'windsouth',
    'windwest',
    'windnorth',
    'dragonred',
    'dragongreen',
    'dragonwhite',
    /* Bonus */
    'flowerplum',
    'flowerorchid',
    'flowerchrysan',
    'flowerbamboo',
    'seasonspring',
    'seasonsummer',
    'seasonautumn',
    'seasonwinter'
];
var isCharacter = function(tile) {
    return tile >= vals.character_beg && tile <= vals.character_end;
};
var isCircle = function(tile) {
    return tile >= vals.circle_beg && tile <= vals.circle_end;
};
var isBamboo = function(tile) {
    return tile >= vals.bamboo_beg && tile <= vals.bamboo_end;
};
var isWind = function(tile) {
    return tile >= vals.wind_beg && tile <= vals.wind_end;
};
var isDragon = function(tile) {
    return tile >= vals.dragon_beg && tile <= vals.dragon_end;
};
var isFlower = function(tile) {
    return tile >= vals.flower_beg && tile <= vals.flower_end;
};
var isSeason = function(tile) {
    return tile >= vals.season_beg && tile <= vals.season_end;
};
var isBonus = function(tile) {
    return isFlower(tile) || isSeason(tile);
};
var windTile = function(wind) {
    return tileNames.indexOf('wind' + wind);
};
var isMyBonus = function(tile, seat) {
    var name = tileNames[tile];
    if (isFlower(tile)) {
        if (name === 'flowerplum' && seat === 'east') {
            return true;
        }
        if (name === 'flowerorchid' && seat === 'south') {
            return true;
        }
        if (name === 'flowerchrysan' && seat === 'west') {
            return true;
        }
        if (name === 'flowerbamboo' && seat === 'north') {
            return true;
        }
    } else if (isSeason(tile)) {
        if (name === 'seasonspring' && seat === 'east') {
            return true;
        }
        if (name === 'seasonsummer' && seat === 'south') {
            return true;
        }
        if (name === 'seasonautumn' && seat === 'west') {
            return true;
        }
        if (name === 'seasonwinter' && seat === 'north') {
            return true;
        }
    }
    return false;
};
var suit = function(tile) {
    if (isCharacter(tile)) {
        return 'character';
    }
    if (isCircle(tile)) {
        return 'circle';
    }
    if (isBamboo(tile)) {
        return 'bamboo';
    }
    if (isWind(tile)) {
        return 'wind';
    }
    if (isDragon(tile)) {
        return 'dragon';
    }
    if (isFlower(tile)) {
        return 'flower';
    }
    if (isSeason(tile)) {
        return 'season';
    }
};
var isColor = function (tile) {
    return isCharacter(tile) || isCircle(tile) || isBamboo(tile);
};
var sum = function (arr){
    // Sum the number of tiles in a hand
    for(var s = 0, i = arr.length; i; s += arr[--i]);
    return s;
};
var sortTile = function(tile1, tile2) {
    return tile1 - tile2;
};

var hist = function(tiles, newTile) {
    var hist = [];
    for (var i = vals.id_min; i<=vals.id_max; i++) {
        hist.push(0);
    }
    for (i = 0; i < tiles.length; i++) {
        hist[tiles[i]]++;
    }
    if (newTile !== undefined) {
        hist[newTile]++;
    }
    return hist;
};

var index = function(tileName) {
    return tileNames.indexOf(tileName);
};

var translateFromBufferedNoHonors = function (buffered) {
    var hist = buffered.slice(0);
    hist.splice(0, 2);
    hist.splice(9, 2);
    hist.splice(18, 2);
    return hist;
};
var translateToBufferedNoHonors = function (hist) {
    // Convert a histogram of tiles into the buffered
    // representation which places extra space on the end
    // of the pins and sous
    hist = hist.slice(0, vals.honor_beg);
    hist.splice(vals.honor_beg, 0, 0, 0);
    hist.splice(vals.sou_beg, 0, 0, 0);
    hist.splice(vals.pin_beg, 0, 0, 0);
    return hist;
};

// attach the .equals method to Array's prototype to call it on any array
var isArrayEquals = function (array1, array2) {
    // if the other array is a falsy value, return
    if (!array1 || !array2) {
        return false;
    }

    // compare lengths - can save a lot of time
    if (array1.length !== array2.length) {
        return false;
    }

    for (var i = 0; i < array1.length; i++) {
        // Check if we have nested arrays
        if (array1[i] instanceof Array && array2[i] instanceof Array) {
            // recurse into the nested arrays
            if (!isArrayEquals(array1[i], array2[i])) {
                return false;
            }
        }
        else if (array1[i] !== array2[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
};

_.extend(util, {
    hist        : hist,
    index       : index,
    isArrayEquals: isArrayEquals,
    isBamboo    : isBamboo,
    isBonus     : isBonus,
    isCharacter : isCharacter,
    isCircle    : isCircle,
    isColor     : isColor,
    isDragon    : isDragon,
    isFlower    : isFlower,
    isMyBonus   : isMyBonus,
    isSeason    : isSeason,
    isWind      : isWind,
    sortTile    : sortTile,
    suit        : suit,
    sum         : sum,
    tileNames   : tileNames,
    translateFromBufferedNoHonors: translateFromBufferedNoHonors,
    translateToBufferedNoHonors: translateToBufferedNoHonors,
    vals        : vals,
    windTile    : windTile
});

module.exports = util;