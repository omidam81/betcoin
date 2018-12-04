'use strict';

var assert = require('assert');
var GameLogic = require('./src/gamelogic');

/* global describe */
/* global it */

describe('oasis game logic', function () {
    var gameLogic = new GameLogic();

    /**
     * Sands Macau pay table
     */
    var payout_multipliers = [
        0,
        0,
        50,     //royal flush
        50,     //straight flush
        20,     //four of a kind
        7,      //full house
        5,      //flush
        4,      //straight
        3,      //three of a kind
        2,      //two pairs
        1,      //one pair
        1       //no pair
    ];
    describe('getCardResult', function() {
        it('should return royal flush', function (done) {
            //Royal Flush
            var rankObj = gameLogic.getCardResult(['s14', 's13', 's12', 's11', 's10']);
            assert.equal(2, rankObj.rnk);
            rankObj = gameLogic.getCardResult(['d14', 'd13', 'd12', 'd11', 'd10']);
            assert.equal(2, rankObj.rnk);
            assert.equal(10, rankObj.data[0]);
            assert.equal(14, rankObj.data[4]);
            done();
        });
        it('should return straight flush', function (done) {
            //Straight Flush
            var rankObj = gameLogic.getCardResult(['s13', 's9', 's12', 's11', 's10']);
            assert.equal(3, rankObj.rnk);
            assert.equal(9, rankObj.data[0]);
            assert.equal(13, rankObj.data[4]);
            done();
        });
        it('should return four of a kind', function (done) {
            //Four of a kind
            var rankObj = gameLogic.getCardResult(['s2', 'c2', 'd2', 'h2', 's10']);
            assert.equal(4, rankObj.rnk);
            assert.equal(2, rankObj.data[0]);
            done();
        });
        it('should return full house', function (done) {
            //Full house
            var rankObj = gameLogic.getCardResult(['s2', 'c2', 'd3', 'h3', 'c3']);
            assert.equal(5, rankObj.rnk);
            assert.equal(3, rankObj.data[0]);
            assert.equal(2, rankObj.data[1]);
            done();
        });
        it('should return flush', function (done) {
            //Flush
            var rankObj = gameLogic.getCardResult(['s10', 's4', 's8', 's6', 's2']);
            assert.equal(6, rankObj.rnk);
            assert.equal(2, rankObj.data[0]);
            assert.equal(10, rankObj.data[4]);
            done();
        });
        it('should return straight', function (done) {
            //Straight
            var rankObj = gameLogic.getCardResult(['s2', 's3', 's4', 's5', 'd6']);
            assert.equal(7, rankObj.rnk);
            assert.equal(2, rankObj.data[0]);
            assert.equal(6, rankObj.data[4]);
            done();
        });
        it('should return three of a kind', function (done) {
            //Three of a kind
            var rankObj = gameLogic.getCardResult(['s2', 'c2', 'd2', 's5', 'd6']);
            assert.equal(8, rankObj.rnk);
            assert.equal(2, rankObj.data[0]);
            done();
        });
        it('should return two pairs', function (done) {
            //Two pairs
            var rankObj = gameLogic.getCardResult(['s2', 'c2', 'd5', 's5', 'd6']);
            assert.equal(9, rankObj.rnk);
            assert.equal(2, rankObj.data[0]);
            assert.equal(5, rankObj.data[1]);
            done();
        });
        it('should return one pair', function (done) {
            //One pairs
            var rankObj = gameLogic.getCardResult(['s2', 'c2', 'd5', 's7', 'd6']);
            assert.equal(10, rankObj.rnk);
            assert.equal(2, rankObj.data[0]);
            done();
        });
        it('should return no pair', function (done) {
            //No pair
            var rankObj = gameLogic.getCardResult(['s2', 'c14', 'd5', 's7', 'd6']);
            assert.equal(11, rankObj.rnk);
            assert.equal(0, rankObj.data.length);
            done();
        });
    });
    describe('isDealerQualifiedCards', function() {
        it('should qualify dealer cards', function (done) {
            var dealerHand = gameLogic.getCardResult(['s14','s13','s4','s3','h2']);
            var dealerQualified = gameLogic.isDealerQualifiedCards(dealerHand);
            assert.equal(true, dealerQualified);
            dealerHand = gameLogic.getCardResult(['s14','s12','s11','s10','h9']);
            dealerQualified = gameLogic.isDealerQualifiedCards(dealerHand);
            assert.equal(false, dealerQualified);
            done();
        });
    });
    describe('parseHandCards', function() {
        it('should parse hand cards', function (done) {
            var initCards = [
                {suit:"S", rank:"A"},
                {suit:"S", rank:"Q"},
                {suit:"C", rank:"J"},
                {suit:"H", rank:"T"},
                {suit:"D", rank:"9"}
            ];
            var cards = gameLogic.parseHandCards(initCards);
            assert.equal("s14", cards[0]);
            assert.equal("s12", cards[1]);
            assert.equal("c11", cards[2]);
            assert.equal("h10", cards[3]);
            assert.equal("d9", cards[4]);
            done();
        });
    });
    describe('getResult', function() {
        it('should forfeit cards, ante bet for fold', function (done) {
            var playerHand = {
                finalCards: [
                    {suit:"S", rank:"A"},
                    {suit:"S", rank:"K"},
                    {suit:"S", rank:"Q"},
                    {suit:"S", rank:"J"},
                    {suit:"S", rank:"T"}
                ]
            };
            var dealerHand = {
                initCards: [
                    {suit:"S", rank:"A"},
                    {suit:"S", rank:"Q"},
                    {suit:"S", rank:"J"},
                    {suit:"S", rank:"T"},
                    {suit:"D", rank:"9"}
                ]
            };
            var result = gameLogic.getResult(dealerHand, playerHand, 3000, false);
            assert.equal(0, result.payout);
            assert.equal(false, result.isWin);
            assert.equal(false, result.isPush);
            assert.equal(true, result.isFold);
            assert.equal(false, result.dealerHand.qualified);
            done();
        });
        it('should pay 4 * ante if player raises and dealer card is not qualified', function (done) {
            var playerHand = {
                finalCards: [
                    {suit:"D", rank:"A"},
                    {suit:"H", rank:"8"},
                    {suit:"H", rank:"Q"},
                    {suit:"C", rank:"J"},
                    {suit:"H", rank:"T"}
                ]
            };
            var dealerHand = {
                initCards: [
                    {suit:"S", rank:"A"},
                    {suit:"S", rank:"Q"},
                    {suit:"S", rank:"J"},
                    {suit:"S", rank:"T"},
                    {suit:"D", rank:"9"}
                ]
            };
            var result = gameLogic.getResult(dealerHand, playerHand, 3000, true);
            assert.equal(12000, result.payout);
            assert.equal(true, result.isWin);
            assert.equal(false, result.isPush);
            assert.equal(false, result.isFold);
            assert.equal(false, result.dealerHand.qualified);
            done();
         });
        it('should pay nothing if player raises, dealer cards are qualified and beat player cards', function (done) {
            var playerHand = {
                finalCards: [
                    {suit:"S", rank:"K"},
                    {suit:"S", rank:"9"},
                    {suit:"S", rank:"Q"},
                    {suit:"S", rank:"J"},
                    {suit:"S", rank:"T"}
                ]
            };
            var dealerHand = {
                initCards: [
                    {suit:"S", rank:"A"},
                    {suit:"S", rank:"K"},
                    {suit:"S", rank:"Q"},
                    {suit:"S", rank:"T"},
                    {suit:"S", rank:"J"}
                ]
            };
            var result = gameLogic.getResult(dealerHand, playerHand, 3000, true);
            assert.equal(0, result.payout);
            assert.equal(false, result.isWin);
            assert.equal(false, result.isPush);
            assert.equal(false, result.isFold);
            assert.equal(true, result.dealerHand.qualified);
            done();
        });
        it('should pay 3 * ante if player raises, dealer and player cards are push', function (done) {
            var playerHand = {
                finalCards: [
                    {suit:"D", rank:"K"},
                    {suit:"D", rank:"T"},
                    {suit:"D", rank:"Q"},
                    {suit:"D", rank:"J"},
                    {suit:"D", rank:"A"}
                ]
            };
            var dealerHand = {
                initCards: [
                    {suit:"S", rank:"A"},
                    {suit:"S", rank:"K"},
                    {suit:"S", rank:"Q"},
                    {suit:"S", rank:"T"},
                    {suit:"S", rank:"J"}
                ]
            };
            var result = gameLogic.getResult(dealerHand, playerHand, 3000, true);
            assert.equal(9000, result.payout);
            assert.equal(false, result.isWin);
            assert.equal(true, result.isPush);
            assert.equal(false, result.isFold);
            assert.equal(true, result.dealerHand.qualified);
            done();

        });
        it('should pay 4 * ante + (2 * ante) * payout_multiplier if player raises, dealer cards are qualified and beaten by player cards', function (done) {
            var playerHand = {
                finalCards: [
                    {suit:"D", rank:"K"},
                    {suit:"D", rank:"T"},
                    {suit:"D", rank:"Q"},
                    {suit:"D", rank:"J"},
                    {suit:"D", rank:"A"}
                ]
            };
            var dealerHand = {
                initCards: [
                    {suit:"S", rank:"T"},
                    {suit:"S", rank:"K"},
                    {suit:"S", rank:"Q"},
                    {suit:"S", rank:"T"},
                    {suit:"S", rank:"J"}
                ]
            };
            var result = gameLogic.getResult(dealerHand, playerHand, 3000, true);
            assert.equal(3000 * 4 + (2 * 3000) * payout_multipliers[result.playerHand.rnk], result.payout);
            assert.equal(true, result.isWin);
            assert.equal(false, result.isPush);
            assert.equal(false, result.isFold);
            assert.equal(true, result.dealerHand.qualified);
            done();

        });
    });
    describe('getPlayerFinalCards', function() {
        it('should replace canceled cards', function (done) {
            var hands = gameLogic.initHands('test');
            var finalArray = hands.allCards;
            var playerHand = {
                initCards : hands.playerCards,
                rnk : hands.playerCardsRank,
                sub_rnk : hands.playerCardsSubRank
            };

            var holds = [true, true, true, false, false];
            playerHand.finalCards = gameLogic.getPlayerFinalCards(playerHand.initCards, holds, finalArray);
            assert.deepEqual(playerHand.finalCards[3], finalArray[10]);
            assert.deepEqual(playerHand.finalCards[4], finalArray[11]);
            done();
        });
    });
});