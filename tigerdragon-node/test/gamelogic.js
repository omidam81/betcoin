'use strict';

var assert = require('assert');
var GameLogic = require('../src/container/gamelogic');

/* global describe */
/* global it */

describe('tigerdragon game logic', function () {
    var gameLogic = new GameLogic();
    describe('deal cards', function () {
        describe('init hand', function () {
            it('both should stand when either hand is 8 or 9', function (done) {
                var hands = {
                    playerHand: {
                        card: {rank:'K', suit: 'C'}
                    },
                    bankerHand: {
                        card: {rank:'5', suit: 'C'}
                    },
                    remainingCards: [{rank:'A'},{rank:'2'},{rank:'3'}]
                };
                var result = gameLogic.getResult(hands, {});
                assert.equal(3, result.remainingCards.length);
                assert.equal(13, result.playerHand.rankOrder);
                assert.equal(5, result.bankerHand.rankOrder);
                done();
            });
        });
    });
    describe('payout', function () {
        describe('bet on player', function () {
            it('should payout 1:1', function (done) {
                var hands = {
                    playerHand: {
                        card: {rank:'K', suit: 'S'}
                    },
                    bankerHand: {
                        card: {rank:'A', suit: 'D'}
                    },
                    remainingCards: [{rank:'A'},{rank:'2'},{rank:'3'}]
                };
                var result = gameLogic.getResult(hands, {player:1});
                assert.equal(2, result.payouts.player);
                assert.equal(2, result.payouts.total);
                done();
            });
        });
        describe('bet on tie', function () {
            it('should payout 1:8', function (done) {
                var hands = {
                    playerHand: {
                        card: {rank:'A', suit: 'D'}
                    },
                    bankerHand: {
                        card: {rank:'A', suit: 'S'}
                    },
                    remainingCards: [{rank:'A'},{rank:'2'},{rank:'3'}]
                };
                var result = gameLogic.getResult(hands, {tie:1});
                assert.equal(9, result.payouts.tie);
                assert.equal(9, result.payouts.total);
                done();
            });
        });
        it('should payout on multiple bets', function (done) {
            var hands = {
                playerHand: {
                    card: {rank:'A', suit: 'D'}
                },
                bankerHand: {
                    card: {rank:'A', suit: 'C'}
                },
                remainingCards: [{rank:'A'},{rank:'2'},{rank:'3'}]
            };
            var result = gameLogic.getResult(hands, {tie:2, banker:1, player:1});
            assert.equal(18, result.payouts.tie);
            assert.equal(0.5, result.payouts.player);
            assert.equal(0.5, result.payouts.banker);
            assert.equal(19, result.payouts.total);
            done();
        });
    });
    describe('score', function () {
        it('should calculate the score of the hands', function (done) {
            var hands = {
                playerHand: {
                    card: {rank:'3', suit: 'D'}
                },
                bankerHand: {
                    card: {rank:'A', suit: 'H'}
                },
                remainingCards: [{rank:'A'},{rank:'3'},{rank:'6'}]
            };
            var result = gameLogic.getResult(hands, {});
            assert.equal(3, result.playerHand.rankOrder);
            assert.equal(1, result.bankerHand.rankOrder);
            done();
        });
    });
});
