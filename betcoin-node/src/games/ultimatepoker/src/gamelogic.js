'use strict';

var provable = require('../../../lib/provably-fair');

var g_cards = {
    c2  : { rank: 2, suit: 'c'},
    c3  : { rank: 3, suit: 'c'},
    c4  : { rank: 4, suit: 'c'},
    c5  : { rank: 5, suit: 'c'},
    c6  : { rank: 6, suit: 'c'},
    c7  : { rank: 7, suit: 'c'},
    c8  : { rank: 8, suit: 'c'},
    c9  : { rank: 9, suit: 'c'},
    c10 : { rank: 10, suit: 'c'},
    c11 : { rank: 11, suit: 'c'},
    c12 : { rank: 12, suit: 'c'},
    c13 : { rank: 13, suit: 'c'},
    c14 : { rank: 14, suit: 'c'},
    d2  : { rank: 2, suit: 'd'},
    d3  : { rank: 3, suit: 'd'},
    d4  : { rank: 4, suit: 'd'},
    d5  : { rank: 5, suit: 'd'},
    d6  : { rank: 6, suit: 'd'},
    d7  : { rank: 7, suit: 'd'},
    d8  : { rank: 8, suit: 'd'},
    d9  : { rank: 9, suit: 'd'},
    d10 : { rank: 10, suit: 'd'},
    d11 : { rank: 11, suit: 'd'},
    d12 : { rank: 12, suit: 'd'},
    d13 : { rank: 13, suit: 'd'},
    d14 : { rank: 14, suit: 'd'},
    h2  : { rank: 2, suit: 'h'},
    h3  : { rank: 3, suit: 'h'},
    h4  : { rank: 4, suit: 'h'},
    h5  : { rank: 5, suit: 'h'},
    h6  : { rank: 6, suit: 'h'},
    h7  : { rank: 7, suit: 'h'},
    h8  : { rank: 8, suit: 'h'},
    h9  : { rank: 9, suit: 'h'},
    h10 : { rank: 10, suit: 'h'},
    h11 : { rank: 11, suit: 'h'},
    h12 : { rank: 12, suit: 'h'},
    h13 : { rank: 13, suit: 'h'},
    h14 : { rank: 14, suit: 'h'},
    s2  : { rank: 2, suit: 's'},
    s3  : { rank: 3, suit: 's'},
    s4  : { rank: 4, suit: 's'},
    s5  : { rank: 5, suit: 's'},
    s6  : { rank: 6, suit: 's'},
    s7  : { rank: 7, suit: 's'},
    s8  : { rank: 8, suit: 's'},
    s9  : { rank: 9, suit: 's'},
    s10 : { rank: 10, suit: 's'},
    s11 : { rank: 11, suit: 's'},
    s12 : { rank: 12, suit: 's'},
    s13 : { rank: 13, suit: 's'},
    s14 : { rank: 14, suit: 's'}
};

var g_rankOrder = {
    five_of_a_kind: {rank : 1},
    royal_flush: {rank : 2},
    straight_flush: {rank : 3},
    four_of_a_kind: {rank : 4},
    full_house: {rank : 5},
    flush: {rank : 6},
    straight: {rank : 7},
    three_of_a_kind: {rank : 8},
    two_pairs: {rank : 9},
    one_pair: {rank : 10},
    no_pair: {rank : 11}
};

/**
 * Blind Bet Pay Table
 */
var blind_payout_multipliers = [
    -1,
    -1,
    500,     //royal flush
    50,     //straight flush
    10,     //four of a kind
    3,      //full house
    1.5,      //flush
    1,      //straight
    1,      //three of a kind
    0,      //two pairs
    0,      //one pair
    0       //no pair
];

/**
 * Trips Bet Pay Table
 */
var trips_payout_multipliers = [
    -1,
    -1,
    50,     //royal flush
    40,     //straight flush
    30,     //four of a kind
    9,      //full house
    7,      //flush
    4,      //straight
    3,      //three of a kind
    -1,      //two pairs
    -1,      //one pair
    -1       //no pair
];

var GameLogic = function () {};

/**
 * Sort card array by rank in asending order
 * @param cardArray
 * @returns {*}
 */
GameLogic.prototype.sortCards = function(cardArray) {
    cardArray.sort(function(a, b) {
        return +/\d+/.exec(a)[0] - +/\d+/.exec(b)[0];
    });
    return cardArray;
};

GameLogic.prototype.getCardRankArray = function(cardArray) {
    var cardRankArray = [];
    for (var key in cardArray) {
        if(cardArray.hasOwnProperty(key)){
            cardRankArray[key] = g_cards[cardArray[key]].rank;
        }
    }
    return cardRankArray;
};

/**
 This function is used to get Pair card ranks.

 arg cardArray The argument card array contains the sorted card values

 return JSON This contains the rank and an array which contains card ranks of the selected cards.
 **/
var checkForPair = function(cardArray, cardArrayOriginal) {
    var sortArrayValue = [];
    var sortCount = [];
    var rank = [];
    rank.actualArray = [];
    var count = 0;
    var equalFlag = false;
    for (var key in cardArray) {
        if (cardArray.length === parseInt(key) + 1 && equalFlag === true && count) {
            sortCount.push(count);
            sortArrayValue.push(cardArray[parseInt(key)]);
        } else if (cardArray[key] === cardArray[parseInt(key) + 1] && cardArray.length !== parseInt(key) + 1) {
            ++count;
            equalFlag = true;
        } else if (equalFlag === true) {
            sortCount.push(count);
            sortArrayValue.push(cardArray[parseInt(key)]);
            equalFlag = false;
            count = 0;
        }
    }

    var c, i, j;
    var actualPairArray = [];
    for(i = 0; i < sortCount.length; i++) {
        for (j = i + 1; j < sortCount.length; j++) {
            if (sortCount[i] < sortCount[j]) {
                c = sortCount[i];
                sortCount[i] = sortCount[j];
                sortCount[j] = c;
                c = sortArrayValue[i];
                sortArrayValue[i] = sortArrayValue[j];
                sortArrayValue[j] = c;
            } else if (sortCount[i] === sortCount[j] && sortArrayValue[i] < sortArrayValue[j]) {
                c = sortArrayValue[i];
                sortArrayValue[i] = sortArrayValue[j];
                sortArrayValue[j] = c;
            }
        }
        for (j = 0; j < cardArray.length; j++) {
            if (cardArray[j] === sortArrayValue[i]) {
                actualPairArray.push(cardArrayOriginal[j]);
            }
        }
    }

    rank = rankForPair(sortCount, sortArrayValue, actualPairArray);
    var restOfArray = [];
    for (i = 0; i < cardArray.length; i++) {
        if (rank.data.indexOf(cardArray[i]) === -1) {
            restOfArray.push(i);
        }
    }
    j = restOfArray.length - 1;
    i = rank.actualArray.length;
    rank.restofData = [];
    for (; i < 5; i++, j--) {
        rank.restofData.unshift(cardArray[restOfArray[j]]);
        rank.actualArray.push(cardArrayOriginal[restOfArray[j]]);
    }
    return rank;
};

/**
 This function is used to get the rank of each pair group.

 arg sortCount Contains the repeated count of each card
 arg sortArray Contains the repeated card values

 return JSON This contains the rank and an array which contains card ranks of the selected cards.
 **/
var rankForPair = function(sortCount, sortArray, actualPairArray) {
    var maxRepeatCout = Math.max.apply(null, sortCount);
    var rank = 0;

    if (sortCount.length === 0) {
        rank = g_rankOrder.no_pair.rank;
    } else if (maxRepeatCout === 4) {
        rank = g_rankOrder.five_of_a_kind.rank;
        sortArray = [sortArray[0]];
    } else if (maxRepeatCout === 3) {
        rank = g_rankOrder.four_of_a_kind.rank;
        sortArray = [sortArray[0]];
    } else if (maxRepeatCout === 2 && sortCount.length >= 2) {
        rank = g_rankOrder.full_house.rank;
        sortArray = [sortArray[0], sortArray[1]];
    } else if (maxRepeatCout === 2 && sortCount.length === 1) {
        rank = g_rankOrder.three_of_a_kind.rank;
    } else if (maxRepeatCout === 1 && sortCount.length >= 2) {
        rank = g_rankOrder.two_pairs.rank;
        sortArray = [sortArray[0], sortArray[1]];
    } else if (maxRepeatCout === 1) {
        rank = g_rankOrder.one_pair.rank;
    }
    var newActualPairArray = [];
    for(var i = 0; i < actualPairArray.length; i++) {
        if (sortArray.indexOf(g_cards[actualPairArray[i]].rank) !== -1) {
            newActualPairArray.push(actualPairArray[i]);
        }
    }
    return {
        rnk: rank,
        data: sortArray,
        actualArray: newActualPairArray.slice(0, 5)
    };
};

var getCardRankArray = function(cardArray) {
    var cardRankArray = [];
    for (var key in cardArray) {
        if(cardArray.hasOwnProperty(key)){
            cardRankArray[key] = g_cards[cardArray[key]].rank;
        }
    }
    return cardRankArray;
};


/**
 This function is used to check whether the cards are Royal/Straight flush. If the sum of cards are 60 then it is Royal Flush otherwise it is straight flush.
 arg cardArray The argument card array contains the sorted card values

 return JSON This contains the rank and an array which contains card ranks of the selected cards.
 **/
var getStraightFlushRank = function(cardArray, aceAsOne) {
    var straightFlush;
    var status = false;
    for (var i = cardArray.length - 1; i >= 4; i--) {
        var j = i;
        var k = i - 1;
        var count = 0;
        straightFlush = [];
        straightFlush.push(cardArray[i]);
        while (k >= 0) {
            var rankk = g_cards[cardArray[k]].rank;
            var rankj = g_cards[cardArray[j]].rank;
            if (aceAsOne) {
                if (rankk === 14) {
                    rankk = 1;
                }
                if (rankj === 14) {
                    rankj = 1;
                }
            }
            if (rankk + 1 === rankj && g_cards[cardArray[k]].suit === g_cards[cardArray[j]].suit) {
                count++;
                j = k;
                straightFlush.push(cardArray[k]);
                if (count >= 4) {
                    status = true;
                    break;
                }
            }
            k--;
        }
        if (status) {
            break;
        }
    }

    if (status) {
        var cardRankArray = getCardRankArray(straightFlush.reverse());
        if (cardRankArray[0] === 14) {
            cardRankArray = [2, 3, 4, 5, 14];
        }

        var totalSum = cardRankArray[0] + cardRankArray[1] + cardRankArray[2] + cardRankArray[3] + cardRankArray[4];
        var rank = totalSum === 60 ? g_rankOrder.royal_flush.rank : g_rankOrder.straight_flush.rank;
        return {
            rnk: rank,
            data: cardRankArray,
            restofData: [],
            actualArray: straightFlush
        };
    }
    return false;
};

/**
 This function is used to get flush card ranks.

 arg cardArray The argument card array contains the sorted card values

 return JSON This contains the rank and an array which contains card ranks of the selected cards.
 **/
var getFlushRank = function(cardArray) {
    var suits = {};
    for (var i = 0; i < cardArray.length; i++) {
        if (!suits[g_cards[cardArray[i]].suit]) {
            suits[g_cards[cardArray[i]].suit] = 0;
        }
        suits[g_cards[cardArray[i]].suit]++;
    }
    for (var s in suits) {
        if (suits[s] >= 5) {
            var rank = g_rankOrder.flush.rank;
            var flush = [];
            for (i = cardArray.length - 1; i >= 0; i--) {
                if (g_cards[cardArray[i]].suit === s) {
                    flush.push(cardArray[i]);
                    if (flush.length === 5) {
                        break;
                    }
                }
            }
            var cardRankArray = getCardRankArray(flush);

            return {
                rnk: rank,
                data: cardRankArray.reverse(),
                restofData: [],
                actualArray: flush
            };
        }
    }

    return false;
};

/**
 This function is used to get flush card ranks.

 arg cardArray The argument card array contains the sorted card values

 return JSON This contains the rank and an array which contains card ranks of the selected cards.
 **/
var getStraightRank = function(cardArray, aceAsOne) {
    var straight;
    for (var i = cardArray.length - 1; i >= 4; i--) {
        var j = i;
        var k = i - 1;
        straight = [cardArray[i]];
        while (k >= 0) {
            var rankk = g_cards[cardArray[k]].rank;
            var rankj = g_cards[cardArray[j]].rank;
            if (aceAsOne) {
                if (rankk === 14) {
                    rankk = 1;
                }
                if (rankj === 14) {
                    rankj = 1;
                }
            }
            if (rankk + 1 === rankj) {
                j = k;
                straight.push(cardArray[k]);
                if (straight.length === 5) {
                    break;
                }
            }
            k--;
        }
        if (straight.length === 5) {
            break;
        }
    }

    if (straight.length === 5) {
        var cardRankArray = getCardRankArray(straight.reverse());
        if (cardRankArray[0] === 14) {
            cardRankArray = [2, 3, 4, 5, 14];
        }

        var rank = g_rankOrder.straight.rank;
        return {
            rnk: rank,
            data: cardRankArray,
            restofData: [],
            actualArray: straight
        };
    }

    return false;
};

var sortArray = function(cardArray) {
    cardArray.sort(function(a, b) {
        return +/\d+/.exec(a)[0] - +/\d+/.exec(b)[0];
    });
    return cardArray;
};

var checkForAce = function(cardArray) {
    var status = false;
    if (g_cards[cardArray[cardArray.length - 1]].rank === 14) {
        status = true;
    }
    return status;
};

/**
 * This function is used to find the Five card rank.
 * Then do a simple checking to understand it is straight , flush.
 * If both the it will be Royal/Straight flush. So call the curresponding function by passing the arguments.
 * If it is only flush then call the flush function. Else call the Straight function.
 * Otherwise do a call for checking for Pair.
 * @param cardArray The argument card array contains the sorted card values
 * @returns {Hash} This contains the rank and an array which contains card ranks of the selected cards.
 */
var checkRankingGroups = function(cardArray) {
    var rank = [];
    cardArray = sortArray(cardArray);
    var acePresent = checkForAce(cardArray);
    var cardArrayWithOne;
    if (acePresent) {
        cardArrayWithOne = [];
        for (var i = 0; i < cardArray.length; i++) {
            cardArrayWithOne.push(cardArray[i].replace("14", "1"));
        }
        cardArrayWithOne = sortArray(cardArrayWithOne);
        for (i = 0; i < cardArrayWithOne.length; i++) {
            cardArrayWithOne[i] = cardArrayWithOne[i].replace(/^(.)(1)$/, '$114');
        }
    }

    rank = getStraightFlushRank(cardArray);
    if (rank) {
        return rank;
    }
    if (acePresent) {
        rank = getStraightFlushRank(cardArrayWithOne, true);
        if (rank) {
            return rank;
        }
    }
    var cardArrayRanks = getCardRankArray(cardArray);
    rank = checkForPair(cardArrayRanks, cardArray);

    if (rank.rnk > g_rankOrder.full_house.rank) {
        var rankFlush = getFlushRank(cardArray);
        if (rankFlush) {
            return rankFlush;
        }

        var rankStraight = getStraightRank(cardArray);
        if (rankStraight) {
            return rankStraight;
        }
        if (acePresent) {
            rankStraight = getStraightRank(cardArrayWithOne, true);
            if (rankStraight) {
                return rankStraight;
            }
        }
    }

    return rank;
};

var compareRank = function(playerData, dealerData) {
    var dataLength = playerData.length;
    var status = "equal";
    for (var key = dataLength - 1; key >= 0; --key) {
        if (dealerData[key] > playerData[key]) {
            status = "dealer";
            break;
        }
        if (dealerData[key] < playerData[key]) {
            status = "player";
            break;
        }
    }
    return status;
};

var getCardResult = function(hand, community) {
    for (var i = 0; i < community.length; i++) {
        hand.push(community[i]);
    }
    return checkRankingGroups(hand);
};

GameLogic.prototype.getCardResult = getCardResult;


var getCardResultText = function(dealerRankObj, g_playerRankObj) {
    var status = '';
    if (g_playerRankObj.rnk < dealerRankObj.rnk) {
        status = "player";
    } else if (g_playerRankObj.rnk > dealerRankObj.rnk) {
        status = "dealer";
    } else {
        status = compareRank(g_playerRankObj.data, dealerRankObj.data);
        if (status === 'equal') {
            status = compareRank(g_playerRankObj.restofData, dealerRankObj.restofData);
        }
    }
    return status;
};
GameLogic.prototype.getCardResultText = getCardResultText;

/**
 * Check whether dealer cards is qualified or not
 * The lowest qualifying hand is ace, king, 4, 3, 2
 * The highest non-qualifying hand is ace, queen, jack, 10, 9
 * @param dealerRankObj
 * @returns {boolean}
 */
GameLogic.prototype.isDealerOpens = function(dealerRankObj) {
    var maxNonQualifyingCards = getCardResult(['s14','s13','s12','s11','h9'], []);
    var resultText = this.getCardResultText(dealerRankObj, maxNonQualifyingCards);
    return (resultText === 'dealer') ? true:false;
};

GameLogic.prototype.parseHandCards = function(cards){
    var newFormat = [];
    for(var card in cards){
        if(cards.hasOwnProperty(card)){
            var rank = cards[card].rank;
            var value = this.getValue(rank) + 2;
            newFormat.push(cards[card].suit.toLowerCase() + value);
        }
    }
    return newFormat;
};

GameLogic.prototype.standardizeHandCards = function(cards){
    var newFormat = [];
    for(var card in cards){
        if(cards.hasOwnProperty(card)){
            var rank = this.getRank(parseInt(cards[card].substring(1)));
            newFormat.push({rank:rank, suit: cards[card][0].toUpperCase()});
        }
    }
    return newFormat;
};

var ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
GameLogic.prototype.getValue = function(rank) {
    var value = ranks.indexOf(rank);
    if(value !== -1){
        return value;
    }
};

GameLogic.prototype.getRank = function(value) {
    var rank = ranks[value - 2];
    return rank;
};

GameLogic.prototype.getPayouts = function(bets, rank, isWin, isPush, isFold, dealerOpens) {
    var payouts = {
        total: 0,
        ante: 0,
        blind: 0,
        trips: 0,
        play: 0
    };
    var multiplier = {
        ante: 0,
        blind: 0,
        trips: 0,
        play: 0
    };

    if (!isFold) {
        if (isWin) {
            if (dealerOpens) {
                multiplier.ante = 2;
            } else {
                multiplier.ante = 1;
            }
            multiplier.play = 2;
            multiplier.blind = 1 + blind_payout_multipliers[rank];
        } else if (isPush) {
            multiplier.ante = 1;
            multiplier.blind = 1;
            multiplier.play = 1;
        } else {
            if (!dealerOpens) {
                multiplier.ante = 1;
            }
        }
        multiplier.trips = 1 + trips_payout_multipliers[rank];
    }
    console.log(multiplier);
    var total = 0;
    for(var i in multiplier) {
        if (multiplier.hasOwnProperty(i) && bets.hasOwnProperty(i) && bets[i]) {
            payouts[i] = multiplier[i] * bets[i];
            total += payouts[i];
        }
    }

    payouts.total = total;
    return payouts;
};

/**
 * Returns game result for dealer and player hands according to the game rule
 * @param dealerHand
 * @param playerHand
 * @param finalArray
 * @param bets | { ante: number, blind: number, trips: number, play: number }
 * @param action | "check"/"raise"/"fold"
 * @params status | "began", "three", "five"
 * @returns {{cardsResult: *, dealerHand: *, playerHand: *, communityHand: *, isWin: boolean, isPush: boolean, isFold: boolean, payout: number, payouts: *}}
 */
GameLogic.prototype.getResult = function(dealerHand, playerHand, finalArray, bets, action, status){
    var ret = {
        status: 'began',
        isWin: false,
        isPush: false,
        isFold: false,
        playerHand: playerHand,
        dealerHand: dealerHand
    };
    var n = dealerHand.initCards.length + playerHand.initCards.length + 1; //player, dealer, player, dealer, burn
    var communityHandCount = 3;
    if (status === 'began') {
        if (action === 'raise') {
            communityHandCount = 5;
            ret.status = 'finished';
        } else {
            communityHandCount = 3;
            ret.status = 'three';
        }
    } else if (status === 'three') {
        communityHandCount = 5;
        if (action === 'raise') {
            ret.status = 'finished';
        } else {
            ret.status = 'five';
        }
    } else if (status === 'five') {
        ret.status = 'finished';
        if (action === 'raise') {
            communityHandCount = 5;
        } else {
            ret.isFold = true;
            communityHandCount = 5;
        }
    }

    ret.communityHand = [];
    for (var i = 0; i < communityHandCount; i++) {
        if (i >= 3) {
            n++; //3 community cards, burn, 1 community card, burn, 1 community card
        }
        ret.communityHand.push(finalArray[n++]);
    }

    if (ret.isFold) {
        ret.isWin = false;
        ret.isPush = false;
        ret.payouts = this.getPayouts(bets, null, ret.isWin, ret.isPush, ret.isFold, false);
    } else if (ret.status === 'finished') {
        var communityHands = this.parseHandCards(ret.communityHand);
        var dealerInitCards = dealerHand.initCards;
        dealerHand = this.getCardResult(this.parseHandCards(dealerInitCards), communityHands);
        var playerInitCards = playerHand.initCards;
        playerHand = this.getCardResult(this.parseHandCards(playerInitCards), communityHands);

        var dealerOpens = this.isDealerOpens(dealerHand);
        dealerHand.opens = dealerOpens;

        var result = this.getCardResultText(dealerHand, playerHand);

        if (result === 'player') {
            ret.isWin = true;
        } else if (result === 'dealer') {
            ret.isWin = false;
        } else {
            ret.isPush = true;
        }
        ret.payouts = this.getPayouts(bets, playerHand.rnk, ret.isWin, ret.isPush, ret.isFold, dealerOpens);

        playerHand.initCards = playerInitCards;
        dealerHand.initCards = dealerInitCards;
        playerHand.sub_rnk = this.getGameSubRank(playerHand);
        dealerHand.sub_rnk = this.getGameSubRank(dealerHand);
        ret.cardsResult = result;
        ret.dealerHand = dealerHand;
        ret.playerHand = playerHand;
    }

    return ret;
};

GameLogic.prototype.getGameSubRank = function(handRnkObj) {
    if (handRnkObj.rnk === g_rankOrder.no_pair.rank) {
        return handRnkObj.restofData[4];
    }
    if (handRnkObj.rnk === g_rankOrder.one_pair.rank) {
        return handRnkObj.data[0];
    }
    return 0;
};

GameLogic.prototype.getUnshuffledCards = function(){
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
    //cards.push({rank:'JO'});
    return cards;
};

GameLogic.prototype.getCardRank = function(order) {
    var cards = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K","A","JO"];
    return cards[order];
};

GameLogic.prototype.getCardSuit = function(order) {
    var suits = ["C", "D", "H", "S"];
    return suits[order];
};

GameLogic.prototype.getShuffledCards = function(seed, cards) {
    return provable.seededShuffle(seed, cards);
};

GameLogic.prototype.initHands = function(seed) {
    var unshuffledCards = this.getUnshuffledCards();
    var cards = this.getShuffledCards(seed, unshuffledCards);
    var allCards = cards.slice();
    var playerCards = [];
    var dealerCards = [];

    var n = 0;
    for(var i=0;i<2;i++){
        playerCards.push(cards[n++]);
        dealerCards.push(cards[n++]);
    }
    return {
        playerCards: playerCards,
        dealerCards: dealerCards,
        allCards: allCards
    };
};

GameLogic.prototype.getHouseEdge = function(){
    return 0.021;
};

module.exports = GameLogic;

