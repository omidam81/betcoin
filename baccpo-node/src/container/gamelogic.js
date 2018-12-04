'use strict';

//var HTTPError = require('httperror-npm');
var provable = require('provably-fair-npm');

module.exports = function() {
    var self = this;
    var numberOfStacks = 8;
    this.g_rankOrder = {
        three_three_of_spades: 1,
        three_suited_threes: 2,
        three_unsuited_threes: 3,
        suited_three_of_a_kind: 4,
        three_suited_0_point_cards: 5,
        unsuited_three_of_a_kind: 6,
        three_unsuited_0_point_cards: 7,
        three_card_flush: 8,
        all_other: 9
    };

    /**
     * Bonus bet pay table
     * Bonus Bet in http://wizardofodds.com/games/baccpo/
     */
    this.bonus_payout_multipliers = [
        0,
        10000,
        1000,
        200,
        100,
        50,
        20,
        10,
        4,
        -1
    ];

    /**
     * Basic methods for cards game
     */
    var getUnshuffledCards = function(){
        var cards = [];
        for (var i = 0; i < numberOfStacks; i++) {
            for (var cardNum = 0; cardNum < 13; cardNum++) {
                for (var type = 0; type < 4; type++) {
                    var suit = getCardSuit(type);
                    var rank = getCardRank(cardNum);
                    var card = {suit: suit, rank: rank};
                    cards.push(card);
                }
            }
        }
        return cards;
    };

    var getCardRank = function(order) {
        var cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
        return cards[order];
    };

    var getCardSuit = function(order) {
        var suits = ["C", "D", "H", "S"];
        return suits[order];
    };

    var getCardPoint = function(card) {
        var cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
        var order = cards.indexOf(card.rank);
        if (order >= 9) { //10's, face cards = 0 points
            return 0;
        }
        return order + 1;
    };

    var getShuffledCards = function(seed, cards) {
        return provable.seededShuffle(seed, cards);
    };

    var dealOneCard = function(initCards, newCard) {
        var cards = initCards.slice();
        cards.push(newCard);
        return cards;
    };

    var getHandResultText = function(dealerHand, playerHand) {
        if (playerHand.rank <= self.g_rankOrder.three_unsuited_threes) {
            return 'player';
        }
        dealerHand.point = self.getPoint(dealerHand.finalCards);
        playerHand.point = self.getPoint(playerHand.finalCards);
        if (dealerHand.point === playerHand.point && playerHand.point === 9) {
            return 'player';
        } else if (dealerHand.point > playerHand.point) {
            return 'dealer';
        } else if (dealerHand.point < playerHand.point) {
            return 'player';
        } else if (playerHand.finalCards.length > dealerHand.finalCards.length) {
            return 'player';
        } else if (playerHand.finalCards.length < dealerHand.finalCards.length) {
            return 'dealer';
        }
        return '';
    };

    var getBonusCardsRank = function(finalCards) {
        if (finalCards.length === 3) {
            var card1 = finalCards[0];
            var card2 = finalCards[1];
            var card3 = finalCards[2];
            var card1_point = getCardPoint(card1);
            var card2_point = getCardPoint(card2);
            var card3_point = getCardPoint(card3);

            if (card1.rank === card2.rank && card2.rank === card3.rank) {
                if (card1.rank === '3') {
                    if (card1.suit === card2.suit && card2.suit === card3.suit) {
                        if (card1.suit === 'S') {
                            return self.g_rankOrder.three_three_of_spades;
                        } else {
                            return self.g_rankOrder.three_suited_threes;
                        }
                    }
                    return self.g_rankOrder.three_unsuited_threes;
                }
                if (card1.suit === card2.suit && card2.suit === card3.suit) {
                    return self.g_rankOrder.suited_three_of_a_kind;
                }
                if (card1_point === 0 && card2_point === 0 && card3_point === 0) {
                    if (card1.suit === card2.suit && card2.suit === card3.suit) {
                        return self.g_rankOrder.three_suited_0_point_cards;
                    }
                }
                return self.g_rankOrder.unsuited_three_of_a_kind;
            }
            if (card1_point === 0 && card2_point === 0 && card3_point === 0) {
                if (card1.suit === card2.suit && card2.suit === card3.suit) {
                    return self.g_rankOrder.three_suited_0_point_cards;
                } else {
                    return self.g_rankOrder.three_unsuited_0_point_cards;
                }
            }

            if (card1.suit === card2.suit && card2.suit === card3.suit) {
                return self.g_rankOrder.three_card_flush;
            }
        }
        return self.g_rankOrder.all_other;
    };

    this.getPoint = function(cards) {
        var total = 0;
        for(var i = 0; i < cards.length; i++) {
            total += getCardPoint(cards[i]);
        }
        return total % 10;
    };

    /**
     * @params bets | {win: number, tie: number, bonus: number}
     * @param isWin
     * @param isPush
     * @param playerHand
     * @returns {total: number, win: number, tie: number, bonus: number}
     */
    var getPayouts = function(bets, isWin, isPush, playerHand) {
        var payouts = {total: 0, win: 0, tie: 0, bonus: 0};

        payouts.houseEdge = self.getHouseEdge(bets);
        if (isWin && bets.win) {
            var multiplier;
            if (playerHand.rank <= self.g_rankOrder.three_unsuited_threes) {
                multiplier = 4;
            } else if (playerHand.point !== 7) {
                multiplier = 2;
            } else {
                multiplier = 1.5;
            }
            payouts.win = multiplier * bets.win;
        }
        if (isPush) {
            if (bets.win) {
                payouts.win = bets.win;
            }
            if (bets.tie) {
                payouts.tie = 11 * bets.tie;
            }
        }

        if (bets.bonus && self.bonus_payout_multipliers[playerHand.rank] > 0) {
            payouts.bonus = (1 + self.bonus_payout_multipliers[playerHand.rank]) * bets.bonus;
        }

        payouts.total = payouts.win + payouts.tie + payouts.bonus;

        return payouts;
    };

    /**
     *
     * @params bets | {win: number, tie: number, bonus: number}
     * @returns {number}
     */
    this.getHouseEdge = function(bets){
        var houseEdges = {
            win: 0.0302,
            tie: 0.1637,
            bonus: 0.0985
        };
        var totalWager = 0;
        for (var i in bets) {
            if (bets[i]) {
                totalWager += bets[i];
            }
        }

        var averageHouseEdge = 0;
        if (totalWager > 0) {
            for (i in bets) {
                if (bets[i] && houseEdges[i]) {
                    averageHouseEdge += bets[i] / totalWager * houseEdges[i];
                }
            }
        }
        return averageHouseEdge;
    };

    this.initHands = function(seed) {
        var unshuffledCards = getUnshuffledCards();
        var cards = getShuffledCards(seed, unshuffledCards);
        var allCards = cards.slice();
        var playerCards = [];
        var dealerCards = [];
        for(var j=0;j<2;j++){
            playerCards.push(cards.shift());
            dealerCards.push(cards.shift());
        }

        var playerHandPoint = self.getPoint(playerCards);
        var dealerHandPoint = self.getPoint(dealerCards);

        return {
            playerCards: playerCards,
            playerCardsPoint: playerHandPoint,
            dealerCards: dealerCards,
            dealerCardsPoint: dealerHandPoint,
            allCards: allCards
        };
    };

    /**
     * Returns game result for dealer and player hands according to the game rule
     * @param dealerHand
     * @param playerHand
     * @params bets | {win: number, tie: number, bonus: number}
     * @param action | 'stand'/'hit'
     * @returns {{cardsResult: *, dealerHand: *, playerHand: *, isWin: boolean, isPush: boolean, payout: number}}
     */
    this.getResult = function(dealerHand, playerHand, bets, action, allCards){
        var lastCardIndex = dealerHand.initCards.length + playerHand.initCards.length;
        if (action === 'stand') { //stand
            playerHand.finalCards = playerHand.initCards.slice();
        } else { //hit
            playerHand.finalCards = dealOneCard(playerHand.initCards, allCards[lastCardIndex++]);
        }
        
        if (self.getPoint(dealerHand.initCards) <= 5 || (dealerHand.initCards[0].rank === '3' && dealerHand.initCards[1].rank === '3')) {
            dealerHand.finalCards = dealOneCard(dealerHand.initCards, allCards[lastCardIndex++]);
        } else {
            dealerHand.finalCards = dealerHand.initCards.slice();
        }

        playerHand.rank = getBonusCardsRank(playerHand.finalCards);

        var result = getHandResultText(dealerHand, playerHand);

        var isWin = false,
            isPush = false;

        if(result === 'player'){
            isWin = true;
        } else if (result === 'dealer') {
            isWin = false;
        } else {
            isPush = true;
        }

        var payouts = getPayouts(bets, isWin, isPush, playerHand);

        return {
            cardsResult: result,
            dealerHand: dealerHand,
            playerHand: playerHand,
            isWin: isWin,
            isPush: isPush,
            payout: payouts.total,
            payouts: payouts
        };
    };

    return this;
};