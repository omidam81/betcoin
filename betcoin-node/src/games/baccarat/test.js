'use strict';

var assert = require('assert');
var GameLogic = require('./src/gamelogic');

/* global describe */
/* global it */

describe('baccarat game logic', function () {
    var gameLogic = new GameLogic();
    describe('deal cards', function () {
        describe('init hand', function () {
            it('both should stand when either hand is 8 or 9', function (done) {
                var hands = {
                    playerHand: {
                        cards: [{rank:'K'},{rank:'8'}]
                    },
                    bankerHand: {
                        cards: [{rank:'5'},{rank:'5'}]
                    },
                    remainingCards: [{rank:'A'},{rank:'2'},{rank:'3'}]
                };
                var result = gameLogic.getResult(hands, {});
                assert.equal(3, result.remainingCards.length);
                assert.equal(2, result.playerHand.cards.length);
                assert.equal(2, result.bankerHand.cards.length);
                hands = {
                    playerHand: {
                        cards: [{rank:'K'},{rank:'4'}]
                    },
                    bankerHand: {
                        cards: [{rank:'A'},{rank:'8'}]
                    },
                    remainingCards: [{rank:'A'},{rank:'2'},{rank:'3'}]
                };
                result = gameLogic.getResult(hands, {});
                assert.equal(3, result.remainingCards.length);
                assert.equal(2, result.playerHand.cards.length);
                assert.equal(2, result.bankerHand.cards.length);
                done();
            });
        });
        describe('player third card rule', function () {
            it('player should hit if player has 5 or less', function (done) {
                var hands = {
                    playerHand: {
                        cards: [{rank:'K'},{rank:'2'}]
                    },
                    bankerHand: {
                        // banker will stand with this current score
                        cards: [{rank:'A'},{rank:'5'}]
                    },
                    remainingCards: [{rank:'A'},{rank:'2'},{rank:'3'}]
                };
                var result = gameLogic.getResult(hands, {});
                assert.equal(2, result.remainingCards.length);
                assert.equal(3, result.playerHand.cards.length);
                assert.equal(2, result.bankerHand.cards.length);
                done();
            });
            it('player should stand if player score is more than 5', function() {
                var hands = {
                    playerHand: {
                        cards: [{rank:'K'},{rank:'6'}]
                    },
                    bankerHand: {
                        // banker will stand with this current score
                        cards: [{rank:'A'},{rank:'5'}]
                    },
                    remainingCards: [{rank:'A'},{rank:'2'},{rank:'3'}]
                };
                var result = gameLogic.getResult(hands, {});
                assert.equal(3, result.remainingCards.length);
                assert.equal(2, result.playerHand.cards.length);
                assert.equal(2, result.bankerHand.cards.length);
            });
        });
        describe('banker third card rule', function () {
            it('banker should hit if the player stands and the banker score is less than 6', function() {
                var hands = {
                    playerHand: {
                        cards: [{rank:'A'},{rank:'6'}]
                    },
                    bankerHand: {
                        cards: [{rank:'2'},{rank:'A'}]
                    },
                    remainingCards: [{rank:'A'},{rank:'3'},{rank:'8'}]
                };
                var result = gameLogic.getResult(hands, {});
                assert.equal(2, result.remainingCards.length);
                assert.equal(2, result.playerHand.cards.length);
                assert.equal(3, result.bankerHand.cards.length);

            });
            it('banker should hit if the player drew a 2 or 3 and the banker score is less than 5', function() {
                ['2', '3'].forEach(function(drawCard) {
                    var hands = {
                        playerHand: {
                            cards: [{rank:'A'},{rank:'2'}]
                        },
                        bankerHand: {
                            cards: [{rank:'3'},{rank:'A'}]
                        },
                        remainingCards: [{rank: drawCard},{rank:'3'},{rank:'8'}]
                    };
                    var result = gameLogic.getResult(hands, {});
                    assert.equal(1, result.remainingCards.length);
                    assert.equal(3, result.playerHand.cards.length);
                    assert.equal(3, result.bankerHand.cards.length);
                });
            });
            it('banker should hit if the player drew a 4 or 5 and the banker score is less than 6', function() {
                ['4', '5'].forEach(function(drawCard) {
                    var hands = {
                        playerHand: {
                            cards: [{rank:'A'},{rank:'2'}]
                        },
                        bankerHand: {
                            cards: [{rank:'4'},{rank:'A'}]
                        },
                        remainingCards: [{rank: drawCard},{rank:'3'},{rank:'8'}]
                    };
                    var result = gameLogic.getResult(hands, {});
                    assert.equal(1, result.remainingCards.length);
                    assert.equal(3, result.playerHand.cards.length);
                    assert.equal(3, result.bankerHand.cards.length);
                });
            });
            it('banker should hit if the player drew a 6 or 7 and the banker score is less than 7', function() {
                ['6', '7'].forEach(function(drawCard) {
                    var hands = {
                        playerHand: {
                            cards: [{rank:'A'},{rank:'2'}]
                        },
                        bankerHand: {
                            cards: [{rank:'5'},{rank:'A'}]
                        },
                        remainingCards: [{rank: drawCard},{rank:'3'},{rank:'8'}]
                    };
                    var result = gameLogic.getResult(hands, {});
                    assert.equal(1, result.remainingCards.length);
                    assert.equal(3, result.playerHand.cards.length);
                    assert.equal(3, result.bankerHand.cards.length);
                });
            });
            it('banker should hit if the player drew a 8 and the banker score is less than 3', function() {
                var hands = {
                    playerHand: {
                        cards: [{rank:'A'},{rank:'2'}]
                    },
                    bankerHand: {
                        cards: [{rank:'2'},{rank:'K'}]
                    },
                    remainingCards: [{rank: '8'},{rank:'3'},{rank:'8'}]
                };
                var result = gameLogic.getResult(hands, {});
                assert.equal(1, result.remainingCards.length);
                assert.equal(3, result.playerHand.cards.length);
                assert.equal(3, result.bankerHand.cards.length);
            });
            it('banker should hit if the player drew a T, J, Q, K, or A and the banker score is less than 4', function() {
                ['T', 'J', 'Q', 'K', 'A'].forEach(function(drawCard) {
                    var hands = {
                        playerHand: {
                            cards: [{rank:'A'},{rank:'2'}]
                        },
                        bankerHand: {
                            cards: [{rank:'2'},{rank:'A'}]
                        },
                        remainingCards: [{rank: drawCard},{rank:'3'},{rank:'8'}]
                    };
                    var result = gameLogic.getResult(hands, {});
                    assert.equal(1, result.remainingCards.length);
                    assert.equal(3, result.playerHand.cards.length);
                    assert.equal(3, result.bankerHand.cards.length);
                });
            });
        });
    });
    describe('payout', function () {
        describe('bet on player', function () {
            it('should payout 1:1', function (done) {
                var hands = {
                    playerHand: {
                        cards: [{rank:'K'},{rank:'8'}]
                    },
                    bankerHand: {
                        cards: [{rank:'A'},{rank:'5'}]
                    },
                    remainingCards: [{rank:'A'},{rank:'2'},{rank:'3'}]
                };
                var result = gameLogic.getResult(hands, {player:1});
                assert.equal(2, result.payouts.player);
                assert.equal(2, result.payouts.total);
                done();
            });
        });
        describe('bet on banker', function () {
            it('should payout 1:0.95', function (done) {
                var hands = {
                    playerHand: {
                        cards: [{rank:'K'},{rank:'8'}]
                    },
                    bankerHand: {
                        cards: [{rank:'A'},{rank:'8'}]
                    },
                    remainingCards: [{rank:'A'},{rank:'2'},{rank:'3'}]
                };
                var result = gameLogic.getResult(hands, {banker:1});
                assert.equal(1.95, result.payouts.banker);
                assert.equal(1.95, result.payouts.total);
                done();
            });
        });
        describe('bet on tie', function () {
            it('should payout 1:8', function (done) {
                var hands = {
                    playerHand: {
                        cards: [{rank:'A'},{rank:'8'}]
                    },
                    bankerHand: {
                        cards: [{rank:'A'},{rank:'8'}]
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
                    cards: [{rank:'A'},{rank:'8'}]
                },
                bankerHand: {
                    cards: [{rank:'A'},{rank:'8'}]
                },
                remainingCards: [{rank:'A'},{rank:'2'},{rank:'3'}]
            };
            var result = gameLogic.getResult(hands, {tie:2, banker:1, player:1});
            assert.equal(18, result.payouts.tie);
            assert.equal(0, result.payouts.player);
            assert.equal(0, result.payouts.banker);
            assert.equal(18, result.payouts.total);
            done();
        });
    });
    describe('score', function () {
        it('should calculate the score of the hands', function (done) {
            var hands = {
                playerHand: {
                    cards: [{rank:'3'},{rank:'2'}]
                },
                bankerHand: {
                    cards: [{rank:'A'},{rank:'5'}]
                },
                remainingCards: [{rank:'A'},{rank:'3'},{rank:'6'}]
            };
            var result = gameLogic.getResult(hands, {});
            assert.equal(6, result.playerHand.score);
            assert.equal(6, result.bankerHand.score);
            done();
        });
    });
});
