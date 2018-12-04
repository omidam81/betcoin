'use strict';
var HTTPError = require('httperror-npm');
var provable = require('provably-fair-npm');

module.exports = function() {
    var self = this;

    this.getUnshuffledCards = function(){
        var cards = [];
        for(var deck=0;deck<8;deck++){
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
        }
        return cards;
    };

    this.getCardRank = function(order) {
        var cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
        return cards[order];
    };

    this.getCardSuit = function(order) {
        var suits = ["C", "D", "H", "S"];
        return suits[order];
    };

    this.getShuffledCards = function(seed, cards) {
        return provable.seededShuffle(seed, cards);
    };

    this.initHands = function(seed, wager, player) {
        var cards = self.getShuffledCards(seed, self.getUnshuffledCards());
        var allCards = cards.slice();
        var playerCards = [];
        var dealerCards = [];
        var playerHand = {};
        var dealerHand = {};
        //deal two cards
        for(var i=0;i<2;i++){
            playerCards.push(cards.pop());
            dealerCards.push(cards.pop());
        }
        playerHand.cards = playerCards;
        playerHand.score = self.getScore(playerCards);
        playerHand.gameOptions = self.analyseGameOptions(playerCards, undefined, wager, player);
        dealerHand.cards = dealerCards;
        return {
            playerHands: [playerHand],
            dealerHand: dealerHand,
            remainingCards: cards,
            allCards: allCards
        };
    };

    /*
    * process the current game decision for one player hand's cards
     */
    this.getHandResult = function(playerCards, dealerCards, remainingCards, betType, wager) {
        var result = {};
        var dealerResult = {};
        var playerResult = self.dealCardToPlayer(playerCards, remainingCards, betType);
        if(playerResult.finished === true && !self.isBlackJack(playerCards) && !playerResult.busted){
            dealerResult = self.dealCardsToDealer(dealerCards, remainingCards);
        }
        
        // result.gameOptions = playerResult.playerCards;
        result.playerHands = playerResult.playerHands;
        result.dealerCards = dealerResult.dealerCards || dealerCards;
        result.remainingCards = dealerResult.remainingCards || playerResult.remainingCards;
        result.playerBusted = playerResult.busted || false;
        result.dealerBusted = dealerResult.busted || false;
        result.finished = playerResult.finished;
        result.playerScore = self.getScore(result.playerHands[0]);

        if(result.finished){
            result.dealerScore = self.getScore(result.dealerCards);
            var compareResult = self.getPayout(result.playerHands[0], result.dealerCards, wager);
            result.payout = compareResult.payout;
            result.isWin = compareResult.isWin;
            result.isPush = compareResult.isPush;
        }
        return result;
    };

    this.dealCardToPlayer = function(playerCards, remainingCards, betType, handsCount){
        var result = {};
        var isBlackJack = self.isBlackJack(playerCards);
        var gameOptions = self.analyseGameOptions(playerCards, handsCount);
        if(betType === undefined){
            betType = 'init';
        }
        if(!gameOptions[betType] && !isBlackJack && betType !== 'init'){
            throw new HTTPError(400, 'bet type '+betType+' for this game decision is not allowed. Allowed options are:' + JSON.stringify(gameOptions));
        }
        if(isBlackJack){
            // result.payout = self.getPayout(playerCards, dealerCards, wager);
            result.finished = true;
        }else{
            if(betType === 'hit'){
                result = self.hit(playerCards, remainingCards);
                if(result.score >= 21){
                    result.finished = true;
                }else{
                    result.finished = false;
                }
            }
            if(betType === 'stand'){
                result.finished = true;
            }
            if(betType === 'double'){
                result = self.hit(playerCards, remainingCards);
                result.finished = true;
            }
            if(betType === 'split'){
                var firstHand = self.hit([playerCards[0]], remainingCards);
                var secondHand = {playerCards: [playerCards[1]]};
                if(playerCards[0].rank === 'A'){
                    secondHand = self.hit(secondHand.playerCards, firstHand.remainingCards);
                }else if(self.isBlackJack(firstHand.playerCards)){
                    //if the first hand is blackjack then deal two cards to second hand
                    secondHand = self.hit(secondHand.playerCards, firstHand.remainingCards);
                }
                result = {
                    playerHands: [firstHand.playerCards, secondHand.playerCards],
                    finished: playerCards[0].rank === 'A'?true:false
                };
            }
        }
        playerCards = result.playerCards || playerCards;
        if(!result.playerHands){
            result.playerHands = [playerCards];
        }
        if(!result.busted){
            result.busted = false;
        }
        result.remainingCards = result.remainingCards || remainingCards;

        return result;
    };

    this.dealCardsToDealer = function(dealerCards, remainingCards){
        var result = self.stand(dealerCards, remainingCards);
        return result;
    };

    this.getResult = function(params) {
        var playerHands = params.playerHands;
        var dealerHand = params.dealerHand;
        var remainingCards = params.remainingCards;
        var player = params.player;
        var wager = params.wager;
        var newHand, playerHand, type, compareResult;
        if(playerHands.length === 1){
            playerHand = playerHands[0];
            if(playerHand.betHistory && playerHand.betHistory.length !== 0){
                type = playerHand.betHistory[playerHand.betHistory.length - 1];
            }
            var handResult = self.getHandResult(playerHand.cards, dealerHand.cards, remainingCards, type, playerHand.wager);
            remainingCards = handResult.remainingCards;
            dealerHand.cards = handResult.dealerCards;
            dealerHand.busted = handResult.dealerBusted;
            dealerHand.score = handResult.dealerScore;

            if(handResult.playerHands.length === 1){
                newHand = {};
                newHand.cards = handResult.playerHands[0];
                newHand.busted = handResult.playerBusted;
                newHand.score = handResult.playerScore;
                newHand.payout = handResult.payout;
                newHand.finished = handResult.finished;
                newHand.isBlackJack = self.isBlackJack(newHand.cards);
                newHand.gameOptions = self.analyseGameOptions(newHand.cards, undefined, wager, player);
                newHand.wager = playerHand.wager;
                newHand.betHistory = playerHand.betHistory;
                playerHands[0] = newHand;
            }
            //calculate for the splitted hands
            if(handResult.playerHands.length === 2){
                for(var i in handResult.playerHands){
                    if(handResult.playerHands.hasOwnProperty(i)){
                        newHand = {};
                        newHand.cards = handResult.playerHands[i];
                        newHand.busted = self.isBusted(newHand.cards);
                        newHand.score = self.getScore(newHand.cards);
                        newHand.wager = playerHand.wager;
                        newHand.gameOptions = self.analyseGameOptions(newHand.cards, 2, wager, player);
                        //if it is blackjack after the split, mark this hand finished
                        newHand.isBlackJack = self.isBlackJack(newHand.cards);
                        newHand.finished = newHand.isBlackJack || handResult.finished;
                        playerHands[i] = newHand;
                    }
                }
                //payout if both hand finished
                if(playerHands[0].finished && playerHands[1].finished){
                    compareResult = self.getPayout(playerHands[0].cards, dealerHand.cards, playerHands[0].wager);
                    playerHands[0].payout = compareResult.payout;
                    playerHands[0].isWin = compareResult.isWin;
                    playerHands[0].isPush = compareResult.isPush;
                    compareResult = self.getPayout(playerHands[1].cards, dealerHand.cards, playerHands[1].wager);
                    playerHands[1].payout = compareResult.payout;
                    playerHands[1].isWin = compareResult.isWin;
                    playerHands[1].isPush = compareResult.isPush;
                }
            }
        }else{
            //handle split hand
            //iterate the two hands and process the first hand not finished yet based on the bet
            for(var j in playerHands){
                if(playerHands.hasOwnProperty(j)){
                    playerHand = playerHands[j];
                    if(playerHand.finished){
                        continue;
                    }
                    if(!playerHand.betHistory || playerHand.betHistory.length === 0){
                        type = 'hit';
                    }else{
                        type = playerHand.betHistory[playerHand.betHistory.length - 1];
                    }
                    var playerResult = self.dealCardToPlayer(playerHands[j].cards, remainingCards, type, 2);
                    remainingCards = playerResult.remainingCards;
                    playerHands[j].cards = playerResult.playerHands[0];
                    playerHands[j].busted = self.isBusted(playerHands[j].cards);
                    playerHands[j].score = self.getScore(playerHands[j].cards);
                    playerHands[j].finished = playerResult.finished;
                    playerHands[j].isBlackJack = self.isBlackJack(playerHands[j].cards);
                    playerHands[j].gameOptions = self.analyseGameOptions(playerHands[j].cards, 2, wager, player);
                    if(playerHands[j].finished){
                        continue;
                    }
                    break;
                }
            }
        }

        var allFinished = true;
        var allBusted = true;
        var allBlackJack = true;
        for(var k in playerHands){
            if(playerHands.hasOwnProperty(k)){
                if(playerHands[k].busted !== true){
                    allBusted = false;
                }
                if(!self.isBlackJack(playerHands[k].cards)){
                    allBlackJack = false;
                }
                if(!playerHands[k].finished){
                    //make sure the hand has the game state
                    playerHands[k].finished = false;
                    //global game state
                    allFinished = false;
                    continue;
                }
            }
        }
        var totalPayout = 0;
        //deal cards to dealer's hand
        if(allFinished){
            //deal new cards for dealer if not all the hands busted
            if(!allBusted && !allBlackJack){
                var dealerResult = self.dealCardsToDealer(dealerHand.cards, remainingCards);
                dealerHand.cards = dealerResult.dealerCards;
                dealerHand.busted = dealerResult.busted;
                dealerHand.score = dealerResult.score;
                remainingCards = dealerResult.remainingCards;
            }
            for(var l=0;l<playerHands.length;l++){
                compareResult = self.getPayout(playerHands[l].cards, dealerHand.cards, playerHands[l].wager, type);
                playerHands[l].payout = compareResult.payout;
                playerHands[l].isWin = compareResult.isWin;
                playerHands[l].isPush = compareResult.isPush;
                if(typeof playerHands[l].payout === 'number'){
                    totalPayout += playerHands[l].payout;
                }
            }
            dealerHand.score = self.getScore(dealerHand.cards);
            dealerHand.isBlackJack = self.isBlackJack(dealerHand.cards);
        }else{
            var tmpCards = dealerHand.cards.slice();
            dealerHand.score = self.getScore(tmpCards.splice(dealerHand.cards.length - 2, 1));
        }


        return {
            playerHands: playerHands,
            dealerHand: dealerHand,
            remainingCards: remainingCards,
            allFinished: allFinished,
            totalPayout: totalPayout
        };
    };

    this.getPayout = function(playerCards, dealerCards, wager, type) {
        var compare = self.compare(playerCards, dealerCards);
        var payout = 0;
        if(compare === 1){
            if(self.isBlackJack(playerCards)){
                payout = 2.5*wager;
            }else{
                payout = 2*wager;
            }
        }
        if(compare === 0){
            payout = wager;
        }
        if(payout > 0 && type === 'double'){
            payout *= 2;
        }
        return {
            payout: payout,
            isWin: compare === 1?true:false,
            isPush: compare === 0?true:false
        };
    };

    this.analyseGameOptions = function(playerCards, handsCount, wager, player) {
        var double = false, split = false, hit = true, stand = true;
        if(playerCards.length === 2){
            var firstCardPoint = self.getPoint(playerCards[0].rank);
            var secondCardPoint = self.getPoint(playerCards[1].rank);
            if(firstCardPoint === secondCardPoint){
                split = true;
                // if(playerCards[0].rank === 'A'){
                //     split = false;
                // }
            }
        }
        if(self.getScore(playerCards) === 10 || self.getScore(playerCards) === 11){
            double = true;
        }
        if(self.isBlackJack(playerCards) === true){
            double = false;
            split = false;
            hit = false;
            stand = false;
        }
        if(self.getScore(playerCards) > 21){
            double = false;
            split = false;
            hit = false;
            stand = false;
        }
        if(handsCount > 1){
            double = false;
            split = false;
        }
        if (player && player.balance.btc < wager) {
            double = false;
            split = false;
        }
        return {
            hit: hit,
            stand: stand,
            double: double,
            split: split
        };
    };

    this.isBlackJack = function(playerCards) {
        var score = self.getScore(playerCards);
        if(score === 21 && playerCards.length === 2){
            return true;
        }
        return false;
    };

    this.stand = function(dealerCards, remainingCards) {
        var busted = false;
        var score = 0;
        var soft = false;
        var hasAce = false;
        for(var dealNextCard = true;dealNextCard;) {
            score = self.getScore(dealerCards);
            //deal more cards for soft 17
            if(!soft){
                for(var card in dealerCards){
                    if(dealerCards.hasOwnProperty(card)){
                        if(dealerCards[card].rank === 'A'){
                            hasAce = true;
                        }
                    }
                }
                if(hasAce && score === 17){
                    dealerCards.push(remainingCards.pop());
                    soft = true;
                    continue;
                }
            }
            if(score >= 17){
                dealNextCard = false;
            }
            if(dealNextCard){
                dealerCards.push(remainingCards.pop());
            }
        }
        busted = self.isBusted(dealerCards);
        return {
            dealerCards: dealerCards,
            remainingCards: remainingCards,
            score: score,
            busted: busted
        };
    };

    this.hit = function(playerCards, remainingCards) {
        playerCards.push(remainingCards.pop());
        return {
            score: self.getScore(playerCards),
            playerCards: playerCards,
            remainingCards: remainingCards,
            busted: self.isBusted(playerCards)
        };
    };

    this.isBusted = function(cards) {
        var score = self.getScore(cards);
        if(score > 21){
            return true;
        }
        return false;
    };
    
    /*
    return 1 for win, -1 for lose, 0 for push
     */
    this.compare = function(playerCards, dealerCards) {
        var playerScore = 0;
        var dealerScore = 0;
        playerScore = self.getScore(playerCards);
        dealerScore = self.getScore(dealerCards);

        if(playerScore > 21){
            return -1;
        }
        if(dealerScore > 21){
            return 1;
        }
        if(playerScore > dealerScore){
            return 1;
        }
        if(playerScore < dealerScore){
            return -1;
        }
        if(playerScore === dealerScore){
            if(playerScore === 21){
                //blackjack push
                if(playerCards.length === 2 && dealerCards.length === 2){
                    return 0;
                }
                //player blackjack win
                if(playerCards.length === 2){
                    return 1;
                }
                //dealer blackjack lose
                if(dealerCards.length === 2){
                    return -1;
                }
            }
            return 0;
        }
    };

    this.getPoint = function(rank) {
        var tenPointRanks = ['T','J','Q','K'];
        if(tenPointRanks.indexOf(rank) !== -1){
            return 10;
        }
        if(rank === 'A'){
            return 1;
        }
        return parseInt(rank);
    };

    this.getScore = function(cards) {
        var totalScore = 0;
        var aceTimes = 0;
        var card;
        //count the number of aces, and determine it is either 1 or 11 based on the total score
        for(card in cards){
            if(cards.hasOwnProperty(card)){
                if(cards[card].rank === 'A'){
                    aceTimes++;
                }
            }
        }
        //count for the non ace cards
        for(card in cards){
            if(cards.hasOwnProperty(card)){
                var point = self.getPoint(cards[card].rank);
                if(point !== 1){
                    totalScore += point;
                }
            }
        }
        var possibleScores = [];
        //determine the ace should be either 1 or 11 
        for(var i=0;i<aceTimes;i++){
            if(possibleScores.length === 0){
                possibleScores.push(1);
                possibleScores.push(11);
                continue;
            }
            var tmpScores = possibleScores.slice();
            for(var p=0;p<tmpScores.length;p++){
                var possibleScore = tmpScores[p];
                possibleScore += 1;
                possibleScores.push(possibleScore);
                possibleScore = tmpScores[p];
                possibleScore += 11;
                possibleScores.push(possibleScore);
                possibleScores.shift();
            }
        }
        possibleScores.sort(function(a, b){
            return a - b;
        });
        var aceUsed = false;
        for(var j=possibleScores.length-1;j>=0;j--){
            var score = possibleScores[j] + totalScore;
            // console.log(possibleScores[j], totalScore);
            if(score > 21){
                continue;
            }
            totalScore = score;
            aceUsed = true;
            break;
        }
        if(aceTimes > 0 && !aceUsed){
            totalScore += aceTimes;
        }
        return totalScore;
    };
    return self;
};
