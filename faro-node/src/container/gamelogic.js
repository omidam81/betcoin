'use strict';

var provable = require('provably-fair-npm');

module.exports = function() {

    var self = this;
    this.cardRanks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];

    var turnBets = [];
    var previousCards = [];
    var highBet = 0;
    var evenBet = 0;
    var oddBet = 0;

    this.init = function(){
        turnBets = [];
        previousCards = [];
        highBet = 0;
        evenBet = 0;
        oddBet = 0;
    };

    this.getUnshuffledCards = function(){
        var cards = [];
        for(var cardNum = 0; cardNum < 13; cardNum++){
            for(var type = 0; type < 4; type++){
                var suit = "";
                var rank = "";
                suit = this.getCardSuit(type);
                rank = this.getCardRank(cardNum);
                var card = {suit:suit,rank:rank};
                cards.push(card);
            }
        }
        return cards;
    };

    this.getBetCards = function () {
        var cards = [];
        for(var cardNum = 0; cardNum < 13; cardNum++){
            var rank = "";
            rank = this.getCardRank(cardNum);
            var card = {rank:rank, cnt: 0, type: 0};
            cards.push(card);
        }
        return cards;
    };

    this.getCardRank = function(order) {
        var cards = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K","A"];
        return cards[order];
    };

    this.getCardSuit = function(order) {
        var suits = ["C", "D", "H", "S"];
        return suits[order];
    };

    this.getShuffledCards = function (seed) {
        var cards = this.getUnshuffledCards();
        cards = provable.seededShuffle(seed, cards);
        var validCards = [];
        for(var i=0;i<cards.length;i++){
            if(cards[i] !== undefined){
                validCards.push(cards[i]);
            }
        }
        return validCards;
    };

    this.getCardValue = function(rank) {
        return this.cardRanks.indexOf(rank) + 1;
    };


    this.getResult = function(cards, betCards, allBets, wager, previous_cards){
        var payout = 0;
        var result;
        var flatBets = allBets.flatBets||[];
        var turnBets = allBets.turnBets||[];
        var highBet = allBets.highBet||0;
        var evenBet = allBets.evenBet||0;
        var oddBet = allBets.oddBet||0;
        var previousCards = previous_cards||[];
        var winnerCard = winnerCard||{};
        var loserCard = loserCard||{};
        var remainingCards = [];
        var turnCards = [];
        var finished = false;
        if(cards.length === 0) {
            finished = true;
            cards = [];
        } else if(cards.length === 3) {
            if (turnBets.length !== 0) {
                var rankCount = 0;
                for(var i=0;i<cards.length;i++){
                    if(cards[i].rank === turnBets[i].rank) {
                        rankCount++;
                    }
                    turnCards.push(cards[i]);
                    previousCards.push(cards[i]);
                }
                if (rankCount === 3) {
                    payout = wager * 5;
                }

                finished = true;
                cards = [];
            }
        } else if(cards.length === 52) {
            previousCards = [];
            var burnCard = cards.pop();
            previousCards.push(burnCard);
            betCards[self.getCardValue(burnCard.rank) - 1].cnt++;
        } else {
            
            winnerCard = cards.pop();
            loserCard = cards.pop();
            previousCards.push(winnerCard);
            previousCards.push(loserCard);

            var loserCardRank = self.getCardValue(loserCard.rank);
            var winnerCardRank = self.getCardValue(winnerCard.rank);

            betCards[loserCardRank-1].cnt++;
            betCards[winnerCardRank-1].cnt++;

            var key, cardRank;

            if (loserCardRank !== winnerCardRank) {
                for (key = betCards.length-1; key >= 0; key--) {
                    cardRank = self.getCardValue(betCards[key].rank);
                    betCards[key].type = flatBets[key].type;
                    if (betCards[key].type === 1) {
                        if (cardRank === winnerCardRank) {
                            payout = payout + wager * 2;
                            betCards[key].type = 0;
                        } else if(cardRank !== loserCardRank) {
                            payout = payout + wager;
                        } else if (cardRank === loserCardRank) {
                            betCards[key].type = 0;
                        }
                    } else if (betCards[key].type === 2) {
                        if (cardRank === loserCardRank) {
                            payout = payout + wager * 2;
                            betCards[key].type = 0;
                        } else if(cardRank !== winnerCardRank) {
                            payout = payout + wager;
                        } else if (cardRank === winnerCardRank) {
                            betCards[key].type = 0;
                        }
                    }
                }
            } else {
                for (key = betCards.length-1; key >= 0; key--) {
                    betCards[key].type = flatBets[key].type;
                    cardRank = self.getCardValue(betCards[key].rank);
                    if (betCards[key].type === 1) {
                        if ((cardRank === winnerCardRank)) {
                            payout = payout + (wager / 2);
                            betCards[key].type = 0;
                        }
                    } else if (betCards[key].type === 2){
                        if ((cardRank === loserCardRank)) {
                            payout = payout + (wager / 2);
                            betCards[key].type = 0;
                        }
                    }
                }
            }

            if(highBet !== 0) {
                if (loserCardRank !== winnerCardRank) {
                    if (winnerCardRank > loserCardRank) {
                        payout = payout + wager * 2;
                        highBet = highBet - 1;
                    } else {
                        highBet = highBet - 1;
                    }
                } else {
                    payout = payout + (wager / 2);
                    highBet = highBet - 1;
                }
            }

            if(oddBet !== 0) {
                if (loserCardRank !== winnerCardRank) {
                    if ((((winnerCardRank+1) % 2) === 1) && (((loserCardRank+1) % 2) === 0)) {
                        payout = payout + wager * 2;
                        oddBet = oddBet - 1;
                    } else if ((((winnerCardRank+1) % 2) === 0) && (((loserCardRank+1) % 2) === 1)) {
                        oddBet = oddBet - 1;
                    } else if (((((winnerCardRank+1) % 2) === 1) && (((loserCardRank+1) % 2) === 1)) || ((((winnerCardRank+1) % 2) === 0) && (((loserCardRank+1) % 2) === 0))) {
                        payout = payout + wager;
                    }
                } else {
                    payout = payout + (wager / 2);
                    oddBet = oddBet - 1;
                }
            }

            if(evenBet !== 0) {
                if (loserCardRank !== winnerCardRank) {
                    if ((((winnerCardRank+1) % 2) === 0) && (((loserCardRank+1) % 2) === 1)) {
                        payout = payout + wager * 2;
                        evenBet = evenBet - 1;
                    } else if ((((winnerCardRank+1) % 2) === 1) && (((loserCardRank+1) % 2) === 0)) {
                        evenBet = evenBet - 1;
                    } else if (((((winnerCardRank+1) % 2) === 1) && (((loserCardRank+1) % 2) === 1)) || ((((winnerCardRank+1) % 2) === 0) && (((loserCardRank+1) % 2) === 0))) {
                        payout = payout + wager;
                    }
                } else {
                    payout = payout + (wager / 2);
                    evenBet = evenBet - 1;
                }
            }
        }
        remainingCards = cards;
        result = {
            remainingCards: remainingCards,
            betCards : betCards,
            turnCards : turnCards,
            previousCards : previousCards,
            winnerCard : winnerCard,
            loserCard : loserCard,
            highBet : highBet,
            evenBet : evenBet,
            oddBet : oddBet,
            finished: finished,
            payout: payout

        };
        return result;
    };

    return this;
};
