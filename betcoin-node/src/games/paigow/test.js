'use strict';

var assert = require('assert');
var GameLogic = require('./src/gamelogic');

/* global describe */
/* global it */

describe('paigow game logic', function () {
    var gameLogic = new GameLogic();
    describe('deal cards', function () {
        it('test', function (done) {
            var dealerCards = [
            {rank:'JO', suit:'D'},
            {rank:'J', suit:'D'},
            {rank:'J', suit:'H'},
            {rank:'T', suit:'S'},
            {rank:'T', suit:'C'},
            {rank:'3', suit:'C'},
            {rank:'2', suit:'C'}];
            // ["d7","d11","h11","s10","c10","c3","c2"]

            var result = gameLogic.getResult(dealerCards, {
                fiveCards: [
                {rank:'4', suit:'C'},
                {rank:'9', suit:'D'},
                {rank:'9', suit:'S'},
                {rank:'9', suit:'C'},
                {rank:'3', suit:'D'}],
                twoCards: [{rank:'K', suit:'D'},{rank:'5', suit:'S'}]
            });
            assert.equal(8, result.playerHand.playerFiveRankObj.rnk);
            assert.equal(9, result.dealerHand.dealerFiveRankObj.rnk);
            assert.deepEqual({"rank":"JO"}, result.dealerHand.twoCards[0]);
            assert.deepEqual({"rank":"3","suit":"C"}, result.dealerHand.twoCards[1]);
            assert.deepEqual({"rank":"J","suit":"D"}, result.dealerHand.fiveCards[0]);
            assert.deepEqual({"rank":"J","suit":"H"}, result.dealerHand.fiveCards[1]);
            assert.deepEqual({"rank":"T","suit":"S"}, result.dealerHand.fiveCards[2]);
            assert.deepEqual({"rank":"T","suit":"C"}, result.dealerHand.fiveCards[3]);
            assert.deepEqual({"rank":"2","suit":"C"}, result.dealerHand.fiveCards[4]);

            assert.deepEqual({"rank":"K", "suit":"D"}, result.playerHand.twoCards[0]);
            assert.deepEqual({"rank":"5","suit":"S"}, result.playerHand.twoCards[1]);
            assert.deepEqual({"rank":"9","suit":"D"}, result.playerHand.fiveCards[0]);
            assert.deepEqual({"rank":"9","suit":"S"}, result.playerHand.fiveCards[1]);
            assert.deepEqual({"rank":"9","suit":"C"}, result.playerHand.fiveCards[2]);
            assert.deepEqual({"rank":"4","suit":"C"}, result.playerHand.fiveCards[3]);
            assert.deepEqual({"rank":"3","suit":"D"}, result.playerHand.fiveCards[4]);
            assert.equal('dealer', result.twoCardsResult);
            assert.equal('player', result.fiveCardsResult);
            done();
        });
        it('house way', function (done) {
            var dealerCards = [
            {rank:'7', suit:'D'},
            {rank:'J', suit:'D'},
            {rank:'J', suit:'H'},
            {rank:'T', suit:'S'},
            {rank:'T', suit:'C'},
            {rank:'3', suit:'C'},
            {rank:'2', suit:'C'}];
            // ["d7","d11","h11","s10","c10","c3","c2"]

            var result = gameLogic.getResult(dealerCards, {
                initCards: [
                {rank:'4', suit:'C'},
                {rank:'9', suit:'D'},
                {rank:'9', suit:'H'},
                {rank:'5', suit:'C'},
                {rank:'3', suit:'D'},
                {rank:'K', suit:'D'},
                {rank:'9', suit:'S'}
                ],
                fiveCards: [
                {rank:'4', suit:'C'},
                {rank:'9', suit:'D'},
                {rank:'9', suit:'S'},
                {rank:'9', suit:'C'},
                {rank:'3', suit:'D'}],
                twoCards: [{rank:'K', suit:'D'},{rank:'5', suit:'S'}]
            }, 1, true);
            assert.equal(8, result.playerHand.playerFiveRankObj.rnk);
            assert.equal(10, result.dealerHand.dealerFiveRankObj.rnk);
            assert.deepEqual({"rank":"T","suit":"S"}, result.dealerHand.twoCards[0]);
            assert.deepEqual({"rank":"T","suit":"C"}, result.dealerHand.twoCards[1]);
            assert.deepEqual({"rank":"J","suit":"D"}, result.dealerHand.fiveCards[0]);
            assert.deepEqual({"rank":"J","suit":"H"}, result.dealerHand.fiveCards[1]);
            assert.deepEqual({"rank":"7","suit":"D"}, result.dealerHand.fiveCards[2]);
            assert.deepEqual({"rank":"3","suit":"C"}, result.dealerHand.fiveCards[3]);
            assert.deepEqual({"rank":"2","suit":"C"}, result.dealerHand.fiveCards[4]);

            assert.deepEqual({"rank":"K", "suit":"D"}, result.playerHand.twoCards[0]);
            assert.deepEqual({"rank":"5","suit":"C"}, result.playerHand.twoCards[1]);
            assert.deepEqual({"rank":"9","suit":"D"}, result.playerHand.fiveCards[0]);
            assert.deepEqual({"rank":"9","suit":"H"}, result.playerHand.fiveCards[1]);
            assert.deepEqual({"rank":"9","suit":"S"}, result.playerHand.fiveCards[2]);
            assert.deepEqual({"rank":"4","suit":"C"}, result.playerHand.fiveCards[3]);
            assert.deepEqual({"rank":"3","suit":"D"}, result.playerHand.fiveCards[4]);

            assert.equal('dealer', result.twoCardsResult);
            assert.equal('player', result.fiveCardsResult);
            done();
        });

        it('should arrange two cards after the five cards is flush', function (done) {
            var dealerCards = [
            {rank:'7', suit:'H'},
            {rank:'7', suit:'D'},
            {rank:'J', suit:'D'},
            {rank:'A', suit:'S'},
            {rank:'4', suit:'D'},
            {rank:'3', suit:'D'},
            {rank:'K', suit:'D'}];
            // ["d7","d11","h11","s10","c10","c3","c2"]
            var result = gameLogic.init(gameLogic.parseHandCards(dealerCards));
            var playerFiveCards = result.fiveCards;
            var playerTwoCards = result.twoCards;
            playerFiveCards = gameLogic.standardizeHandCards(playerFiveCards);
            playerTwoCards = gameLogic.standardizeHandCards(playerTwoCards);
            assert.deepEqual({"rank":"7","suit":"H"}, playerTwoCards[1]);
            assert.deepEqual({"rank":"A","suit":"S"}, playerTwoCards[0]);
            assert.deepEqual({"rank":"3","suit":"D"}, playerFiveCards[0]);
            assert.deepEqual({"rank":"4","suit":"D"}, playerFiveCards[1]);
            assert.deepEqual({"rank":"7","suit":"D"}, playerFiveCards[2]);
            assert.deepEqual({"rank":"J","suit":"D"}, playerFiveCards[3]);
            assert.deepEqual({"rank":"K","suit":"D"}, playerFiveCards[4]);
            var playerHand = gameLogic.getPlayerCardResult({
                playerFiveCards: gameLogic.parseHandCards(playerFiveCards),
                playerTwoCards: gameLogic.parseHandCards(playerTwoCards)
            });
            //should be flush
            assert.equal(6, playerHand.playerFiveRankObj.rnk);
            assert.equal(11, playerHand.playerTwoRankObj.rnk);
            done();
        });

        it('bug', function (done) {
            var dealerCards = [
            {rank:'Q', suit:'S'},
            {rank:'9', suit:'S'},
            {rank:'7', suit:'S'},
            {rank:'9', suit:'C'},
            {rank:'T', suit:'S'},
            {rank:'7', suit:'H'},
            {rank:'JO'}];
            // ["d7","d11","h11","s10","c10","c3","c2"]
            var result = gameLogic.init(gameLogic.parseHandCards(dealerCards));
            var playerFiveCards = result.fiveCards;
            var playerTwoCards = result.twoCards;
            playerFiveCards = gameLogic.standardizeHandCards(playerFiveCards);
            playerTwoCards = gameLogic.standardizeHandCards(playerTwoCards);
            assert.deepEqual({"rank":"7","suit":"H"}, playerTwoCards[1]);
            assert.deepEqual({"rank":"9","suit":"C"}, playerTwoCards[0]);
            assert.deepEqual({"rank":"Q","suit":"S"}, playerFiveCards[0]);
            assert.deepEqual({"rank":"T","suit":"S"}, playerFiveCards[1]);
            assert.deepEqual({"rank":"9","suit":"S"}, playerFiveCards[2]);
            assert.deepEqual({"rank":"7","suit":"S"}, playerFiveCards[3]);
            assert.deepEqual({"rank":"JO"}, playerFiveCards[4]);
            done();
        });

        it.skip('more bug tests', function (done) {
            for(var i=8550;i<15000;i++){
                var unshuffledCards = gameLogic.getUnshuffledCards();
                var cards = gameLogic.getShuffledCards(i, unshuffledCards);
                var sevenCards = cards.slice(0,7);
                var result = gameLogic.init(gameLogic.parseHandCards(sevenCards));
                var playerFiveCards = result.fiveCards;
                var playerTwoCards = result.twoCards;
                playerFiveCards = gameLogic.standardizeHandCards(playerFiveCards);
                playerTwoCards = gameLogic.standardizeHandCards(playerTwoCards);
                assert.equal(true, playerTwoCards.length===2);
                assert.equal(true, playerFiveCards.length===5);
                assert.equal(5, playerFiveCards.length);
            }
            done();
        });
        it('sub_rnk test', function (done) {
            var dealerCards = [
                {rank:'JO', suit:'D'},
                {rank:'J', suit:'D'},
                {rank:'J', suit:'H'},
                {rank:'T', suit:'S'},
                {rank:'T', suit:'C'},
                {rank:'3', suit:'C'},
                {rank:'2', suit:'C'}];
            // ["d7","d11","h11","s10","c10","c3","c2"]

            var result = gameLogic.getResult(dealerCards, {
                fiveCards: [
                    {rank:'4', suit:'C'},
                    {rank:'K', suit:'D'},
                    {rank:'9', suit:'S'},
                    {rank:'K', suit:'C'},
                    {rank:'3', suit:'D'}],
                twoCards: [{rank:'Q', suit:'D'},{rank:'Q', suit:'S'}]
            });
            assert.equal(10, result.playerHand.playerFiveRankObj.rnk);
            assert.equal(13, result.playerHand.playerFiveRankObj.sub_rnk);
            assert.equal(10, result.playerHand.playerTwoRankObj.rnk);
            assert.equal(12, result.playerHand.playerTwoRankObj.sub_rnk);
            done();
        });
        it('sub_rnk test', function (done) {
            var dealerCards = [
                {rank:'JO', suit:'D'},
                {rank:'J', suit:'D'},
                {rank:'J', suit:'H'},
                {rank:'T', suit:'S'},
                {rank:'T', suit:'C'},
                {rank:'3', suit:'C'},
                {rank:'2', suit:'C'}];
            // ["d7","d11","h11","s10","c10","c3","c2"]

            var result = gameLogic.getResult(dealerCards, {
                fiveCards: [
                    {rank:'4', suit:'C'},
                    {rank:'K', suit:'D'},
                    {rank:'9', suit:'S'},
                    {rank:'T', suit:'C'},
                    {rank:'3', suit:'D'}],
                twoCards: [{rank:'Q', suit:'D'},{rank:'5', suit:'S'}]
            });
            assert.equal(11, result.playerHand.playerFiveRankObj.rnk);
            assert.equal(13, result.playerHand.playerFiveRankObj.sub_rnk);
            assert.equal(11, result.playerHand.playerTwoRankObj.rnk);
            assert.equal(12, result.playerHand.playerTwoRankObj.sub_rnk);
            done();
        });
        it('house way', function (done) {
            var dealerCards = [
                {rank:'K', suit:'C'},
                {rank:'K', suit:'H'},
                {rank:'2', suit:'S'},
                {rank:'2', suit:'H'},
                {rank:'9', suit:'H'},
                {rank:'J', suit:'S'},
                {rank:'T', suit:'S'}];
            // ["d7","d11","h11","s10","c10","c3","c2"]

            var result = gameLogic.getResult(dealerCards, {
                initCards: [
                    {rank:'K', suit:'D'},
                    {rank:'Q', suit:'S'},
                    {rank:'J', suit:'D'},
                    {rank:'T', suit:'D'},
                    {rank:'9', suit:'D'},
                    {rank:'6', suit:'D'},
                    {rank:'4', suit:'H'}
                ],
                fiveCards: [
                    {rank:'K', suit:'D'},
                    {rank:'Q', suit:'S'},
                    {rank:'J', suit:'D'},
                    {rank:'T', suit:'D'},
                    {rank:'9', suit:'D'}],
                twoCards: [{rank:'6', suit:'D'},{rank:'4', suit:'H'}]
            }, 1, true);
            assert.deepEqual({"rank":"Q", "suit":"S"}, result.playerHand.twoCards[0]);
            assert.deepEqual({"rank":"4","suit":"H"}, result.playerHand.twoCards[1]);
            done();
        });
        it('house way', function (done) {
            var dealerCards = [
                {rank:'K', suit:'C'},
                {rank:'K', suit:'H'},
                {rank:'2', suit:'S'},
                {rank:'2', suit:'H'},
                {rank:'9', suit:'H'},
                {rank:'J', suit:'S'},
                {rank:'T', suit:'S'}];
            // ["d7","d11","h11","s10","c10","c3","c2"]

            var result = gameLogic.getResult(dealerCards, {
                initCards: [
                    {rank:'K', suit:'D'},
                    {rank:'Q', suit:'D'},
                    {rank:'J', suit:'D'},
                    {rank:'T', suit:'D'},
                    {rank:'9', suit:'D'},
                    {rank:'8', suit:'D'},
                    {rank:'4', suit:'H'}
                ],
                fiveCards: [
                    {rank:'K', suit:'D'},
                    {rank:'Q', suit:'D'},
                    {rank:'J', suit:'D'},
                    {rank:'T', suit:'D'},
                    {rank:'9', suit:'D'}],
                twoCards: [{rank:'8', suit:'D'},{rank:'4', suit:'H'}]
            }, 1, true);
            assert.deepEqual({"rank":"Q", "suit":"D"}, result.playerHand.fiveCards[0]);
            assert.deepEqual({"rank":"J","suit":"D"}, result.playerHand.fiveCards[1]);
            assert.deepEqual({"rank":"T","suit":"D"}, result.playerHand.fiveCards[2]);
            assert.deepEqual({"rank":"9","suit":"D"}, result.playerHand.fiveCards[3]);
            assert.deepEqual({"rank":"8","suit":"D"}, result.playerHand.fiveCards[4]);
            assert.deepEqual({"rank":"K", "suit":"D"}, result.playerHand.twoCards[0]);
            assert.deepEqual({"rank":"4","suit":"H"}, result.playerHand.twoCards[1]);
            done();
        });
        it('init', function (done) {
            var initCards = [
                { suit: 'H', rank: 'T' },
                { rank: 'JO' },
                { suit: 'C', rank: 'A' },
                { suit: 'H', rank: '2' },
                { suit: 'H', rank: 'A' },
                { suit: 'C', rank: 'K' },
                { suit: 'H', rank: '8' }
            ];
            var result;
            result = gameLogic.init(gameLogic.parseHandCards(initCards));
            assert.deepEqual(result.twoCards, ['c14', 'c13']);
            initCards = [
                { suit: 'S', rank: 'J' },
                { suit: 'S', rank: 'T' },
                { suit: 'C', rank: 'K' },
                { suit: 'S', rank: '9' },
                { suit: 'C', rank: 'J' },
                { suit: 'S', rank: '4' },
                { rank: 'JO' }
            ];
            var parsed = gameLogic.parseHandCards(initCards);
            result = gameLogic.init(parsed);
            assert.deepEqual(result.fiveCards, ['s11', 's10', 's9', 's4', 'jo15']);
            initCards = [
                { rank: 'JO' },
                { suit: 'H', rank: 'K' },
                { suit: 'H', rank: 'Q' },
                { suit: 'H', rank: 'J' },
                { suit: 'D', rank: '5' },
                { suit: 'H', rank: 'T' },
                { suit: 'C', rank: 'J' }
            ];
            parsed = gameLogic.parseHandCards(initCards);
            result = gameLogic.init(parsed);
            assert.deepEqual(result.fiveCards, [ 'h13', 'h12', 'c11', 'h10', 'jo15' ]);
            done();
        });
    });
});
