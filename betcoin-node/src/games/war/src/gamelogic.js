'use strict';
var GameLogic = function() {
};

GameLogic.prototype.isTie = function(params) {
    var dealerCardNumber = getCardNumber(params.finalArray[0]);
    var playerCardNumber = getCardNumber(params.finalArray[1]);
    if(dealerCardNumber === playerCardNumber){
        return true;
    }
    return false;
};
/**
 * params.wager is the origin wager.
 */
GameLogic.prototype.getPayouts = function(params) {
    var payoutsum = 0;
    var result = params.finalArray;
    var dealerFirstCardNumber = getCardNumber(result[0]);
    var playerFirstCardNumber = getCardNumber(result[1]);
    var dealerSecondCardNumber = getCardNumber(result[5]);
    var playerSecondCardNumber = getCardNumber(result[6]);
    // since wager doubles on gotoWar, we must use different payout logic for ties
    if(dealerFirstCardNumber === playerFirstCardNumber) {
        if(params.gotoWar === true) { // wager has been doubled
            if(params.isTieBet) {
                payoutsum += params.wager/3 * 10 + params.wager/3;
                if(dealerSecondCardNumber < playerSecondCardNumber || dealerSecondCardNumber === playerSecondCardNumber){
                    payoutsum += (params.wager/3* 2)+params.wager/3; // player wins 2x on raise wager only when going to war
                }
            } // regardless of go to war or surrender, player wins 10x on tie, 5x of original wager
            else if(dealerSecondCardNumber < playerSecondCardNumber || dealerSecondCardNumber === playerSecondCardNumber){
                payoutsum += params.wager+params.wager/2; // player wins 2x on the raise wager only when going to war
            }
        } else { // surrender
            if(params.isTieBet) { payoutsum += params.wager/2 * 10 + params.wager/2; payoutsum += params.wager/4; } // regardless of go to war or surrender, player wins 10x on tie
            else {
                payoutsum += params.wager/2; // surrender pays out 50% of original wager
            }
        }
    } else if(dealerFirstCardNumber < playerFirstCardNumber){ // player's first card is higher
         // player wins twice the initial wager if their card is higher
        if(params.isTieBet) {
            payoutsum += params.wager; // player loses the amount of wager if they tie bet, so the total winnings are 1x
        } else {
            payoutsum += params.wager * 2;
        }
    }

    return payoutsum;
};

var getCardNumber = function(card) {
    var ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

    return parseInt(ranks.indexOf(card.rank));
};

module.exports = GameLogic;