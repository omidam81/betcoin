'use strict'

var assert = require('assert');
var GameLogic = require('../src/container/gamelogic');

describe('baccpo game logic', function () {
    var gameLogic = new GameLogic();

    describe('initHands', function() {
        it('should return init hands', function (done) {
            var initHands = gameLogic.initHands('test');
            assert.deepEqual({suit:'D', rank: '8'}, initHands.playerCards[0]);
            assert.deepEqual({suit:'S', rank: '7'}, initHands.playerCards[1]);
            assert.deepEqual({suit:'D', rank: '4'}, initHands.dealerCards[0]);
            assert.deepEqual({suit:'S', rank: 'K'}, initHands.dealerCards[1]);
            assert.deepEqual({suit:'D', rank: 'T'}, initHands.allCards[5]);
            assert.deepEqual({suit:'C', rank: 'T'}, initHands.allCards[6]);
            assert.equal(5, initHands.playerCardsPoint);
            done();
        });
    });

    describe('getResult', function() {
        it('should deal one more card for 5 or less point dealer hand', function(done) {
            var playerHand = {
                initCards: [
                    {suit:'D', rank: '8'},
                    {suit:'S', rank: '7'}
                ]
            };
            var dealerHand = {
                initCards: [
                    {suit:'D', rank: '4'},
                    {suit:'S', rank: 'K'}
                ]
            };
            var bets = {};
            var allCards = [
                { suit: 'D', rank: '8' },
                { suit: 'D', rank: '4' },
                { suit: 'S', rank: '7' },
                { suit: 'S', rank: 'K' },
                { suit: 'C', rank: '2' },
                { suit: 'D', rank: 'T' },
                { suit: 'C', rank: 'T' }
            ];
            var result = gameLogic.getResult(dealerHand, playerHand, bets, 'hit', allCards);
            assert.equal(3, result.dealerHand.finalCards.length);
            assert.equal(3, result.playerHand.finalCards.length);
            assert.deepEqual(allCards[4], result.playerHand.finalCards[2]);
            assert.deepEqual(allCards[5], result.dealerHand.finalCards[2]);

            done();
        });
        it('should deal one more card for 5 or less point or two threes in dealer hand', function(done) {
            var playerHand = {
                initCards: [
                    {suit:'D', rank: '8'},
                    {suit:'S', rank: '7'}
                ]
            };
            var dealerHand = {
                initCards: [
                    {suit:'D', rank: '3'},
                    {suit:'S', rank: '3'}
                ]
            };
            var bets = {};
            var allCards = [
                { suit: 'D', rank: '8' },
                { suit: 'D', rank: '4' },
                { suit: 'S', rank: '7' },
                { suit: 'S', rank: 'K' },
                { suit: 'C', rank: '2' },
                { suit: 'D', rank: 'T' },
                { suit: 'C', rank: 'T' }
            ];
            var result = gameLogic.getResult(dealerHand, playerHand, bets, 'hit', allCards);
            assert.equal(3, result.dealerHand.finalCards.length);
            assert.equal(3, result.playerHand.finalCards.length);
            assert.deepEqual(allCards[4], result.playerHand.finalCards[2]);

            done();
        });
        it('should not deal one more card for 6 or above point dealer hand', function(done) {
            var playerHand = {
                initCards: [
                    {suit:'D', rank: '8'},
                    {suit:'S', rank: '7'}
                ]
            };
            var dealerHand = {
                initCards: [
                    {suit:'D', rank: '4'},
                    {suit:'S', rank: '2'}
                ]
            };
            var bets = {};
            var allCards = [
                { suit: 'D', rank: '8' },
                { suit: 'D', rank: '4' },
                { suit: 'S', rank: '7' },
                { suit: 'S', rank: '2' },
                { suit: 'C', rank: '2' },
                { suit: 'D', rank: 'T' },
                { suit: 'C', rank: 'T' }
            ];
            var result = gameLogic.getResult(dealerHand, playerHand, bets, 'stand', allCards);
            assert.equal(2, result.dealerHand.finalCards.length);
            assert.equal(2, result.playerHand.finalCards.length);

            done();
        });
        it('should win dealer hand', function(done) {
            var playerHand = {
                initCards: [
                    {suit:'D', rank: '8'},
                    {suit:'S', rank: '7'}
                ]
            };
            var dealerHand = {
                initCards: [
                    {suit:'D', rank: '4'},
                    {suit:'S', rank: '2'}
                ]
            };
            var bets = {win: 10000, tie: 10000, bonus: 10000};
            var allCards = [
                { suit: 'D', rank: '8' },
                { suit: 'D', rank: '4' },
                { suit: 'S', rank: '7' },
                { suit: 'S', rank: '2' },
                { suit: 'C', rank: '2' },
                { suit: 'D', rank: 'T' },
                { suit: 'C', rank: 'T' }
            ];
            var result = gameLogic.getResult(dealerHand, playerHand, bets, 'stand', allCards);
            assert.equal('dealer', result.cardsResult);
            assert.equal(0, result.payout);

            done();
        });
        it('should pay 2 for winning player hand except 3-3-3 and 7 opints', function(done) {
            var playerHand = {
                initCards: [
                    {suit:'D', rank: '2'},
                    {suit:'S', rank: '7'}
                ]
            };
            var dealerHand = {
                initCards: [
                    {suit:'D', rank: '4'},
                    {suit:'S', rank: '2'}
                ]
            };
            var bets = {win: 10000, tie: 10000, bonus: 10000};
            var allCards = [
                { suit: 'D', rank: '2' },
                { suit: 'D', rank: '4' },
                { suit: 'S', rank: '7' },
                { suit: 'S', rank: '2' },
                { suit: 'C', rank: '2' },
                { suit: 'D', rank: 'T' },
                { suit: 'C', rank: 'T' }
            ];
            var result = gameLogic.getResult(dealerHand, playerHand, bets, 'stand', allCards);
            assert.equal('player', result.cardsResult);
            assert.equal(20000, result.payout);

            done();
        });
        it('should pay 1.5 for winning player hand - 7 points', function(done) {
            var playerHand = {
                initCards: [
                    {suit:'D', rank: 'T'},
                    {suit:'S', rank: '7'}
                ]
            };
            var dealerHand = {
                initCards: [
                    {suit:'D', rank: '4'},
                    {suit:'S', rank: '2'}
                ]
            };
            var bets = {win: 10000, tie: 10000, bonus: 10000};
            var allCards = [
                { suit: 'D', rank: 'T' },
                { suit: 'D', rank: '4' },
                { suit: 'S', rank: '7' },
                { suit: 'S', rank: '2' },
                { suit: 'C', rank: '2' },
                { suit: 'D', rank: 'T' },
                { suit: 'C', rank: 'T' }
            ];
            var result = gameLogic.getResult(dealerHand, playerHand, bets, 'stand', allCards);
            assert.equal('player', result.cardsResult);
            assert.equal(15000, result.payout);

            done();
        });
        it('should pay 4 for winning player hand 3-3-3', function(done) {
            var playerHand = {
                initCards: [
                    {suit:'D', rank: '3'},
                    {suit:'S', rank: '3'}
                ]
            };
            var dealerHand = {
                initCards: [
                    {suit:'D', rank: '4'},
                    {suit:'S', rank: 'A'}
                ]
            };
            var bets = {win: 10000, tie: 10000, bonus: 10000};
            var allCards = [
                { suit: 'D', rank: '3' },
                { suit: 'D', rank: '4' },
                { suit: 'S', rank: '3' },
                { suit: 'S', rank: 'A' },
                { suit: 'C', rank: '3' },
                { suit: 'D', rank: 'T' },
                { suit: 'C', rank: 'T' }
            ];
            var result = gameLogic.getResult(dealerHand, playerHand, bets, 'hit', allCards);
            assert.equal('player', result.cardsResult);
            assert.equal(40000, result.payouts.win);
            assert.equal(2010000, result.payouts.bonus);

            done();
        });
        it('should win longer hand', function(done) {
            var playerHand = {
                initCards: [
                    {suit:'D', rank: '4'},
                    {suit:'S', rank: 'A'}
                ]
            };
            var dealerHand = {
                initCards: [
                    {suit:'D', rank: '3'},
                    {suit:'S', rank: '3'}
                ]
            };
            var bets = {win: 10000, tie: 10000, bonus: 10000};
            var allCards = [
                { suit: 'D', rank: '3' },
                { suit: 'D', rank: '4' },
                { suit: 'S', rank: '3' },
                { suit: 'S', rank: 'A' },
                { suit: 'C', rank: 'T' },
                { suit: 'D', rank: 'A' },
                { suit: 'C', rank: 'T' }
            ];
            var result = gameLogic.getResult(dealerHand, playerHand, bets, 'hit', allCards);
            assert.equal(3, result.dealerHand.finalCards.length);
            assert.equal('dealer', result.cardsResult);
            assert.equal(5, result.playerHand.point);
            assert.equal(7, result.dealerHand.point);
            assert.equal(false, result.isWin);

            done();
        });
    });
});