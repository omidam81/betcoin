'use strict'

var assert = require('assert');
var GameLogic = require('../src/container/gamelogic');

describe('3card game logic', function () {
    var gameLogic = new GameLogic();

    var g_rankOrder = {
        royal_flush: {rank : 1},
        straight_flush: {rank : 2},
        three_of_a_kind: {rank : 3},
        straight: {rank : 4},
        flush: {rank : 5},
        one_pair: {rank : 6},
        no_pair: {rank : 7}
    };

    /**
     * Ante Bet Bonus pay table
     */
    var ante_payout_multipliers = [
        0,
        5,     //mini royal flush
        5,     //straight flush
        4,      //three of a kind
        1,      //straight
        0,      //flush
        0,      //one pair
        0       //no pair
    ];

    /**
     * Pairplus pay table
     */
    var pairplus_payout_multipliers = [
        0,
        40,     //mini royal flush
        40,     //straight flush
        30,      //three of a kind
        5,      //straight
        4,      //flush
        1,      //one pair
        0       //no pair
    ];
    describe('getCardResult', function() {
        it('should return royal flush', function (done) {
            //Royal Flush
            var rankObj = gameLogic.getCardResult(['s14', 's13', 's12']);
            assert.equal(g_rankOrder.royal_flush.rank, rankObj.rnk);
            rankObj = gameLogic.getCardResult(['c14', 'c13', 'c12']);
            assert.equal(g_rankOrder.royal_flush.rank, rankObj.rnk);
            assert.equal(12, rankObj.data[0]);
            assert.equal(14, rankObj.data[2]);
            done();
        });
        it('should return straight flush', function (done) {
            //Straight Flush
            var rankObj = gameLogic.getCardResult(['s14', 's2', 's3']);
            assert.equal(g_rankOrder.straight_flush.rank, rankObj.rnk);
            assert.equal(1, rankObj.data[0]);
            assert.equal(3, rankObj.data[2]);
            var rankObj = gameLogic.getCardResult(['s13', 's11', 's12']);
            assert.equal(g_rankOrder.straight_flush.rank, rankObj.rnk);
            assert.equal(11, rankObj.data[0]);
            assert.equal(13, rankObj.data[2]);
            done();
        });
        it('should return flush', function (done) {
            //Flush
            var rankObj = gameLogic.getCardResult(['s10', 's4', 's8']);
            assert.equal(g_rankOrder.flush.rank, rankObj.rnk);
            assert.equal(4, rankObj.data[0]);
            assert.equal(10, rankObj.data[2]);
            done();
        });
        it('should return straight', function (done) {
            //Straight
            var rankObj = gameLogic.getCardResult(['s4', 's5', 'd6']);
            assert.equal(g_rankOrder.straight.rank, rankObj.rnk);
            assert.equal(4, rankObj.data[0]);
            assert.equal(6, rankObj.data[2]);
            rankObj = gameLogic.getCardResult(['s14', 's2', 'd3']);
            assert.equal(g_rankOrder.straight.rank, rankObj.rnk);
            assert.equal(1, rankObj.data[0]);
            assert.equal(3, rankObj.data[2]);
            done();
        });
        it('should return three of a kind', function (done) {
            //Three of a kind
            var rankObj = gameLogic.getCardResult(['s2', 'c2', 'd2']);
            assert.equal(g_rankOrder.three_of_a_kind.rank, rankObj.rnk);
            assert.equal(2, rankObj.data[0]);
            done();
        });
        it('should return one pair', function (done) {
            //One pairs
            var rankObj = gameLogic.getCardResult(['s2', 'c2', 'd5']);
            assert.equal(g_rankOrder.one_pair.rank, rankObj.rnk);
            assert.equal(2, rankObj.data[0]);
            assert.equal(5, rankObj.restofData[0]);
            done();
        });
        it('should return no pair', function (done) {
            //No pair
            var rankObj = gameLogic.getCardResult(['s2', 's14', 'd5']);
            assert.equal(g_rankOrder.no_pair.rank, rankObj.rnk);
            assert.equal(0, rankObj.data.length);
            done();
        });
    });
    describe('isDealerQualifiedCards', function() {
        it('should qualify dealer cards', function (done) {
            var dealerHand = gameLogic.getCardResult(['s12','s3','h2']);
            var dealerQualified = gameLogic.isDealerQualifiedCards(dealerHand);
            assert.equal(true, dealerQualified);
            dealerHand = gameLogic.getCardResult(['s11','s10','h8']);
            dealerQualified = gameLogic.isDealerQualifiedCards(dealerHand);
            assert.equal(false, dealerQualified);
            dealerHand = gameLogic.getCardResult(['s11','s8','h8']);
            dealerQualified = gameLogic.isDealerQualifiedCards(dealerHand);
            assert.equal(true, dealerQualified);
            done();
        });
    });
    describe('parseHandCards', function() {
        it('should parse hand cards', function (done) {
            var initCards = [
                {suit:"S", rank:"A"},
                {suit:"S", rank:"Q"},
                {suit:"C", rank:"J"}
            ];
            var cards = gameLogic.parseHandCards(initCards);
            assert.equal("s14", cards[0]);
            assert.equal("s12", cards[1]);
            assert.equal("c11", cards[2]);
            done();
        });
    });
    describe('getResult', function() {
        it('should forfeit cards, ante bet for fold and should pay pairplus ', function (done) {
            var dealerHand = {
                initCards: [
                    {suit:"S", rank:"J"},
                    {suit:"S", rank:"8"},
                    {suit:"D", rank:"T"}
                ]
            };
            var playerHand = {
                initCards: [
                    {suit:"S", rank:"A"},
                    {suit:"D", rank:"T"},
                    {suit:"S", rank:"Q"}
                ]
            };
            var ante = 100;
            var pairplus = 100;
            var result = gameLogic.getResult(dealerHand, playerHand, ante, pairplus, 0);
            assert.equal(gameLogic.getPairplusPay(result.playerHand.rnk, pairplus), result.payout);
            assert.equal(g_rankOrder.no_pair.rank, result.playerHand.rnk);
            assert.equal(14, result.playerHand.sub_rnk);
            assert.equal(false, result.isWin);
            assert.equal(false, result.isPush);
            assert.equal(true, result.isFold);
            assert.equal(false, result.dealerHand.qualified);
            done();
        });
        it('should pay stake(ante * 2) + ante + ante bonus + pairplus pay if player raises and dealer card is not qualified', function (done) {
            var dealerHand = {
                initCards: [
                    {suit:"S", rank:"J"},
                    {suit:"S", rank:"8"},
                    {suit:"D", rank:"T"}
                ]
            };
            var playerHand = {
                initCards: [
                    {suit:"S", rank:"A"},
                    {suit:"S", rank:"K"},
                    {suit:"S", rank:"Q"}
                ]
            };
            var ante = 100;
            var pairplus = 100;
            var result = gameLogic.getResult(dealerHand, playerHand, ante, pairplus, 1);
            assert.equal(ante * 3 + gameLogic.getAnteBonus(result.playerHand.rnk, ante) + gameLogic.getPairplusPay(result.playerHand.rnk, pairplus), result.payout);
            assert.equal(true, result.isWin);
            assert.equal(false, result.isPush);
            assert.equal(false, result.isFold);
            assert.equal(false, result.dealerHand.qualified);
            done();
        });
        it('should pay ante bonus + pairplus pay if player raises, dealer cards are qualified and beat player cards', function (done) {
            var dealerHand = {
                initCards: [
                    {suit:"S", rank:"A"},
                    {suit:"S", rank:"K"},
                    {suit:"S", rank:"Q"}
                ]
            };
            var playerHand = {
                initCards: [
                    {suit:"S", rank:"K"},
                    {suit:"D", rank:"9"},
                    {suit:"S", rank:"Q"}
                ]
            };
            var ante = 100;
            var pairplus = 100;
            var result = gameLogic.getResult(dealerHand, playerHand, ante, pairplus, 1);
            assert.equal(gameLogic.getPairplusPay(result.playerHand.rnk, pairplus) + gameLogic.getAnteBonus(result.playerHand.rnk, ante), result.payout);
            assert.equal(false, result.isWin);
            assert.equal(false, result.isPush);
            assert.equal(false, result.isFold);
            assert.equal(true, result.dealerHand.qualified);
            done();
        });
        it('should pay stake(2 * ante) + pairplus pay + ante bonus if player raises, dealer and player cards are push', function (done) {
            var dealerHand = {
                initCards: [
                    {suit:"S", rank:"A"},
                    {suit:"S", rank:"K"},
                    {suit:"S", rank:"Q"}
                ]
            };
            var playerHand = {
                initCards: [
                    {suit:"D", rank:"K"},
                    {suit:"D", rank:"Q"},
                    {suit:"D", rank:"A"}
                ]
            };
            var ante = 100;
            var pairplus = 100;
            var result = gameLogic.getResult(dealerHand, playerHand, ante, pairplus, 1);
            assert.equal(gameLogic.getPairplusPay(result.playerHand.rnk, pairplus) + 2 * ante + gameLogic.getAnteBonus(result.playerHand.rnk, ante), result.payout);
            assert.equal(false, result.isWin);
            assert.equal(true, result.isPush);
            assert.equal(false, result.isFold);
            assert.equal(true, result.dealerHand.qualified);
            done();
        });
        it('should pay stake + 2 * ante + ante bonus + pairplus pay if player raises, dealer cards are qualified and beaten by player cards', function (done) {
            var dealerHand = {
                initCards: [
                    {suit:"S", rank:"T"},
                    {suit:"S", rank:"9"},
                    {suit:"S", rank:"Q"}
                ]
            };
            var playerHand = {
                initCards: [
                    {suit:"D", rank:"K"},
                    {suit:"D", rank:"Q"},
                    {suit:"D", rank:"A"}
                ]
            };
            var ante = 100;
            var pairplus = 100;
            var result = gameLogic.getResult(dealerHand, playerHand, ante, pairplus, 1);
            assert.equal(4 * ante + gameLogic.getAnteBonus(result.playerHand.rnk, ante) + gameLogic.getPairplusPay(result.playerHand.rnk, pairplus), result.payout);
            assert.equal(true, result.isWin);
            assert.equal(false, result.isPush);
            assert.equal(false, result.isFold);
            assert.equal(true, result.dealerHand.qualified);
            done();
        });
        it('should pay pairplus pay if play bets only pairplus', function (done) {
            var dealerHand = {
                initCards: [
                    {suit:"S", rank:"T"},
                    {suit:"S", rank:"9"},
                    {suit:"S", rank:"Q"}
                ]
            };
            var playerHand = {
                initCards: [
                    {suit:"D", rank:"K"},
                    {suit:"D", rank:"Q"},
                    {suit:"D", rank:"A"}
                ]
            };
            var ante = 0;
            var pairplus = 0;
            var result = gameLogic.getResult(dealerHand, playerHand, ante, pairplus, 2);
            assert.equal(gameLogic.getPairplusPay(result.playerHand.rnk, pairplus), result.payout);
            assert.equal(true, result.isWin);
            assert.equal(false, result.isPush);
            assert.equal(false, result.isFold);
            assert.equal(true, result.dealerHand.qualified);
            done();
        });
    });
});