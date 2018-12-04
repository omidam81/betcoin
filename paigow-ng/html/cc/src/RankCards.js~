/**
   This function is used to check whether the cards are straight or not. If it is straight that means it is straight (Royal/straight/straight) 

   arg cardArray The argument card array contains the sorted card values

   return boolean status Will return true or false based on card rank. 
**/
var chekForStraight = function (cardArray) {
   var status = false;
   if (g_cards[cardArray[0]].rank+1 == g_cards[cardArray[1]].rank && g_cards[cardArray[1]].rank+1 == g_cards[cardArray[2]].rank && g_cards[cardArray[2]].rank+1 == g_cards[cardArray[3]].rank ) {
       status = true;
       if (cardArray.length == 5 && g_cards[cardArray[3]].rank+1 != g_cards[cardArray[4]].rank) {
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
   
   if (fifthValue == 15) {
        cardArray.pop();        
    }
    var flushStatus = checkForFlush(cardArray);
    var rank = (flushStatus == true) ?g_rankOrder['straight_flush'].rank : g_rankOrder['straight'].rank;
    if (fifthValue == 15) {
        cardArray[4] = 'jo15';
    }
    if (firstValue == 2 && secValue == 3 && thirdValue == 4 && fourthValue == 5 && (fifthValue == 14 || fifthValue == 15)) {
       return {status:true, rnk:rank, data:[firstValue,fourthValue,thirdValue,secValue,14], actualArray:[cardArray[4],cardArray[0],cardArray[1],cardArray[2],cardArray[3]]};
   }
   
   if (fifthValue != 15) {
       return {status:false, data:[], actualArray:[]};
   }
   // alert(fourthValue+' ss '+fifthValue);
   if(firstValue != 2 && firstValue != 3) {
      return {status:false, data:[], actualArray:[]};
   }
   if (firstValue == 3 && secValue == 4 && thirdValue == 5 && fourthValue == 14) {
       return {status:true, rnk:rank, data:[2,thirdValue,secValue,firstValue,fourthValue], actualArray:[cardArray[3],cardArray[4],cardArray[0],cardArray[1],cardArray[2]]};
   }
   if(firstValue == 2 && secValue == 3 && thirdValue == 4 && fourthValue == 14) {
      return {status:true, rnk:rank, data:[firstValue,5,thirdValue,secValue,fourthValue], actualArray:[cardArray[3],cardArray[0],cardArray[1],cardArray[2],cardArray[4]]};
   }
   if(firstValue == 2 && secValue == 4 && thirdValue == 5 && fourthValue == 14) {
      return {status:true, rnk:rank, data:[firstValue,thirdValue,secValue,3,fourthValue], actualArray:[cardArray[3],cardArray[0],cardArray[4],cardArray[1],cardArray[2]]};
   }
   if(firstValue == 2 && secValue == 3 && thirdValue == 5 && fourthValue == 14) {
      return {status:true, rnk:rank, data:[firstValue,thirdValue,4,secValue,fourthValue], actualArray:[cardArray[3],cardArray[0],cardArray[1],cardArray[4],cardArray[2]]};
   }
   return {status:false, data:[], actualArray:[]};
};


var chekForStraightIfJokerPresent = function(cardArray) {
    var status = true;
    var nextVal = '';
    var misFlag = false;
    for (key in cardArray) {
       if (cardArray.length  == parseInt(key) +1) {
           break;
       }  
       nextVal = g_cards[cardArray[parseInt(key) + 1]].rank;
       if (g_cards[cardArray[key]].rank + 1 !=  nextVal && g_cards[cardArray[key]].rank + 2 != nextVal) {
           status = false;
           break;
       }
       else if (!misFlag && g_cards[cardArray[key]].rank + 1 !=  nextVal && g_cards[cardArray[key]].rank + 2 == nextVal) {
           misFlag = true;
       }
       else if (misFlag && g_cards[cardArray[key]].rank + 1 !=  nextVal && g_cards[cardArray[key]].rank + 2 == nextVal) {
          status = false;
          break;
       }
    }
    return status;
}


/**
   This function is used to check whether the cards suits  are equal or not. If it is equal that means it is flush (Royal/straight/flush) 

   arg cardArray The argument card array contains the sorted card values

   return boolean status Will return true or false based on suit. 
**/
var checkForFlush = function(cardArray) {
    var status = false;
    if (g_cards[cardArray[0]].suit == g_cards[cardArray[1]].suit && g_cards[cardArray[1]].suit == g_cards[cardArray[2]].suit && g_cards[cardArray[2]].suit == g_cards[cardArray[3]].suit && g_cards[cardArray[3]].suit == g_cards[cardArray[cardArray.length - 1]].suit) {
        status = true;
    }
    return status;
}

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
   var restOfArray = []; 
   var actualPairArray = [];
   var actualNonPairArray = [];
   for (key in cardArray) { 
       if (cardArray.length == parseInt(key) +1 && equalFlag == true && count) {
          sortCount.push(count);
          sortArrayValue.push(cardArray[parseInt(key)]);
          actualPairArray.push(cardArrayOriginal[key]);
       }
       else if (cardArray[key] == cardArray[parseInt(key) + 1] && cardArray.length != parseInt(key) +1) {    
          ++count;
          actualPairArray.push(cardArrayOriginal[key]);
          equalFlag = true;
       }
       else if (equalFlag == true) { 
          sortCount.push(count);
          sortArrayValue.push(cardArray[parseInt(key)]);
          actualPairArray.push(cardArrayOriginal[key]);
          equalFlag = false;
          count = 0;
       }
       else { 
           restOfArray.push(cardArray[key]);
           actualNonPairArray.push(cardArrayOriginal[key]);
       }
   }

   // actualNonPairArray = reverseSortArray(actualNonPairArray);
   // actualPairArray = reverseSortArray(actualPairArray);

   
   
   // alert(actualPairArray+' pair '+actualNonPairArray);
   
   rank = rankForPair(sortCount, sortArrayValue, actualPairArray);
   cardArray = '';
   // restOfArray.sort();
  //  alert(actualPairArray);
   actualNonPairArray = sortArray(actualNonPairArray);
   // actualNonPairArray = sortArray(actualNonPairArray);
   // akert()
   for(var nonPairLength = actualNonPairArray.length -1;nonPairLength >= 0;--nonPairLength) {
      rank.actualArray.push(actualNonPairArray[nonPairLength]);
   } 
  
   actualNonPairArray = [];
   rank.restofData = restOfArray;
   // rank.actualArray = actualPairArray;
   //  alert(rank.actualArray+' 1 '+rank.data+' 2 '+rank.restofData+' s ');
   actualPairArray = [];
   // return {rnk:rank, data:sortArray, restofData: restOfArray};
   return rank;
}


/**
   This function is used to get the rank of each pair group.

   arg sortCount Contains the repeated count of each card
   arg sortArray Contains the repeated card values
    
   return JSON This contains the rank and an array which contains card ranks of the selected cards. 
**/
var rankForPair = function(sortCount, sortArray, actualPairArray) {
   var maxRepeatCout = Math.max.apply(null, sortCount);
   var rank = 0;
   if (sortCount.length == 0) {
        rank = g_rankOrder['no_pair'].rank;
   }
   else if (maxRepeatCout == 4) {
        rank = g_rankOrder['five_of_a_kind'].rank;
   }
   else if (maxRepeatCout == 3) {
        rank = g_rankOrder['four_of_a_kind'].rank;
   }
   else if (maxRepeatCout == 2 && sortCount.length == 2) {
        if (sortCount[0] < sortCount[1]) {
           sortArray[0] = sortArray[0] + sortArray[1];
           sortArray[1] = sortArray[0] - sortArray[1]
           sortArray[0] = sortArray[0] - sortArray[1];
           actualPairArray = actualPairArray.reverse();
        }
        // alert(sortArray);
        rank = g_rankOrder['full_house'].rank;
   }
   else if (maxRepeatCout == 2 && sortCount.length == 1) {
        rank = g_rankOrder['three_of_a_kind'].rank;
   }
   else if (maxRepeatCout == 1 && sortCount.length == 2) {
      rank = g_rankOrder['two_pairs'].rank; 
      // alert(sortArray);
      actualPairArray = reverseSortArray(actualPairArray);
      // alert(sortArray);
   }
   else if (maxRepeatCout == 1) {
       rank = g_rankOrder['one_pair'].rank;
   }
   return {rnk:rank, data:sortArray, actualArray:actualPairArray};
}

/**
   This function is used to check whether there‎ is a Joker present or Not.
   The predefined value for the Joker is 15. THis is the highest value. 

   arg cardArray The argument card array contains the sorted card values

   return boolean status Will return true or false based on the Joker availability. 
**/
var checkForJoker = function(cardArray) {
    var status = false;
    // alert(cardArray);
    if (g_cards[cardArray[cardArray.length - 1]].rank == 15) {
        status = true;
    }
    return status;
}


var checkForJokerReplacementValue = function(cardArray) {
   var misFlag = false;
   var jokerReArrangeValue = 0; 
   var reArrangeKey = 0;
   for (key in cardArray) { 
       if (jokerReArrangeValue && cardArray.length == parseInt(key) +1) {
          break;
       }
       else if (cardArray.length == parseInt(key) +1) {
           if (g_cards[cardArray[key]].rank == '14') {
              jokerReArrangeValue = g_cards[cardArray[0]].rank - 1;
              reArrangeKey = -1;
           }
           else {
               jokerReArrangeValue = g_cards[cardArray[key]].rank+1;
               reArrangeKey = parseInt(key);
               // misFlag = true;
           }
           break;
       }       
       else if (cardArray.length != parseInt(key) +1 && g_cards[cardArray[key]].rank +1 ==  g_cards[cardArray[parseInt(key) + 1]].rank) {
           continue;
       }
       else if (g_cards[cardArray[key]].rank + 2 ==  g_cards[cardArray[parseInt(key) + 1]].rank && !misFlag) {
           misFlag = true;
           jokerReArrangeValue = g_cards[cardArray[key]].rank+1;
           reArrangeKey = parseInt(key);
       }
       else if (g_cards[cardArray[key]].rank + 2 ==  g_cards[cardArray[parseInt(key) + 1]].rank && misFlag) {
           // misFlag = true;
           jokerReArrangeValue = 0;
           reArrangeKey = 0;
           break;
       }
 
   }
   return {value:jokerReArrangeValue, key:reArrangeKey};
}


var checkForJokerReplacementFlushValue = function(cardArray) {
   var previousSuit = g_cards[cardArray[0]].suit;
   var jokerReArrangeValue = '';
   var reArrangeKey = 0;
   /*if (g_cards[cardArray[0]].suit == g_cards[cardArray[1]].suit == g_cards[cardArray[2]].suit == g_cards[cardArray[3]].suit == g_cards[cardArray[4]].suit) {
        previousSuit = g_cards[cardArray[0]].suit;
   }
   if (!previousSuit) {
       return false;
   }*/
   var rankArray = [];
   rankArray.push(g_cards[cardArray[3]].rank);
   rankArray.push(g_cards[cardArray[2]].rank);
   rankArray.push(g_cards[cardArray[1]].rank);
   rankArray.push(g_cards[cardArray[0]].rank);
   for (key in rankArray) {
       if (rankArray.length == parseInt(key) +1) {
           jokerReArrangeValue = rankArray[key] - 1;
           reArrangeKey = parseInt(key);
           break;
       }
       else if (rankArray[key] != 14) {
           jokerReArrangeValue = 14; 
           reArrangeKey = parseInt(key);
           break;
       }
       else if (rankArray[key]  ==  rankArray[parseInt(key) + 1]+1) {
           continue;
       }       
       else {
           jokerReArrangeValue = rankArray[key] - 1;
           reArrangeKey = parseInt(key) + 1;
           break; 
       }
   }
   rankArray = '';
   return {value:g_cards[previousSuit+jokerReArrangeValue].rank, key:reArrangeKey};
}

var getCardRankArray = function(cardArray) {
    var cardRankArray= [];
    for (key in cardArray) { 
       cardRankArray[key] = g_cards[cardArray[key]].rank;
    }
    return cardRankArray;
}


/**
   This function is used to check whether the cards are Royal/Straight flush. If the sum of cards are 60 then it is Royal Flush otherwise it is straight flush. 

   arg isJokerPresent The value of this variable is true/false. If it is true, we need to replace the joker with a card value to maintain the Straight.
   arg cardArray The argument card array contains the sorted card values
    
   return JSON This contains the rank and an array which contains card ranks of the selected cards. 
**/
var  getRoyalStraightFlushRank = function(isJokerPresent, cardArray) {
    var rank = 0;
    var jokerReArrangeValue = '';
    var cardRankArray= [];
    /*var cardArrayCopy = [];
    if (isJokerPresent) {
       cardArrayCopy = cardArray;
       cardArray.pop();
    }*/
    cardRankArray = getCardRankArray(cardArray);
    if (isJokerPresent) {
        jokerReArrangeValue = checkForJokerReplacementValue(cardArray);
        // cardArrayCopy[4] = jokerReArrangeValue;    
        cardRankArray[4] = jokerReArrangeValue.value;    
        cardRankArray = sortArray(cardRankArray);
        cardArray = replaceJoker(cardArray, jokerReArrangeValue.key);
    }
    var totalSum = cardRankArray[0] + cardRankArray[1] + cardRankArray[2] + cardRankArray[3] + cardRankArray[4];
    rank = totalSum == 60 ? g_rankOrder['royal_flush'].rank: g_rankOrder['straight_flush'].rank;
    // alert(cardRankArray);
    return {rnk:rank, data:cardRankArray,  restofData:[], actualArray:cardArray.reverse()};
}

/**
   This function is used to get flush card ranks.

   arg isJokerPresent The value of this variable is true/false. If it is true, we need to replace the joker with a card value to maintain the flush value.
   arg cardArray The argument card array contains the sorted card values
    
   return JSON This contains the rank and an array which contains card ranks of the selected cards. 
**/
var getFlushRank = function(isJokerPresent, cardArray) {
    var jokerReArrangeValue = '';
    var rank = 0;
    var cardRankArray= [];
    /*var cardArrayCopy = [];
    if (isJokerPresent) {
       cardArrayCopy = cardArray;
       cardArray.pop();
    }*/
    cardRankArray = getCardRankArray(cardArray);
    if (isJokerPresent) {
        jokerReArrangeValue = checkForJokerReplacementFlushValue(cardArray);
        cardRankArray[4] = jokerReArrangeValue.value;
        cardRankArray = sortArray(cardRankArray); 
        cardArray = replaceJokerForFlush(cardArray, jokerReArrangeValue.key);
    }
    rank = g_rankOrder['flush'].rank;
    return {rnk:rank, data:cardRankArray,  restofData:[], actualArray:cardArray.reverse()};
}

/**
   This function is used to get flush card ranks.

   arg isJokerPresent The value of this variable is true/false. If it is true, we need to replace the joker with a card value to maintain the Straight.
   arg cardArray The argument card array contains the sorted card values
    
   return JSON This contains the rank and an array which contains card ranks of the selected cards. 
**/
var getStraightRank = function(isJokerPresent, cardArray) {
    var jokerReArrangeValue = '';
    var cardRankArray= [];
    /*var cardArrayCopy = [];
    if (isJokerPresent) {
       cardArrayCopy = cardArray;
       cardArray.pop();
    }*/
    cardRankArray = getCardRankArray(cardArray);
    if (isJokerPresent) {
        jokerReArrangeValue = checkForJokerReplacementValue(cardArray);
        cardRankArray[4] = jokerReArrangeValue.value;
        cardRankArray = sortArray(cardRankArray);
        cardArray = replaceJoker(cardArray, jokerReArrangeValue.key);
    }
    rank = g_rankOrder['straight'].rank;
    return {rnk:rank, data:cardRankArray, restofData:[], actualArray:cardArray.reverse()};

}

var replaceJoker = function(cardData, replacePosition) {
    // alert(cardData+'  '+replacePosition);
    var cardDataLength = cardData.length;
    for (key = cardDataLength - 1;key > replacePosition; --key) {
       cardData[key + 1] = cardData[key];
    }
    cardData[replacePosition+1] = 'jo15';
   // alert(cardData);
    return cardData;
}

var replaceJokerForFlush = function(cardData, replacePosition) {
    // alert(cardData+'  '+replacePosition);
    var positions = [3,2,1,0];
    var cardDataLength = cardData.length;
    replacePosition = positions[replacePosition]; 
    for (key = replacePosition+1;key < cardDataLength; ++key) {
       cardData[key + 1] = cardData[key];
    }
    cardData[replacePosition+1] = 'jo15';
    // alert(cardData);
    return cardData;
}

var sortArray = function(cardArray) {
    cardArray.sort(function(a, b) {
         return +/\d+/.exec(a)[0] - +/\d+/.exec(b)[0];
    });
    return cardArray;
}

var reverseSortArray = function(cardArray) {
    cardArray.sort(function(a, b) {
         return +/\d+/.exec(b)[0] - +/\d+/.exec(a)[0];
    });
    return cardArray;
}
/**
   This function is used to find the Five card rank. At the very first, we would do a Natural sorting for card array. Then check for the availability of Joker. Then do a simple checking to understand it is straight , flush. If both the it will be Royal/Straight flush. So call the curresponding function by passing the arguments. If it is only flush then call the flush function. Else call the Straight function. Otherwise do a call for checking for Pair. 

   arg cardArray The argument card array contains the sorted card values
    
   return JSON This contains the rank and an array which contains card ranks of the selected cards. 
**/
var checkFiveRankingGroups = function(cardArray) {
    /*cardArray.sort(function(a, b) {
         return +/\d+/.exec(a)[0] - +/\d+/.exec(b)[0];
    });*/
    var rank = [];
    cardArray = sortArray(cardArray); 

    rank = chekForStraightFlushSpecialCase(cardArray);
    // alert(rank.status + cardArray);
    if (rank.status == true) {
       return rank;
    }
    rank = [];
    var isJokerPresent = checkForJoker(cardArray);

    
    // var cardArrayCopy = [];
    var isStraightCards = '';
    if (isJokerPresent) {  // alert('ss');
       // cardArrayCopy = cardArray;
       cardArray.pop();
       isStraightCards = chekForStraightIfJokerPresent(cardArray);
    }
    else {
       isStraightCards = chekForStraight(cardArray);
       
    }
    // alert(isStraightCards+' '+cardArray);
    var isFlushedCards = checkForFlush(cardArray);
    // cardArray = cardArrayCopy;
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
    cardArrayRanks = getCardRankArray(cardArray);
    if (isJokerPresent) {
        cardArrayRanks[4] = 14;
        cardArray[4] = 'jo15';
    }
    return rank = checkForPair(cardArrayRanks, cardArray);
    
}



var compareRank = function(playerData, delearData) {
    var dataLength =  playerData.length;
    var status = "equal";
    for (key = dataLength - 1;key >= 0; --key) {
        if (delearData[key] > playerData[key]) {
           status = "delear";
           break;
        }
        if (delearData[key] < playerData[key]) {
           status = "player";
           break;
        }
    }
    return status;
}


/*var reverseArray = function(playerData, delearData) {
    var dataLength =  playerData.length;
    var status = "equal";
    for (key = dataLength - 1;key >= 0; --key) {

    }

}*/

var getDelearCardResult = function() {
    g_delearFiveRankObj = checkFiveRankingGroups(g_delearFiveCards);
      // alert(g_delearFiveRankObj.rnk+' =  '+g_delearFiveRankObj.data+' =  '+ g_delearFiveRankObj.restofData+' '+g_delearFiveRankObj.actualArray);
    
    g_delearFiveCards = g_delearFiveRankObj.actualArray; 
    
    g_delearTwoRankObj = checkTwoRankingGroups(g_delearTwoCards);
    g_delearTwoCards = reverseSortArray(g_delearTwoRankObj.actualArray); // alert(g_delearTwoCards);
    // alert('Delear = '+g_delearTwoRankObj.rnk+' =  '+g_delearTwoRankObj.data+' =  '+ g_delearTwoRankObj.restofData);

    
    
};

var getPlayerCardResult = function() {
    g_playerFiveRankObj = checkFiveRankingGroups(g_playerFiveCards);
     // alert(g_playerFiveRankObj.rnk+' =  '+g_playerFiveRankObj.data+' =  '+ g_playerFiveRankObj.restofData+' = '+g_playerFiveRankObj.actualArray);
    g_playerFiveCards = g_playerFiveRankObj.actualArray;
    g_playerTwoRankObj = checkTwoRankingGroups(g_playerTwoCards);
    g_playerTwoCards = reverseSortArray(g_playerTwoRankObj.actualArray); // alert(g_delearTwoCards);
    //  alert(g_playerTwoRankObj.rnk+' =  '+g_playerTwoRankObj.data+' =  '+ g_playerTwoRankObj.restofData);
};


var getFiveCardResultText = function() {
     var status = '';
     // alert(g_playerFiveRankObj.rnk+' =  '+g_playerFiveRankObj.data+' =  '+ g_playerFiveRankObj.restofData+' = '+g_playerFiveRankObj.actualArray);
     // alert(g_playerFiveRankObj.rnk+' '+g_delearFiveRankObj.rnk);
     if (g_playerFiveRankObj.rnk < g_delearFiveRankObj.rnk) {
         status = "player";
     }
     else if (g_playerFiveRankObj.rnk > g_delearFiveRankObj.rnk) {
         status = "delear";
     }
     else { // alert(g_playerFiveRankObj.data +' = s'+ g_delearFiveRankObj.data);
         status = compareRank(g_playerFiveRankObj.data, g_delearFiveRankObj.data);
        //  alert(status);
         if (status == 'equal' && (g_playerFiveRankObj.rnk == 9 || g_playerFiveRankObj.rnk == 10 || g_playerFiveRankObj.rnk == 11)) {
             status = compareRank(g_playerFiveRankObj.restofData, g_delearFiveRankObj.restofData);
         }
     }
     // alert(status);
     /*if (status == "player") {
         status = "Win";
     }
     else {
         status = "Loss";
     }*/
     return status;
};


var getTwoCardResultText = function() {
     var status = '';
    
     if (g_playerTwoRankObj.rnk < g_delearTwoRankObj.rnk) {
         status = "player";
     }
     else if (g_playerTwoRankObj.rnk > g_delearTwoRankObj.rnk) {
         status = "delear";
     }
     else {   // alert(g_playerTwoRankObj.restofData +' = '+ g_delearTwoRankObj.restofData);
         status = compareRank(g_playerTwoRankObj.data, g_delearTwoRankObj.data);
     }
     // alert(status);
     return status;
};

/**
   This function is used to find the Five card rank. At the very first, we would do a Natural sorting for card array. Then check for the availability of Joker. 

   arg cardArray The argument card array contains the sorted card values
    
   return JSON This contains the rank and an array which contains card ranks of the selected cards. 
**/
var checkTwoRankingGroups = function(cardArray) {
    /*cardArray.sort(function(a, b) {
         return +/\d+/.exec(a)[0] - +/\d+/.exec(b)[0];
    });*/
    cardArray = sortArray(cardArray); 
    var isJokerPresent = checkForJoker(cardArray);
    var rank = '';
    var isStraightCards = '';
    var firstValue = g_cards[cardArray[0]].rank;
    var secondValue =  g_cards[cardArray[1]].rank;
    if (isJokerPresent) { 
       secondValue = 14;
    }
    var cardArrayValueFirst = cardArray[0];
    var cardArrayValueSec = cardArray[1];
   
    cardArray[0] = firstValue
    cardArray[1] = secondValue
    if (firstValue == secondValue) {
        rank = g_rankOrder['one_pair'].rank;
        cardArray.pop();
    }    
    else {
        rank = g_rankOrder['no_pair'].rank;
    }
    // alert(cardArrayBack+'sss');
    return {rnk:rank, data:cardArray,  restofData:[], actualArray:[cardArrayValueFirst, cardArrayValueSec]}
}

var checkHighestSecondHighestValidation = function() {
   if (g_playerFiveRankObj.rnk > g_playerTwoRankObj.rnk) {
      return false;
   }
   else if (g_playerFiveRankObj.rnk == g_playerTwoRankObj.rnk && g_playerFiveRankObj.rnk == 11) { 
      var maxFiveHand = Math.max.apply(null, g_playerFiveRankObj.restofData);
      var maxTwoHand = Math.max.apply(null, g_playerTwoRankObj.data);  
      g_playerTwoRankObj.data = sortArray(g_playerTwoRankObj.data);
      var twoCardHighest = g_playerTwoRankObj.data[1];
      var twoCardLowest = g_playerTwoRankObj.data[0];
      var fiveCardHighest = g_playerFiveRankObj.restofData[4];
      var fiveCardSecHighest = g_playerFiveRankObj.restofData[3];
      // alert('ss '+twoCardHighest+' '+twoCardLowest+'   '+g_playerFiveRankObj.restofData);
      if (fiveCardHighest < twoCardHighest) { // alert(fiveCardSecHighest+ '  '+twoCardHighest);
          return false;
      }
      if (fiveCardHighest == twoCardHighest && twoCardLowest >= fiveCardSecHighest) { // alert('0o');
          return false;
      }
   }
   else if (g_playerFiveRankObj.rnk == g_playerTwoRankObj.rnk && g_playerFiveRankObj.rnk == 10) { 
      var maxFiveHand = Math.max.apply(null, g_playerFiveRankObj.data);
      var maxTwoHand = Math.max.apply(null, g_playerTwoRankObj.data);  
      // alert(maxFiveHand+' '+maxTwoHand);
      if (maxTwoHand > maxFiveHand) {
         return false;
      }
   }
   else if (g_playerFiveRankObj.rnk == g_playerTwoRankObj.rnk) {
      return false;
   }
   return true;
}


