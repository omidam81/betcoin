'use strict';

module.exports = function(HTTPError) {
    var provable = require('../../../lib/provably-fair');

    var numberOfStacks = 8;
    var GameLogic = function() {
    };

    GameLogic.prototype.getUnshuffledCards = function(){
        var self = this;
        var cards = [];
        for (var i = 0; i < numberOfStacks; i++) {
            for (var cardNum = 0; cardNum < 13; cardNum++) {
                for (var type = 0; type < 4; type++) {
                    var suit = "";
                    var rank = "";
                    suit = self.getCardSuit(type);
                    rank = self.getCardRank(cardNum);
                    var card = {suit: suit, rank: rank};
                    cards.push(card);
                }
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

    GameLogic.prototype.getCardRankOrder = function(card) {
        var cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
        return cards.indexOf(card.rank) + 1;
    };

    GameLogic.prototype.getCardSuit = function(order) {
        var suits = ["C", "D", "H", "S"];
        return suits[order];
    };

    GameLogic.prototype.initHands = function(seed) {
        var self = this;
        var cards = self.getShuffledCards(seed, self.getUnshuffledCards());
        var allCards = cards.slice();
        var playerHand = {};
        var bankerHand = {};
        //deal two cards, one to the Dragon and one to the Tiger
        playerHand.card = cards.shift();
        bankerHand.card = cards.shift();

        return {
            playerHand: playerHand,
            bankerHand: bankerHand,
            remainingCards: cards,
            allCards: allCards
        };
    };

    GameLogic.prototype.dealCard = function(playerHand, bankerHand, remainingCards){
        return {
            playerHand: playerHand,
            bankerHand: bankerHand,
            remainingCards: remainingCards
        };
    };

    GameLogic.prototype.getPayout = function(hands, bets){
        var self = this;
        var payouts = {
            total: 0,
            player: 0,
            banker: 0,
            tie: 0,
            suitedtie: 0,
            playerbig: 0,
            playersmall: 0,
            playerc: 0,
            playerd: 0,
            playerh: 0,
            players: 0,
            bankerbig: 0,
            bankersmall: 0,
            bankerc: 0,
            bankerd: 0,
            bankerh: 0,
            bankers: 0
        };
        hands.playerHand.rankOrder = self.getCardRankOrder(hands.playerHand.card);
        hands.bankerHand.rankOrder = self.getCardRankOrder(hands.bankerHand.card);
        if(hands.playerHand.rankOrder > hands.bankerHand.rankOrder && bets.player){
            payouts.player_multiplier = 2;
            payouts.player = bets.player * payouts.player_multiplier;
        }
        if(hands.bankerHand.rankOrder > hands.playerHand.rankOrder && bets.banker){
            payouts.banker_multiplier = 2;
            payouts.banker = bets.banker * payouts.banker_multiplier;
        }

        // Tie bet
        if(hands.playerHand.rankOrder === hands.bankerHand.rankOrder){
            if (bets.player) {
                payouts.player_multiplier = 0.5;
                payouts.player = bets.player * payouts.player_multiplier;
            }
            if (bets.banker) {
                payouts.banker_multiplier = 0.5;
                payouts.banker = bets.banker * payouts.banker_multiplier;
            }
            if (bets.tie) {
                payouts.tie_multiplier = 9;
                payouts.tie = bets.tie * payouts.tie_multiplier;
            }
        }

        // Suited Tie bet
        if(hands.playerHand.card.rank === hands.bankerHand.card.rank && hands.playerHand.card.suit === hands.bankerHand.card.suit) {
            if (bets.suitedtie) {
                payouts.suitedtie_multiplier = 51;
                payouts.suitedtie = bets.suitedtie * payouts.suitedtie_multiplier;
            }
        }

        // Big/Small bet
        var sevenRankOrder = self.getCardRankOrder({rank: '7'});
        if (hands.playerHand.rankOrder > sevenRankOrder && bets.playerbig) {
            payouts.playerbig_multiplier = 2;
            payouts.playerbig = bets.playerbig * payouts.playerbig_multiplier;
        } else if (hands.playerHand.rankOrder < sevenRankOrder && bets.playersmall) {
            payouts.playersmall_multiplier = 2;
            payouts.playersmall = bets.playersmall * payouts.playersmall_multiplier;
        }

        if (hands.bankerHand.rankOrder > sevenRankOrder && bets.bankerbig) {
            payouts.bankerbig_multiplier = 2;
            payouts.bankerbig = bets.bankerbig * payouts.bankerbig_multiplier;
        } else if (hands.bankerHand.rankOrder < sevenRankOrder && bets.bankersmall) {
            payouts.bankersmall_multiplier = 2;
            payouts.bankersmall = bets.bankersmall * payouts.bankersmall_multiplier;
        }

        // Suit bet
        var suit = hands.playerHand.card.suit.toLowerCase();
        if (bets['player' + suit] && hands.playerHand.rankOrder !== sevenRankOrder) {
            payouts['player' + suit + '_multiplier'] = 4;
            payouts['player' + suit] = bets['player' + suit] * payouts['player' + suit + '_multiplier'];
        }

        suit = hands.bankerHand.card.suit.toLowerCase();
        if (bets['banker' + suit] && hands.bankerHand.rankOrder !== sevenRankOrder) {
            payouts['banker' + suit + '_multiplier'] = 4;
            payouts['banker' + suit] = bets['banker' + suit] * payouts['banker' + suit + '_multiplier'];
        }

        payouts.total = payouts.player + payouts.banker + payouts.tie + payouts.suitedtie + payouts.playerbig + payouts.playersmall + payouts.playerc + payouts.playerd + payouts.playerh + payouts.players + payouts.bankerbig + payouts.bankersmall + payouts.bankerc + payouts.bankerd + payouts.bankerh + payouts.bankers;
        payouts.houseEdge = self.getHouseEdge(bets);
        return payouts;
    };

    GameLogic.prototype.getHouseEdge = function(bets){
        var totalWager = 0;
        var houseEdges = {
            player: 0.037,
            banker: 0.037,
            tie: 0.032,
            suitedtie: 0.139,
            playerbig: 0.076,
            playersmall: 0.076,
            playerc: 0.076,
            playerd: 0.076,
            playerh: 0.076,
            players: 0.076,
            bankerbig: 0.076,
            bankersmall: 0.076,
            bankerc: 0.076,
            bankerd: 0.076,
            bankerh: 0.076,
            bankers: 0.076
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
