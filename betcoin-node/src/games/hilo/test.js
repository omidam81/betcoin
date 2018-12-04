'use strict';

var assert = require('assert');
var GameLogic = require('./src/gamelogic');

/* global describe */
/* global it */
/* global beforeEach */

describe.skip('hilo game logic', function () {
    var gameLogic = new GameLogic();
    describe('deal cards', function () {
        it('red and black cards should be evenly dealt', function (done) {
            var red = 0, black = 0;
            for(var i=0;i<11;i++){
                var cards = gameLogic.getShuffledCards(i+'');
                for(var j=0;j<cards.length;j++){
                    if(['C','D'].indexOf(cards[j].suit) !== -1){
                        black ++;
                    }else{
                        red ++;
                    }
                }
                assert.equal(black,red);
            }
            done();
        });
        it('should process the cards properly after one pick', function (done) {
            var cards = gameLogic.getShuffledCards('test');
            assert.equal(12, cards.length);
            var wager = 1;
            var pickOrder = 4;
            var cardToPick = cards[pickOrder-1];
            var result = gameLogic.getResult(cards, [pickOrder], wager);
            var remainingCards = result.remainingCards;
            var previousCards = result.previousCards;
            assert.equal(11, remainingCards.length);
            assert.equal(1, previousCards.length);
            assert.equal(cardToPick.rank, previousCards[0].rank);
            done();
        });
    });
    describe('payouts', function () {
        var cards = [
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
        var result;
        beforeEach(function (done) {
            //draw 8 diamond
            result = gameLogic.getResult(cards.slice(),[2],1);
            done();
        });
        it('house edge should be always equal to 1.65%', function (done) {
            var wager;
            var checkHouseEdge = function(betType, result){
                result = gameLogic.getResult(result.remainingCards, betType, wager, result.previousCards);
                var winningAmount = result.payout;
                if(winningAmount !== 0){
                    winningAmount -= wager;
                }
                // betType[0] = betType[0].replace('_b','B');
                // betType[0] = betType[0].replace('_r','R');
                var houseEdge = winningAmount*result.payoutGameOdds[betType[0]] - wager*(1 - result.payoutGameOdds[betType[0]]);
                var houseEdgeRatio = houseEdge/wager;
                assert.equal(true, Math.ceil(-houseEdgeRatio*10000) === 165 || Math.ceil(-houseEdgeRatio*10000) === 166);
                //should flag the game finished when either it is lose or hit the jackpot
                if(result.payout === 0){
                    assert.equal(true, result.finished);
                    return result;
                }
                var hasValidOdds = false;
                for(var odds in result.gameOdds){
                    if(result.gameOdds.hasOwnProperty(odds)){
                        if(result.gameOdds[odds] !== 0 && result.gameOdds[odds] !== 1){
                            hasValidOdds = true;
                        }
                    }
                }
                assert.equal(!hasValidOdds,result.finished);
                return result;
            };
            //test with different wager amounts
            for(var i=1;i<500;i++){
                result = gameLogic.getResult(cards.slice(),[2],1);
                wager = i;
                //draw 4 diamond
                checkHouseEdge(['red',1], result);
                assert.equal(result.previousCards[result.previousCards.length - 1].rank, "4");
                //draw J spike
                checkHouseEdge(['black',1], result);
                assert.equal(result.previousCards[result.previousCards.length - 1].rank, "J");
                //draw T
                checkHouseEdge(['smaller',1], result);
                assert.equal(result.previousCards[result.previousCards.length - 1].rank, "T");
                //draw Q heart
                checkHouseEdge(['bigger',1], result);
                assert.equal(result.previousCards[result.previousCards.length - 1].rank, "Q");
                //draw K
                checkHouseEdge(['bigger_black',1], result);
                assert.equal(result.previousCards[result.previousCards.length - 1].rank, "K");
                //draw 6
                checkHouseEdge(['smaller_black',1], result);
                assert.equal(result.previousCards[result.previousCards.length - 1].rank, "6");
                //draw 8
                checkHouseEdge(['bigger_red',2], result);
                assert.equal(result.previousCards[result.previousCards.length - 1].rank, "8");
                //draw 2
                checkHouseEdge(['smaller_black',2], result);
                assert.equal(result.previousCards[result.previousCards.length - 1].rank, "2");
                //draw A
                checkHouseEdge(['black',2], result);
                assert.equal(result.previousCards[result.previousCards.length - 1].rank, "A");
                // //draw 2
                // checkHouseEdge(['red',2], result);
                // assert.equal(result.previousCards[result.previousCards.length - 1].rank, 2);
                // //draw 4
                // checkHouseEdge(['bigger',1], result);
                // assert.equal(result.previousCards[result.previousCards.length - 1].rank, 4);
            }
            done();
        });
        it('should pick up the right card based on the bet param', function (done) {
            assert.equal(result.previousCards[0].rank, cards[1].rank);
            done();
        });
        it('should finish the game if lose', function (done) {
            result = gameLogic.getResult(result.remainingCards, ['smaller',2], 1, result.previousCards);
            assert.equal(result.finished, true);
            done();
        });
        it('payout should be based on the game odds of cards at the dealer\'s hand', function (done) {
            result = gameLogic.getResult(result.remainingCards, ['smaller',1], 1, result.previousCards);
            done();
        });
        it('should payout based on the odds', function (done) {
            var wager = 1;
            var odds = 0.1;
            var payout = gameLogic.getPayout(wager, odds);
            var houseEdge = payout*odds - (1-odds);
            var houseEdgeRatio = houseEdge/wager;
            assert.equal(true, Math.ceil(-houseEdgeRatio*10000) === 165);

            //handle zero game odds
            odds = 0;
            payout = gameLogic.getPayout(wager, odds);
            assert.equal(0, payout);
            done();
        });
        it('should not allow to bet on the type that is 100% win', function (done) {
            try{
                result = gameLogic.getResult(result.remainingCards,['bigger', 9],1);
            }catch(e){
                done();
            }
        });
    });
});
