'use strict';

var assert = require('assert');
var GameLogic = require('./src/gamelogic');

/* global describe */
/* global it */

describe('ultimatepoker game logic', function () {
    var gameLogic = new GameLogic();
    describe('getCardResult', function() {
        it('should return royal flush', function (done) {
            //Royal Flush
            var rankObj = gameLogic.getCardResult(['s14', 's10'], ['d14', 's13', 's12', 's11', 'h10']);
            assert.equal(2, rankObj.rnk);
            rankObj = gameLogic.getCardResult(['s10', 'h13'], ['c14', 'c13', 'c12', 'c11', 'c10']);
            assert.equal(2, rankObj.rnk);
            assert.equal(10, rankObj.data[0]);
            assert.equal(14, rankObj.data[4]);
            done();
        });
        it('should return straight flush', function (done) {
            //Straight Flush
            var rankObj = gameLogic.getCardResult(['s9','s8'], ['s13', 's9', 's12', 's11', 's10']);
            assert.equal(3, rankObj.rnk);
            assert.equal(9, rankObj.data[0]);
            assert.equal(13, rankObj.data[4]);
            rankObj = gameLogic.getCardResult(['s14','s8'], ['s7', 's9', 's12', 's11', 's10']);
            assert.equal(3, rankObj.rnk);
            assert.equal(8, rankObj.data[0]);
            assert.equal(12, rankObj.data[4]);
            rankObj = gameLogic.getCardResult(['s14','c8'], ['s2', 's3', 's5', 's4', 'd4']);
            assert.equal(3, rankObj.rnk);
            assert.equal(2, rankObj.data[0]);
            assert.equal(14, rankObj.data[4]);
            done();
        });
        it('should return four of a kind', function (done) {
            //Four of a kind
            var rankObj = gameLogic.getCardResult(['c10', 'd11'], ['s2', 'c2', 'd2', 'h2', 's12']);
            assert.equal(4, rankObj.rnk);
            assert.equal(2, rankObj.data[0]);
            done();
        });
        it('should return full house', function (done) {
            //Full house
            var rankObj = gameLogic.getCardResult(['h9','s11'], ['s9', 'c9', 'd10', 'h10', 'c10']);
            assert.equal(5, rankObj.rnk);
            assert.equal(10, rankObj.data[0]);
            assert.equal(9, rankObj.data[1]);
            done();
        });
        it('should return flush', function (done) {
            //Flush
            var rankObj = gameLogic.getCardResult(['s13', 'h10'], ['s10', 's4', 's8', 's6', 'c10']);
            assert.equal(6, rankObj.rnk);
            assert.equal(4, rankObj.data[0]);
            assert.equal(13, rankObj.data[4]);
            done();
        });
        it('should return straight', function (done) {
            //Straight
            var rankObj = gameLogic.getCardResult(['s2', 's3'], ['h7', 'd8', 's4', 's5', 'd6']);
            assert.equal(7, rankObj.rnk);
            assert.equal(4, rankObj.data[0]);
            assert.equal(8, rankObj.data[4]);
            rankObj = gameLogic.getCardResult(['s14','c8'], ['d2', 'c3', 's5', 's4', 'd4']);
            assert.equal(7, rankObj.rnk);
            assert.equal(2, rankObj.data[0]);
            assert.equal(14, rankObj.data[4]);
            done();
        });
        it('should return three of a kind', function (done) {
            //Three of a kind
            var rankObj = gameLogic.getCardResult(['s2', 'c2'], ['s8', 'd7', 'd2', 's5', 'd6']);
            assert.equal(8, rankObj.rnk);
            assert.equal(2, rankObj.data[0]);
            done();
        });
        it('should return two pairs', function (done) {
            //Two pairs
            var rankObj = gameLogic.getCardResult(['s2', 'd6'], ['c2', 'd5', 's5', 'd6', 'd10']);
            assert.equal(9, rankObj.rnk);
            assert.equal(6, rankObj.data[0]);
            assert.equal(5, rankObj.data[1]);
            done();
        });
        it('should return one pair', function (done) {
            //One pairs
            var rankObj = gameLogic.getCardResult(['s2', 'c2'], ['d5', 's7', 'd6', 'd8', 's10']);
            assert.equal(10, rankObj.rnk);
            assert.equal(2, rankObj.data[0]);
            done();
        });
        it('should return no pair', function (done) {
            //No pair
            var rankObj = gameLogic.getCardResult(['s2', 'c14'], ['s3', 'd10', 'd5', 's7', 'd6']);
            assert.equal(11, rankObj.rnk);
            assert.equal(0, rankObj.data.length);
            done();
        });
    });
    describe('isDealerOpens', function() {
        it('should qualify dealer cards', function (done) {
            var dealerHand = gameLogic.getCardResult(['s14','s13'], ['h7', 'd8','s4','s3','h2']);
            var dealerOpens = gameLogic.isDealerOpens(dealerHand);
            assert.equal(false, dealerOpens);
            dealerHand = gameLogic.getCardResult(['s14','s12'], ['d7', 'c5','s11','s10','h9']);
            dealerOpens = gameLogic.isDealerOpens(dealerHand);
            assert.equal(false, dealerOpens);
            dealerHand = gameLogic.getCardResult(['s14','s2'], ['d2', 'c5','s11','s10','h9']);
            dealerOpens = gameLogic.isDealerOpens(dealerHand);
            assert.equal(true, dealerOpens);
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
        it('should return game result for raise', function (done) {
            var dealerHand = {
                initCards: [
                    {suit:"S", rank:"Q"},
                    {suit:"S", rank:"J"}
                ]
            };
            var playerHand = {
                initCards: [
                    {suit:"S", rank:"A"},
                    {suit:"S", rank:"K"}
                ]
            };
            var bets = {ante: 1, blind: 1, trips: 1, play: 3};
            var finalArray = [
                {suit:"S", rank:"Q"},
                {suit:"S", rank:"A"},
                {suit:"S", rank:"J"},
                {suit:"S", rank:"K"},

                {suit:"D", rank:"Q"},
                {suit:"H", rank:"Q"},
                {suit:"C", rank:"K"},
                {suit:"H", rank:"K"},
                {suit:"D", rank:"A"}
            ];

            var result = gameLogic.getResult(dealerHand, playerHand, finalArray, bets, 'raise', 'began');
            assert.equal(22, result.payouts.total);
            assert.equal(true, result.isWin);
            assert.equal(false, result.isPush);
            assert.equal(false, result.isFold);
            assert.equal(true, result.dealerHand.opens);
            done();
        });
        it('should return game result for dealer not opens', function (done) {
            var dealerHand = {
                initCards: [
                    {suit:"C", rank:"A"},
                    {suit:"C", rank:"J"}
                ]
            };
            var playerHand = {
                initCards: [
                    {suit:"D", rank:"6"},
                    {suit:"C", rank:"4"}
                ]
            };
            var bets = {ante: 1, blind: 1, trips: 1, play: 3};
            var finalArray = [
                {suit:"D", rank:"6"},
                {suit:"C", rank:"A"},
                {suit:"C", rank:"4"},
                {suit:"C", rank:"J"},

                {suit:"C", rank:"6"},
                {suit:"D", rank:"4"},
                {suit:"H", rank:"8"},
                {suit:"D", rank:"7"},
                {suit:"C", rank:"2"}
            ];

            var result = gameLogic.getResult(dealerHand, playerHand, finalArray, bets, 'raise', 'began');
            assert.equal(8, result.payouts.total);
            assert.equal(true, result.isWin);
            assert.equal(false, result.isPush);
            assert.equal(false, result.isFold);
            assert.equal(false, result.dealerHand.opens);
            done();
        });
        it('should change game status for check', function (done) {
            var dealerHand = {
                initCards: [
                    {suit:"C", rank:"A"},
                    {suit:"C", rank:"J"}
                ]
            };
            var playerHand = {
                initCards: [
                    {suit:"D", rank:"6"},
                    {suit:"C", rank:"4"}
                ]
            };
            var bets = {ante: 1, blind: 1, trips: 1, play: 3};
            var finalArray = [
                {suit:"D", rank:"6"},
                {suit:"C", rank:"A"},
                {suit:"C", rank:"4"},
                {suit:"C", rank:"J"},

                {suit:"C", rank:"6"},
                {suit:"D", rank:"4"},
                {suit:"H", rank:"8"},
                {suit:"D", rank:"7"},
                {suit:"C", rank:"2"}
            ];

            var result = gameLogic.getResult(dealerHand, playerHand, finalArray, bets, 'check', 'began');
            assert.equal(result.communityHand.length, 3);
            assert.equal(result.status, 'three');
            done();
        });
    });
});