'use strict';

var assert = require('assert');
var GameLogic = require('../src/container/gamelogic');
require('bitcoin-math');

/* global describe */
/* global it */
/* global beforeEach */

describe('faro game logic', function () {
    var gameLogic = new GameLogic();
    describe('deal cards', function () {
        it('should process the cards', function (done) {
            var cards = gameLogic.getShuffledCards('test');
            assert.equal(52, cards.length);
            done();
        });

        it('should process the bet cards', function (done) {
            var betCards = gameLogic.getBetCards();
            assert.equal(13, betCards.length);
            done();
        });

    });
    
    describe('should get payouts when user bet with flat', function () {
        var differentCards, equalCards, shuffledCards, betCards, allBets;
        beforeEach(function (done) {
            gameLogic.init();
            differentCards = [
                { rank: '4', suit: 'D' },
                { rank: '9', suit: 'D' },
                { rank: 'J', suit: 'S' },
                { rank: 'T', suit: 'C' },
                { rank: 'Q', suit: 'H' },
                { rank: 'K', suit: 'C' },
                { rank: '6', suit: 'S' },
                { rank: '5', suit: 'H' },
                { rank: '8', suit: 'H' },
                { rank: '2', suit: 'C' },
                { rank: 'A', suit: 'S' },
                { rank: '3', suit: 'D' }
            ];
            equalCards = [
                { rank: '4', suit: 'D' },
                { rank: '9', suit: 'D' },
                { rank: 'J', suit: 'S' },
                { rank: 'T', suit: 'C' },
                { rank: 'Q', suit: 'H' },
                { rank: 'K', suit: 'C' },
                { rank: '6', suit: 'S' },
                { rank: '5', suit: 'H' },
                { rank: '8', suit: 'H' },
                { rank: '2', suit: 'C' },
                { rank: '3', suit: 'S' },
                { rank: '3', suit: 'D' }
            ];
            allBets = {};
            betCards = gameLogic.getBetCards();
            allBets.flatBets = gameLogic.getBetCards();
            done();
        });
        it('If the Winning card and bets card are equal in rank, then bets on that rank should be get one', function (done) {
            allBets.flatBets[1].type = 1;
            var result = gameLogic.getResult(differentCards, betCards, allBets, 10);
            assert.equal(result.payout, 20);
            done();
        })
        it('If the Winning card and bets card, the Losing card and bets card are different in rank, then bets on that rank should be get nothing', function (done) {
            allBets.flatBets[6].type = 1;
            var result = gameLogic.getResult(differentCards, betCards, allBets, 10);
            assert.equal(result.payout, 10);
            assert.equal(result.betCards[6].type, 1);
            done();
        });
        it('If the Losing card and bets card are equal in rank, then bets on that rank should be lose one', function (done) {
            allBets.flatBets[12].type = 1;
            var result = gameLogic.getResult(differentCards, betCards, allBets, 10);
            assert.equal(result.payout, 0);
            done();
        });
        it('If the bets card, Winning card and Losing card have same rank, then bets on that rank should be lose half', function (done) {
            allBets.flatBets[1].type = 1;
            var result = gameLogic.getResult(equalCards, betCards, allBets, 10);
            assert.equal(result.payout, 5);
            done();
        });
    });
    
    describe('should get payouts when user bet with high', function () {
        var differentCards, equalCards, shuffledCards, betCards, allBets;
        beforeEach(function (done) {
            gameLogic.init();
            differentCards = [
                { rank: '4', suit: 'D' },
                { rank: '9', suit: 'D' },
                { rank: 'J', suit: 'S' },
                { rank: 'T', suit: 'C' },
                { rank: 'Q', suit: 'H' },
                { rank: 'K', suit: 'C' },
                { rank: '6', suit: 'S' },
                { rank: '5', suit: 'H' },
                { rank: '8', suit: 'H' },
                { rank: '2', suit: 'C' },
                { rank: 'A', suit: 'S' },
                { rank: '3', suit: 'D' }
            ];
            equalCards = [
                { rank: '4', suit: 'D' },
                { rank: '9', suit: 'D' },
                { rank: 'J', suit: 'S' },
                { rank: 'T', suit: 'C' },
                { rank: 'Q', suit: 'H' },
                { rank: 'K', suit: 'C' },
                { rank: '6', suit: 'S' },
                { rank: '5', suit: 'H' },
                { rank: '8', suit: 'H' },
                { rank: '2', suit: 'C' },
                { rank: '3', suit: 'S' },
                { rank: '3', suit: 'D' }
            ];
            allBets = {};
            betCards = gameLogic.getBetCards();
            allBets.flatBets = gameLogic.getBetCards();
            done();
        });
        it('If the Winning card is grater than the Losing card  in rank, then bets on that rank should be get one', function (done) {
            allBets.highBet = 1;
            differentCards.pop();
            var result = gameLogic.getResult(differentCards, betCards, allBets, 10);
            assert.equal(result.payout, 20);
            done();
        });
        it('If the Losing card is grater than the Winning card , then bets on that rank should be lose one', function (done) {
            allBets.highBet = 1;
            var result = gameLogic.getResult(differentCards, betCards, allBets, 10);
            assert.equal(result.payout, 0);
            done();
        });
        it('If the Winning card and Losing card are equal in rank, then bets on that rank should be lose half', function (done) {
            allBets.highBet = 1;
            var result = gameLogic.getResult(equalCards, betCards, allBets, 10);
            assert.equal(result.payout, 5);
            done();
        });

    });
    describe('should get payouts when user bet with odd', function () {
        var differentCards, equalCards, shuffledCards, betCards, allBets;
        beforeEach(function (done) {
            gameLogic.init();
            differentCards = [
                { rank: '4', suit: 'D' },
                { rank: '8', suit: 'H' },
                { rank: 'J', suit: 'S' },
                { rank: 'T', suit: 'C' },
                { rank: 'Q', suit: 'H' },
                { rank: 'K', suit: 'C' },
                { rank: '6', suit: 'S' },
                { rank: '5', suit: 'H' },
                { rank: '9', suit: 'D' },
                { rank: '2', suit: 'C' },
                { rank: 'A', suit: 'S' },
                { rank: '3', suit: 'D' }
            ];
            equalCards = [
                { rank: '4', suit: 'D' },
                { rank: '9', suit: 'D' },
                { rank: 'J', suit: 'S' },
                { rank: 'T', suit: 'C' },
                { rank: 'Q', suit: 'H' },
                { rank: 'K', suit: 'C' },
                { rank: '6', suit: 'S' },
                { rank: '5', suit: 'H' },
                { rank: '8', suit: 'H' },
                { rank: '2', suit: 'C' },
                { rank: '3', suit: 'S' },
                { rank: '3', suit: 'D' }
            ];
            allBets = {};
            betCards = gameLogic.getBetCards();
            allBets.flatBets = gameLogic.getBetCards();
            done();
        });
        it('If the Winning card is odd rank, then bets on that rank should be get one', function (done) {
            allBets.oddBet = 1;
            equalCards.pop();
            var result = gameLogic.getResult(equalCards, betCards, allBets, 10);
            assert.equal(result.payout, 20);
            done();
        });
        it('If the Winning card and Losing card are odd rank or even rank, then bets on that rank should be get nothing', function (done) {
            allBets.oddBet = 1;
            differentCards.pop();
            var result = gameLogic.getResult(differentCards, betCards, allBets, 10);
            assert.equal(result.payout, 10);
            done();
        });
        it('If the Losing card is odd card , then bets on that rank should be lose one', function (done) {
            allBets.oddBet = 1;
            differentCards.pop();
            differentCards.pop();
            var result = gameLogic.getResult(differentCards, betCards, allBets, 10);
            assert.equal(result.payout, 0);
            done();
        });
        it('If the Winning card and Losing card are equal in rank, then bets on that rank should be lose half', function (done) {
            allBets.oddBet = 1;
            var result = gameLogic.getResult(equalCards, betCards, allBets, 10);
            assert.equal(result.payout, 5);
            done();
        });

    });
    describe('should get payouts when user bet with even', function () {
        var differentCards, equalCards, shuffledCards, betCards, allBets;
        beforeEach(function (done) {
            gameLogic.init();
            differentCards = [
                { rank: '4', suit: 'D' },
                { rank: '8', suit: 'H' },
                { rank: 'J', suit: 'S' },
                { rank: 'T', suit: 'C' },
                { rank: 'Q', suit: 'H' },
                { rank: 'K', suit: 'C' },
                { rank: '6', suit: 'S' },
                { rank: '5', suit: 'H' },
                { rank: '9', suit: 'D' },
                { rank: '2', suit: 'C' },
                { rank: 'A', suit: 'S' },
                { rank: '3', suit: 'D' }
            ];
            equalCards = [
                { rank: '4', suit: 'D' },
                { rank: '9', suit: 'D' },
                { rank: 'J', suit: 'S' },
                { rank: 'T', suit: 'C' },
                { rank: 'Q', suit: 'H' },
                { rank: 'K', suit: 'C' },
                { rank: '6', suit: 'S' },
                { rank: '5', suit: 'H' },
                { rank: '8', suit: 'H' },
                { rank: '2', suit: 'C' },
                { rank: '3', suit: 'S' },
                { rank: '3', suit: 'D' }
            ];
            allBets = {};
            betCards = gameLogic.getBetCards();
            allBets.flatBets = gameLogic.getBetCards();
            done();
        });
        it('If the Winning card is even rank, then bets on that rank should be get one', function (done) {
            allBets.evenBet = 1;
            differentCards.pop();
            differentCards.pop();
            var result = gameLogic.getResult(differentCards, betCards, allBets, 10);
            assert.equal(result.payout, 20);
            done();
        });
        it('If the Winning card and Losing card are odd rank or even rank, then bets on that rank should be get nothing', function (done) {
            allBets.evenBet = 1;
            differentCards.pop();
            var result = gameLogic.getResult(differentCards, betCards, allBets, 10);
            assert.equal(result.payout, 10);
            done();
        });
        it('If the Losing card is even card , then bets on that rank should be lose one', function (done) {
            allBets.evenBet = 1;
            var result = gameLogic.getResult(differentCards, betCards, allBets, 10);
            assert.equal(result.payout, 0);
            done();
        });
        it('If the Winning card and Losing card are equal in rank, then bets on that rank should be lose half', function (done) {
            allBets.evenBet = 1;
            var result = gameLogic.getResult(equalCards, betCards, allBets, 10);
            assert.equal(result.payout, 5);
            done();
        });

    });
    describe('should get payouts when user bet with turn', function () {
        var turnBets, betCards, allBets;
        beforeEach(function (done) {
            gameLogic.init();
            turnBets = [
                { rank: '4', suit: 'D' },
                { rank: '9', suit: 'D' },
                { rank: 'J', suit: 'S' }
            ];
            allBets = {};
            betCards = gameLogic.getBetCards();
            allBets.flatBets = gameLogic.getBetCards();
            done();
        });
        it('If turn bet cards are correct, then bets on that rank should be get four', function (done) {
            allBets.turnBets = [{rank:'4', suit:'S'}, {rank:'9', suit:'S'}, {rank:'J', suit:'S'}];
            var result = gameLogic.getResult(turnBets, betCards, allBets, 10);
            assert.equal(result.payout, 50);
            assert.equal(result.finished, true);
            done();
        });
        it('If turn bet cards are wrong, then bets on that rank should be lose one', function (done) {
            allBets.turnBets = [{rank:'9', suit:'S'}, {rank:'4', suit:'S'}, {rank:'J', suit:'S'}];
            var result = gameLogic.getResult(turnBets, betCards, allBets, 10);
            assert.equal(result.payout, 0);
            assert.equal(result.finished, true);
            done();
        });

    });
});
