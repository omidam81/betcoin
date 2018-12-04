'use strict';

module.exports = function(HTTPError) {
    var provable = require('../../../lib/provably-fair');

    var GameLogic = function() {

    };

    GameLogic.prototype.getUnshuffledCards = function(){
        var self = this;
        var cards = [];
        for(var cardNum = 0; cardNum < 13; cardNum++){
            for(var type = 0; type < 4; type++){
                var suit = "";
                var rank = "";
                suit = self.getCardSuit(type);
                rank = self.getCardRank(cardNum);
                var card = {suit:suit,rank:rank};
                cards.push(card);
            }
        }
        return cards;
    };

    GameLogic.prototype.getShuffledCards = function(seed, cards) {
        return provable.seededShuffle(seed, cards);
    };

    GameLogic.prototype.getCardRank = function(order) {
        var cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
        return cards[order];
    };

    GameLogic.prototype.getCardSuit = function(order) {
        var suits = ["C", "D", "H", "S"];
        return suits[order];
    };

    GameLogic.prototype.getScore = function(cards) {
        var totalScore = 0;
        var actualScore;
        for(var i in cards){
            if(cards.hasOwnProperty(i)){
                if(cards[i].rank === 'A'){
                    totalScore += 1;
                }else if(['T','J','Q','K'].indexOf(cards[i].rank) !== -1){
                    totalScore += 10;
                }else {
                    totalScore += parseInt(cards[i].rank);
                }
            }
        }
        actualScore = totalScore % 10;
        return actualScore;
    };

    GameLogic.prototype.initHands = function(seed) {
        var self = this;
        var cards = self.getShuffledCards(seed, self.getUnshuffledCards());
        var allCards = cards.slice();
        var playerCards = [];
        var bankderCards = [];
        var playerHand = {};
        var bankerHand = {};
        //deal two cards
        for(var i=0;i<2;i++){
            playerCards.push(cards.shift());
            bankderCards.push(cards.shift());
        }
        playerHand.cards = playerCards;
        bankerHand.cards = bankderCards;
        return {
            playerHand: playerHand,
            bankerHand: bankerHand,
            remainingCards: cards,
            allCards: allCards
        };
    };

    GameLogic.prototype.dealCard = function(playerHand, bankerHand, remainingCards){
        var self = this;
        playerHand.score = self.getScore(playerHand.cards);
        bankerHand.score = self.getScore(bankerHand.cards);

        //player third card rule
        if([8,9].indexOf(playerHand.score) !== -1 || [8,9].indexOf(bankerHand.score) !== -1){
            return {
                playerHand: playerHand,
                bankerHand: bankerHand,
                remainingCards: remainingCards
            };
        } else if(playerHand.score <= 5){
            playerHand.cards.push(remainingCards.shift());
        }
        if(playerHand.cards.length === 2){
            if(bankerHand.score <= 5){
                bankerHand.cards.push(remainingCards.shift());
            }
        } else {
            var lastPlayerCard = parseInt(playerHand.cards[2].rank, 10);
            // T J Q K A result in NaN, use 10 for our purposes
            if (isNaN(lastPlayerCard)) lastPlayerCard = 10;
            switch (lastPlayerCard) {
            case 2:
            case 3:
                if (bankerHand.score <= 4) bankerHand.cards.push(remainingCards.shift());
                break;
            case 4:
            case 5:
                if (bankerHand.score <= 5) bankerHand.cards.push(remainingCards.shift());
                break;
            case 6:
            case 7:
                if (bankerHand.score <= 6) bankerHand.cards.push(remainingCards.shift());
                break;
            case 8:
                if (bankerHand.score <= 2) bankerHand.cards.push(remainingCards.shift());
                break;
            case 9:
            case 10:
                if (bankerHand.score <= 3) bankerHand.cards.push(remainingCards.shift());
                break;
            }
        }

        return {
            playerHand: playerHand,
            bankerHand: bankerHand,
            remainingCards: remainingCards
        };
    };

    GameLogic.prototype.getPayout = function(hands, bets){
        var self = this;
        var payouts = {total: 0, player: 0, banker: 0, tie: 0};
        hands.playerHand.score = self.getScore(hands.playerHand.cards);
        hands.bankerHand.score = self.getScore(hands.bankerHand.cards);
        if(hands.playerHand.score > hands.bankerHand.score && bets.player){
            payouts.player_multiplier = 2;
            payouts.player = bets.player * payouts.player_multiplier;
            payouts.total += payouts.player;
        }
        if(hands.bankerHand.score > hands.playerHand.score && bets.banker){
            payouts.banker_multiplier = 1.95;
            payouts.banker = bets.banker * payouts.banker_multiplier;
            payouts.total += payouts.banker;
        }
        if(hands.playerHand.score === hands.bankerHand.score && bets.tie){
            payouts.tie_multiplier = 9;
            payouts.tie = bets.tie * payouts.tie_multiplier;
            payouts.total += payouts.tie;
        }
        payouts.houseEdge = self.getHouseEdge(bets);
        return payouts;
    };

    GameLogic.prototype.getHouseEdge = function(bets){
        var totalWager = 0;
        var houseEdges = {
            player: 0.0106,
            banker: 0.0124,
            tie: 0.1436
        };
        for(var i in bets){
            if(bets.hasOwnProperty(i)){
                totalWager += bets[i];
            }
        }
        var averageHouseEdge = 0;
        for(var j in bets){
            if(bets.hasOwnProperty(j)){
                if(typeof bets[j] === 'number' && houseEdges[j]){
                    var ratio = bets[j]/totalWager;
                    averageHouseEdge += ratio*houseEdges[j];
                }
            }
        }
        return averageHouseEdge;
    };

    GameLogic.prototype.validBets = function(bets){
        for(var i in bets){
            if(bets.hasOwnProperty(i)){
                if(typeof bets[i] !== 'number'){
                    throw new HTTPError(400, 'invalid bets params');
                }
            }
        }
        return true;
    };

    GameLogic.prototype.getResult = function(hands, bets){
        var self = this;
        hands = self.dealCard(hands.playerHand, hands.bankerHand, hands.remainingCards);
        hands.payouts = self.getPayout(hands, bets);
        return hands;
    };


    return GameLogic;
};
