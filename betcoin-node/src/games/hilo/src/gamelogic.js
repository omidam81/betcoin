'use strict';

var provable = require('../../../lib/provably-fair');
module.exports = function(HTTPError) {

    var GameLogic = function() {
        this.cardRanks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
        this.possibleBets = [
            "bigger",
            "smaller",
            "black",
            "red",
            "bigger_black",
            "smaller_black",
            "bigger_red",
            "smaller_red",
            "finish"
        ];
    };

    GameLogic.prototype.getUnshuffledCards = function(){
        var self = this;
        var cards = [];
        for(var index = 0; index < 13; index++){
            var card = {rank:self.cardRanks[index]};
            cards.push(card);
        }
        return cards;
    };

    GameLogic.prototype.makeCardSuits = function (cards, seed) {
        var suits = ['C','D','H','S'];
        var suitsToShuffle = [];
        //copy 3 times of the four suits, making the red and black color evenly.
        //this makes up the 12 cards
        for(var i=0;i<3;i++){
            suitsToShuffle = suitsToShuffle.concat(suits);
        }
        //determine the last color by using the first suit after shuffled by the seed
        // suitsToShuffle.push(provable.seededShuffle(seed, suits)[0]);
        //shuffle the suits before assigning them the cards
        var shuffledSuits = provable.seededShuffle(seed, suitsToShuffle);
        for(var cardIndex=0;cardIndex<cards.length;cardIndex++){
            cards[cardIndex].suit = shuffledSuits[cardIndex];
        }
        return cards;
    };

    GameLogic.prototype.getShuffledCards = function (seed) {
        var cards = this.getUnshuffledCards();
        cards = provable.seededShuffle(seed, cards);
        var shuffledCards = cards.splice(0,12);
        shuffledCards = this.makeCardSuits(shuffledCards, seed);
        return shuffledCards;
    };

    GameLogic.prototype.getGameOdds = function(remainingCards, previousCards) {
        var self = this;
        var colorPossibles = self.guessColorCardCount(previousCards);
        var comparePossibles = self.guessSmallerOrBiggerCount(previousCards);
        // add one more card count to make it up like 13 cards
        var remainingCardCount = remainingCards.length + 1;
        var biggerOdds = comparePossibles.bigger/remainingCardCount;
        var smallerOdds = comparePossibles.smaller/remainingCardCount;
        var blackOdds = colorPossibles.black/remainingCards.length;
        var redOdds = colorPossibles.red/remainingCards.length;
        var biggerBlackOdds = biggerOdds*blackOdds;
        var biggerRedOdds = biggerOdds*redOdds;
        var smallerBlackOdds = smallerOdds*blackOdds;
        var smallerRedOdds = smallerOdds*redOdds;

        var odds = {
            bigger: biggerOdds,
            smaller: smallerOdds,
            black: blackOdds,
            red: redOdds,
            bigger_black: biggerBlackOdds,
            bigger_red: biggerRedOdds,
            smaller_black: smallerBlackOdds,
            smaller_red: smallerRedOdds
        };
        return odds;
    };

    /*
      calculate the possible card counts of two colors based on the previous cards
    */
    GameLogic.prototype.guessColorCardCount = function(previousCards){
        var self = this;
        var possibles = {
            red: 6,
            black: 6
        };
        var colors = ['red','black'];
        for(var i=0;i<colors.length;i++){
            var color = colors[i];
            for(var card in previousCards){
                if(previousCards.hasOwnProperty(card)){
                    if(self.getCardColor(previousCards[card].suit) === color){
                        possibles[color]--;
                    }
                }
            }
        }
        return possibles;
    };

    /*
      calculate the possible card counts for bigger or smaller cards based on the previous cards
    */
    GameLogic.prototype.guessSmallerOrBiggerCount = function(previousCards){
        var self = this;
        var lastCard = previousCards[previousCards.length - 1];
        var lastCardValue = self.getCardValue(lastCard.rank);
        var possibles = {
            smaller: lastCardValue - 1,
            bigger: 13 - lastCardValue
        };
        for(var card in previousCards){
            if(previousCards.hasOwnProperty(card)){
                var compareCard = previousCards[card];
                var compareCardValue = self.getCardValue(compareCard.rank);
                if(compareCardValue < lastCardValue && possibles.smaller > 0){
                    possibles.smaller--;
                }
                if(compareCardValue > lastCardValue && possibles.bigger > 0){
                    possibles.bigger--;
                }
                if(lastCardValue === 1){
                    possibles.smaller = 0;
                }
                if(lastCardValue === 13){
                    possibles.bigger = 0;
                }
            }
        }
        return possibles;
    };

    GameLogic.prototype.getCardValue = function(rank) {
        return this.cardRanks.indexOf(rank) + 1;
    };

    GameLogic.prototype.getResult = function(cards, betType, wager, previousCards){
        var self = this;
        var newCard;
        var pickOrder;
        var nextGameOdds;
        var payoutGameOdds;
        var payout = 0;
        var possibleMultipliers;
        var finished = false;
        var type;
        previousCards = previousCards||[];
        // var payout = 0;
        if(cards.length === 12){
            pickOrder = betType[0];
            self.validPickOrder(pickOrder, cards.length);
            newCard = cards.splice(pickOrder-1,1);
            previousCards.push(newCard[0]);
        }else{
            type = betType[0];
            pickOrder = betType[1];
            self.validPickOrder(pickOrder, cards.length);
            //game odds used for the payout for the current round
            payoutGameOdds = self.getGameOdds(cards, previousCards);
            if(payoutGameOdds[type] === 1 || payoutGameOdds[type] === 0){
                throw new HTTPError(400, 'not allowed to bet on the 100% or 0% odds');
            }
            newCard = cards.splice(pickOrder-1,1)[0];
            previousCards.push(newCard);
            if(type === 'bigger'){
                if(self.getCardValue(newCard.rank) < self.getCardValue(previousCards[previousCards.length-2].rank)){
                    finished = true;
                }
            }
            if(type === 'smaller'){
                if(self.getCardValue(newCard.rank) > self.getCardValue(previousCards[previousCards.length-2].rank)){
                    finished = true;
                }
            }
            if(type === 'black'){
                if(self.getCardColor(newCard.suit) !== 'black'){
                    finished = true;
                }
            }
            if(type === 'red'){
                if(self.getCardColor(newCard.suit) !== 'red'){
                    finished = true;
                }
            }
            if(type === 'bigger_black'){
                if(self.getCardValue(newCard.rank) < self.getCardValue(previousCards[previousCards.length-2].rank)||self.getCardColor(newCard.suit) !== 'black'){
                    finished = true;
                }
            }
            if(type === 'bigger_red'){
                if(self.getCardValue(newCard.rank) < self.getCardValue(previousCards[previousCards.length-2].rank)||self.getCardColor(newCard.suit) !== 'red'){
                    finished = true;
                }
            }
            if(type === 'smaller_black'){
                if(self.getCardValue(newCard.rank) > self.getCardValue(previousCards[previousCards.length-2].rank)||self.getCardColor(newCard.suit) !== 'black'){
                    finished = true;
                }
            }
            if(type === 'smaller_red'){
                if(self.getCardValue(newCard.rank) > self.getCardValue(previousCards[previousCards.length-2].rank)||self.getCardColor(newCard.suit) !== 'red'){
                    finished = true;
                }
            }
            //check if lose
            if(!finished){
                payout = self.getPayout(wager, payoutGameOdds[type]);
            }
            //flag the game as finished if there are no more cards in dealer's hand
            if(cards.length === 0){
                finished = true;
            }
        }
        //game odds used for displaying the possible win amount for each bet type
        nextGameOdds = self.getGameOdds(cards, previousCards);

        if(finished && cards.length !== 0){
            payout = 0;
        }
        var hasValidOdds = false;
        for(var odds in nextGameOdds){
            if(nextGameOdds.hasOwnProperty(odds)){
                if(nextGameOdds[odds] !== 0 && nextGameOdds[odds] !== 1){
                    hasValidOdds = true;
                }
            }
        }
        //flag the game as finished when there are greater than 0% or less than 100% game odds for betting
        if(!hasValidOdds){
            finished = true;
        }
        if(!finished){
            // var amount = payout === 0? wager:payout;
            // possiblePayouts = self.getPossiblePayouts(nextGameOdds, amount);
            possibleMultipliers = self.getPossibleMultipliers(nextGameOdds);
        }
        var result = {
            remainingCards: cards,
            previousCards: previousCards,
            gameOdds: nextGameOdds,
            finished: finished,
            payout: payout,
            payoutGameOdds: payoutGameOdds,
            // possiblePayouts: possiblePayouts
            possibleMultipliers: possibleMultipliers
        };
        return result;
    };

    GameLogic.prototype.getPossiblePayouts = function(gameOdds, wager) {
        var self = this;
        var possiblePayouts = {};
        for(var oddType in gameOdds){
            if(gameOdds.hasOwnProperty(oddType)){
                var possiblePayout = self.getPayout(wager, gameOdds[oddType]);
                if(possiblePayout === 0){
                    possiblePayouts[oddType] = 0;
                }else{
                    possiblePayouts[oddType] = possiblePayout + wager;
                }
            }
        }
        return possiblePayouts;
    };

    GameLogic.prototype.getPossibleMultipliers = function(gameOdds) {
        var self = this;
        var possibleMultipliers = {};
        for(var oddType in gameOdds){
            if(gameOdds.hasOwnProperty(oddType)){
                var possibleMultiplier = self.getPayoutMultiplier(gameOdds[oddType]);
                if(possibleMultiplier === 0){
                    possibleMultipliers[oddType] = 0;
                }else{
                    possibleMultipliers[oddType] = possibleMultiplier;
                }
            }
        }
        return possibleMultipliers;
    };

    GameLogic.prototype.getPayout = function(wager, odds) {
        var self = this;
        var multiplier = self.getPayoutMultiplier(odds);
        var payout = Math.floor(wager*multiplier);
        return payout;
    };

    GameLogic.prototype.getPayoutMultiplier = function(odds) {
        var houseEdge = 0.0165;
        if(odds === 0 || !odds){
            return 0;
        }
        //so using the house edge calculation (payout * winning chance - wager * losing chance) = house edge,
        //we apply it to our payout multiplier formula -- >
        //(payout multipler) * wager * odds * x - (1 - odds) * wager = house edge, assuming wager is 1
        //use 1/odds to find the payout multiplier, the lower the chance of winning the higher multiplier
        //exclude the amount of the wager, that is the winning amount, and scale with the house edge
        // var x = houseEdge/(1-odds) + 1;
        // return (1/odds - 1)*x;
        var payout = 1 + (((houseEdge * -1) - odds + 1) / odds);
        return payout;
    };

    GameLogic.prototype.getCardColor = function(suit){
        if(['C','S'].indexOf(suit) === -1){
            return 'red';
        }
        return 'black';
    };

    GameLogic.prototype.validPickOrder = function(pickOrder, cardCount){
        if(typeof pickOrder !== 'number'){
            throw new HTTPError(400, "invalid pick order param");
        }
        if(pickOrder > cardCount || pickOrder <= 0){
            throw new HTTPError(400, "pick order should fall within in the card order range");
        }
        return true;
    };

    return GameLogic;
};
