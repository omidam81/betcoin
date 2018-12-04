'use strict';

var crypto = require('crypto');
var HTTPError = require('httperror-npm');

module.exports = function() {
    this.houseEdge = 0.0165;
    this.columns = 8;
    this.rows = 4;
    this.bombsEachColumn = 1;

    this.getOdds = function(){
        return 1 - this.bombsEachColumn/this.rows;
    };

    var getHashRand = function(seed, characters) {
        // default to 4 characters 0 - 65535
        if (characters === undefined) characters = 4;
        // get the max (array hack to repeat 'f')
        var partialDivisor = parseInt(Array(characters + 1).join('f'), 16);
        // hash the seed and get the first 4 characters
        var partial = sha256sum(seed).substring(0, characters);
        // divide the result by the max to get a random "percentage"
        return parseInt(partial, 16) / partialDivisor;
    };

    var sha256sum = function(data, returnType) {
        if (returnType === undefined) {
            returnType = 'hex';
        }
        var sha = crypto.createHash('sha256');
        sha.update("" + data);
        return sha.digest(returnType);
    };

    var randToValue = function(rand, min, max) {
        // standard random "percent" to int given min/max
        return Math.floor(rand * (max - min + 1) + min);
    };

    this.init = function(seed) {
        var bombs = [];
        for(var i=0; i<this.columns; i++){
            var hashRand = getHashRand(seed + i);
            var randValue = randToValue(hashRand, 1, 4);
            bombs.push(randValue);
        }
        return bombs;
    };

    this.getResult = function(finalArray, step, position, wager){
        var result = {finished: false};
        position = parseInt(position);
        if(isNaN(position) || position > this.rows || position < 1){
            throw new HTTPError(400, 'invalid position param');
        }

        if(finalArray[step - 1] === position){
            result.winnings = 0;
            result.win = false;
            result.finished = true;
        }else{
            result.winnings = this.getPayout(wager);
            result.win = true;
            if(step === this.columns){
                result.finished = true;
            }
        }
        result.results = finalArray.slice(0, step);
        result.nextStep = step + 1;

        return result;
    };

    this.getPayout = function(wager) {
        var multiplier = (-this.houseEdge + (1 - this.getOdds()))/this.getOdds();
        return wager * multiplier;
    };

    return this;
};
