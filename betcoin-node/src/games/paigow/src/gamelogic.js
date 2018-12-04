'use strict';

var provable = require('../../../lib/provably-fair');
var HTTPError = require('../../../lib/http-error');

var g_rankOrder = {
    five_of_a_kind: {rank: 1},
    royal_flush: {rank: 2},
    straight_flush: {rank: 3},
    four_of_a_kind: {rank: 4},
    full_house: {rank: 5},
    flush: {rank: 6},
    straight: {rank: 7},
    three_of_a_kind: {rank: 8},
    two_pairs: {rank: 9},
    one_pair: {rank: 10},
    no_pair: {rank: 11}
};

var g_cards = {
    c2: { rank: 2, suit: 'c'},
    c3: { rank: 3, suit: 'c'},
    c4: { rank: 4, suit: 'c'},
    c5: { rank: 5, suit: 'c'},
    c6: { rank: 6, suit: 'c'},
    c7: { rank: 7, suit: 'c'},
    c8: { rank: 8, suit: 'c'},
    c9: { rank: 9, suit: 'c'},
    c10: { rank: 10, suit: 'c'},
    c11: { rank: 11, suit: 'c'},
    c12: { rank: 12, suit: 'c'},
    c13: { rank: 13, suit: 'c'},
    c14: { rank: 14, suit: 'c'},
    d2: { rank: 2, suit: 'd'},
    d3: { rank: 3, suit: 'd'},
    d4: { rank: 4, suit: 'd'},
    d5: { rank: 5, suit: 'd'},
    d6: { rank: 6, suit: 'd'},
    d7: { rank: 7, suit: 'd'},
    d8: { rank: 8, suit: 'd'},
    d9: { rank: 9, suit: 'd'},
    d10: { rank: 10, suit: 'd'},
    d11: { rank: 11, suit: 'd'},
    d12: { rank: 12, suit: 'd'},
    d13: { rank: 13, suit: 'd'},
    d14: { rank: 14, suit: 'd'},
    h2: { rank: 2, suit: 'h'},
    h3: { rank: 3, suit: 'h'},
    h4: { rank: 4, suit: 'h'},
    h5: { rank: 5, suit: 'h'},
    h6: { rank: 6, suit: 'h'},
    h7: { rank: 7, suit: 'h'},
    h8: { rank: 8, suit: 'h'},
    h9: { rank: 9, suit: 'h'},
    h10: { rank: 10, suit: 'h'},
    h11: { rank: 11, suit: 'h'},
    h12: { rank: 12, suit: 'h'},
    h13: { rank: 13, suit: 'h'},
    h14: { rank: 14, suit: 'h'},
    s2: { rank: 2, suit: 's'},
    s3: { rank: 3, suit: 's'},
    s4: { rank: 4, suit: 's'},
    s5: { rank: 5, suit: 's'},
    s6: { rank: 6, suit: 's'},
    s7: { rank: 7, suit: 's'},
    s8: { rank: 8, suit: 's'},
    s9: { rank: 9, suit: 's'},
    s10: { rank: 10, suit: 's'},
    s11: { rank: 11, suit: 's'},
    s12: { rank: 12, suit: 's'},
    s13: { rank: 13, suit: 's'},
    s14: { rank: 14, suit: 's'},
    jo15: { rank: 15, suit: 'j'}
};

var GameLogic = function () {
    /*this.dealerFiveCards = [];
    this.dealerFiveRankObj = [];
    this.dealerTwoCards = [];
    this.dealerTwoRankObj = [];

    g_playerFiveRankObj = [];
    g_playerTwoRankObj = [];*/
};

GameLogic.prototype.getFlushedArray = function (retFlushedArray) {
    var retValue = [];
    retValue.flushedArray = [];
    retValue.restOfArray = [];
    if (retFlushedArray.c.length >= 4) {
        retValue.flushedArray = retFlushedArray.c;
        retValue.restOfArray = this.moveRestOfCards(retFlushedArray.s, retValue.restOfArray);
        retValue.restOfArray = this.moveRestOfCards(retFlushedArray.h, retValue.restOfArray);
        retValue.restOfArray = this.moveRestOfCards(retFlushedArray.d, retValue.restOfArray);
    } else if (retFlushedArray.s.length >= 4) {
        retValue.flushedArray = retFlushedArray.s;
        retValue.restOfArray = this.moveRestOfCards(retFlushedArray.c, retValue.restOfArray);
        retValue.restOfArray = this.moveRestOfCards(retFlushedArray.h, retValue.restOfArray);
        retValue.restOfArray = this.moveRestOfCards(retFlushedArray.d, retValue.restOfArray);
    } else if (retFlushedArray.d.length >= 4) {
        retValue.flushedArray = retFlushedArray.d;
        retValue.restOfArray = this.moveRestOfCards(retFlushedArray.c, retValue.restOfArray);
        retValue.restOfArray = this.moveRestOfCards(retFlushedArray.h, retValue.restOfArray);
        retValue.restOfArray = this.moveRestOfCards(retFlushedArray.s, retValue.restOfArray);
    } else if (retFlushedArray.h.length >= 4) {
        retValue.flushedArray = retFlushedArray.h;
        retValue.restOfArray = this.moveRestOfCards(retFlushedArray.s, retValue.restOfArray);
        retValue.restOfArray = this.moveRestOfCards(retFlushedArray.c, retValue.restOfArray);
        retValue.restOfArray = this.moveRestOfCards(retFlushedArray.d, retValue.restOfArray);
    }
    retFlushedArray = '';

    return retValue;
};
GameLogic.prototype.init = function (cardArray) {
    cardArray = this.sortCards(cardArray);

    var result = {
        twoCards: [],
        fiveCards: []
    };

    var jokerPresent = false;
    if (cardArray[cardArray.length - 1] === 'jo15') {
        jokerPresent = true;
        cardArray.pop();
    }
    var retFlushedArray = this.checkForSuit(cardArray);
    retValue = this.getFlushedArray(retFlushedArray);
    var flushedArray = retValue.flushedArray;
    var flushRestOfArray = retValue.restOfArray;
    var flush = true;
    var straight = true;
    if (flushedArray.length < 4) {
        flush = false;
    }
    if (!jokerPresent && flushedArray.length === 4) {
        flush = false;
    }
    var retValue = this.checkForStraight(cardArray, jokerPresent);
    var straightArrayBackCount = retValue.straightArrayBack.length;
    var straightArrayCount = retValue.straightArray.length;
    if (straightArrayBackCount >= 4) {
        retValue.restOfArray = this.moveRestOfCards(retValue.straightArray, retValue.restOfArray);
        retValue.straightArray = retValue.straightArrayBack; // alert(straight);
        straightArrayCount = retValue.straightArray.length;
    } else if (straightArrayCount >= 4) {
        retValue.restOfArray = this.moveRestOfCards(retValue.straightArrayBack, retValue.restOfArray);
    } else {
        straight = false;
    }
    if (!jokerPresent && straightArrayCount <= 4) {
        straight = false;
    }
    if (!flush && !straight) {
        if (jokerPresent) {
            cardArray.push('jo15');
        }
        result = this.checkForRepeat(result, cardArray);
        if (result.fiveCards.length === 5 && result.twoCards.length === 2) {
            return result;
        }
        return result;
    } else if (flush) {
        result = this.arrangeFlushStraightCards(flushedArray.slice(), flushRestOfArray.slice(), jokerPresent, 'flush');
        if (result.twoCards.length === 0) {
            for (var i = 0; i < cardArray.length; i++) {
                if (result.fiveCards.indexOf(cardArray[i]) === -1) {
                    result.twoCards.push(cardArray[i]);
                }
            }
        }
        if (straight) {
            var dealerTwoCards_flush = result.twoCards.slice();
            var dealerFiveCards_flush = result.fiveCards.slice();
            var flushResult = this.getPlayerCardResult({
                playerFiveCards: dealerFiveCards_flush,
                playerTwoCards: dealerTwoCards_flush
            });
            result.twoCards = [];
            result.fiveCards = [];
            result = this.arrangeStraightCards(retValue.straightArray.slice(), retValue.restOfArray.slice(), jokerPresent, 'straight');

            var straightResult = this.getPlayerCardResult({
                playerFiveCards: result.fiveCards.slice(),
                playerTwoCards: result.twoCards.slice()
            });

            var twoResult = this.getTwoCardResultText(flushResult.playerTwoRankObj, straightResult.playerTwoRankObj);
            if (twoResult === 'player') { //should return flush
                result = this.arrangeFlushStraightCards(flushedArray.slice(), flushRestOfArray.slice(), jokerPresent, 'flush');
            } else {
                result = this.arrangeStraightCards(retValue.straightArray.slice(), retValue.restOfArray.slice(), jokerPresent, 'straight');
            }
        }
        return result;
    }
    result = this.arrangeStraightCards(retValue.straightArray, retValue.restOfArray, jokerPresent, 'straight');
    return result;
};

GameLogic.prototype.arrangeFlushStraightCards = function (arrayValues, cardRestOfArray, jokerPresent, flag) {
    arrayValues = this.sortCards(arrayValues);
    cardRestOfArray = this.sortCards(cardRestOfArray);
    var result = {
        twoCards: [],
        fiveCards: []
    };
    for (var key = cardRestOfArray.length - 1; key >= 0; --key) {
        result.twoCards.push(cardRestOfArray[key]);
    }
    if (arrayValues.length >= 5) {
        // var count = 0;
        var countLimit = 4;

        // alert('ss');
        if (flag === 'straight' && jokerPresent) {
            countLimit = 3;
        }
        for (key = 0; key <= countLimit; ++key) {
            result.fiveCards.push(arrayValues[key]);
            // arrayValues.pop();
            // ++count
        }
        for (key = countLimit + 1; key < arrayValues.length; ++key) {
            result.twoCards.push(arrayValues[key]);
            // arrayValues.pop();
        }
    } else if (arrayValues.length === 4) {
        for (key = arrayValues.length - 1; key >= 0; --key) {
            result.fiveCards.push(arrayValues[key]);
            arrayValues.pop();
        }

    }
    // alert(jokerPresent+' '+)
    if (jokerPresent && result.fiveCards.length === 4) {
        result.fiveCards.push('jo15');
    } else if (jokerPresent && result.twoCards.length === 1) {
        result.twoCards.push('jo15');
    }
    return result;
};

GameLogic.prototype.arrangeStraightCards = function (arrayValues, cardRestOfArray, jokerPresent) {
    arrayValues = this.sortCards(arrayValues);
    cardRestOfArray = this.sortCards(cardRestOfArray);
    var result = {
        fiveCards: [],
        twoCards: []
    };
    var status = false;
    for (var key = cardRestOfArray.length - 1; key >= 0; --key) {
        result.twoCards.push(cardRestOfArray[key]);
    }
    var tempArray = [];
    //  alert(arrayValues.length);
    if (arrayValues.length === 7) { // alert(cardRestOfArray+' ss '+arrayValues);
        tempArray.push(arrayValues[0]);
        tempArray.push(arrayValues[1]);
        tempArray.push(arrayValues[2]);
        tempArray.push(arrayValues[3]);
        tempArray.push(arrayValues[4]);
        status = this.chekForMiddleStraight(tempArray);

        result.fiveCards = tempArray;
        result.twoCards.push(arrayValues[5]);
        result.twoCards.push(arrayValues[6]);
    } else if (arrayValues.length === 6) { // alert('sssss');
        tempArray = [];
        tempArray.push(arrayValues[0]);
        tempArray.push(arrayValues[1]);
        tempArray.push(arrayValues[2]);
        tempArray.push(arrayValues[3]);
        tempArray.push(arrayValues[4]);
        // alert(tempArray);
        status = this.chekForMiddleStraight(tempArray);
        if (!status) {
            tempArray.pop();
            status = this.checkForMiddleStraightWithJoker(tempArray, jokerPresent);
        }
        if (status) {
            if (tempArray.length === 4) {
                tempArray.push('jo15');
                result.twoCards.push(arrayValues[4]);
                result.twoCards.push(arrayValues[5]);
            } else {
                result.twoCards.push(arrayValues[5]);
            }
            result.fiveCards = tempArray;
        } else { // alert('sss');
            tempArray = [];
            tempArray.push(arrayValues[1]);
            tempArray.push(arrayValues[2]);
            tempArray.push(arrayValues[3]);
            tempArray.push(arrayValues[4]);
            tempArray.push(arrayValues[5]);
            status = this.chekForMiddleStraight(tempArray);
            if (!status) {
                tempArray.pop();
                status = this.checkForMiddleStraightWithJoker(tempArray, jokerPresent);
            }
            if (status) {
                if (tempArray.length === 4) {
                    tempArray.push('jo15');
                    result.twoCards.push(arrayValues[0]);
                    result.twoCards.push(arrayValues[5]);
                } else {
                    result.twoCards.push(arrayValues[0]);
                }
                result.fiveCards = tempArray;
            }
        }
    } else if (arrayValues.length === 5) { // alert('ss');
        tempArray.push(arrayValues[0]);
        tempArray.push(arrayValues[1]);
        tempArray.push(arrayValues[2]);
        tempArray.push(arrayValues[3]);
        tempArray.push(arrayValues[4]);
        status = this.chekForMiddleStraight(tempArray);
        if (!status) {
            /*tempArray  = [];
             tempArray.push(arrayValues[1]);
             tempArray.push(arrayValues[2]);
             tempArray.push(arrayValues[3]);
             tempArray.push(arrayValues[4]);*/
            tempArray.pop();
            status = this.checkForMiddleStraightWithJoker(tempArray, jokerPresent);
        }
        if (status) {
            if (tempArray.length === 4) {
                tempArray.push('jo15');
                result.twoCards.push(arrayValues[4]);
            }
            result.fiveCards = tempArray;
        } else {
            tempArray = [];
            /*tempArray.push(arrayValues[0]);
             tempArray.push(arrayValues[1]);
             tempArray.push(arrayValues[2]);
             tempArray.push(arrayValues[3]);*/
            tempArray.push(arrayValues[1]);
            tempArray.push(arrayValues[2]);
            tempArray.push(arrayValues[3]);
            tempArray.push(arrayValues[4]);
            status = this.checkForMiddleStraightWithJoker(tempArray, jokerPresent);
            if (status) {
                tempArray.push('jo15');
                result.twoCards.push(arrayValues[0]);
                result.fiveCards = tempArray;
            }
        }
    } else if (arrayValues.length === 4) {
        for (key = arrayValues.length - 1; key >= 0; --key) {
            result.fiveCards.push(arrayValues[key]);
            arrayValues.pop();
        }

    }
    // alert(jokerPresent+' '+)
    if (jokerPresent && result.fiveCards.length === 4) {
        result.fiveCards.push('jo15');
    } else if (jokerPresent && result.twoCards.length === 1) {
        result.twoCards.push('jo15');
    }
    return result;
};

GameLogic.prototype.chekForMiddleStraight = function (dataArray) { // alert(dataArray);
    var status = false;
    if (g_cards[dataArray[0]].rank + 1 === g_cards[dataArray[1]].rank && g_cards[dataArray[1]].rank + 1 === g_cards[dataArray[2]].rank && g_cards[dataArray[2]].rank + 1 === g_cards[dataArray[3]].rank && g_cards[dataArray[3]].rank + 1 === g_cards[dataArray[4]].rank) {
        status = true;

    }
    return status;
};

GameLogic.prototype.checkForMiddleStraightWithJoker = function (cardArray) {
    var status = false;
    var nextVal = '';
    var misFlag = false;
    var cardLength = cardArray.length;
    // alert(cardArray);
    for (var key = 0; key < cardLength; ++key) {
        if (key === cardLength - 1) {
            break;
        }
        nextVal = g_cards[cardArray[parseInt(key) + 1]].rank;
        if (g_cards[cardArray[key]].rank + 1 !== nextVal && g_cards[cardArray[key]].rank + 2 !== nextVal) {
            return false;
        }
        if (g_cards[cardArray[key]].rank + 1 === nextVal) {
            status = true;
            continue;
        }
        if (misFlag === false && g_cards[cardArray[key]].rank + 2 === nextVal) {
            misFlag = true;
            status = true;
            continue;
        } else {
            status = false;
            break;
        }
    }
    return status;
};


GameLogic.prototype.sortCards = function (cardArray) {
    cardArray.sort(function (a, b) {
        return +/\d+/.exec(a)[0] - +/\d+/.exec(b)[0];
    });
    return cardArray;
};

GameLogic.prototype.checkForSuit = function (cardArray) {
    var resultArray = [];
    resultArray.c = [];
    resultArray.s = [];
    resultArray.h = [];
    resultArray.d = [];
    for (var key = 0; key < cardArray.length; key++) {
        if (cardArray[key].indexOf('c') !== -1) {
            resultArray.c.push(cardArray[key]);
        }
        if (cardArray[key].indexOf('d') !== -1) {
            resultArray.d.push(cardArray[key]);
        }
        if (cardArray[key].indexOf('h') !== -1) {
            resultArray.h.push(cardArray[key]);
        }
        if (cardArray[key].indexOf('s') !== -1) {
            resultArray.s.push(cardArray[key]);
        }
    }
    return resultArray;
};

GameLogic.prototype.moveRestOfCards = function (cardArray, restOfArray) {
    for (var idx in cardArray) {
        if (cardArray.hasOwnProperty(idx)) {
            restOfArray.push(cardArray[idx]);
        }
    }
    return restOfArray;
};

GameLogic.prototype.moveNonStraightCards = function (retValue) {
    //  alert(retValue.straightArray);
    if (retValue.straightArray.length >= 4) {
        retValue.restOfArray = this.moveRestOfCards(retValue.straightArrayBack, retValue.restOfArray);
        retValue.straightArrayBack = retValue.straightArray;
    } else {
        retValue.restOfArray = this.moveRestOfCards(retValue.straightArray, retValue.restOfArray);
        // alert(retValue.restOfArray);
    }
    retValue.straightArray = [];
    return retValue;
};

GameLogic.prototype.moveNonStraightSingleCards = function (status, value, retValue) {
    if (status) {
        retValue.straightArray.push(value);
    } else {
        retValue.restOfArray.push(value);
    }
    return retValue;
};

GameLogic.prototype.checkForStraight = function (cardArray, jokerPresent) {
    var status = false;
    var nextVal = '';
    var misFlag = false;
    // var straightArray = [];
    var retValue = [];
    retValue.restOfArray = [];
    retValue.straightArrayBack = [];
    retValue.straightArray = [];
    // alert(cardArray);
    var cardLength = cardArray.length;
    // alert(cardArray);
    for (var key = 0; key < cardLength; ++key) {
        if (key === cardLength - 1) {
            retValue = this.moveNonStraightSingleCards(status, cardArray[key], retValue);
            break;
        }
        nextVal = g_cards[cardArray[parseInt(key) + 1]].rank;

        if (status === true && g_cards[cardArray[key]].rank === nextVal) { // alert(g_cards[cardArray[key]].rank);
            // retValue.straightArray.push(cardArray[key]); // alert('1+ '+cardArray[key]);
            retValue = this.moveNonStraightSingleCards(false, cardArray[key], retValue);
            // status = false;
            // retValue =  this.moveNonStraightSingleCards(status, cardArray[key], retValue);
            continue;
        }
        if (g_cards[cardArray[key]].rank + 1 !== nextVal && g_cards[cardArray[key]].rank + 2 !== nextVal) {

            retValue = this.moveNonStraightSingleCards(status, cardArray[key], retValue);
            status = false;
            retValue = this.moveNonStraightCards(retValue);
            continue;
        }
        if (g_cards[cardArray[key]].rank + 1 === nextVal) {
            retValue.straightArray.push(cardArray[key]); // alert('1+ '+cardArray[key]);
            status = true;
            continue;
        }
        if (jokerPresent && g_cards[cardArray[key]].rank + 2 === nextVal) {
            status = true;

            retValue = this.moveNonStraightSingleCards(status, cardArray[key], retValue);
            if (misFlag) {
                status = false;
                // misFlag = false;
                retValue = this.moveNonStraightCards(retValue);
                // straightArray = [];
            }
            misFlag = true;
            continue;
        }
        //  alert('ss');

        retValue = this.moveNonStraightSingleCards(status, cardArray[key], retValue);
        status = false;
        retValue = this.moveNonStraightCards(retValue);
    }

    // alert(retValue.straightArray+' = '+retValue.restOfArray+' = '+retValue.straightArrayBack);
    return retValue;
};

GameLogic.prototype.getCardRankArray = function (cardArray) {
    var cardRankArray = [];
    for (var key in cardArray) {
        if (cardArray.hasOwnProperty(key)) {
            cardRankArray[key] = g_cards[cardArray[key]].rank;
        }
    }
    return cardRankArray;
};

GameLogic.prototype.checkForRepeat = function (result, cardArray) {
    // var sortArray = [];
    // var sortCount = [];
    // var rank = 0;
    var count = 0;
    var equalFlag = false;
    // var restOfArray = [];
    var cardRankArray = this.getCardRankArray(cardArray);
    if (cardRankArray[6] === 15) {
        cardRankArray[6] = 14;
    }
    var retValue = [];
    retValue.sortArray = [];
    retValue.repeatArray = [];
    retValue.restOfArray = [];
    retValue.sortCount = [];
    for (var key in cardRankArray) {
        if (cardRankArray[key]) {
            if (cardRankArray.length === parseInt(key) + 1 && equalFlag === true && count) {
                retValue.sortCount.push(count);
                retValue.sortArray.push(cardArray[parseInt(key)]);
                retValue.repeatArray.push(cardArray[parseInt(key)]);
            } else if (cardRankArray[key] === cardRankArray[parseInt(key) + 1] && cardRankArray.length > parseInt(key) + 1) {
                ++count;
                equalFlag = true;
                retValue.repeatArray.push(cardArray[parseInt(key)]);
            } else if (equalFlag === true) {
                retValue.sortCount.push(count);
                retValue.sortArray.push(cardArray[parseInt(key)]);
                retValue.repeatArray.push(cardArray[parseInt(key)]);
                equalFlag = false;
                count = 0;
            } else {
                retValue.restOfArray.push(cardArray[key]);
            }
        }
    }

    return this.rankForPair(result, retValue);
};

GameLogic.prototype.fiveOfAKind = function (retValue) {
    var first = 0;
    var limit = 0;
    var resOfFirst = 0;
    var restOfLimit = 0;
    retValue.pairs = [];
    // var next = 0;
    // var nextLimit = 0;
    if (retValue.sortCount.length === 2 && retValue.sortCount[0] < retValue.sortCount[1]) {
        first = retValue.sortCount[0] + 1;
        limit = retValue.sortCount[0] + 1 + retValue.sortCount[1];

        resOfFirst = 0;
        restOfLimit = retValue.sortCount[0];
    } else if (retValue.sortCount.length === 2 && retValue.sortCount[0] > retValue.sortCount[1]) {
        first = 0;
        limit = retValue.sortCount[0];
        resOfFirst = retValue.sortCount[0] + 1;
        restOfLimit = retValue.sortCount[0] + 1 + retValue.sortCount[1];
    } else if (retValue.sortCount.length === 1) {
        first = 0;
        limit = retValue.sortCount[0];
        resOfFirst = 0;
        restOfLimit = -1;
    }
    var key;
    for (key = first; key <= limit; ++key) {
        retValue.pairs.push(retValue.repeatArray[key]);
    }
    for (key = resOfFirst; key <= restOfLimit; ++key) {
        retValue.restOfArray.push(retValue.repeatArray[key]);
    }
    return retValue;
};

GameLogic.prototype.threeOfAKind = function (retValue) {
    var first = 0;
    var limit = 0;
    var resOfFirst = 0;
    var restOfLimit = 0;
    retValue.pairs = [];
    var next = 0;
    var nextLimit = 0; // alert('shiju');
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

GameLogic.prototype.onePairs = function (retValue) {
    var first = 0;
    var limit = 0;
    var resOfFirst = 0;
    var restOfLimit = 0;
    retValue.pairs = [];
    var next = 0;
    var nextLimit = 0;
    // alert(retValue.sortCount+'ss');
    if (retValue.sortCount.length === 2) {
        first = 0;
        limit = retValue.sortCount[0];
        next = limit + 1;
        nextLimit = next + retValue.sortCount[1];
        // nextLimit = -1;
        resOfFirst = 0;
        restOfLimit = -1;
        //  alert(retValue.sortCount);
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
    // alert(retValue.repeatArray);
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

GameLogic.prototype.arrangeNoPair = function (result, retValue) {
    retValue.restOfArray = this.sortCards(retValue.restOfArray);
    result.fiveCards.push(retValue.restOfArray[6]);
    if (g_cards[retValue.restOfArray[6]].rank > 10) {
        result.twoCards.push(retValue.restOfArray[4]);
        result.twoCards.push(retValue.restOfArray[5]);
        result.fiveCards.push(retValue.restOfArray[3]);
        result.fiveCards.push(retValue.restOfArray[2]);
    } else {
        result.twoCards.push(retValue.restOfArray[4]);
        result.twoCards.push(retValue.restOfArray[3]);
        result.fiveCards.push(retValue.restOfArray[5]);
        result.fiveCards.push(retValue.restOfArray[2]);
    }

    result.fiveCards.push(retValue.restOfArray[1]);
    result.fiveCards.push(retValue.restOfArray[0]);
    return [];
};

GameLogic.prototype.arrangeOnePair = function (result, retValue) {


    for (var key = 0; key < retValue.pairs.length; ++key) {
        result.fiveCards.push(retValue.pairs[key]);
    }
    retValue.restOfArray = this.sortCards(retValue.restOfArray);
    // if (g_cards[retValue.pairs[0]].rank > 10) {
    result.fiveCards.push(retValue.restOfArray[2]);
    result.fiveCards.push(retValue.restOfArray[1]);
    result.fiveCards.push(retValue.restOfArray[0]);
    result.twoCards.push(retValue.restOfArray[3]);
    result.twoCards.push(retValue.restOfArray[4]);
    return [];
};

GameLogic.prototype.arrangeTwoPairs = function (result, retValue) { // alert(retValue.pairs+'ss'+retValue.restOfArray);
    retValue.pairs = this.sortCards(retValue.pairs);
    retValue.restOfArray = this.sortCards(retValue.restOfArray);
    var key;
    if (g_cards[retValue.restOfArray[0]].rank === g_cards[retValue.restOfArray[1]].rank) {
        for (key = 2; key < retValue.pairs.length; ++key) {
            result.fiveCards.push(retValue.pairs[key]);
        }

        result.fiveCards.push(retValue.restOfArray[0]);
        result.fiveCards.push(retValue.restOfArray[1]);
        result.fiveCards.push(retValue.restOfArray[2]);
        result.twoCards.push(retValue.pairs[0]);
        result.twoCards.push(retValue.pairs[1]);
    } else if (g_cards[retValue.restOfArray[1]].rank === g_cards[retValue.restOfArray[2]].rank) {
        for (key = 2; key < retValue.pairs.length; ++key) {
            result.fiveCards.push(retValue.pairs[key]);
        }
        result.fiveCards.push(retValue.restOfArray[1]);
        result.fiveCards.push(retValue.restOfArray[2]);
        result.fiveCards.push(retValue.restOfArray[0]);
        result.twoCards.push(retValue.pairs[0]);
        result.twoCards.push(retValue.pairs[1]);
    } else if (g_cards[retValue.restOfArray[2]].rank > 10) {
        for (key = 0; key < retValue.pairs.length; ++key) {
            result.fiveCards.push(retValue.pairs[key]);
        }
        retValue.restOfArray = this.sortCards(retValue.restOfArray);
        result.fiveCards.push(retValue.restOfArray[0]);
        result.twoCards.push(retValue.restOfArray[1]);
        result.twoCards.push(retValue.restOfArray[2]);
    } else {
        for (key = 2; key < retValue.pairs.length; ++key) {
            result.fiveCards.push(retValue.pairs[key]);
        }
        retValue.restOfArray = this.sortCards(retValue.restOfArray);
        result.fiveCards.push(retValue.restOfArray[0]);
        result.fiveCards.push(retValue.restOfArray[1]);
        result.fiveCards.push(retValue.restOfArray[2]);
        result.twoCards.push(retValue.pairs[0]);
        result.twoCards.push(retValue.pairs[1]);
    }
    return [];
};

GameLogic.prototype.arrangeThreeOfKind = function (result, retValue) {
    for (var key = 0; key < retValue.pairs.length; ++key) {
        result.fiveCards.push(retValue.pairs[key]);
    }
    // sort rest
    retValue.restOfArray = this.sortCards(retValue.restOfArray);
    result.fiveCards.push(retValue.restOfArray[0]);
    result.fiveCards.push(retValue.restOfArray[1]);
    result.twoCards.push(retValue.restOfArray[2]);
    result.twoCards.push(retValue.restOfArray[3]);
    return [];
};

GameLogic.prototype.arrangeFullhouse = function (result, retValue) {
    var key;
    retValue.pairs = this.sortCards(retValue.pairs);
    if (g_cards[retValue.restOfArray[0]].rank === g_cards[retValue.restOfArray[1]].rank) {
        for (key = 0; key < retValue.pairs.length; ++key) {
            result.fiveCards.push(retValue.pairs[key]);
        }
        result.twoCards.push(retValue.restOfArray[0]);
        result.twoCards.push(retValue.restOfArray[1]);
    } else if (g_cards[retValue.pairs[0]].rank !== g_cards[retValue.pairs[1]].rank || g_cards[retValue.pairs[1]].rank !== g_cards[retValue.pairs[2]].rank) {
        for (key = 2; key < retValue.pairs.length; ++key) {
            result.fiveCards.push(retValue.pairs[key]);
        }
        result.twoCards.push(retValue.pairs[0]);
        result.twoCards.push(retValue.pairs[1]);
        result.fiveCards.push(retValue.restOfArray[0]);
        result.fiveCards.push(retValue.restOfArray[1]);
    } else if (g_cards[retValue.pairs[0]].rank === g_cards[retValue.pairs[1]].rank && g_cards[retValue.pairs[1]].rank === g_cards[retValue.pairs[2]].rank) {
        for (key = 0; key < 3; ++key) {
            result.fiveCards.push(retValue.pairs[key]);
        }
        result.twoCards.push(retValue.pairs[3]);
        result.twoCards.push(retValue.pairs[4]);
        result.fiveCards.push(retValue.restOfArray[0]);
        result.fiveCards.push(retValue.restOfArray[1]);
    }
    return [];
};

GameLogic.prototype.arrangeFourOfKind = function (result, retValue) {
    for (var key = 0; key < retValue.pairs.length; ++key) {
        result.fiveCards.push(retValue.pairs[key]);
    }
    // sort rest
    retValue.restOfArray = this.sortCards(retValue.restOfArray);
    if (g_cards[retValue.restOfArray[0]].rank === g_cards[retValue.restOfArray[1]].rank) {
        result.fiveCards.push(retValue.restOfArray[2]);
        result.twoCards.push(retValue.restOfArray[0]);
        result.twoCards.push(retValue.restOfArray[1]);
    } else if (g_cards[retValue.restOfArray[1]].rank === g_cards[retValue.restOfArray[2]].rank) {
        result.fiveCards.push(retValue.restOfArray[0]);
        result.twoCards.push(retValue.restOfArray[1]);
        result.twoCards.push(retValue.restOfArray[2]);
    } else {
        result.fiveCards.push(retValue.restOfArray[0]);
        result.twoCards.push(retValue.restOfArray[1]);
        result.twoCards.push(retValue.restOfArray[2]);
    }
    return [];
};

GameLogic.prototype.arrangeFiveOfKind = function (result, retValue) {
    // sort rest
    result.fiveCards.push(retValue.pairs[0]);
    result.fiveCards.push(retValue.pairs[1]);
    result.fiveCards.push(retValue.pairs[2]);
    result.twoCards.push(retValue.pairs[3]);
    result.twoCards.push(retValue.pairs[4]);

    result.fiveCards.push(retValue.restOfArray[0]);
    result.fiveCards.push(retValue.restOfArray[1]);
    return [];
};

GameLogic.prototype.rankForPair = function (result, retValue) {
    var maxRepeatCout = Math.max.apply(null, retValue.sortCount);
    // var rank = 0;
    if (retValue.sortCount.length === 0) {
        retValue = this.arrangeNoPair(result, retValue);
    } else if (maxRepeatCout === 4) {
        retValue = this.fiveOfAKind(retValue);
        retValue = this.ar8rangeFiveOfKind(result, retValue);
    } else if (maxRepeatCout === 3) {
        retValue = this.fiveOfAKind(retValue);
        retValue = this.arrangeFourOfKind(result, retValue);
    } else if (maxRepeatCout === 2 && retValue.sortCount.length >= 2) {
        retValue = this.threeOfAKind(retValue);
        retValue = this.arrangeFullhouse(result, retValue);
    } else if (maxRepeatCout === 2 && retValue.sortCount.length === 1) {
        retValue = this.threeOfAKind(retValue);
        retValue = this.arrangeThreeOfKind(result, retValue);
    } else if (maxRepeatCout === 1 && retValue.sortCount.length >= 2) {
        retValue = this.onePairs(retValue);
        retValue = this.arrangeTwoPairs(result, retValue);
    } else if (maxRepeatCout === 1) {
        retValue = this.onePairs(retValue);
        retValue = this.arrangeOnePair(result, retValue);
    }
    return result;
};
/**
 This function is used to check whether the cards are straight or not. If it is straight that means it is straight (Royal/straight/straight)

 arg cardArray The argument card array contains the sorted card values

 return boolean status Will return true or false based on card rank.
 **/
var chekForStraight = function (cardArray) {
    var status = false;
    if (g_cards[cardArray[0]].rank + 1 === g_cards[cardArray[1]].rank && g_cards[cardArray[1]].rank + 1 === g_cards[cardArray[2]].rank && g_cards[cardArray[2]].rank + 1 === g_cards[cardArray[3]].rank) {
        status = true;
        if (cardArray.length === 5 && g_cards[cardArray[3]].rank + 1 !== g_cards[cardArray[4]].rank) {
            status = false;
        }
    }
    return status;
};


/**
 This function is used to check whether the cards are straightflush special case or not. 2,3,4,5,A is the lowest StraightFlush

 arg cardArray The argument card array contains the sorted card values

 return boolean status Will return true or false based on card rank.
 **/
var chekForStraightFlushSpecialCase = function (cardArray) {
    var firstValue = g_cards[cardArray[0]].rank;
    var secValue = g_cards[cardArray[1]].rank;
    var thirdValue = g_cards[cardArray[2]].rank;
    var fourthValue = g_cards[cardArray[3]].rank;
    var fifthValue = g_cards[cardArray[4]].rank;

    if (fifthValue === 15) {
        cardArray.pop();
    }
    var flushStatus = checkForFlush(cardArray);
    var rank = (flushStatus === true) ? g_rankOrder.straight_flush.rank : g_rankOrder.straight.rank;
    if (fifthValue === 15) {
        cardArray[4] = 'jo15';
    }
    if (firstValue === 2 && secValue === 3 && thirdValue === 4 && fourthValue === 5 && (fifthValue === 14 || fifthValue === 15)) {
        return {
            status: true,
            rnk: rank,
            data: [firstValue, fourthValue, thirdValue, secValue, 14],
            actualArray: [cardArray[4], cardArray[0], cardArray[1], cardArray[2], cardArray[3]]
        };
    }

    if (fifthValue !== 15) {
        return {
            status: false,
            data: [],
            actualArray: []
        };
    }
    // alert(fourthValue+' ss '+fifthValue);
    if (firstValue !== 2 && firstValue !== 3) {
        return {
            status: false,
            data: [],
            actualArray: []
        };
    }
    if (firstValue === 3 && secValue === 4 && thirdValue === 5 && fourthValue === 14) {
        return {
            status: true,
            rnk: rank,
            data: [2, thirdValue, secValue, firstValue, fourthValue],
            actualArray: [cardArray[3], cardArray[4], cardArray[0], cardArray[1], cardArray[2]]
        };
    }
    if (firstValue === 2 && secValue === 3 && thirdValue === 4 && fourthValue === 14) {
        return {
            status: true,
            rnk: rank,
            data: [firstValue, 5, thirdValue, secValue, fourthValue],
            actualArray: [cardArray[3], cardArray[0], cardArray[1], cardArray[2], cardArray[4]]
        };
    }
    if (firstValue === 2 && secValue === 4 && thirdValue === 5 && fourthValue === 14) {
        return {
            status: true,
            rnk: rank,
            data: [firstValue, thirdValue, secValue, 3, fourthValue],
            actualArray: [cardArray[3], cardArray[0], cardArray[4], cardArray[1], cardArray[2]]
        };
    }
    if (firstValue === 2 && secValue === 3 && thirdValue === 5 && fourthValue === 14) {
        return {
            status: true,
            rnk: rank,
            data: [firstValue, thirdValue, 4, secValue, fourthValue],
            actualArray: [cardArray[3], cardArray[0], cardArray[1], cardArray[4], cardArray[2]]
        };
    }
    return {
        status: false,
        data: [],
        actualArray: []
    };
};


var chekForStraightIfJokerPresent = function (cardArray) {
    var status = true;
    var nextVal = '';
    var misFlag = false;
    var key;
    for (key in cardArray) {
        if (cardArray.hasOwnProperty(key)) {
            if (cardArray.length === parseInt(key) + 1) {
                break;
            }
            nextVal = g_cards[cardArray[parseInt(key) + 1]].rank;
            if (g_cards[cardArray[key]].rank + 1 !== nextVal && g_cards[cardArray[key]].rank + 2 !== nextVal) {
                status = false;
                break;
            } else if (!misFlag && g_cards[cardArray[key]].rank + 1 !== nextVal && g_cards[cardArray[key]].rank + 2 === nextVal) {
                misFlag = true;
            } else if (misFlag && g_cards[cardArray[key]].rank + 1 !== nextVal && g_cards[cardArray[key]].rank + 2 === nextVal) {
                status = false;
                break;
            }
        }
    }
    return status;
};


/**
 This function is used to check whether the cards suits  are equal or not. If it is equal that means it is flush (Royal/straight/flush)

 arg cardArray The argument card array contains the sorted card values

 return boolean status Will return true or false based on suit.
 **/
var checkForFlush = function (cardArray) {
    var status = false;
    if (g_cards[cardArray[0]].suit === g_cards[cardArray[1]].suit && g_cards[cardArray[1]].suit === g_cards[cardArray[2]].suit && g_cards[cardArray[2]].suit === g_cards[cardArray[3]].suit && g_cards[cardArray[3]].suit === g_cards[cardArray[cardArray.length - 1]].suit) {
        status = true;
    }
    return status;
};

/**
 This function is used to get Pair card ranks.

 arg cardArray The argument card array contains the sorted card values

 return JSON This contains the rank and an array which contains card ranks of the selected cards.
 **/
var checkForPair = function (cardArray, cardArrayOriginal) {
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
 This function is used to get the rank of each pair group.

 arg sortCount Contains the repeated count of each card
 arg sortArray Contains the repeated card values

 return JSON This contains the rank and an array which contains card ranks of the selected cards.
 **/
var rankForPair = function (sortCount, sortArray, actualPairArray) {
    var maxRepeatCout = Math.max.apply(null, sortCount);
    var rank = 0;
    if (sortCount.length === 0) {
        rank = g_rankOrder.no_pair.rank;
    } else if (maxRepeatCout === 4) {
        rank = g_rankOrder.five_of_a_kind.rank;
    } else if (maxRepeatCout === 3) {
        rank = g_rankOrder.four_of_a_kind.rank;
    } else if (maxRepeatCout === 2 && sortCount.length === 2) {
        if (sortCount[0] < sortCount[1]) {
            sortArray[0] = sortArray[0] + sortArray[1];
            sortArray[1] = sortArray[0] - sortArray[1];
            sortArray[0] = sortArray[0] - sortArray[1];
            actualPairArray = actualPairArray.reverse();
        }
        // alert(sortArray);
        rank = g_rankOrder.full_house.rank;
    } else if (maxRepeatCout === 2 && sortCount.length === 1) {
        rank = g_rankOrder.three_of_a_kind.rank;
    } else if (maxRepeatCout === 1 && sortCount.length === 2) {
        rank = g_rankOrder.two_pairs.rank;
        // alert(sortArray);
        actualPairArray = reverseSortArray(actualPairArray);
        // alert(sortArray);
    } else if (maxRepeatCout === 1) {
        rank = g_rankOrder.one_pair.rank;
    }
    return {
        rnk: rank,
        data: sortArray,
        actualArray: actualPairArray
    };
};

/**
 The predefined value for the Joker is 15. THis is the highest value.
 arg cardArray The argument card array contains the sorted card values

 return boolean status Will return true or false based on the Joker availability.
 **/
var checkForJoker = function (cardArray) {
    var status = false;
    if (g_cards[cardArray[cardArray.length - 1]].rank === 15) {
        status = true;
    }
    return status;
};


var checkForJokerReplacementValue = function (cardArray) {
    var misFlag = false;
    var jokerReArrangeValue = 0;
    var reArrangeKey = 0;
    for (var key in cardArray) {
        if (jokerReArrangeValue && cardArray.length === parseInt(key) + 1) {
            break;
        } else if (cardArray.length === parseInt(key) + 1) {
            if (g_cards[cardArray[key]].rank === '14') {
                jokerReArrangeValue = g_cards[cardArray[0]].rank - 1;
                reArrangeKey = -1;
            } else {
                jokerReArrangeValue = g_cards[cardArray[key]].rank + 1;
                reArrangeKey = parseInt(key);
                // misFlag = true;
            }
            break;
        } else if (cardArray.length !== parseInt(key) + 1 && g_cards[cardArray[key]].rank + 1 === g_cards[cardArray[parseInt(key) + 1]].rank) {
            continue;
        } else if (g_cards[cardArray[key]].rank + 2 === g_cards[cardArray[parseInt(key) + 1]].rank && !misFlag) {
            misFlag = true;
            jokerReArrangeValue = g_cards[cardArray[key]].rank + 1;
            reArrangeKey = parseInt(key);
        } else if (g_cards[cardArray[key]].rank + 2 === g_cards[cardArray[parseInt(key) + 1]].rank && misFlag) {
            // misFlag = true;
            jokerReArrangeValue = 0;
            reArrangeKey = 0;
            break;
        }

    }
    return {
        value: jokerReArrangeValue,
        key: reArrangeKey
    };
};


var checkForJokerReplacementFlushValue = function (cardArray) {
    var previousSuit = g_cards[cardArray[0]].suit;
    var jokerReArrangeValue = '';
    var reArrangeKey = 0;
    var rankArray = [];
    rankArray.push(g_cards[cardArray[3]].rank);
    rankArray.push(g_cards[cardArray[2]].rank);
    rankArray.push(g_cards[cardArray[1]].rank);
    rankArray.push(g_cards[cardArray[0]].rank);
    for (var key in rankArray) {
        if (rankArray.length === parseInt(key) + 1) {
            jokerReArrangeValue = rankArray[key] - 1;
            reArrangeKey = parseInt(key);
            break;
        } else if (rankArray[key] !== 14) {
            jokerReArrangeValue = 14;
            reArrangeKey = parseInt(key);
            break;
        } else if (rankArray[key] === rankArray[parseInt(key) + 1] + 1) {
            continue;
        } else {
            jokerReArrangeValue = rankArray[key] - 1;
            reArrangeKey = parseInt(key) + 1;
            break;
        }
    }
    rankArray = '';
    return {
        value: g_cards[previousSuit + jokerReArrangeValue].rank,
        key: reArrangeKey
    };
};

var getCardRankArray = function (cardArray) {
    var cardRankArray = [];
    for (var key in cardArray) {
        if (cardArray.hasOwnProperty(key)) {
            cardRankArray[key] = g_cards[cardArray[key]].rank;
        }
    }
    return cardRankArray;
};


/**
 This function is used to check whether the cards are Royal/Straight flush. If the sum of cards are 60 then it is Royal Flush otherwise it is straight flush.

 arg isJokerPresent The value of this variable is true/false. If it is true, we need to replace the joker with a card value to maintain the Straight.
 arg cardArray The argument card array contains the sorted card values

 return JSON This contains the rank and an array which contains card ranks of the selected cards.
 **/
var getRoyalStraightFlushRank = function (isJokerPresent, cardArray) {
    var rank = 0;
    var jokerReArrangeValue = '';
    var cardRankArray = [];
    cardRankArray = getCardRankArray(cardArray);
    if (isJokerPresent) {
        jokerReArrangeValue = checkForJokerReplacementValue(cardArray);
        // cardArrayCopy[4] = jokerReArrangeValue;
        cardRankArray[4] = jokerReArrangeValue.value;
        cardRankArray = sortArray(cardRankArray);
        cardArray = replaceJoker(cardArray, jokerReArrangeValue.key);
    }
    var totalSum = cardRankArray[0] + cardRankArray[1] + cardRankArray[2] + cardRankArray[3] + cardRankArray[4];
    rank = totalSum === 60 ? g_rankOrder.royal_flush.rank : g_rankOrder.straight_flush.rank;
    return {
        rnk: rank,
        data: cardRankArray,
        restofData: [],
        actualArray: cardArray.reverse()
    };
};

/**
 This function is used to get flush card ranks.

 arg isJokerPresent The value of this variable is true/false. If it is true, we need to replace the joker with a card value to maintain the flush value.
 arg cardArray The argument card array contains the sorted card values

 return JSON This contains the rank and an array which contains card ranks of the selected cards.
 **/
var getFlushRank = function (isJokerPresent, cardArray) {
    var jokerReArrangeValue = '';
    var rank = 0;
    var cardRankArray = [];
    cardRankArray = getCardRankArray(cardArray);
    if (isJokerPresent) {
        jokerReArrangeValue = checkForJokerReplacementFlushValue(cardArray);
        cardRankArray[4] = jokerReArrangeValue.value;
        cardRankArray = sortArray(cardRankArray);
        cardArray = replaceJokerForFlush(cardArray, jokerReArrangeValue.key);
    }
    rank = g_rankOrder.flush.rank;
    return {
        rnk: rank,
        data: cardRankArray,
        restofData: [],
        actualArray: cardArray.reverse()
    };
};

/**
 This function is used to get flush card ranks.

 arg isJokerPresent The value of this variable is true/false. If it is true, we need to replace the joker with a card value to maintain the Straight.
 arg cardArray The argument card array contains the sorted card values

 return JSON This contains the rank and an array which contains card ranks of the selected cards.
 **/
var getStraightRank = function (isJokerPresent, cardArray) {
    var jokerReArrangeValue = '';
    var cardRankArray = [];
    cardRankArray = getCardRankArray(cardArray);
    if (isJokerPresent) {
        jokerReArrangeValue = checkForJokerReplacementValue(cardArray);
        cardRankArray[4] = jokerReArrangeValue.value;
        cardRankArray = sortArray(cardRankArray);
        cardArray = replaceJoker(cardArray, jokerReArrangeValue.key);
    }
    var rank = g_rankOrder.straight.rank;
    return {
        rnk: rank,
        data: cardRankArray,
        restofData: [],
        actualArray: cardArray.reverse()
    };

};

var replaceJoker = function (cardData, replacePosition) {
    var cardDataLength = cardData.length;
    for (var key = cardDataLength - 1; key > replacePosition; --key) {
        cardData[key + 1] = cardData[key];
    }
    cardData[replacePosition + 1] = 'jo15';
    return cardData;
};

var replaceJokerForFlush = function (cardData, replacePosition) {
    var positions = [3, 2, 1, 0];
    var cardDataLength = cardData.length;
    replacePosition = positions[replacePosition];
    for (var key = replacePosition + 1; key < cardDataLength; ++key) {
        cardData[key + 1] = cardData[key];
    }
    cardData[replacePosition + 1] = 'jo15';
    return cardData;
};

var sortArray = function (cardArray) {
    cardArray.sort(function (a, b) {
        return +/\d+/.exec(a)[0] - +/\d+/.exec(b)[0];
    });
    return cardArray;
};

var reverseSortArray = function (cardArray) {
    cardArray.sort(function (a, b) {
        return +/\d+/.exec(b)[0] - +/\d+/.exec(a)[0];
    });
    return cardArray;
};
/**
 This function is used to find the Five card rank. At the very first, we would do a Natural sorting for card array. Then check for the availability of Joker. Then do a simple checking to understand it is straight , flush. If both the it will be Royal/Straight flush. So call the curresponding function by passing the arguments. If it is only flush then call the flush function. Else call the Straight function. Otherwise do a call for checking for Pair.

 arg cardArray The argument card array contains the sorted card values

 return JSON This contains the rank and an array which contains card ranks of the selected cards.
 **/
var checkFiveRankingGroups = function (cardArray) {
    var rank = [];
    cardArray = sortArray(cardArray);

    rank = chekForStraightFlushSpecialCase(cardArray);
    if (rank.status === true) {
        return rank;
    }
    rank = [];
    var isJokerPresent = checkForJoker(cardArray);


    var isStraightCards = '';
    if (isJokerPresent) {
        cardArray.pop();
        isStraightCards = chekForStraightIfJokerPresent(cardArray);
    } else {
        isStraightCards = chekForStraight(cardArray);

    }
    var isFlushedCards = checkForFlush(cardArray);
    if (isFlushedCards && isStraightCards) { // alert('sss');
        rank = getRoyalStraightFlushRank(isJokerPresent, cardArray);
        return rank;
    }
    if (isFlushedCards && !isStraightCards) { // alert('s');
        rank = getFlushRank(isJokerPresent, cardArray);
        return rank;
    }
    if (isStraightCards) { // alert('s1');
        rank = getStraightRank(isJokerPresent, cardArray);
        return rank;
    }
    var cardArrayRanks = getCardRankArray(cardArray);
    if (isJokerPresent) {
        cardArrayRanks[4] = 14;
        cardArray[4] = 'jo15';
    }
    rank = checkForPair(cardArrayRanks, cardArray);
    return rank;
};


var compareRank = function (playerData, dealerData) {
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

var getGameSubRank = function (handRnkObj) {

    if (handRnkObj.rnk === g_rankOrder.no_pair.rank) {
        if (handRnkObj.restofData.length === 0) {
            return handRnkObj.data[handRnkObj.data.length - 1];
        } else {
            return handRnkObj.restofData[handRnkObj.restofData.length - 1];
        }
    }
    if (handRnkObj.rnk === g_rankOrder.one_pair.rank) {
        return handRnkObj.data[0];
    }
    return 0;
};

GameLogic.prototype.getDealerCardResult = function (result) {
    var dealerFiveRankObj = checkFiveRankingGroups(result.fiveCards);
    dealerFiveRankObj.sub_rnk = getGameSubRank(dealerFiveRankObj);
    var dealerFiveCards = dealerFiveRankObj.actualArray;


    var dealerTwoRankObj = checkTwoRankingGroups(result.twoCards);
    dealerTwoRankObj.sub_rnk = getGameSubRank(dealerTwoRankObj);
    var dealerTwoCards = reverseSortArray(dealerTwoRankObj.actualArray);

    return {
        dealerFiveRankObj: dealerFiveRankObj,
        dealerFiveCards: dealerFiveCards,
        dealerTwoRankObj: dealerTwoRankObj,
        dealerTwoCards: dealerTwoCards
    };

};

GameLogic.prototype.getPlayerCardResult = function (params) {
    var g_playerFiveRankObj = checkFiveRankingGroups(params.playerFiveCards);
    g_playerFiveRankObj.sub_rnk = getGameSubRank(g_playerFiveRankObj);
    params.playerFiveCards = g_playerFiveRankObj.actualArray;

    var g_playerTwoRankObj = checkTwoRankingGroups(params.playerTwoCards);
    g_playerTwoRankObj.sub_rnk = getGameSubRank(g_playerTwoRankObj);
    params.playerTwoCards = reverseSortArray(g_playerTwoRankObj.actualArray);

    return {
        playerFiveRankObj: g_playerFiveRankObj,
        playerFiveCards: params.playerFiveCards,
        playerTwoRankObj: g_playerTwoRankObj,
        playerTwoCards: params.playerTwoCards
    };
};


GameLogic.prototype.getFiveCardResultText = function (g_playerFiveRankObj, dealerFiveRankObj) {
    var status = '';
    if (g_playerFiveRankObj.rnk < dealerFiveRankObj.rnk) {
        status = "player";
    } else if (g_playerFiveRankObj.rnk > dealerFiveRankObj.rnk) {
        status = "dealer";
    } else {
        status = compareRank(g_playerFiveRankObj.data, dealerFiveRankObj.data);
        if (status === 'equal' && (g_playerFiveRankObj.rnk === 9 || g_playerFiveRankObj.rnk === 10 || g_playerFiveRankObj.rnk === 11)) {
            status = compareRank(g_playerFiveRankObj.restofData, dealerFiveRankObj.restofData);
        }
    }
    return status;
};


var getTwoCardResultText = function (g_playerTwoRankObj, dealerTwoRankObj) {
    var status = '';

    if (g_playerTwoRankObj.rnk < dealerTwoRankObj.rnk) {
        status = "player";
    } else if (g_playerTwoRankObj.rnk > dealerTwoRankObj.rnk) {
        status = "dealer";
    } else {
        status = compareRank(g_playerTwoRankObj.data, dealerTwoRankObj.data);
    }
    // alert(status);
    return status;
};
GameLogic.prototype.getTwoCardResultText = getTwoCardResultText;

/**
 This function is used to find the Five card rank. At the very first, we would do a Natural sorting for card array. Then check for the availability of Joker.

 arg cardArray The argument card array contains the sorted card values

 return JSON This contains the rank and an array which contains card ranks of the selected cards.
 **/
var checkTwoRankingGroups = function (cardArray) {
    /*cardArray.sort(function(a, b) {
     return +/\d+/.exec(a)[0] - +/\d+/.exec(b)[0];
     });*/
    cardArray = sortArray(cardArray);
    var isJokerPresent = checkForJoker(cardArray);
    var rank = '';
    // var isStraightCards = '';
    var firstValue = g_cards[cardArray[0]].rank;
    var secondValue = g_cards[cardArray[1]].rank;
    if (isJokerPresent) {
        secondValue = 14;
    }
    var cardArrayValueFirst = cardArray[0];
    var cardArrayValueSec = cardArray[1];

    cardArray[0] = firstValue;
    cardArray[1] = secondValue;
    if (firstValue === secondValue) {
        rank = g_rankOrder.one_pair.rank;
        cardArray.pop();
    } else {
        rank = g_rankOrder.no_pair.rank;
    }
    // alert(cardArrayBack+'sss');
    return {
        rnk: rank,
        data: cardArray,
        restofData: [],
        actualArray: [cardArrayValueFirst, cardArrayValueSec]
    };
};

GameLogic.prototype.checkHighestSecondHighestValidation = function (g_playerFiveRankObj, g_playerTwoRankObj) {
    var maxFiveHand, maxTwoHand;
    if (g_playerFiveRankObj.rnk > g_playerTwoRankObj.rnk) {
        return false;
    } else if (g_playerFiveRankObj.rnk === g_playerTwoRankObj.rnk && g_playerFiveRankObj.rnk === 11) {
        maxFiveHand = Math.max.apply(null, g_playerFiveRankObj.restofData);
        maxTwoHand = Math.max.apply(null, g_playerTwoRankObj.data);
        g_playerTwoRankObj.data = sortArray(g_playerTwoRankObj.data);
        var twoCardHighest = g_playerTwoRankObj.data[1];
        var twoCardLowest = g_playerTwoRankObj.data[0];
        var fiveCardHighest = g_playerFiveRankObj.restofData[4];
        var fiveCardSecHighest = g_playerFiveRankObj.restofData[3];

        if (fiveCardHighest < twoCardHighest) { // alert(fiveCardSecHighest+ '  '+twoCardHighest);
            return false;
        }
        if (fiveCardHighest === twoCardHighest && twoCardLowest >= fiveCardSecHighest) { // alert('0o');
            return false;
        }
    } else if (g_playerFiveRankObj.rnk === g_playerTwoRankObj.rnk && g_playerFiveRankObj.rnk === 10) {
        maxFiveHand = Math.max.apply(null, g_playerFiveRankObj.data);
        maxTwoHand = Math.max.apply(null, g_playerTwoRankObj.data);
        // alert(maxFiveHand+' '+maxTwoHand);
        if (maxTwoHand > maxFiveHand) {
            return false;
        }
    } else if (g_playerFiveRankObj.rnk === g_playerTwoRankObj.rnk) {
        return false;
    }
    return true;
};

GameLogic.prototype.parseHandCards = function (cards) {
    var newFormat = [];
    for (var card in cards) {
        if (cards.hasOwnProperty(card)) {
            var rank = cards[card].rank;
            var value = this.getValue(rank) + 2;
            if (value === 15) {
                newFormat.push('jo15');
                continue;
            }
            newFormat.push(cards[card].suit.toLowerCase() + value);
        }
    }
    return newFormat;
};

GameLogic.prototype.standardizeHandCards = function (cards) {
    var newFormat = [];
    for (var card in cards) {
        if (cards.hasOwnProperty(card)) {
            if (cards[card] === 'jo15') {
                newFormat.push({rank: 'JO'});
                continue;
            }
            var rank = this.getRank(parseInt(cards[card].substring(1)));
            newFormat.push({rank: rank, suit: cards[card][0].toUpperCase()});
        }
    }
    return newFormat;
};

var ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A', 'JO'];
GameLogic.prototype.getValue = function (rank) {
    var value = ranks.indexOf(rank);
    if (value !== -1) {
        return value;
    }
};

GameLogic.prototype.getRank = function (value) {
    var rank = ranks[value - 2];
    return rank;
};

GameLogic.prototype.getResult = function (cardsForDealer, playerHand, wager, isHouseWay) {
    cardsForDealer = this.parseHandCards(cardsForDealer);
    var playerInitCards = playerHand.initCards;
    var playerFiveCards;
    var playerTwoCards;
    if (isHouseWay) {
        playerHand = this.init(this.parseHandCards(playerHand.initCards));
        playerFiveCards = playerHand.fiveCards;
        playerTwoCards = playerHand.twoCards;
    } else {
        playerFiveCards = this.parseHandCards(playerHand.fiveCards);
        playerTwoCards = this.parseHandCards(playerHand.twoCards);
    }
    var dealerHand = this.init(cardsForDealer);
    playerHand = this.getPlayerCardResult({
        playerFiveCards: playerFiveCards,
        playerTwoCards: playerTwoCards
    });
    var validSplit = this.checkHighestSecondHighestValidation(playerHand.playerFiveRankObj, playerHand.playerTwoRankObj);
    if (!validSplit) {
        throw new HTTPError(400, 'two cards hand should not be higher than five cards hand');
    }
    dealerHand = this.getDealerCardResult(dealerHand);

    var fiveResult = this.getFiveCardResultText(playerHand.playerFiveRankObj, dealerHand.dealerFiveRankObj);
    var twoResult = this.getTwoCardResultText(playerHand.playerTwoRankObj, dealerHand.dealerTwoRankObj);
    playerHand.fiveCardsResult = fiveResult;
    playerHand.twoCardsResult = twoResult;
    playerHand.fiveCards = this.standardizeHandCards(playerHand.playerFiveCards);
    playerHand.twoCards = this.standardizeHandCards(playerHand.playerTwoCards);
    playerHand.initCards = playerInitCards;
    dealerHand.fiveCards = this.standardizeHandCards(dealerHand.dealerFiveCards);
    dealerHand.twoCards = this.standardizeHandCards(dealerHand.dealerTwoCards);
    dealerHand.initCards = this.standardizeHandCards(cardsForDealer);
    var winTimes = 0;
    if (twoResult === 'player') {
        winTimes++;
    }
    if (fiveResult === 'player') {
        winTimes++;
    }
    var isWin = winTimes === 2 ? true : false;
    var isPush = winTimes === 1 ? true : false;
    var payout = 0;
    if (isWin) {
        payout = wager * 2;
    } else if (isPush) {
        payout = wager;
    }
    playerHand.twoRankObj = playerHand.playerTwoRankObj;
    playerHand.fiveRankObj = playerHand.playerFiveRankObj;
    dealerHand.twoRankObj = dealerHand.dealerTwoRankObj;
    dealerHand.fiveRankObj = dealerHand.dealerFiveRankObj;
    return {
        fiveCardsResult: fiveResult,
        twoCardsResult: twoResult,
        dealerHand: dealerHand,
        playerHand: playerHand,
        isWin: isWin,
        isPush: isPush,
        payout: payout
    };
};

GameLogic.prototype.getUnshuffledCards = function () {
    var cards = [];
    for (var cardNum = 0; cardNum < 13; cardNum++) {
        for (var type = 0; type < 4; type++) {
            var suit = "";
            var rank = "";
            suit = this.getCardSuit(type);
            rank = this.getCardRank(cardNum);
            var card = {suit: suit, rank: rank};
            cards.push(card);
        }
    }
    cards.push({rank: 'JO'});
    return cards;
};

GameLogic.prototype.getCardRank = function (order) {
    var cards = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A", "JO"];
    return cards[order];
};

GameLogic.prototype.getCardSuit = function (order) {
    var suits = ["C", "D", "H", "S"];
    return suits[order];
};

GameLogic.prototype.getShuffledCards = function (seed, cards) {
    cards = provable.seededShuffle(seed, cards);
    var validCards = [];
    for (var i = 0; i < cards.length; i++) {
        if (cards[i] !== undefined) {
            validCards.push(cards[i]);
        }
    }
    return validCards;
};

GameLogic.prototype.initHands = function (seed) {
    var unshuffledCards = this.getUnshuffledCards();
    var cards = this.getShuffledCards(seed, unshuffledCards);
    var allCards = cards.slice();
    var playerCards = [];
    var dealerCards = [];
    for (var j = 0; j < 7; j++) {
        playerCards.push(cards.pop());
    }
    for (var i = 0; i < 7; i++) {
        dealerCards.push(cards.pop());
    }
    return {
        playerCards: playerCards,
        dealerCards: dealerCards,
        allCards: allCards
    };
};

module.exports = GameLogic;
