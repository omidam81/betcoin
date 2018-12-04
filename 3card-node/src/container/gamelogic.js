'use strict';

//var HTTPError = require('httperror-npm');
var provable = require('provably-fair-npm');

module.exports = function() {
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
        royal_flush: {rank : 1},
        straight_flush: {rank : 2},
        three_of_a_kind: {rank : 3},
        straight: {rank : 4},
        flush: {rank : 5},
        one_pair: {rank : 6},
        no_pair: {rank : 7}
    };

    /**
     * Ante Bet Bonus pay table
     */
    var ante_payout_multipliers = [
        0,
        5,     //mini royal flush
        5,     //straight flush
        4,      //three of a kind
        1,      //straight
        0,      //flush
        0,      //one pair
        0,      //no pair
    ];

    /**
     * Pairplus pay table
     */
    var pairplus_payout_multipliers = [
        0,
        40,     //mini royal flush
        40,     //straight flush
        30,      //three of a kind
        5,      //straight
        4,      //flush
        1,      //one pair
        0,      //no pair
    ];
    /**
     * Sort card array by rank in asending order
     * @param cardArray
     * @returns {*}
     */
    this.sortCards = function(cardArray) {
        cardArray.sort(function(a, b) {
            return +/\d+/.exec(a)[0] - +/\d+/.exec(b)[0];
        });
        return cardArray;
    };

    this.getCardRankArray = function(cardArray) {
        var cardRankArray = [];
        for (var key in cardArray) {
            if(cardArray.hasOwnProperty(key)){
                cardRankArray[key] = g_cards[cardArray[key]].rank;
            }
        }
        return cardRankArray;
    };

    this.threeOfAKind = function(retValue) {
        var first = 0;
        var limit = 0;
        var resOfFirst = 0;
        var restOfLimit = 0;
        retValue.pairs = [];
        var next = 0;
        var nextLimit = 0;
        if (retValue.sortCount.length === 2 && retValue.sortCount[0] === retValue.sortCount[1]) {
            first = retValue.sortCount[0] + 1;
            limit = first + retValue.sortCount[1];
            next = 0;
            nextLimit = next + 1;
            resOfFirst = nextLimit + 1;
            restOfLimit = retValue.sortCount[0];
        }
        else if (retValue.sortCount.length === 2) {
            first = 0;
            limit = retValue.sortCount[0];
            next = limit + 1;
            nextLimit = next + retValue.sortCount[1];
            resOfFirst = 0;
            restOfLimit = -1;

        } else if (retValue.sortCount.length === 3) {
            if (retValue.sortCount[0] > retValue.sortCount[1]) {
                first = 0;
                limit = retValue.sortCount[0];
                next = limit + 1;
                nextLimit = next + retValue.sortCount[1];
                resOfFirst = nextLimit + 1;
                restOfLimit = resOfFirst + retValue.sortCount[2];
            } else if (retValue.sortCount[1] > retValue.sortCount[2]) {
                // 1, 0
                first = 0;
                limit = retValue.sortCount[0];
                next = limit + 1;
                nextLimit = next + retValue.sortCount[1];
                resOfFirst = nextLimit + 1;
                restOfLimit = resOfFirst + retValue.sortCount[2];
            } else {
                // 2,0
                first = 0;
                limit = retValue.sortCount[0];
                resOfFirst = limit + 1;
                restOfLimit = resOfFirst + retValue.sortCount[1];
                next = restOfLimit + 1;
                nextLimit = next + retValue.sortCount[2];
            }
        } else if (retValue.sortCount.length === 1) {
            first = 0;
            limit = retValue.sortCount[0];
            resOfFirst = 0;
            restOfLimit = -1;
            next = 0;
            nextLimit = -1;
        }
        var key;
        for (key = first; key <= limit; ++key) {
            retValue.pairs.push(retValue.repeatArray[key]);
        }
        for (key = next; key <= nextLimit; ++key) {
            retValue.pairs.push(retValue.repeatArray[key]);
        }
        for (key = resOfFirst; key <= restOfLimit; ++key) {
            retValue.restOfArray.push(retValue.repeatArray[key]);
        }
        return retValue;
    };

    this.onePairs = function(retValue) {
        var first = 0;
        var limit = 0;
        var resOfFirst = 0;
        var restOfLimit = 0;
        retValue.pairs = [];
        var next = 0;
        var nextLimit = 0;

        if (retValue.sortCount.length === 2) {
            first = 0;
            limit = retValue.sortCount[0];
            next = limit + 1;
            nextLimit = next + retValue.sortCount[1];
            resOfFirst = 0;
            restOfLimit = -1;
        } else if (retValue.sortCount.length === 3) {
            resOfFirst = 0;
            restOfLimit = retValue.sortCount[0];
            first = restOfLimit + 1;
            limit = first + retValue.sortCount[1];

            next = limit + 1;
            nextLimit = next + retValue.sortCount[2];
        } else if (retValue.sortCount.length === 1) {
            first = 0;
            limit = retValue.sortCount[0];
            resOfFirst = 0;
            restOfLimit = -1;
            next = 0;
            nextLimit = -1;
        }
        var key;
        for (key = first; key <= limit; ++key) {
            retValue.pairs.push(retValue.repeatArray[key]);
        }
        for (key = next; key <= nextLimit; ++key) {
            retValue.pairs.push(retValue.repeatArray[key]);
        }
        for (key = resOfFirst; key <= restOfLimit; ++key) {
            retValue.restOfArray.push(retValue.repeatArray[key]);
        }
        return retValue;
    };

    this.rankForPair = function(retValue) {
        var maxRepeatCout = Math.max.apply(null, retValue.sortCount);
        if (maxRepeatCout === 2 && retValue.sortCount.length >= 2) {
            retValue = this.threeOfAKind(retValue);
        } else if (maxRepeatCout === 2 && retValue.sortCount.length === 1) {
            retValue = this.threeOfAKind(retValue);
        } else if (maxRepeatCout === 1 && retValue.sortCount.length >= 2) {
            retValue = this.onePairs(retValue);
        } else if (maxRepeatCout === 1) {
            retValue = this.onePairs(retValue);
        }
        return;
    };

    this.chekForStraightFlushSpecialCase = chekForStraightFlushSpecialCase;

    /**
     * Checks whether cardArray is straight or not
     * @param cardArray | length should be three
     * @returns {boolean} | true means royal flush/straight flush/straight
     */
    var chekForStraight = function(cardArray) {
        var status = false;
        if (g_cards[cardArray[0]].rank + 1 === g_cards[cardArray[1]].rank && g_cards[cardArray[1]].rank + 1 === g_cards[cardArray[2]].rank) {
            status = true;
        }
        return status;
    };


    /**
     * Checks whether a straight is a straight flush or not
     * @param cardArray | a straight
     * @returns {*} | rank result
     */
    var chekForStraightFlushSpecialCase = function(cardArray) {
        var firstValue = g_cards[cardArray[0]].rank;
        var secValue = g_cards[cardArray[1]].rank;
        var thirdValue = g_cards[cardArray[2]].rank;

        var flushStatus = checkForFlush(cardArray);
        var rank = (flushStatus === true) ? g_rankOrder.straight_flush.rank : g_rankOrder.straight.rank;

        if (firstValue === 2 && secValue === 3 && thirdValue === 14) {
            return {
                status: true,
                rnk: rank,
                data: [1, firstValue, secValue],
                actualArray: [cardArray[2], cardArray[0], cardArray[1]]
            };
        }

        return {
            status: false,
            data: [],
            actualArray: []
        };
    };

    /**
     * Checks whether cardArray is a flush or not
     * @param cardArray
     * @returns {boolean} | true means a flush
     */
    var checkForFlush = function(cardArray) {
        var status = false;
        if (g_cards[cardArray[0]].suit === g_cards[cardArray[1]].suit && g_cards[cardArray[1]].suit === g_cards[cardArray[2]].suit) {
            status = true;
        }
        return status;
    };

    /**
     * Checks for pair rank(three of a kind, one pair)
     * @param cardArray
     * @param cardArrayOriginal
     * @returns {Array}
     */
    var checkForPair = function(cardArray, cardArrayOriginal) {
        var sortArrayValue = [];
        var sortCount = [];
        var rank = [];
        rank.actualArray = [];
        var count = 0;
        var equalFlag = false;
        var restOfArray = [];
        var actualPairArray = [];
        var actualNonPairArray = [];
        for (var key in cardArray) {
            if (cardArray.length === parseInt(key) + 1 && equalFlag === true && count) {
                sortCount.push(count);
                sortArrayValue.push(cardArray[parseInt(key)]);
                actualPairArray.push(cardArrayOriginal[key]);
            } else if (cardArray[key] === cardArray[parseInt(key) + 1] && cardArray.length !== parseInt(key) + 1) {
                ++count;
                actualPairArray.push(cardArrayOriginal[key]);
                equalFlag = true;
            } else if (equalFlag === true) {
                sortCount.push(count);
                sortArrayValue.push(cardArray[parseInt(key)]);
                actualPairArray.push(cardArrayOriginal[key]);
                equalFlag = false;
                count = 0;
            } else {
                restOfArray.push(cardArray[key]);
                actualNonPairArray.push(cardArrayOriginal[key]);
            }
        }

        rank = rankForPair(sortCount, sortArrayValue, actualPairArray);
        cardArray = '';
        actualNonPairArray = sortArray(actualNonPairArray);
        for (var nonPairLength = actualNonPairArray.length - 1; nonPairLength >= 0; --nonPairLength) {
            rank.actualArray.push(actualNonPairArray[nonPairLength]);
        }

        actualNonPairArray = [];
        rank.restofData = restOfArray;
        actualPairArray = [];
        return rank;
    };


    /**
     * Checks and returns pair rank (three of a kind/one pair/no pair)
     * @param sortCount
     * @param sortArray
     * @param actualPairArray
     * @returns {{rnk: number, data: *, actualArray: *}}
     */
    var rankForPair = function(sortCount, sortArray, actualPairArray) {
        var maxRepeatCout = Math.max.apply(null, sortCount);
        var rank = 0;
        if (sortCount.length === 0) {
            rank = g_rankOrder.no_pair.rank;
        } else if (maxRepeatCout === 2 && sortCount.length === 1) {
            rank = g_rankOrder.three_of_a_kind.rank;
        } else if (maxRepeatCout === 1) {
            rank = g_rankOrder.one_pair.rank;
        }
        return {
            rnk: rank,
            data: sortArray,
            actualArray: actualPairArray
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
     * Checks whether the cards are Royal/Straight flush
     * If the sum of cards are 39, then it is a royal flush
     * @param cardArray | a straight
     * @returns {{rnk: number, data: Array, restofData: Array, actualArray: *}}
     */
    var getRoyalStraightFlushRank = function(cardArray) {
        var rank = 0;
        var cardRankArray = [];
        cardRankArray = getCardRankArray(cardArray);
        var totalSum = cardRankArray[0] + cardRankArray[1] + cardRankArray[2];
        rank = totalSum === 39 ? g_rankOrder.royal_flush.rank : g_rankOrder.straight_flush.rank;
        return {
            rnk: rank,
            data: cardRankArray,
            restofData: [],
            actualArray: cardArray.reverse()
        };
    };

    /**
     * Returns a flush card rank
     * @param cardArray
     * @returns {{rnk: number, data: Array, restofData: Array, actualArray: *}}
     */
    var getFlushRank = function(cardArray) {
        var rank = 0;
        var cardRankArray = [];
        cardRankArray = getCardRankArray(cardArray);
        rank = g_rankOrder.flush.rank;
        return {
            rnk: rank,
            data: cardRankArray,
            restofData: [],
            actualArray: cardArray.reverse()
        };
    };

    /**
     * Returns a straight card rank
     * @param cardArray
     * @returns {{rnk: number, data: Array, restofData: Array, actualArray: *}}
     */
    var getStraightRank = function(cardArray) {
        var cardRankArray = [];
        cardRankArray = getCardRankArray(cardArray);
        var rank = g_rankOrder.straight.rank;
        return {
            rnk: rank,
            data: cardRankArray,
            restofData: [],
            actualArray: cardArray.reverse()
        };

    };

    var sortArray = function(cardArray) {
        cardArray.sort(function(a, b) {
            return +/\d+/.exec(a)[0] - +/\d+/.exec(b)[0];
        });
        return cardArray;
    };

    /**
     * This function is used to find the Five card rank.
     * At the very first, we would do a Natural sorting for card array. Then check for the availability of Joker.
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

        rank = chekForStraightFlushSpecialCase(cardArray);
        if (rank.status === true) {
            return rank;
        }
        rank = [];

        var isStraightCards = chekForStraight(cardArray);
        var isFlushedCards = checkForFlush(cardArray);
        if (isFlushedCards && isStraightCards) {
            rank = getRoyalStraightFlushRank(cardArray);
            return rank;
        }
        if (isFlushedCards && !isStraightCards) {
            rank = getFlushRank(cardArray);
            return rank;
        }
        if (isStraightCards) {
            rank = getStraightRank(cardArray);
            return rank;
        }
        var cardArrayRanks = getCardRankArray(cardArray);
        rank = checkForPair(cardArrayRanks, cardArray);
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

    var getCardResult = function(params) {
        return checkRankingGroups(params);
    };

    this.getCardResult = getCardResult;


    var getCardResultText = function(dealerRankObj, g_playerRankObj) {
        var status = '';
        if (g_playerRankObj.rnk < dealerRankObj.rnk) {
            status = "player";
        } else if (g_playerRankObj.rnk > dealerRankObj.rnk) {
            status = "dealer";
        } else {
            status = compareRank(g_playerRankObj.data, dealerRankObj.data);
            if (status === 'equal' && (g_playerRankObj.rnk === g_rankOrder.one_pair.rank || g_playerRankObj.rnk === g_rankOrder.no_pair.rank)) {
                status = compareRank(g_playerRankObj.restofData, dealerRankObj.restofData);
            }
        }
        return status;
    };
    this.getCardResultText = getCardResultText;

    /**
     * Check whether dealer cards is qualified or not
     * The lowest qualifying hand is queen, 3, 2
     * The highest non-qualifying hand is jack, 10, 8
     * @param dealerRankObj
     * @returns {boolean}
     */
    this.isDealerQualifiedCards = function(dealerRankObj) {
        var maxNonQualifyingCards = ['s11','s10','h8'];
        var resultText = this.getCardResultText(dealerRankObj, getCardResult(maxNonQualifyingCards));
        return (resultText === 'dealer') ? true:false;
    };

    this.parseHandCards = function(cards){
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

    this.standardizeHandCards = function(cards){
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
    this.getValue = function(rank) {
        var value = ranks.indexOf(rank);
        if(value !== -1){
            return value;
        }
    };

    this.getRank = function(value) {
        var rank = ranks[value - 2];
        return rank;
    };

    /**
     * gets pairplus pay
     * @param playerHandRank
     * @param pairplus
     * @returns {number}
     */
    this.getPairplusPay = function(playerHandRank, pairplus) {
        var pairplus_payout_multiplier = pairplus_payout_multipliers[playerHandRank];
        if (pairplus_payout_multiplier >= 1)
            return pairplus + pairplus * pairplus_payout_multiplier;
        return 0;
    };

    /**
     * gets ante bonus
     * @param playerHandRank
     * @param ante
     * @returns {number}
     */
    this.getAnteBonus = function(playerHandRank, ante) {
        var ante_payout_multiplier = ante_payout_multipliers[playerHandRank];
        return ante * ante_payout_multiplier;
    };
    /**
     *
     * @param playerHandRank
     * @param ante
     * @param pairplus
     * @param action
     * @param dealerQualified
     * @param isWin
     * @param isPush
     * @returns {{total: number, pairplus: number, ante: number, play: number, ante_bonus: number}}
     */
    this.getPayouts = function(playerHandRank, ante, pairplus, action, dealerQualified, isWin, isPush) {
        var payouts = {total: 0, pairplus: 0, ante: 0, play: 0, ante_bonus: 0};

        payouts.houseEdge = this.getHouseEdge(ante, pairplus);
        payouts.pairplus = this.getPairplusPay(playerHandRank, pairplus);

        if (action === 1) {  //raise
            payouts.ante_bonus += this.getAnteBonus(playerHandRank, ante);
            if (!dealerQualified) {
                payouts.ante = ante * 2;
                payouts.play = ante;
            } else {
                if (isWin) {
                    payouts.ante += ante * 2;
                    payouts.play += ante * 2;
                } else if (isPush) {
                    payouts.ante += ante;
                    payouts.play += ante;
                }
            }
        }
        payouts.total = payouts.pairplus + payouts.ante + payouts.play + payouts.ante_bonus;

        return payouts;
    };

    this.getHouseEdge = function(ante, pairplus){
        var houseEdges = {
            ante: 0.0337,
            pairplus: 0.0232
        };
        var totalWager = ante + pairplus;
        var averageHouseEdge = ante / totalWager * houseEdges.ante + pairplus / totalWager * houseEdges.pairplus;
        return averageHouseEdge;
    };

    this.getGameSubRank = function(handRnkObj) {
        if (handRnkObj.rnk === g_rankOrder.no_pair.rank) {
            return handRnkObj.restofData[2];
        }
        if (handRnkObj.rnk === g_rankOrder.one_pair.rank) {
            return handRnkObj.data[0];
        }
        return 0;
    };

    /**
     * Returns game result for dealer and player hands according to the game rule
     * 1. pays nothing for fold
     * 2. pays 4 * ante if dealer cards is not qualified
     * 3. pays 4 * ante + (2 * ante) * payout_multiplier if dealer cards is qualified and beaten by player cards
     * 4. pays 3 * ante if dealer cards is qualified and is push
     * 5. pays nothing if dealer cards is qualified and beans player cards
     * @param dealerHand
     * @param playerHand
     * @param wager ante + raise
     * @param action 1 means "raise", 0 means "fold", 2 means "none"
     * @returns {{cardsResult: *, dealerHand: *, playerHand: *, isWin: boolean, isPush: boolean, isFold: boolean, payout: number}}
     */
    this.getResult = function(dealerHand, playerHand, ante, pairplus, action){
        var dealerInitCards = dealerHand.initCards;
        dealerHand = this.getCardResult(this.parseHandCards(dealerInitCards));
        var playerInitCards = playerHand.initCards;
        playerHand = this.getCardResult(this.parseHandCards(playerInitCards));

        var dealerQualified = this.isDealerQualifiedCards(dealerHand);
        dealerHand.qualified = dealerQualified;

        var result = this.getCardResultText(dealerHand, playerHand);

        playerHand.initCards = playerInitCards;
        dealerHand.initCards = dealerInitCards;
        var isWin = false,
            isPush = false;

        if (action === 1) {
            if(result === 'player' || !dealerQualified){
                isWin = true;
            } else if (result === 'dealer') {
                isWin = false;
            } else {
                isPush = true;
            }
        } else if (action === 2) {
            if (pairplus_payout_multipliers[playerHand.rnk] >= 1) {
                isWin = true;
            }
        }

        var payouts = this.getPayouts(playerHand.rnk, ante, pairplus, action, dealerQualified, isWin, isPush);
        playerHand.sub_rnk = this.getGameSubRank(playerHand);
        dealerHand.sub_rnk = this.getGameSubRank(dealerHand);

        return {
            cardsResult: result,
            dealerHand: dealerHand,
            playerHand: playerHand,
            isWin: isWin,
            isPush: isPush,
            payout: payouts.total,
            payouts: payouts,
            isFold: action === 0
        };
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
        //cards.push({rank:'JO'});
        return cards;
    };

    this.getCardRank = function(order) {
        var cards = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K","A","JO"];
        return cards[order];
    };

    this.getCardSuit = function(order) {
        var suits = ["C", "D", "H", "S"];
        return suits[order];
    };

    this.getShuffledCards = function(seed, cards) {
        return provable.seededShuffle(seed, cards);
    };

    this.initHands = function(seed) {
        var unshuffledCards = this.getUnshuffledCards();
        var cards = this.getShuffledCards(seed, unshuffledCards);
        var allCards = cards.slice();
        var playerCards = [];
        var dealerCards = [];
        for(var j=0;j<3;j++){
            playerCards.push(cards.pop());
        }
        for(var i=0;i<3;i++){
            dealerCards.push(cards.pop());
        }
        var playerHand = this.getCardResult(this.parseHandCards(playerCards));
        playerHand.sub_rnk = this.getGameSubRank(playerHand);
        return {
            playerCards: playerCards,
            playerCardsRank: playerHand.rnk,
            playerCardsSubRank: playerHand.sub_rnk,
            dealerCards: dealerCards,
            allCards: allCards
        };
    };

    return this;
};