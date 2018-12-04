'use strict';
var assert = require('assert');
var GameLogic = require('../src/container/gamelogic');

describe('game logic', function () {
    var gameLogic = new GameLogic();

    describe('fan', function () {
        it('should win for one match', function (done) {
            var betType = "[\"fan\",2]";
            var encodedBetType = betType;
            var bets = {};
            bets[encodedBetType] = 1;
            var game = {bets: bets, dices: [1,2,3]};
            var payouts = gameLogic.getPayouts(game);
            assert.equal(payouts.betPayouts[encodedBetType], 3.85);
            done();
        });
        it('should win for one match', function (done) {
            var betType = "[\"fan\",1]";
            var encodedBetType = betType;
            var bets = {};
            bets[encodedBetType] = 1;
            var game = {bets: bets, dices: [1,2,3]};
            var payouts = gameLogic.getPayouts(game);
            assert.equal(payouts.betPayouts[encodedBetType], 0);
            done();
        });
    });

    describe('kwok', function () {
        it('should win when one of two numbers matches', function (done) {
            var betType = "[\"kwok\",1,2]";
            var encodedBetType = betType;
            var bets = {};
            bets[encodedBetType] = 1;
            var game = {bets: bets, dices: [1,2,3]};
            var payouts = gameLogic.getPayouts(game);
            assert.equal(payouts.betPayouts[encodedBetType], 1.95);
            done();
        });
        it('should win when one of two numbers matches', function (done) {
            var betType = "[\"kwok\",1,3]";
            var encodedBetType = betType;
            var bets = {};
            bets[encodedBetType] = 1;
            var game = {bets: bets, dices: [1,2,3]};
            var payouts = gameLogic.getPayouts(game);
            assert.equal(payouts.betPayouts[encodedBetType], 0);
            done();
        });
    });
    describe('ssh', function () {
        it('should win when one of two numbers matches', function (done) {
            var betType = "[\"ssh\",1]";
            var encodedBetType = betType;
            var bets = {};
            bets[encodedBetType] = 1;
            var game = {bets: bets, dices: [1,2,3]};
            var payouts = gameLogic.getPayouts(game);
            assert.equal(payouts.betPayouts[encodedBetType], 1.32); //1 + 0.95 / 3===1.31666
            assert.equal(payouts.winningNumber, 2);
            done();
        });
        it('should win when one of two numbers matches', function (done) {
            var betType = "[\"ssh\",2]";
            var encodedBetType = betType;
            var bets = {};
            bets[encodedBetType] = 1;
            var game = {bets: bets, dices: [1,2,3]};
            var payouts = gameLogic.getPayouts(game);
            assert.equal(payouts.betPayouts[encodedBetType], 0);
            done();
        });
    });
    describe('getPayouts', function () {
        it('should win', function (done) {
            var bets = {};
            bets["[\"ssh\",2]"] = 1;
            bets["[\"nga\",1,4]"] = 1;
            bets["[\"nga\",2,3]"] = 1;
            bets["[\"nim\",1,4]"] = 1;
            bets["[\"nim\",2,4]"] = 1;
            var game = {bets: bets, dices: [3,2,3]};
            var payouts = gameLogic.getPayouts(game);
            console.log(payouts.betPayouts);
            assert.equal(payouts.betPayouts["[\"ssh\",2]"], 1.32);
            assert.equal(payouts.betPayouts["[\"nga\",1,4]"], 1);
            assert.equal(payouts.betPayouts["[\"nga\",2,3]"], 1.48);
            assert.equal(payouts.betPayouts["[\"nim\",1,4]"], 1);
            assert.equal(payouts.betPayouts["[\"nim\",2,4]"], 1);
            assert.equal(payouts.sum, 5.791666666666666);

            done();
        });
    });
});