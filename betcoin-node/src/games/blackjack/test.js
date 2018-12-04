'use strict';
var assert = require('assert');
var GameLogic = require('./src/gamelogic');

/* global describe */
/* global it */

describe('blackjack game logics', function () {
    var gameLogic = new GameLogic();
    describe('scores', function () {
        it('should translate the cards into points', function (done) {
            assert.equal(1, gameLogic.getPoint('A'));
            assert.equal(10, gameLogic.getPoint('J'));
            assert.equal(10, gameLogic.getPoint('Q'));
            assert.equal(10, gameLogic.getPoint('K'));
            for(var point=2;point<=10;point++){
                assert.equal(point, gameLogic.getPoint(point+""));
            }
            done();
        });
        it('should count A as 11', function (done) {
            var cards = [{rank:'A'},{rank:'K'}];
            var score = gameLogic.getScore(cards);
            assert.equal(21, score);
            cards = [{rank:'2'},{rank:'4'},{rank:'A'}];
            score = gameLogic.getScore(cards);
            assert.equal(17, score);
            done();
        });
        it('should count A as 1', function (done) {
            var cards = [{rank:'J'},{rank:'K'},{rank:'A'}];
            var score = gameLogic.getScore(cards);
            assert.equal(21, score);
            cards = [{rank:'4'},{rank:'A'},{rank:'K'}];
            score = gameLogic.getScore(cards);
            assert.equal(15, score);
            done();
        });
        it('bug', function (done) {
            var cards = [{rank:'A'},{rank:'A'},{rank:'10'}];
            var score = gameLogic.getScore(cards);
            assert.equal(12, score);
            cards = [{rank:'A'},{rank:'A'},{rank:'3'},{rank:'10'}];
            score = gameLogic.getScore(cards);
            assert.equal(15, score);
            done();
        });
        it('should add up the aces if the other cards already busted', function (done) {
            var cards = [ { rank: '5' }, { rank: 'K' }, { rank: 'A' }, { rank: 'K' } ];
            var score = gameLogic.getScore(cards);
            assert.equal(26, score);
            cards = [ { rank: 'A' }, { rank: 'K' }, { rank: 'A' }, { rank: 'K' } ];
            score = gameLogic.getScore(cards);
            assert.equal(22, score);
            cards = [ { rank: 'A' }, { rank: 'A' }, { rank: 'A' }, { rank: 'K' }, {rank: 'K'} ];
            score = gameLogic.getScore(cards);
            assert.equal(23, score);
            cards = [ { rank: 'A' }, { rank: 'A' }, { rank: 'A' }, { rank: 'A' }, {rank: 'K'}, {rank: 'K'} ];
            score = gameLogic.getScore(cards);
            assert.equal(24, score);
            cards = [ { rank: 'A' }, { rank: 'A' }, { rank: 'A' }, { rank: 'A' }, {rank: 'K'}, {rank: '6'}, {rank:' 8'} ];
            score = gameLogic.getScore(cards);
            assert.equal(28, score);
            done();
        });
    });
    describe('compare', function () {
        it('should win', function (done) {
            var playerCards = [{rank:'J'},{rank:'K'},{rank:'A'}];
            var dealerCards = [{rank:'4'},{rank:'A'},{rank:'K'}];
            var result = gameLogic.compare(playerCards, dealerCards);
            assert.equal(1, result);
            done();
        });
        it('should lose', function (done) {
            var dealerCards = [{rank:'J'},{rank:'K'},{rank:'A'}];
            var playerCards = [{rank:'4'},{rank:'A'},{rank:'K'}];
            var result = gameLogic.compare(playerCards, dealerCards);
            assert.equal(-1, result);
            done();
        });
        it('should push', function (done) {
            var dealerCards = [{rank:'J'},{rank:'A'}];
            var playerCards = [{rank:'A'},{rank:'K'}];
            var result = gameLogic.compare(playerCards, dealerCards);
            assert.equal(0, result);
            done();
        });
        it('should blackjack win when score equals', function (done) {
            var dealerCards = [{rank:'J'},{rank:'K'},{rank:'A'}];
            var playerCards = [{rank:'A'},{rank:'K'}];
            var result = gameLogic.compare(playerCards, dealerCards);
            assert.equal(1, result);
            done();
        });
    });
    describe('deal cards', function () {
        describe('deal first two cards', function () {
            it('should give first card to player', function (done) {
                var hands = gameLogic.initHands('cards');
                assert.equal(2, hands.playerHands[0].cards.length);
                assert.equal(2, hands.dealerHand.cards.length);
                assert.equal(412, hands.remainingCards.length);
                assert.equal('4', hands.playerHands[0].cards[0].rank);
                assert.equal('A', hands.playerHands[0].cards[1].rank);
                assert.equal('4', hands.dealerHand.cards[0].rank);
                assert.equal('K', hands.dealerHand.cards[1].rank);
                assert.equal('4', hands.remainingCards.pop().rank);
                done();
            });
        });
        describe('hit', function () {
            it('should deal one card to player', function (done) {
                var remainingCards = [{rank:'K'},{rank:'2'}];
                var playerCards = [{rank:'J'},{rank:'3'}];
                var result = gameLogic.hit(playerCards, remainingCards);
                assert.equal(15, result.score);
                assert.equal(false, result.busted);
                assert.equal(3, result.playerCards.length);
                assert.equal(1, result.remainingCards.length);
                done();
            });
            it('should bust if the score higher than 21', function (done) {
                var remainingCards = [{rank:'K'}];
                var playerCards = [{rank:'J'},{rank:'Q'}];
                var result = gameLogic.hit(playerCards, remainingCards);
                assert.equal(true, result.busted);
                done();
            });
        });
        describe('stand', function () {
            it('should bust dealer if his hand is greater than 21', function (done) {
                var remainingCards = [{rank:'K'},{rank:'J'},{rank:'6'}];
                var dealerCards = [{rank:'K'},{rank:'6'}];
                var result = gameLogic.stand(dealerCards, remainingCards);
                assert.equal(true, result.busted);
                assert.equal(22, result.score);
                assert.equal(2, result.remainingCards.length);
                done();
            });
            it('should not deal more cards when dealer hand is greater than or equals to 17', function (done) {
                var remainingCards = [{rank:'K'},{rank:'J'},{rank:'6'}];
                var dealerCards = [{rank:'Q'},{rank:'7'}];
                var result = gameLogic.stand(dealerCards, remainingCards);
                assert.equal(false, result.busted);
                assert.equal(17, result.score);
                assert.equal(3, result.remainingCards.length);

                remainingCards = [{rank:'K'},{rank:'7'},{rank:'2'}];
                dealerCards = [{rank:'Q'},{rank:'2'}];
                result = gameLogic.stand(dealerCards, remainingCards);
                assert.equal(false, result.busted);
                assert.equal(21, result.score);
                assert.equal(1, result.remainingCards.length);
                done();
            });
            it('should deal more cards for dealer hand when it is less 17 score, including soft 17', function (done) {
                var remainingCards = [{rank:'K'},{rank:'2'},{rank:'A'}];
                var dealerCards = [{rank:'A'},{rank:'6'}];
                var result = gameLogic.stand(dealerCards, remainingCards);
                assert.equal(false, result.busted);
                assert.equal(18, result.score);
                assert.equal(2, result.remainingCards.length);
                done();
            });
            it('should not deal more cards when it has 17 again after the first soft 17', function (done) {
                var remainingCards = [{rank:'K'},{rank:'2'},{rank:'10'},{rank:'4'},{rank:'6'}];
                var dealerCards = [{rank:'A'},{rank:'6'}];
                var result = gameLogic.stand(dealerCards, remainingCards);
                assert.equal(false, result.busted);
                assert.equal(17, result.score);
                assert.equal(3, result.remainingCards.length);
                done();
            });
        });
    });
    describe('analyse game options', function () {
        it('should be able to hit or stand', function (done) {
            var playerCards = [{rank:'A'},{rank:'2'}];
            var result = gameLogic.analyseGameOptions(playerCards);
            assert.equal(true, result.hit);
            assert.equal(true, result.stand);
            assert.equal(false, result.double);
            assert.equal(false, result.split);
            done();
        });
        it('should not be able to double or split when it is more than two cards hand', function (done) {
            var playerCards = [{rank:'Q'},{rank:'J'},{rank:'1'}];
            var result = gameLogic.analyseGameOptions(playerCards);
            assert.equal(true, result.hit);
            assert.equal(true, result.stand);
            assert.equal(false, result.double);
            assert.equal(false, result.split);
            done();
        });
        it('should be able to split', function (done) {
            var playerCards = [{rank:'Q'},{rank:'J'}];
            var player = {balance: {btc: 1000}};
            var wager = 500;
            var result = gameLogic.analyseGameOptions(playerCards, undefined, wager, player);
            assert.equal(true, result.hit);
            assert.equal(true, result.stand);
            assert.equal(false, result.double);
            assert.equal(true, result.split);
            done();
        });
        it.skip('should not be able to split if the player\'s balance it too low', function (done) {
            var playerCards = [{rank:'Q'},{rank:'J'}];
            var player = {balance: {btc: 1000}};
            var wager = 1001;
            var result = gameLogic.analyseGameOptions(playerCards, undefined, wager, player);
            assert.equal(true, result.hit);
            assert.equal(true, result.stand);
            assert.equal(false, result.double);
            assert.equal(false, result.split);
            done();
        });
        it('should not be no options for blackjack', function (done) {
            var playerCards = [{rank:'A'},{rank:'T'}];
            var result = gameLogic.analyseGameOptions(playerCards);
            assert.equal(false, result.hit);
            assert.equal(false, result.stand);
            assert.equal(false, result.double);
            assert.equal(false, result.split);
            done();
        });
    });
    describe('after a game decision', function () {
        describe('init hands', function () {
            it('should init hands and get the game options', function (done) {
                var hands = gameLogic.initHands('cards');
                assert.equal(2, hands.playerHands[0].cards.length);
                assert.equal(2, hands.dealerHand.cards.length);
                assert.equal(412, hands.remainingCards.length);
                assert.equal('4', hands.playerHands[0].cards[0].rank);
                assert.equal('A', hands.playerHands[0].cards[1].rank);
                assert.equal('4', hands.dealerHand.cards[0].rank);
                assert.equal('K', hands.dealerHand.cards[1].rank);
                assert.equal('4', hands.remainingCards.pop().rank);

                var result = gameLogic.getResult({
                    playerHands: hands.playerHands,
                    dealerHand: hands.dealerHand,
                    remainingCards: hands.remainingCards
                });
                assert.equal(false, result.allFinished);
                assert.equal(false, result.playerHands[0].finished);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.dealerHand.busted);
                assert.equal(15, result.playerHands[0].score);
                assert.equal(true, result.playerHands[0].gameOptions.hit);
                assert.equal(true, result.playerHands[0].gameOptions.stand);
                assert.equal(false, result.playerHands[0].gameOptions.double);
                assert.equal(false, result.playerHands[0].gameOptions.split);
                done();
            });
            it('should allow splits', function () {
                gameLogic.getShuffledCards = function(){
                    return [{rank:'K'},{rank:'K'},{rank:'K'},{rank:'K'},{rank:'5'},{rank:'T'},{rank:'7'},{rank:'T'}];
                };
                var hands = gameLogic.initHands('cards');
                assert.equal(2, hands.playerHands[0].cards.length);
                assert.equal(2, hands.dealerHand.cards.length);
                assert.equal('T', hands.playerHands[0].cards[0].rank);
                assert.equal('T', hands.playerHands[0].cards[1].rank);
                assert.equal('7', hands.dealerHand.cards[0].rank);
                assert.equal('5', hands.dealerHand.cards[1].rank);
                assert.equal('K', hands.remainingCards.pop().rank);

                var result = gameLogic.getResult({
                    playerHands: hands.playerHands,
                    dealerHand: hands.dealerHand,
                    remainingCards: hands.remainingCards,
                    player: {balance: {btc: 100}},
                    wager: 100
                });
                assert.equal(false, result.allFinished);
                assert.equal(false, result.playerHands[0].finished);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.dealerHand.busted);
                assert.equal(20, result.playerHands[0].score);
                assert.equal(true, result.playerHands[0].gameOptions.hit);
                assert.equal(true, result.playerHands[0].gameOptions.stand);
                assert.equal(false, result.playerHands[0].gameOptions.double);
                assert.equal(true, result.playerHands[0].gameOptions.split);
            });
            it('should allow double bets', function () {
                gameLogic.getShuffledCards = function(){
                    return [{rank:'K'},{rank:'K'},{rank:'K'},{rank:'K'},{rank:'5'},{rank:'3'},{rank:'7'},{rank:'7'}];
                };
                var hands = gameLogic.initHands('cards');
                assert.equal(2, hands.playerHands[0].cards.length);
                assert.equal(2, hands.dealerHand.cards.length);
                assert.equal('7', hands.playerHands[0].cards[0].rank);
                assert.equal('3', hands.playerHands[0].cards[1].rank);
                assert.equal('7', hands.dealerHand.cards[0].rank);
                assert.equal('5', hands.dealerHand.cards[1].rank);
                assert.equal('K', hands.remainingCards.pop().rank);

                var result = gameLogic.getResult({
                    playerHands: hands.playerHands,
                    dealerHand: hands.dealerHand,
                    remainingCards: hands.remainingCards,
                    player: {balance: {btc: 100}},
                    wager: 100
                });
                assert.equal(false, result.allFinished);
                assert.equal(false, result.playerHands[0].finished);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.dealerHand.busted);
                assert.equal(10, result.playerHands[0].score);
                assert.equal(true, result.playerHands[0].gameOptions.hit);
                assert.equal(true, result.playerHands[0].gameOptions.stand);
                assert.equal(true, result.playerHands[0].gameOptions.double);
                assert.equal(false, result.playerHands[0].gameOptions.split);
            });
            it('should allow splits and double bets', function () {
                gameLogic.getShuffledCards = function(){
                    return [{rank:'K'},{rank:'K'},{rank:'K'},{rank:'K'},{rank:'5'},{rank:'5'},{rank:'7'},{rank:'5'}];
                };
                var hands = gameLogic.initHands('cards');
                assert.equal(2, hands.playerHands[0].cards.length);
                assert.equal(2, hands.dealerHand.cards.length);
                assert.equal('5', hands.playerHands[0].cards[0].rank);
                assert.equal('5', hands.playerHands[0].cards[1].rank);
                assert.equal('7', hands.dealerHand.cards[0].rank);
                assert.equal('5', hands.dealerHand.cards[1].rank);
                assert.equal('K', hands.remainingCards.pop().rank);

                var result = gameLogic.getResult({
                    playerHands: hands.playerHands,
                    dealerHand: hands.dealerHand,
                    remainingCards: hands.remainingCards,
                    player: {balance: {btc: 100}},
                    wager: 100
                });
                assert.equal(false, result.allFinished);
                assert.equal(false, result.playerHands[0].finished);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.dealerHand.busted);
                assert.equal(10, result.playerHands[0].score);
                assert.equal(true, result.playerHands[0].gameOptions.hit);
                assert.equal(true, result.playerHands[0].gameOptions.stand);
                assert.equal(true, result.playerHands[0].gameOptions.double);
                assert.equal(true, result.playerHands[0].gameOptions.split);
            });
            it.skip('should not allow splits if the player\'s balance is too low', function (done) {
                gameLogic.getShuffledCards = function(){
                    return [{rank:'K'},{rank:'K'},{rank:'K'},{rank:'K'},{rank:'5'},{rank:'T'},{rank:'7'},{rank:'T'}];
                };
                var hands = gameLogic.initHands('cards');
                assert.equal(2, hands.playerHands[0].cards.length);
                assert.equal(2, hands.dealerHand.cards.length);
                assert.equal('T', hands.playerHands[0].cards[0].rank);
                assert.equal('T', hands.playerHands[0].cards[1].rank);
                assert.equal('7', hands.dealerHand.cards[0].rank);
                assert.equal('5', hands.dealerHand.cards[1].rank);
                assert.equal('K', hands.remainingCards.pop().rank);

                var result = gameLogic.getResult({
                    playerHands: hands.playerHands,
                    dealerHand: hands.dealerHand,
                    remainingCards: hands.remainingCards,
                    player: {balance: {btc: 100}},
                    wager: 101
                });
                assert.equal(false, result.allFinished);
                assert.equal(false, result.playerHands[0].finished);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.dealerHand.busted);
                assert.equal(20, result.playerHands[0].score);
                assert.equal(true, result.playerHands[0].gameOptions.hit);
                assert.equal(true, result.playerHands[0].gameOptions.stand);
                assert.equal(false, result.playerHands[0].gameOptions.double);
                assert.equal(false, result.playerHands[0].gameOptions.split);
                done();
            });
            it.skip('should not allow double if the player\'s balance is too low', function (done) {
                gameLogic.getShuffledCards = function(){
                    return [{rank:'K'},{rank:'K'},{rank:'K'},{rank:'K'},{rank:'5'},{rank:'3'},{rank:'7'},{rank:'7'}];
                };
                var hands = gameLogic.initHands('cards');
                assert.equal(2, hands.playerHands[0].cards.length);
                assert.equal(2, hands.dealerHand.cards.length);
                assert.equal('7', hands.playerHands[0].cards[0].rank);
                assert.equal('3', hands.playerHands[0].cards[1].rank);
                assert.equal('7', hands.dealerHand.cards[0].rank);
                assert.equal('5', hands.dealerHand.cards[1].rank);
                assert.equal('K', hands.remainingCards.pop().rank);

                var result = gameLogic.getResult({
                    playerHands: hands.playerHands,
                    dealerHand: hands.dealerHand,
                    remainingCards: hands.remainingCards,
                    player: {balance: {btc: 100}},
                    wager: 101
                });
                assert.equal(false, result.allFinished);
                assert.equal(false, result.playerHands[0].finished);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.dealerHand.busted);
                assert.equal(10, result.playerHands[0].score);
                assert.equal(true, result.playerHands[0].gameOptions.hit);
                assert.equal(true, result.playerHands[0].gameOptions.stand);
                assert.equal(false, result.playerHands[0].gameOptions.double);
                assert.equal(false, result.playerHands[0].gameOptions.split);
                done();
            });
            it('should finish game when the init hand is blackjack', function (done) {
                gameLogic.getShuffledCards = function(){
                    return [{rank:'K'},{rank:'K'},{rank:'K'},{rank:'K'},{rank:'5'},{rank:'Q'},{rank:'7'},{rank:'A'}];
                };
                var hands = gameLogic.initHands('cards');
                assert.equal(2, hands.playerHands[0].cards.length);
                assert.equal(2, hands.dealerHand.cards.length);
                assert.equal('A', hands.playerHands[0].cards[0].rank);
                assert.equal('Q', hands.playerHands[0].cards[1].rank);
                assert.equal('7', hands.dealerHand.cards[0].rank);
                assert.equal('5', hands.dealerHand.cards[1].rank);
                hands.playerHands[0].wager = 1;
                var result = gameLogic.getResult({
                    playerHands: hands.playerHands,
                    dealerHand: hands.dealerHand,
                    remainingCards: hands.remainingCards
                });
                assert.equal(2, result.playerHands[0].cards.length);
                assert.equal(2, result.dealerHand.cards.length);
                assert.equal(true, result.allFinished);
                assert.equal(true, result.playerHands[0].finished);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.dealerHand.busted);
                assert.equal(21, result.playerHands[0].score);
                done();
            });
        });
        describe('blackjack', function () {
            it('should winnning blackjack 3:2', function (done) {
                var playerHands = [{
                    cards: [{rank:'Q'},{rank:'A'}],
                    wager: 1,
                    betHistory: []
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'T'}]},
                    remainingCards: []
                };
                var result = gameLogic.getResult(params);
                assert.equal(2.5, result.playerHands[0].payout);
                assert.equal(0, result.remainingCards.length);
                assert.equal(2, result.playerHands[0].cards.length);
                assert.equal(2, result.dealerHand.cards.length);
                assert.equal(true, result.playerHands[0].finished);
                done();
            });
        });
        describe('hit', function () {
            it('should lose when busted after a hit', function (done) {
                var playerHands = [{
                    cards: [{rank:'Q'},{rank:'7'}],
                    wager: 1,
                    betHistory: ['hit']
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: []},
                    remainingCards: [{rank:'K'},{rank:'T'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(0, result.playerHands[0].payout);
                assert.equal(true, result.playerHands[0].busted);
                assert.equal(1, result.remainingCards.length);
                assert.equal(3, result.playerHands[0].cards.length);
                assert.equal(true, result.playerHands[0].finished);
                done();
            });
            it('should push when both player and dealer have un-natural hand', function (done) {
                var playerHands = [{
                    cards: [{rank:'Q'},{rank:'7'}],
                    wager: 1,
                    betHistory: ['hit']
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'7'},{rank:'4'}]},
                    remainingCards: [{rank:'K'},{rank:'4'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(1, result.playerHands[0].payout);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.dealerHand.busted);
                assert.equal(0, result.remainingCards.length);
                assert.equal(3, result.playerHands[0].cards.length);
                assert.equal(3, result.dealerHand.cards.length);
                assert.equal(true, result.playerHands[0].finished);
                assert.equal(true, result.allFinished);
                assert.equal(false, result.playerHands[0].isWin);
                assert.equal(true, result.playerHands[0].isPush);
                done();
            });
            it('should win when player have un-natural hand and have higher score than dealer', function (done) {
                var playerHands = [{
                    cards: [{rank:'Q'},{rank:'7'}],
                    wager: 1,
                    betHistory: ['hit']
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'7'},{rank:'4'}]},
                    remainingCards: [{rank:'9'},{rank:'4'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(2, result.playerHands[0].payout);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.dealerHand.busted);
                assert.equal(0, result.remainingCards.length);
                assert.equal(3, result.playerHands[0].cards.length);
                assert.equal(3, result.dealerHand.cards.length);
                assert.equal(true, result.playerHands[0].finished);
                assert.equal(true, result.allFinished);
                assert.equal(true, result.playerHands[0].isWin);
                assert.equal(false, result.playerHands[0].isPush);
                done();
            });
            it('should lose when player have un-natural hand and dealer has a blackjack', function (done) {
                var playerHands = [{
                    cards: [{rank:'Q'},{rank:'7'}],
                    wager: 1,
                    betHistory: ['hit']
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'A'}]},
                    remainingCards: [{rank:'9'},{rank:'4'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(0, result.playerHands[0].payout);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.dealerHand.busted);
                assert.equal(1, result.remainingCards.length);
                assert.equal(3, result.playerHands[0].cards.length);
                assert.equal(2, result.dealerHand.cards.length);
                assert.equal(true, result.playerHands[0].finished);
                assert.equal(true, result.allFinished);
                assert.equal(false, result.playerHands[0].isWin);
                assert.equal(false, result.playerHands[0].isPush);
                done();
            });
        });
        describe('stand', function () {
            it('should win 1:1 for stand higher score', function (done) {
                var playerHands = [{
                    cards: [{rank:'Q'},{rank:'8'}],
                    wager: 1,
                    betHistory: ['stand']
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'7'}]},
                    remainingCards: []
                };
                var result = gameLogic.getResult(params);
                assert.equal(2, result.playerHands[0].payout);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(0, result.remainingCards.length);
                assert.equal(2, result.playerHands[0].cards.length);
                assert.equal(2, result.dealerHand.cards.length);
                assert.equal(true, result.playerHands[0].finished);
                done();
            });
            it('should pay back wager for stand equal score', function (done) {
                var playerHands = [{
                    cards: [{rank:'Q'},{rank:'7'}],
                    wager: 1,
                    betHistory: ['stand']
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'7'}]},
                    remainingCards: []
                };
                var result = gameLogic.getResult(params);
                assert.equal(1, result.playerHands[0].payout);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(0, result.remainingCards.length);
                assert.equal(2, result.playerHands[0].cards.length);
                assert.equal(2, result.dealerHand.cards.length);
                assert.equal(true, result.playerHands[0].finished);
                done();
            });
        });
        describe('double', function () {
            it('should payout for double when player hand higher than dealer', function (done) {
                var playerHands = [{
                    cards: [{rank:'5'},{rank:'6'}],
                    wager: 1,
                    betHistory: ['double']
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'7'}]},
                    remainingCards: [{rank:'2'},{rank:'3'},{rank:'T'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(4, result.playerHands[0].payout);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(2, result.remainingCards.length);
                assert.equal(3, result.playerHands[0].cards.length);
                assert.equal(2, result.dealerHand.cards.length);
                assert.equal(true, result.playerHands[0].finished);
                done();
            });
            it('should lose for double when player hand less than dealer', function (done) {
                var playerHands = [{
                    cards: [{rank:'5'},{rank:'6'}],
                    wager: 1,
                    betHistory: ['double']
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'6'},{rank:'A'}]},
                    remainingCards: [{rank:'2'},{rank:'3'},{rank:'A'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(0, result.playerHands[0].payout);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(1, result.remainingCards.length);
                assert.equal(3, result.playerHands[0].cards.length);
                assert.equal(3, result.dealerHand.cards.length);
                assert.equal(true, result.playerHands[0].finished);
                done();
            });
        });
        describe('split', function () {
            it('should split the cards', function (done) {
                var playerHands = [{
                    cards: [{rank:'2'},{rank:'2'}],
                    wager: 1,
                    betHistory: ['split']
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'3'}]},
                    remainingCards: [{rank:'2'},{rank:'3'},{rank:'A'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.playerHands[1].busted);
                assert.equal(2, result.remainingCards.length);
                assert.equal(2, result.playerHands[0].cards.length);
                assert.equal(1, result.playerHands[1].cards.length);
                assert.equal(2, result.dealerHand.cards.length);
                assert.equal(false, result.playerHands[0].finished);
                assert.equal(false, result.playerHands[1].finished);
                assert.equal(1, result.playerHands[0].wager);
                assert.equal(1, result.playerHands[1].wager);
                //verify the new cards to the splited hands
                assert.equal('A', result.playerHands[0].cards[1].rank);
                assert.equal('2', result.playerHands[1].cards[0].rank);
                assert.equal(13, result.playerHands[0].score);
                assert.equal(false, result.playerHands[0].gameOptions.double);
                assert.equal(false, result.playerHands[0].gameOptions.split);
                done();
            });
            it('should deal two cards to second hand if the first hand is blackjack after split', function (done) {
                var playerHands = [{
                    cards: [{rank:'K'},{rank:'K'}],
                    wager: 1,
                    betHistory: ['split']
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'3'}]},
                    remainingCards: [{rank:'2'},{rank:'3'},{rank:'A'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.playerHands[1].busted);
                assert.equal(1, result.remainingCards.length);
                assert.equal(2, result.playerHands[0].cards.length);
                assert.equal(2, result.playerHands[1].cards.length);
                assert.equal(2, result.dealerHand.cards.length);
                assert.equal(true, result.playerHands[0].finished);
                assert.equal(false, result.playerHands[1].finished);
                assert.equal(1, result.playerHands[0].wager);
                assert.equal(1, result.playerHands[1].wager);
                //verify the new cards to the splited hands
                assert.equal('A', result.playerHands[0].cards[1].rank);
                assert.equal('3', result.playerHands[1].cards[1].rank);
                assert.equal(true, result.playerHands[1].gameOptions.hit);
                assert.equal(true, result.playerHands[1].gameOptions.stand);
                assert.equal(21, result.playerHands[0].score);
                assert.equal(13, result.playerHands[1].score);
                done();
            });
            it('should be able to hit a card for split ace', function (done) {
                var playerHands = [{
                    cards: [{rank:'A'},{rank:'2'}],
                    wager: 1,
                    betHistory: ['hit']
                }, {
                    cards: [{rank:'A'}],
                    wager: 1
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'3'}]},
                    remainingCards: [{rank:'T'},{rank:'K'},{rank:'8'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(3, result.playerHands[0].cards.length);
                assert.equal(21, result.playerHands[0].score);
                assert.equal(true, result.playerHands[0].finished);
                assert.equal(false, result.playerHands[0].isBlackJack);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(2, result.playerHands[1].cards.length);
                assert.equal(21, result.playerHands[1].score);
                assert.equal(true, result.playerHands[1].isBlackJack);
                assert.equal(true, result.playerHands[1].finished);
                assert.equal(false, result.playerHands[1].busted);
                assert.equal(4.5, result.totalPayout);
                done();
            });
            it('should hit a card for the first split hand', function (done) {
                var playerHands = [{
                    cards: [{rank:'2'},{rank:'2'}],
                    wager: 1,
                    betHistory: ['hit']
                }, {
                    cards: [{rank:'2'}],
                    wager: 1
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'3'}]},
                    remainingCards: [{rank:'T'},{rank:'K'},{rank:'8'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(true, !result.playerHands[0].busted);
                assert.equal(true, !result.playerHands[1].busted);
                assert.equal(2, result.remainingCards.length);
                assert.equal(3, result.playerHands[0].cards.length);
                assert.equal(1, result.playerHands[1].cards.length);
                assert.equal(2, result.dealerHand.cards.length);
                assert.equal(false, result.playerHands[0].finished);
                assert.equal(false, result.playerHands[1].finished);
                //verify the new cards to the splited hands
                assert.equal('8', result.playerHands[0].cards[2].rank);
                assert.equal('2', result.playerHands[1].cards[0].rank);
                assert.equal(false, result.playerHands[0].gameOptions.double);
                assert.equal(false, result.playerHands[0].gameOptions.split);
                assert.equal(12, result.playerHands[0].score);
                assert.equal(false, result.allFinished);
                done();
            });
            it('should hit a card for the second split hand after first hand stand', function (done) {
                var playerHands = [{
                    cards: [{rank:'2'},{rank:'2'}],
                    wager: 1,
                    betHistory: ['hit','stand']
                }, {
                    cards: [{rank:'2'}],
                    wager: 1
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'3'}]},
                    remainingCards: [{rank:'T'},{rank:'K'},{rank:'8'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(true, !result.playerHands[0].busted);
                assert.equal(true, !result.playerHands[1].busted);
                assert.equal(2, result.remainingCards.length);
                assert.equal(2, result.playerHands[0].cards.length);
                assert.equal(2, result.playerHands[1].cards.length);
                assert.equal(2, result.dealerHand.cards.length);
                assert.equal(true, result.playerHands[0].finished);
                assert.equal(false, result.playerHands[1].finished);
                //verify the new cards to the splited hands
                assert.equal('2', result.playerHands[0].cards[1].rank);
                assert.equal('8', result.playerHands[1].cards[1].rank);
                assert.equal(false, result.playerHands[0].gameOptions.double);
                assert.equal(false, result.playerHands[0].gameOptions.split);
                assert.equal(true, result.playerHands[1].gameOptions.hit);
                assert.equal(true, result.playerHands[1].gameOptions.stand);
                assert.equal(false, result.playerHands[1].gameOptions.double);
                assert.equal(false, result.playerHands[1].gameOptions.split);
                assert.equal(4, result.playerHands[0].score);
                assert.equal(false, result.allFinished);
                done();
            });
            it('should hit a card for the second split hand after first hand busted', function (done) {
                var playerHands = [{
                    cards: [{rank:'K'},{rank:'Q'}],
                    wager: 1,
                    betHistory: ['hit']
                }, {
                    cards: [{rank:'Q'}],
                    wager: 1
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'3'}]},
                    remainingCards: [{rank:'T'},{rank:'K'},{rank:'8'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(true, result.playerHands[0].busted);
                assert.equal(false, result.playerHands[1].busted);
                assert.equal(1, result.remainingCards.length);
                assert.equal(3, result.playerHands[0].cards.length);
                assert.equal(2, result.playerHands[1].cards.length);
                assert.equal(2, result.dealerHand.cards.length);
                assert.equal(true, result.playerHands[0].finished);
                assert.equal(false, result.playerHands[1].finished);
                //verify the new cards to the splited hands
                assert.equal('8', result.playerHands[0].cards[2].rank);
                assert.equal('K', result.playerHands[1].cards[1].rank);
                assert.equal(false, result.playerHands[0].gameOptions.double);
                assert.equal(false, result.playerHands[0].gameOptions.split);
                assert.equal(true, result.playerHands[1].gameOptions.hit);
                assert.equal(true, result.playerHands[1].gameOptions.stand);
                assert.equal(false, result.playerHands[1].gameOptions.double);
                assert.equal(false, result.playerHands[1].gameOptions.split);
                assert.equal(false, result.allFinished);
                done();
            });
            it('should finish the game when both hand busted', function (done) {
                var playerHands = [{
                    cards: [{rank:'K'},{rank:'Q'},{rank:'5'}],
                    wager: 1,
                    busted: true,
                    finished: true
                }, {
                    cards: [{rank:'Q'},{rank:'K'}],
                    wager: 1,
                    betHistory: ['hit']
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'3'}]},
                    remainingCards: [{rank:'T'},{rank:'K'},{rank:'8'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(true, result.playerHands[1].busted);
                assert.equal(2, result.remainingCards.length);
                assert.equal(3, result.playerHands[0].cards.length);
                assert.equal(3, result.playerHands[1].cards.length);
                assert.equal(2, result.dealerHand.cards.length);
                assert.equal(true, result.playerHands[0].finished);
                assert.equal(true, result.playerHands[1].finished);
                //verify the new cards to the splited hands
                assert.equal('5', result.playerHands[0].cards[2].rank);
                assert.equal('8', result.playerHands[1].cards[2].rank);
                assert.equal(0, result.playerHands[0].payout);
                assert.equal(0, result.playerHands[1].payout);
                assert.equal(true, result.allFinished);
                done();
            });
            it('should hit a card for the second hand when the first hand is finished', function (done) {
                var playerHands = [{
                    cards: [{rank:'K'},{rank:'Q'}],
                    wager: 1,
                    finished: true,
                    busted: false
                }, {
                    cards: [{rank:'Q'},{rank:'2'}],
                    wager: 1,
                    betHistory: ['hit']
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'3'}]},
                    remainingCards: [{rank:'T'},{rank:'K'},{rank:'8'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.playerHands[1].busted);
                assert.equal(2, result.remainingCards.length);
                assert.equal(2, result.playerHands[0].cards.length);
                assert.equal(3, result.playerHands[1].cards.length);
                assert.equal(2, result.dealerHand.cards.length);
                assert.equal(true, result.playerHands[0].finished);
                assert.equal(false, result.playerHands[1].finished);
                //verify the new cards to the splited hands
                assert.equal('Q', result.playerHands[0].cards[1].rank);
                assert.equal('8', result.playerHands[1].cards[2].rank);
                assert.equal(true, result.playerHands[1].gameOptions.hit);
                assert.equal(true, result.playerHands[1].gameOptions.stand);
                assert.equal(false, result.playerHands[1].gameOptions.double);
                assert.equal(false, result.playerHands[1].gameOptions.split);
                assert.equal(false, result.allFinished);
                done();
            });
            it('should payout when both hands finished', function (done) {
                var playerHands = [{
                    cards: [{rank:'K'},{rank:'Q'}],
                    wager: 1,
                    betHistory: ['stand']
                }, {
                    cards: [{rank:'Q'}],
                    wager: 1
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'3'}]},
                    remainingCards: [{rank:'T'},{rank:'K'},{rank:'A'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.playerHands[1].busted);
                assert.equal(1, result.remainingCards.length);
                assert.equal(2, result.playerHands[0].cards.length);
                assert.equal(2, result.playerHands[1].cards.length);
                assert.equal(3, result.dealerHand.cards.length);
                assert.equal(true, result.dealerHand.busted);
                assert.equal(23, result.dealerHand.score);
                assert.equal(true, result.playerHands[0].finished);
                assert.equal(true, result.playerHands[1].finished);
                //verify the new cards to the splited hands
                assert.equal('Q', result.playerHands[0].cards[1].rank);
                assert.equal('A', result.playerHands[1].cards[1].rank);
                assert.equal(2, result.playerHands[0].payout);
                assert.equal(2.5, result.playerHands[1].payout);
                assert.equal(true, result.allFinished);
                done();
            });
            it('should split the Aces and hit only once for each hand', function (done) {
                var playerHands = [{
                    cards: [{rank:'A'},{rank:'A'}],
                    wager: 1,
                    betHistory: ['split']
                }];
                var params = {
                    playerHands: playerHands,
                    dealerHand: {cards: [{rank:'K'},{rank:'3'}]},
                    remainingCards: [{rank:'T'},{rank:'K'},{rank:'A'}]
                };
                var result = gameLogic.getResult(params);
                assert.equal(false, result.playerHands[0].busted);
                assert.equal(false, result.playerHands[1].busted);
                assert.equal(0, result.remainingCards.length);
                assert.equal(2, result.playerHands[0].cards.length);
                assert.equal(2, result.playerHands[1].cards.length);
                assert.equal(3, result.dealerHand.cards.length);
                assert.equal(true, result.dealerHand.busted);
                assert.equal(23, result.dealerHand.score);
                assert.equal(true, result.playerHands[0].finished);
                assert.equal(true, result.playerHands[1].finished);
                //verify the new cards to the splited hands
                assert.equal('A', result.playerHands[0].cards[1].rank);
                assert.equal('K', result.playerHands[1].cards[1].rank);
                assert.equal(12, result.playerHands[0].score);
                assert.equal(21, result.playerHands[1].score);
                assert.equal(2, result.playerHands[0].payout);
                assert.equal(2.5, result.playerHands[1].payout);
                assert.equal(true, result.allFinished);
                done();
            });
        });
        it('should throw exception when an invalid bet type is supplied', function (done) {
            var remainingCards = [{rank:'K'},{rank:'T'}];
            var playerCards = [{rank:'Q'},{rank:'7'}];
            var betType = "split";
            var wager = 1;
            var result;
            try{
                result = gameLogic.getHandResult(playerCards, [], remainingCards, betType, wager);
            }catch(e){
                assert.ok(e);
            }
            assert.equal(null, result);
            done();
        });
        it('isBlackJack', function (done) {
            var score = gameLogic.isBlackJack([{rank:'J'},{rank:'A'}]);
            assert.equal(score, true);
            done();
        });
    });
});
