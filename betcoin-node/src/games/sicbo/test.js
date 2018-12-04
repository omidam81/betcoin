'use strict';
var assert = require('assert');
var GameLogic = require('./src/gamelogic');

/* global describe */
/* global it */

describe('game logic', function () {
    var gameLogic = new GameLogic();
    // = function(betType{
    //     return encodeURIComponent(betType);
    // };
    describe('single dice', function () {
        it('should win one for one dice match', function (done) {
            var betType = "[\"single_dice\",1]";
            var encodedBetType = betType;
            var bets = {};
            bets[encodedBetType] = 1;
            var game = {bets: bets, result: [1,2,3]};
            var payouts = gameLogic.getPayouts(game);
            assert.equal(payouts.betPayouts[encodedBetType], 2);
            done();
        });
        it('should win two for two dices match', function (done) {
            var betType = "[\"single_dice\",1]";
            var encodedBetType = betType;
            var bets = {};
            bets[encodedBetType] = 1;
            var game = {bets: bets, result: [1,1,3]};
            var payouts = gameLogic.getPayouts(game);
            assert.equal(payouts.betPayouts[encodedBetType], 3);
            done();
        });
        it('should win three for three dices match', function (done) {
            var betType = "[\"single_dice\",1]";
            var encodedBetType = betType;
            var bets = {};
            bets[encodedBetType] = 1;
            var game = {bets: bets, result: [1,1,1]};
            var payouts = gameLogic.getPayouts(game);
            assert.equal(payouts.betPayouts[encodedBetType], 4);
            done();
        });
    });
    describe('two dices', function () {
        it('should win when two dices match', function (done) {
            for(var i=1;i<6;i++){
                for(var j=i+1;j<=6;j++){
                    var betType = "[\"two_dice\","+i+","+j+"]";
                    betType = betType;
                    var bets = {};
                    bets[betType] = 1;
                    var game = {bets: bets, result: [1,i,j]};
                    var payouts = gameLogic.getPayouts(game);
                    assert.equal(payouts.betPayouts[betType], 7);
                }
            }
            done();
        });
    });
    describe('total score', function () {
        var getDicesForScore = function(score){
            for(var i=1;i<=6;i++){
                for(var j=1;j<=6;j++){
                    for(var k=1;k<=6;k++){
                        if((i+j+k) === score){
                            return [i,j,k];
                        }
                    }
                }
            }
        };
        it('should win when total score match', function (done) {
            for(var score=4;score<=17;score++){
                var betType = "[\"total\","+score+"]";
                var encodedBetType = betType;
                var bets = {};
                var wager = 1;
                bets[encodedBetType] = wager;
                var game = {bets: bets, result: getDicesForScore(score)};
                var payouts = gameLogic.getPayouts(game);
                assert.equal(payouts.betPayouts[encodedBetType], gameLogic.betmap[betType]+wager);
            }
            done();
        });
    });
    describe('triples', function () {
        it('should win for any triples', function (done) {
            for(var i=1; i<=6; i++){
                var dices = [i,i,i];
                var betType = "[\"any_triple\"]";
                var encodedBetType = betType;
                var bets = {};
                var wager = 1;
                bets[encodedBetType] = wager;
                var game = {bets: bets, result: dices};
                var payouts = gameLogic.getPayouts(game);
                assert.equal(payouts.betPayouts[encodedBetType], gameLogic.betmap[betType]+wager);
            }
            done();
        });
        it('should win for specific triple', function (done) {
            for(var i=1; i<=6; i++){
                var dices = [i,i,i];
                var betType = "[\"triple\","+i+"]";
                var encodedBetType = betType;
                var bets = {};
                var wager = 1;
                bets[encodedBetType] = wager;
                var game = {bets: bets, result: dices};
                var payouts = gameLogic.getPayouts(game);
                assert.equal(payouts.betPayouts[encodedBetType], gameLogic.betmap[betType]+wager);
            }
            done();
        });
    });
    describe('doubles', function () {
        it('should win for doubles', function (done) {
            for(var i=1; i<=6; i++){
                var dices = [i,i,i];
                var betType = "[\"double\","+i+"]";
                var encodedBetType = betType;
                var bets = {};
                var wager = 1;
                bets[encodedBetType] = wager;
                var game = {bets: bets, result: dices};
                var payouts = gameLogic.getPayouts(game);
                assert.equal(payouts.betPayouts[encodedBetType], gameLogic.betmap[betType]+wager);
            }
            done();
        });
    });
    describe('smallOrBig', function () {
        it('should win for small or big', function (done) {
            for(var i=1;i<=6;i++){
                for(var j=1;j<=6;j++){
                    for(var k=1;k<=6;k++){
                        var dices = [i,j,k];
                        var score = i+j+k;
                        var betType;
                        if(score <= 10){
                            betType = "[\"small\"]";
                        }
                        if(score >= 11 && score <= 18){
                            betType = "[\"big\"]";
                        }
                        var encodedBetType = betType;
                        var bets = {};
                        var wager = 1;
                        bets[encodedBetType] = wager;
                        var game = {bets: bets, result: dices};
                        var payouts = gameLogic.getPayouts(game);
                        if(score === 3){
                            assert.equal(payouts.betPayouts[encodedBetType], 0);
                            continue;
                        }
                        if(score === 18){
                            assert.equal(payouts.betPayouts[encodedBetType], 0);
                            continue;
                        }
                        assert.equal(payouts.betPayouts[encodedBetType], gameLogic.betmap[betType]+wager);
                    }
                }
            }
            done();
        });
    });
    describe('multiple bets', function () {
        it('should win for matches', function (done) {
            var bets = {};
            var betType = "[\"single_dice\",1]";
            var encodedBetType1 = betType;
            bets[encodedBetType1] = 1;
            betType = "[\"single_dice\",4]";
            var encodedBetType2 = betType;
            bets[encodedBetType2] = 1;
            betType = "[\"total\",6]";
            var encodedBetType3 = betType;
            bets[encodedBetType3] = 2;
            betType = "[\"single_dice\",3]";
            var encodedBetType4 = betType;
            bets[encodedBetType4] = 3;
            var game = {bets: bets, result: [1,2,3]};
            var payouts = gameLogic.getPayouts(game);
            assert.equal(payouts.betPayouts[encodedBetType1], 2);
            assert.equal(payouts.betPayouts[encodedBetType2], 0);
            assert.equal(payouts.betPayouts[encodedBetType3], 19);
            assert.equal(payouts.betPayouts[encodedBetType4], 2);
            done();
        });
    });
});
