'use strict';

var assert = require('assert');
var GameLogic = require('../src/container/gamelogic');
require('bitcoin-math');

/* global describe */
/* global it */
/* global beforeEach */

describe('mine sweeper game logic', function () {
    var gameLogic = new GameLogic();
    describe('init', function () {
        it('should init bomb array in 8*4 dimension', function(done){
            for(var seed=0; seed<100; seed++){
                var bombs = gameLogic.init(seed);
                assert.equal(8, bombs.length);
                for(var i=0; i<bombs.length; i++){
                    assert.equal(true, bombs[i]>=1 && bombs[i]<=4);
                }
            }
            done();
        });
    });
    describe('house edge', function () {
        it('should be alwasy equal to 1.65%', function (done) {
            var gameArray = [1,2,3,2,2,1,3,2];
            var position = 4;
            var wager = 1000;
            for(var step = 1; step <= 8; step++){
                var result = gameLogic.getResult(gameArray, step, position, wager);
                assert.equal(-0.0165, Math.round((result.winnings*3/4 - wager/4)/wager * 10000)/10000);
                assert.equal(true, result.win);
                wager = result.winnings + wager;
            }
            done();
        });
    });
    describe('finish', function () {
        it('should lose', function(done){
            var gameArray = [1,2,3,2,2,1,3,2];
            var position = 2;
            var step = 2;
            var wager = 1000;
            var result = gameLogic.getResult(gameArray, step, position, wager);
            assert.equal(0, result.winnings);
            assert.equal(false, result.win);
            assert.equal(true, result.finished);
            done();
        });
        it('should mark finished when it wins at the last step', function(done){
            var gameArray = [1,2,3,2,2,1,3,2];
            var position = 1;
            var step = 8;
            var wager = 1000;
            var result = gameLogic.getResult(gameArray, step, position, wager);
            assert.equal(311.3333333333333, result.winnings);
            assert.equal(true, result.win);
            assert.equal(true, result.finished);
            done();
        });
    });
    describe('display result', function () {
        it('should output the result before current step', function(done){
            var gameArray = [1,2,3,2,2,1,3,2];
            var position = 1;
            var step = 2;
            var wager = 1000;
            var result = gameLogic.getResult(gameArray, step, position, wager);
            assert.equal(311.3333333333333, result.winnings);
            assert.equal(true, result.win);
            assert.equal(false, result.finished);
            assert.equal(3, result.nextStep);
            assert.deepEqual([1,2], result.results);
            done();
        })
    });
    describe('exceptions', function () {
        it('should throw exception for invalid position param', function (done) {
            var gameArray = [1,2,3,2,2,1,3,2];
            var position = 'test';
            var step = 2;
            var wager = 1000;
            var result;
            try {
                result = gameLogic.getResult(gameArray, step, position, wager);
            }catch(ex){
                try{
                    result = gameLogic.getResult(gameArray, step, 0, wager);
                }catch(exc){
                    done();
                }
            }
        });
    });
});