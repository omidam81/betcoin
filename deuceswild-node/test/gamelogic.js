'use strict'

var assert = require('assert');
var GameLogic = require('../src/container/gamelogic');

describe('deuces wild game logic', function () {
    var gameLogic = new GameLogic();

    var g_rankOrder = {
        five_of_a_kind: {rank : 1},
        royal_flush: {rank : 2},
        straight_flush: {rank : 3},
        four_of_a_kind: {rank : 4},
        full_house: {rank : 5},
        flush: {rank : 6},
        straight: {rank : 7},
        three_of_a_kind: {rank : 8},
        two_pairs: {rank : 9},
        one_pair: {rank : 10},
        no_pair: {rank : 11}
    };

    /**
     * Jacks or Better Video Poker
     */
    var payout_multipliers = [
        0,
        0,
        1000,     //royal flush
        50,     //straight flush
        25,     //four of a kind
        6,      //full house
        5,      //flush
        4,      //straight
        3,      //three of a kind
        2,      //two pairs
        1,      //one pair jacks or higher
        0       //no pair
    ];
    describe('initHands', function() {
        it('should return holds', function (done) {
            //Royal Flush
            var result = gameLogic.initHands('9820224325');
            assert.equal('A', result.playerCards[0].rank);
            assert.equal('T', result.playerCards[1].rank);
            assert.equal('J', result.playerCards[2].rank);
            assert.equal('T', result.playerCards[3].rank);
            assert.equal('A', result.playerCards[4].rank);

            assert.equal(9, result.playerCardsRank);
            assert.equal(true, result.holds[0]);
            assert.equal(true, result.holds[1]);
            assert.equal(false, result.holds[2]);
            assert.equal(true, result.holds[3]);
            assert.equal(true, result.holds[4]);
            done();
        });
    });
    describe('getAutoHolds', function() {
        it('should return holds for straight candidates', function (done) {
            var playerCards = [
                {rank:'A', suit:'C'},
                {rank:'J', suit:'H'},
                {rank:'K', suit:'D'},
                {rank:'Q', suit:'C'},
                {rank:'8', suit:'C'}
            ]
            var rankObj = gameLogic.getCardResult(gameLogic.parseHandCards(playerCards));
            var holds = gameLogic.getAutoHolds(playerCards, rankObj);
            assert.equal(true, holds[0]);
            assert.equal(true, holds[1]);
            assert.equal(true, holds[2]);
            assert.equal(true, holds[3]);
            assert.equal(false, holds[4]);
            done();
        });
        it('should return holds for straight candidates', function (done) {
            var playerCards = [
                {rank:'A', suit:'C'},
                {rank:'5', suit:'H'},
                {rank:'4', suit:'D'},
                {rank:'3', suit:'C'},
                {rank:'8', suit:'C'}
            ]
            var rankObj = gameLogic.getCardResult(gameLogic.parseHandCards(playerCards));
            var holds = gameLogic.getAutoHolds(playerCards, rankObj);
            assert.equal(true, holds[0]);
            assert.equal(true, holds[1]);
            assert.equal(true, holds[2]);
            assert.equal(true, holds[3]);
            assert.equal(false, holds[4]);
            done();
        });
        it('should return holds for straight candidates', function (done) {
            var playerCards = [
                {rank:'A', suit:'H'},
                {rank:'7', suit:'D'},
                {rank:'K', suit:'C'},
                {rank:'8', suit:'C'},
                {rank:'T', suit:'D'}
            ]
            var rankObj = gameLogic.getCardResult(gameLogic.parseHandCards(playerCards));
            var holds = gameLogic.getAutoHolds(playerCards, rankObj);
            assert.equal(false, holds[0]);
            assert.equal(false, holds[1]);
            assert.equal(false, holds[2]);
            assert.equal(false, holds[3]);
            assert.equal(false, holds[4]);
            done();
        });
        it('should return holds for straight candidates', function (done) {
            var playerCards = [
                {rank:'8', suit:'C'},
                {rank:'5', suit:'H'},
                {rank:'4', suit:'D'},
                {rank:'3', suit:'C'},
                {rank:'7', suit:'C'}
            ]
            var rankObj = gameLogic.getCardResult(gameLogic.parseHandCards(playerCards));
            var holds = gameLogic.getAutoHolds(playerCards, rankObj);
            assert.equal(true, holds[0]);
            assert.equal(true, holds[1]);
            assert.equal(true, holds[2]);
            assert.equal(false, holds[3]);
            assert.equal(true, holds[4]);
            done();
        });
        it('should return holds for straight candidates', function (done) {
            var playerCards = [
                {rank:'A', suit:'C'},
                {rank:'J', suit:'C'},
                {rank:'K', suit:'D'},
                {rank:'Q', suit:'C'},
                {rank:'9', suit:'C'}
            ]
            var rankObj = gameLogic.getCardResult(gameLogic.parseHandCards(playerCards));
            var holds = gameLogic.getAutoHolds(playerCards, rankObj);
            assert.equal(true, holds[0]);
            assert.equal(true, holds[1]);
            assert.equal(false, holds[2]);
            assert.equal(true, holds[3]);
            assert.equal(true, holds[4]);

            done();
        });
    });
    describe('getCardResult', function() {
        it('should return royal flush', function (done) {
            //Royal Flush
            var rankObj = gameLogic.getCardResult(['s14', 's13', 's12', 's11', 's10']);
            assert.equal(2, rankObj.rnk);
            rankObj = gameLogic.getCardResult(['c14', 'c13', 'c12', 'c11', 'c10']);
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
            var rankObj = gameLogic.getCardResult(['s2', 's3', 's4', 's5', 'd14']);
            assert.equal(7, rankObj.rnk);
            assert.equal(2, rankObj.data[0]);
            assert.equal(14, rankObj.data[4]);
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
            var rankObj = gameLogic.getCardResult(['s11', 'c11', 'd5', 's7', 'd6']);
            assert.equal(10, rankObj.rnk);
            assert.equal(11, rankObj.data[0]);
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
    describe('isJacksOrHigher', function() {
        it('should return false for tens or lower', function (done) {
            var rankObj = gameLogic.getCardResult(['s2', 'c14', 'd5', 's7', 'd6']);
            assert.equal(false, gameLogic.isJacksOrHigher(rankObj));
            var rankObj = gameLogic.getCardResult(['s10', 'c10', 's14', 's13', 's12']);
            assert.equal(false, gameLogic.isJacksOrHigher(rankObj));
            done();
        });
        it('should return true for jacks or higher', function (done) {
            var rankObj = gameLogic.getCardResult(['s11', 'c11', 'd2', 's3', 'd4']);
            assert.equal(true, gameLogic.isJacksOrHigher(rankObj));
            var rankObj = gameLogic.getCardResult(['s12', 'c13', 's11', 's10', 's9']);
            assert.equal(true, gameLogic.isJacksOrHigher(rankObj));
            done();
        });
    });
    describe('parseHandCards', function() {
        it('should parse hand cards', function (done) {
            var initCards = [
                {suit:"S", rank:"A"},
                {suit:"S", rank:"Q"},
                {suit:"C", rank:"J"},
                {suit:"C", rank:"T"},
                {suit:"C", rank:"8"}
            ];
            var cards = gameLogic.parseHandCards(initCards);
            assert.equal("s14", cards[0]);
            assert.equal("s12", cards[1]);
            assert.equal("c11", cards[2]);
            done();
        });
    });
    describe('getPlayerFinalCards', function() {
        it('should replace canceled cards', function (done) {
            var hands = gameLogic.initHands('test');
            var finalArray = hands.allCards;
            var playerHand = {
                initCards : hands.playerCards
            };

            assert.equal("A", playerHand.initCards[0].rank);
            assert.equal("5", playerHand.initCards[1].rank);
            assert.equal("8", playerHand.initCards[2].rank);
            assert.equal("3", playerHand.initCards[3].rank);
            assert.equal("2", playerHand.initCards[4].rank);

            var holds = [true, true, true, false, false];
            var finalCards = gameLogic.getPlayerFinalCards(playerHand.initCards, holds, finalArray);
            assert.equal(finalArray[5].rank, finalCards[3].rank);
            assert.equal(finalArray[6].rank, finalCards[4].rank);

            holds = [false, false, true, false, false];
            finalCards = gameLogic.getPlayerFinalCards(playerHand.initCards, holds, finalArray);
            assert.equal(finalArray[5].rank, finalCards[0].rank);
            assert.equal(finalArray[6].rank, finalCards[1].rank);
            assert.equal(finalArray[7].rank, finalCards[3].rank);
            assert.equal(finalArray[8].rank, finalCards[4].rank);

            done();
        });
    });
    describe('getResult', function() {
        it('should pay 1001 * wager for royal flush', function (done) {
            var finalArray = [
                {suit:"S", rank:"A"},
                {suit:"D", rank:"8"},
                {suit:"S", rank:"J"},
                {suit:"H", rank:"T"},
                {suit:"S", rank:"K"},
                {suit:"S", rank:"Q"},
                {suit:"S", rank:"T"}
            ];
            var playerHand = {
                initCards : [
                    {suit:"S", rank:"A"},
                    {suit:"D", rank:"8"},
                    {suit:"S", rank:"J"},
                    {suit:"H", rank:"T"},
                    {suit:"S", rank:"K"}
                ]
            };
            var wager = 100;
            var holds = [true, false, true, false, true];
            var result = gameLogic.getResult(playerHand, wager, holds, finalArray);
            assert.equal(8, result.playerHand.initCards[1].rank);
            assert.equal("T", result.playerHand.initCards[3].rank);
            assert.equal("Q", result.playerHand.finalCards[1].rank);
            assert.equal("S", result.playerHand.finalCards[3].suit);
            assert.equal(g_rankOrder.royal_flush.rank, result.playerHand.rnk);
            assert.equal(payout_multipliers[g_rankOrder.royal_flush.rank] * wager, result.payout);
            assert.equal(1000 * wager, result.payout);

            done();
        });
        it('should pay 2 * wager for jacks or higher', function (done) {
            var finalArray = [
                {suit:"S", rank:"A"},
                {suit:"D", rank:"8"},
                {suit:"S", rank:"J"},
                {suit:"H", rank:"T"},
                {suit:"S", rank:"K"},
                {suit:"D", rank:"J"},
                {suit:"S", rank:"3"}
            ];
            var playerHand = {
                initCards : [
                    {suit:"S", rank:"A"},
                    {suit:"D", rank:"8"},
                    {suit:"S", rank:"J"},
                    {suit:"H", rank:"T"},
                    {suit:"S", rank:"K"}
                ]
            };
            var wager = 100;
            var holds = [true, false, true, false, true];
            var result = gameLogic.getResult(playerHand, wager, holds, finalArray);
            assert.equal(8, result.playerHand.initCards[1].rank);
            assert.equal("T", result.playerHand.initCards[3].rank);
            assert.equal("J", result.playerHand.finalCards[1].rank);
            assert.equal(3, result.playerHand.finalCards[3].rank);
            assert.equal(g_rankOrder.one_pair.rank, result.playerHand.rnk);
            assert.equal(payout_multipliers[g_rankOrder.one_pair.rank] * wager, result.payout);
            assert.equal(1 * wager, result.payout);

            done();
        });
    });
});