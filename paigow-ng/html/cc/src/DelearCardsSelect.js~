
var delearCards = {};

delearCards.getFlushedArray = function(retFlushedArray) {
    var retValue = [];
    retValue.flushedArray = [];
    retValue.restOfArray = [];
    if (retFlushedArray['c'].length >= 4) {
       retValue.flushedArray = retFlushedArray['c'];
       retValue.restOfArray = this.moveRestOfCards(retFlushedArray['s'], retValue.restOfArray);
       retValue.restOfArray = this.moveRestOfCards(retFlushedArray['h'], retValue.restOfArray);
       retValue.restOfArray = this.moveRestOfCards(retFlushedArray['d'], retValue.restOfArray);
    }
    else if (retFlushedArray['s'].length >= 4) {
       retValue.flushedArray = retFlushedArray['s'];
       retValue.restOfArray = this.moveRestOfCards(retFlushedArray['c'], retValue.restOfArray);
       retValue.restOfArray = this.moveRestOfCards(retFlushedArray['h'], retValue.restOfArray);
       retValue.restOfArray = this.moveRestOfCards(retFlushedArray['d'], retValue.restOfArray);
    }
    else if (retFlushedArray['d'].length >= 4) {
       retValue.flushedArray = retFlushedArray['d'];
       retValue.restOfArray = this.moveRestOfCards(retFlushedArray['c'], retValue.restOfArray);
       retValue.restOfArray = this.moveRestOfCards(retFlushedArray['h'], retValue.restOfArray);
       retValue.restOfArray = this.moveRestOfCards(retFlushedArray['s'], retValue.restOfArray);
    }
    else if (retFlushedArray['h'].length >= 4) {
       retValue.flushedArray = retFlushedArray['h'];
       retValue.restOfArray = this.moveRestOfCards(retFlushedArray['s'], retValue.restOfArray);
       retValue.restOfArray = this.moveRestOfCards(retFlushedArray['c'], retValue.restOfArray);
       retValue.restOfArray = this.moveRestOfCards(retFlushedArray['d'], retValue.restOfArray);
    }
    retFlushedArray = ''
    
    return retValue;
}
delearCards.init = function(cardArray) { 
    cardArray = this.sortCards(cardArray);
    // var cardArrayBack = cardArray;
   // 
  // alert(g_delearFiveCards+'ss '+g_delearTwoCards);
    // alert(cardArray);
    g_delearTwoCards = [];
    g_delearFiveCards = [];
    // cardArray = this.sortCards(cardArray);

    var status = this.chekForStraightFlushSpecialCase(cardArray);
    // alert(g_delearTwoCards+' s '+g_delearFiveCards);
    if(g_delearFiveCards.length == 5 && g_delearTwoCards.length == 2) {
        return;
    }
    jokerPresent = false;
    if (cardArray[cardArray.length -1] == 'jo15') {
        jokerPresent = true;
        cardArray.pop();
    }
    // alert(cardArray+' ss '+cardArrayBack);
    var retFlushedArray = this.checkForSuit(cardArray);
    // alert(retFlushedArray['d']);
    retValue = this.getFlushedArray(retFlushedArray);
    flushedArray = retValue.flushedArray;
    var flushRestOfArray = retValue.restOfArray;
     // alert(flushedArray+' values '+flushRestOfArray);
    var flush = true;
    var straight = true;
    if (flushedArray.length < 4 ) {
       flush = false;
    }
    if (!jokerPresent && flushedArray.length ==4 ) {
       flush = false;
    }
    var retValue = this.checkForStraight(cardArray, jokerPresent);
    var straightArrayBackCount = retValue.straightArrayBack.length;
    // alert(retValue.straightArray+' '+retValue.straightArrayBack+' '+straightArrayBackCount+' '+straight);
    var straightArrayCount = retValue.straightArray.length;
    if (straightArrayBackCount >=4) { 
        retValue.restOfArray = this.moveRestOfCards(retValue.straightArray, retValue.restOfArray);
        retValue.straightArray = retValue.straightArrayBack; // alert(straight);
        straightArrayCount = retValue.straightArray.length;
    }
    else if (straightArrayCount >=4) {
        retValue.restOfArray = this.moveRestOfCards(retValue.straightArrayBack, retValue.restOfArray);
    }
    else {
       straight = false;
    }
    if (!jokerPresent && straightArrayCount <=4 ) { // alert('sss');
       straight = false;
    }    

   //  alert(straight);
    if (!flush && !straight) {  
       //  retValue = this.delearCards.arrangeNoPair(cardArray);
        if (jokerPresent) {
            cardArray.push('jo15');
        }
         // alert('ss2'+cardArray);
        this.checkForRepeat(cardArray);
        if(g_delearFiveCards.length == 5 && g_delearTwoCards.length == 2) { // alert('repeat '+g_delearFiveCards+'ss '+g_delearTwoCards);
            return;
        }
        return;
    }
    else if (flush && !straight) {// alert('ss');
        this.arrangeFlushStraightCards(flushedArray, flushRestOfArray, jokerPresent, 'flush');
         // alert('flushed '+g_delearFiveCards+'ss '+g_delearTwoCards);
        return;
    }
    // alert('ss1');
    this.arrangeStraightCards(retValue.straightArray, retValue.restOfArray, jokerPresent, 'straight');
    // alert('straight '+g_delearFiveCards+'ss '+g_delearTwoCards);
};

delearCards.arrangeFlushStraightCards = function(arrayValues, cardRestOfArray, jokerPresent, flag) {
    arrayValues = this.sortCards(arrayValues);
    cardRestOfArray = this.sortCards(cardRestOfArray);
    // alert(arrayValues+' / '+cardRestOfArray);
       //   alert('flushed '+g_delearFiveCards+'ss '+g_delearTwoCards);   
    for(key=cardRestOfArray.length - 1; key >= 0; --key) {
       g_delearTwoCards.push(cardRestOfArray[key]);
    }   
    if (arrayValues.length >= 5) {
        count = 0;
        countLimit = 4;
        /*if (flag == 'straight' && jokerPresent) {
            countLimit = 3;
        }
        for(key=arrayValues.length - 1; count <=  countLimit; --key) {
           g_delearFiveCards.push(arrayValues[key]);
           arrayValues.pop();
           ++count
        }

        for(key=arrayValues.length - 1; key >= 0; --key) {
           g_delearTwoCards.push(arrayValues[key]);
           arrayValues.pop();
        }*/
 
       // alert('ss');
       if (flag == 'straight' && jokerPresent) {
            countLimit = 3;
        }
        for(key=0; key <=  countLimit; ++key) {
           g_delearFiveCards.push(arrayValues[key]);
           // arrayValues.pop();
           // ++count
        }    
        // alert(g_delearFiveCards); 
        for(key=countLimit + 1; key < arrayValues.length; ++key) {
           g_delearTwoCards.push(arrayValues[key]);
          // arrayValues.pop();
        }
    }
    else if (arrayValues.length == 4) {
        for(key=arrayValues.length - 1; key >= 0; --key) {
           g_delearFiveCards.push(arrayValues[key]);
           arrayValues.pop();
        }
        
    }
    // alert(jokerPresent+' '+)
    if (jokerPresent && g_delearFiveCards.length == 4) {
        g_delearFiveCards.push('jo15');
    }
    else if (jokerPresent && g_delearTwoCards.length == 1) {
        g_delearTwoCards.push('jo15');
    } 
    // alert(g_delearFiveCards);
    // alert('ok');
};

delearCards.arrangeStraightCards = function(arrayValues, cardRestOfArray, jokerPresent, flag) {
    arrayValues = this.sortCards(arrayValues);
    cardRestOfArray = this.sortCards(cardRestOfArray); 
    var status = false;
    for(key=cardRestOfArray.length - 1; key >= 0; --key) {
       g_delearTwoCards.push(cardRestOfArray[key]);
    }   
    var tempArray = [];
    //  alert(arrayValues.length);
    if (arrayValues.length == 7) { // alert(cardRestOfArray+' ss '+arrayValues);
        tempArray.push(arrayValues[0]);
        tempArray.push(arrayValues[1]);
        tempArray.push(arrayValues[2]);
        tempArray.push(arrayValues[3]);
        tempArray.push(arrayValues[4]);
        status = delearCards.chekForMiddleStraight(tempArray);
        /*if (!status) {
            tempArray.pop();
            status = delearCards.checkForMiddleStraightWithJoker(tempArray, jokerPresent);
        }
        if (status) {
            if (tempArray.length == 4) {
               tempArray.push('jo15');
               g_delearTwoCards.push(cardRestOfArray[5]);
            }
            else {
               g_delearTwoCards.push(cardRestOfArray[6]);
            }*/
            g_delearFiveCards  = tempArray;
            g_delearTwoCards.push(arrayValues[5]);
            g_delearTwoCards.push(arrayValues[6]);
            
        // }
    }
    else if (arrayValues.length == 6) { // alert('sssss');
         /*tempArray  = [];
         tempArray.push(arrayValues[1]);
         tempArray.push(arrayValues[2]);
         tempArray.push(arrayValues[3]);
         tempArray.push(arrayValues[4]);        
         status = delearCards.checkForMiddleStraightWithJoker(tempArray, jokerPresent);
         if (status && jokerPresent == true) {
             tempArray.push('jo15');
             g_delearTwoCards.push(arrayValues[0]);
             g_delearTwoCards.push(arrayValues[5]);
             g_delearFiveCards  = tempArray;

             return;
        }*/
        tempArray  = [];
        tempArray.push(arrayValues[0]);
        tempArray.push(arrayValues[1]);
        tempArray.push(arrayValues[2]);
        tempArray.push(arrayValues[3]);
        tempArray.push(arrayValues[4]);
        // alert(tempArray);
        status = delearCards.chekForMiddleStraight(tempArray);
        if (!status) {
            tempArray.pop();
            status = delearCards.checkForMiddleStraightWithJoker(tempArray, jokerPresent);
        }
        if (status) {
            if (tempArray.length == 4) {
               tempArray.push('jo15');
               g_delearTwoCards.push(arrayValues[4]);
               g_delearTwoCards.push(arrayValues[5]);
            }
            else {
               g_delearTwoCards.push(arrayValues[5]);
            }
            g_delearFiveCards  = tempArray;
        }
        else { // alert('sss');
            tempArray  = [];
            tempArray.push(arrayValues[1]);
            tempArray.push(arrayValues[2]);
            tempArray.push(arrayValues[3]);
            tempArray.push(arrayValues[4]);
            tempArray.push(arrayValues[5]);
            status = delearCards.chekForMiddleStraight(tempArray);
            if (!status) {
               tempArray.pop();
               status = delearCards.checkForMiddleStraightWithJoker(tempArray, jokerPresent);
            }
            if (status) {
                if (tempArray.length == 4) {
                     tempArray.push('jo15');
                     g_delearTwoCards.push(arrayValues[0]);
                     g_delearTwoCards.push(arrayValues[5]);
                }
                else {
                    g_delearTwoCards.push(arrayValues[0]);
                }
                g_delearFiveCards  = tempArray;
            }
        }
    }
    else if (arrayValues.length == 5) { // alert('ss');
        tempArray.push(arrayValues[0]);
        tempArray.push(arrayValues[1]);
        tempArray.push(arrayValues[2]);
        tempArray.push(arrayValues[3]);
        tempArray.push(arrayValues[4]);
        status = delearCards.chekForMiddleStraight(tempArray);
        if (!status) {
            /*tempArray  = [];
            tempArray.push(arrayValues[1]);
            tempArray.push(arrayValues[2]);
            tempArray.push(arrayValues[3]);
            tempArray.push(arrayValues[4]);*/
            tempArray.pop();
            status = delearCards.checkForMiddleStraightWithJoker(tempArray, jokerPresent);
        }
        if (status) {
                if (tempArray.length == 4) {
                     tempArray.push('jo15');
                     g_delearTwoCards.push(arrayValues[4]);
                     // g_delearTwoCards.push(cardRestOfArray[5]);
                }   
                g_delearFiveCards  = tempArray;             
        }
        else {
            tempArray  = [];
            /*tempArray.push(arrayValues[0]);
	    tempArray.push(arrayValues[1]);
            tempArray.push(arrayValues[2]);
            tempArray.push(arrayValues[3]);*/
            tempArray.push(arrayValues[1]);
            tempArray.push(arrayValues[2]);
            tempArray.push(arrayValues[3]);
            tempArray.push(arrayValues[4]);
            status = delearCards.checkForMiddleStraightWithJoker(tempArray, jokerPresent);            
            if (status) {
                tempArray.push('jo15');
                g_delearTwoCards.push(arrayValues[0]);
                g_delearFiveCards  = tempArray;
            }
        }
        // count = 0;
        // countLimit = 4;
        /*if (flag == 'straight' && jokerPresent) {
            countLimit = 3;
        }*
        for(key=arrayValues.length - 1; count <=  countLimit; --key) {
           g_delearFiveCards.push(arrayValues[key]);
           arrayValues.pop();
           ++count
        }

        for(key=arrayValues.length - 1; key >= 0; --key) {
           g_delearTwoCards.push(arrayValues[key]);
           arrayValues.pop();
        }
 
       */
        /*if (flag == 'straight' && jokerPresent) {
            countLimit = 3;
        }
        for(key=0; key <=  countLimit; ++key) {
           g_delearFiveCards.push(arrayValues[key]);
           // arrayValues.pop();
           // ++count
        }    
        // alert(g_delearFiveCards); 
        for(key=countLimit + 1; key < arrayValues.length; ++key) {
           g_delearTwoCards.push(arrayValues[key]);
          // arrayValues.pop();
        }*/
    }
    else if (arrayValues.length == 4) {
        for(key=arrayValues.length - 1; key >= 0; --key) {
           g_delearFiveCards.push(arrayValues[key]);
           arrayValues.pop();
        }
        
    }
    // alert(jokerPresent+' '+)
    if (jokerPresent && g_delearFiveCards.length == 4) {
        g_delearFiveCards.push('jo15');
    }
    else if (jokerPresent && g_delearTwoCards.length == 1) {
        g_delearTwoCards.push('jo15');
    } 
    // alert(g_delearFiveCards);
    // alert('ok');
};

delearCards.chekForMiddleStraight = function (dataArray) { // alert(dataArray);
   var status = false;
   if (g_cards[dataArray[0]].rank+1 == g_cards[dataArray[1]].rank && g_cards[dataArray[1]].rank+1 == g_cards[dataArray[2]].rank && g_cards[dataArray[2]].rank+1 == g_cards[dataArray[3]].rank && g_cards[dataArray[3]].rank+1 == g_cards[dataArray[4]].rank ) {
       status = true;
      
   }
   return status;
};

delearCards.checkForMiddleStraightWithJoker = function(cardArray, jokerPresent) {
    var status = false;
    var nextVal = '';
    var misFlag = false;
    var cardLength = cardArray.length;
    // alert(cardArray);
    for(key =0 ; key < cardLength; ++key) {
       if (key  == cardLength -1) {           
           break;
       } 
       nextVal = g_cards[cardArray[parseInt(key) + 1]].rank;
       if (g_cards[cardArray[key]].rank + 1 !=  nextVal && g_cards[cardArray[key]].rank + 2 != nextVal) {
           return false;
       }
       if (g_cards[cardArray[key]].rank + 1 ==  nextVal)  {
           status = true;
           continue
       }       
       if (misFlag == false && g_cards[cardArray[key]].rank + 2 == nextVal) {
           misFlag = true;
           status = true;                 
          continue;
       }
       else {
           status = false;
           break;
       }
    }
    return status;
};




delearCards.sortCards = function(cardArray) {
    cardArray.sort(function(a, b) {
         return +/\d+/.exec(a)[0] - +/\d+/.exec(b)[0];
    });
    return cardArray;
};

delearCards.checkForSuit = function(cardArray) {
    var suitArray = [];
    for (idx in cardArray) {
       suitArray.push(g_cards[cardArray[idx]].suit);
    }
    var dataLength = suitArray.length;
    var notPresentCount = 0;
    var resultArray = [];
    resultArray['c'] = [];
    resultArray['s'] = [];
    resultArray['h'] = [];
    resultArray['d'] = [];
    var cFlag = false;
    var dFlag = false;
    var hFlag = false;
    var sFlag = false;
    
    for (var key = 0; key < dataLength; ++key) {
        if (eval(suitArray[key]+'Flag')) {
           continue;
        }
        notPresentCount = 0;
        for (var nextKey = key + 1; nextKey < dataLength && notPresentCount < 3; ++nextKey) {
            if (suitArray[key] == suitArray[nextKey]) {
                resultArray[suitArray[key]].push(cardArray[nextKey]);
                eval(suitArray[key]+'Flag = true');
                continue;
            }
            notPresentCount++;
        }
        resultArray[suitArray[key]].push(cardArray[key]);
    }
    suitArray = [];
    return resultArray;
    // alert(resultArray['c']+' =  '+resultArray['h']+' = '+resultArray['s']);
};

delearCards.moveRestOfCards = function(cardArray, restOfArray) {
    for (idx in cardArray) {
       restOfArray.push(cardArray[idx]);
    }
    return restOfArray;
};

delearCards.moveNonStraightCards = function(retValue) {
   //  alert(retValue.straightArray);
    if (retValue.straightArray.length >= 4) {
               retValue.restOfArray = this.moveRestOfCards(retValue.straightArrayBack, retValue.restOfArray);
               retValue.straightArrayBack = retValue.straightArray;
           }
           else {
               retValue.restOfArray = this.moveRestOfCards(retValue.straightArray, retValue.restOfArray);
               // alert(retValue.restOfArray);
           }
           retValue.straightArray = [];
    return retValue
};

delearCards.moveNonStraightSingleCards = function(status, value, retValue) {
    if (status) {
               retValue.straightArray.push(value);
           }
           else {
               retValue.restOfArray.push(value);
           }
    return retValue
};


/*delearCards.checkForStraight = function(cardArray, jokerPresent) {
    var status = false;
    var nextVal = '';
    var misFlag = false;
    // var straightArray = [];
    var retValue = [];
    retValue.restOfArray = [];
    retValue.straightArrayBack = [];
    retValue.straightArray = [];
    // alert(cardArray);
    for(key = cardArray.length - 1; key >=0; --key) {
       if (key  == 0) {
           retValue = this.moveNonStraightSingleCards(status, cardArray[key], retValue);
           break;
       } 
       nextVal = g_cards[cardArray[parseInt(key) - 1]].rank;
       if (g_cards[cardArray[key]].rank - 1 !=  nextVal && g_cards[cardArray[key]].rank - 2 != nextVal) {

           retValue = this.moveNonStraightSingleCards(status, cardArray[key], retValue);
           status = false;                      
           retValue = this.moveNonStraightCards(retValue);
           continue;
       }
       if (g_cards[cardArray[key]].rank - 1 ==  nextVal)  {
           retValue.straightArray.push(cardArray[key]); // alert('1+ '+cardArray[key]);
           status = true;
           continue
       }       
       if (jokerPresent && g_cards[cardArray[key]].rank - 2 == nextVal) {
           status = true;
                     
           retValue =  this.moveNonStraightSingleCards(status, cardArray[key], retValue);
          if (misFlag) {
              status = false;
              // misFlag = false;
              retValue = this.moveNonStraightCards(retValue);
              // straightArray = [];
          } 
          misFlag = true;         
          continue;
       }
       retValue =  this.moveNonStraightSingleCards(status, cardArray[key], retValue);
       status = false;
       retValue = this.moveNonStraightCards(retValue);
    }

    // alert(retValue.straightArray+' = '+retValue.restOfArray+' = '+retValue.straightArrayBack);
    return retValue;
};*/

delearCards.checkForStraight = function(cardArray, jokerPresent) {
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
    for(key =0 ; key < cardLength; ++key) {
       if (key  == cardLength -1) {
           retValue = this.moveNonStraightSingleCards(status, cardArray[key], retValue);
           break;
       } 
       nextVal = g_cards[cardArray[parseInt(key) + 1]].rank;

       if (status == true && g_cards[cardArray[key]].rank  ==  nextVal)  { // alert(g_cards[cardArray[key]].rank);
            // retValue.straightArray.push(cardArray[key]); // alert('1+ '+cardArray[key]);
           retValue =  this.moveNonStraightSingleCards(false, cardArray[key], retValue);
           // status = false;
           // retValue =  this.moveNonStraightSingleCards(status, cardArray[key], retValue);
           continue
       } 
       if (g_cards[cardArray[key]].rank + 1 !=  nextVal && g_cards[cardArray[key]].rank + 2 != nextVal) {

           retValue = this.moveNonStraightSingleCards(status, cardArray[key], retValue);
           status = false;                      
           retValue = this.moveNonStraightCards(retValue);
           continue;
       }
       if (g_cards[cardArray[key]].rank + 1 ==  nextVal)  {
           retValue.straightArray.push(cardArray[key]); // alert('1+ '+cardArray[key]);
           status = true;
           continue
       }       
       if (jokerPresent && g_cards[cardArray[key]].rank + 2 == nextVal) {
           status = true;
                     
           retValue =  this.moveNonStraightSingleCards(status, cardArray[key], retValue);
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
       
       retValue =  this.moveNonStraightSingleCards(status, cardArray[key], retValue);
       status = false;
       retValue = this.moveNonStraightCards(retValue);
    }

     // alert(retValue.straightArray+' = '+retValue.restOfArray+' = '+retValue.straightArrayBack);
    return retValue;
};

delearCards.getCardRankArray = function(cardArray) {
    var cardRankArray= [];
    for (key in cardArray) { 
       cardRankArray[key] = g_cards[cardArray[key]].rank;
    }
    return cardRankArray;
};

delearCards.checkForRepeat = function(cardArray) {
   // var sortArray = [];
   // var sortCount = [];
   var rank = 0;
   var count = 0;
   var equalFlag = false;
   // var restOfArray = []; 
   var cardRankArray = this.getCardRankArray(cardArray);
   if (cardRankArray[6] == 15) {
       cardRankArray[6] = 14;
   }
   var retValue = [];
   retValue.sortArray = [];
   retValue.repeatArray = [];
   retValue.restOfArray = [];
   retValue.sortCount = [];
   for (key in cardRankArray) { 
       if (cardRankArray.length == parseInt(key) +1 && equalFlag == true && count) {
          retValue.sortCount.push(count);
          retValue.sortArray.push(cardArray[parseInt(key)]);
          retValue.repeatArray.push(cardArray[parseInt(key)]);
       }
       else if (cardRankArray[key] == cardRankArray[parseInt(key) + 1] && cardRankArray.length != parseInt(key) +1) {    
          ++count;
          equalFlag = true;
          retValue.repeatArray.push(cardArray[parseInt(key)]);
       }
       else if (equalFlag == true) { 
          retValue.sortCount.push(count);
          retValue.sortArray.push(cardArray[parseInt(key)]);
          retValue.repeatArray.push(cardArray[parseInt(key)]);
          equalFlag = false;
          count = 0;
       }
       else { 
           retValue.restOfArray.push(cardArray[key]);
       }
   }

  //  alert(retValue.sortCount+' = '+retValue.sortArray+' = '+retValue.restOfArray+' = '+retValue.repeatArray)
   this.rankForPair(retValue);
   // cardArray = '';
   // restOfArray.sort();
   // rank.restofData = restOfArray;
   // return {rnk:rank, data:sortArray, restofData: restOfArray};
   return;
}

delearCards.fiveOfAKind = function(retValue) {
    var first = 0;
    var limit = 0;
    var resOfFirst = 0;
    var restOfLimit = 0;
    retValue.pairs = [];
    var next = 0;
    var nextLimit = 0;
    if (retValue.sortCount.length == 2 && retValue.sortCount[0] < retValue.sortCount[1]) {           
           first = retValue.sortCount[0]+1;
           limit = retValue.sortCount[0]+1 + retValue.sortCount[1];

           resOfFirst = 0;
           restOfLimit = retValue.sortCount[0];
    }
    else if (retValue.sortCount.length == 2 && retValue.sortCount[0] > retValue.sortCount[1]) {           
        first = 0;
        limit = retValue.sortCount[0];
        resOfFirst = retValue.sortCount[0]+1;
        restOfLimit = retValue.sortCount[0]+1 + retValue.sortCount[1];
    }
    else if (retValue.sortCount.length == 1) {
        first = 0;
        limit = retValue.sortCount[0];
        resOfFirst = 0;
        restOfLimit = -1;
    }
    
    for(key=first; key <=limit; ++key) {
       retValue.pairs.push(retValue.repeatArray[key]);
    }
    for(key=resOfFirst; key <=restOfLimit; ++key) {
       retValue.restOfArray.push(retValue.repeatArray[key]);
    }
    return retValue;
};

delearCards.threeOfAKind = function(retValue) {
    var first = 0;
    var limit = 0;
    var resOfFirst = 0;
    var restOfLimit = 0;
    retValue.pairs = [];
    var next = 0;
    var nextLimit = 0; // alert('shiju');
    if (retValue.sortCount.length == 2 && retValue.sortCount[0] == retValue.sortCount[1]) {           
           first = retValue.sortCount[0]+1;
           limit = first+ retValue.sortCount[1];
           next = 0
           nextLimit = next + 1;  
           resOfFirst = nextLimit + 1;
           restOfLimit = retValue.sortCount[0];
    }
    /*else if (retValue.sortCount.length == 2 && retValue.sortCount[0] > retValue.sortCount[1]) {           
           first = retValue.sortCount[0]+1;
           limit = retValue.sortCount[0]+1 + retValue.sortCount[1];

           next = 0
           nextLimit = -1; 
           resOfFirst = 0;
           restOfLimit = retValue.sortCount[0];
    }
    else if (retValue.sortCount.length == 2 && retValue.sortCount[0] < retValue.sortCount[1]) {           
           first = retValue.sortCount[0]+1;
           limit = retValue.sortCount[0]+1 + retValue.sortCount[1];
           next = 0
           nextLimit = -1; 
           resOfFirst = 0;
           restOfLimit = retValue.sortCount[0];*/
    else if (retValue.sortCount.length == 2) {
           first = 0;
           limit = retValue.sortCount[0];
           next = limit + 1;
           nextLimit = next + retValue.sortCount[1]; 
           resOfFirst = 0;
           restOfLimit = -1;
           
    }
    else if (retValue.sortCount.length == 3) {           
        if (retValue.sortCount[0] > retValue.sortCount[1]) {
           first = 0;
           limit = retValue.sortCount[0];
           next = limit + 1
           nextLimit = next + retValue.sortCount[1]; 
           resOfFirst = nextLimit + 1;
           restOfLimit = resOfFirst + retValue.sortCount[2];
        }else if (retValue.sortCount[1] > retValue.sortCount[2]) {
         // 1, 0
           first = 0;
           limit = retValue.sortCount[0];
           next = limit + 1
           nextLimit = next + retValue.sortCount[1];
           resOfFirst = nextLimit + 1;
           restOfLimit = resOfFirst + retValue.sortCount[2];
        }
        else {
           // 2,0
           first = 0;
           limit = retValue.sortCount[0];
           resOfFirst = limit + 1;
           restOfLimit = resOfFirst + retValue.sortCount[1];
           next = restOfLimit + 1
           nextLimit = next + retValue.sortCount[2];
        }        
    }
    else if (retValue.sortCount.length == 1) {
        first = 0;
        limit = retValue.sortCount[0];
        resOfFirst = 0;
        restOfLimit = -1;
        next = 0;
        nextLimit = -1;
    }
    for(key=first; key <=limit; ++key) {
       retValue.pairs.push(retValue.repeatArray[key]);
    }
    for(key=next; key <=nextLimit; ++key) {
       retValue.pairs.push(retValue.repeatArray[key]);
    }
    for(key=resOfFirst; key <=restOfLimit; ++key) {
       retValue.restOfArray.push(retValue.repeatArray[key]);
    }
    return retValue;
};

delearCards.onePairs = function(retValue) {
    var first = 0;
    var limit = 0;
    var resOfFirst = 0;
    var restOfLimit = 0;
    retValue.pairs = [];
    var next = 0;
    var nextLimit = 0;
    // alert(retValue.sortCount+'ss');
    if (retValue.sortCount.length == 2) {           
           first = 0;
           limit = retValue.sortCount[0];
           next =  limit+1;
           nextLimit = next + retValue.sortCount[1];
           // nextLimit = -1; 
           resOfFirst = 0;
           restOfLimit = -1;
        //  alert(retValue.sortCount);
    }
    else if (retValue.sortCount.length == 3) {           
           resOfFirst = 0;
           restOfLimit = retValue.sortCount[0];
           first = restOfLimit + 1;
           limit = first + retValue.sortCount[1];
           
           next = limit + 1
           nextLimit = next + retValue.sortCount[2];
    }
    else if (retValue.sortCount.length == 1) {
        first = 0;
        limit = retValue.sortCount[0];
        resOfFirst = 0;
        restOfLimit = -1;
        next = 0;
        nextLimit = -1;
    }
    // alert(retValue.repeatArray);
    for(key=first; key <=limit; ++key) {
       retValue.pairs.push(retValue.repeatArray[key]);
    }
    for(key=next; key <=nextLimit; ++key) {
       retValue.pairs.push(retValue.repeatArray[key]);
    }
    for(key=resOfFirst; key <=restOfLimit; ++key) {
       retValue.restOfArray.push(retValue.repeatArray[key]);
    }
    return retValue;
};

delearCards.arrangeNoPair = function(retValue) {
   retValue.restOfArray = this.sortCards(retValue.restOfArray);
   g_delearFiveCards.push(retValue.restOfArray[6]);   
   if (g_cards[retValue.restOfArray[6]].rank > 10) {
       g_delearTwoCards.push(retValue.restOfArray[4]);
       g_delearTwoCards.push(retValue.restOfArray[5]);
       g_delearFiveCards.push(retValue.restOfArray[3]);
       g_delearFiveCards.push(retValue.restOfArray[2]);
   }
   else {
       g_delearTwoCards.push(retValue.restOfArray[4]);
       g_delearTwoCards.push(retValue.restOfArray[3]);
       g_delearFiveCards.push(retValue.restOfArray[5]);
       g_delearFiveCards.push(retValue.restOfArray[2]);  
   }
   
   /*g_delearFiveCards.push(retValue.restOfArray[3]);
   g_delearFiveCards.push(retValue.restOfArray[2]);
   g_delearTwoCards.push(retValue.restOfArray[4]);
   g_delearTwoCards.push(retValue.restOfArray[5]);*/
   g_delearFiveCards.push(retValue.restOfArray[1]);
   g_delearFiveCards.push(retValue.restOfArray[0]);
   return [];
}

delearCards.arrangeOnePair = function(retValue) {

   
   for(key=0; key < retValue.pairs.length; ++key) {
       g_delearFiveCards.push(retValue.pairs[key]);
   }
   retValue.restOfArray = this.sortCards(retValue.restOfArray);
   // if (g_cards[retValue.pairs[0]].rank > 10) { 
       g_delearFiveCards.push(retValue.restOfArray[2]);
       g_delearFiveCards.push(retValue.restOfArray[1]);
       g_delearFiveCards.push(retValue.restOfArray[0]);
       g_delearTwoCards.push(retValue.restOfArray[3]);
       g_delearTwoCards.push(retValue.restOfArray[4]);
   /*}
   else {
       g_delearFiveCards.push(retValue.restOfArray[4]);
       g_delearFiveCards.push(retValue.restOfArray[1]);
       g_delearFiveCards.push(retValue.restOfArray[0]);
       g_delearTwoCards.push(retValue.restOfArray[2]);
       g_delearTwoCards.push(retValue.restOfArray[3]);
   }*/
   return [];
}

delearCards.arrangeTwoPairs = function(retValue) { // alert(retValue.pairs+'ss'+retValue.restOfArray);
   retValue.pairs = this.sortCards(retValue.pairs);
   retValue.restOfArray = this.sortCards(retValue.restOfArray);
   if (g_cards[retValue.restOfArray[0]].rank == g_cards[retValue.restOfArray[1]].rank) {
       for(key=2; key < retValue.pairs.length; ++key) {
           g_delearFiveCards.push(retValue.pairs[key]);
       }

       g_delearFiveCards.push(retValue.restOfArray[0]);
       g_delearFiveCards.push(retValue.restOfArray[1]);
       g_delearFiveCards.push(retValue.restOfArray[2]);
       g_delearTwoCards.push(retValue.pairs[0]);
       g_delearTwoCards.push(retValue.pairs[1]);

       // alert(g_delearTwoCards+' = '+g_delearFiveCards);
        // return [];
   }
   else if (g_cards[retValue.restOfArray[1]].rank == g_cards[retValue.restOfArray[2]].rank) {
       for(key=2; key < retValue.pairs.length; ++key) {
           g_delearFiveCards.push(retValue.pairs[key]);
       }
       g_delearFiveCards.push(retValue.restOfArray[1]);
       g_delearFiveCards.push(retValue.restOfArray[2]);
       g_delearFiveCards.push(retValue.restOfArray[0]);
       g_delearTwoCards.push(retValue.pairs[0]);
       g_delearTwoCards.push(retValue.pairs[1]);
   }


   else if (g_cards[retValue.restOfArray[2]].rank > 10) {
       for(key=0; key < retValue.pairs.length; ++key) {
          g_delearFiveCards.push(retValue.pairs[key]);
       }
       retValue.restOfArray = this.sortCards(retValue.restOfArray);
       g_delearFiveCards.push(retValue.restOfArray[0]);
       g_delearTwoCards.push(retValue.restOfArray[1]);
       g_delearTwoCards.push(retValue.restOfArray[2]);
  }
  else {
       for(key=2; key < retValue.pairs.length; ++key) {
          g_delearFiveCards.push(retValue.pairs[key]);
       }
       retValue.restOfArray = this.sortCards(retValue.restOfArray);
       g_delearFiveCards.push(retValue.restOfArray[0]);
       g_delearFiveCards.push(retValue.restOfArray[1]);
       g_delearFiveCards.push(retValue.restOfArray[2]);
       g_delearTwoCards.push(retValue.pairs[0]);
       g_delearTwoCards.push(retValue.pairs[1]);
  }
   return [];
}

delearCards.arrangeThreeOfKind = function(retValue) {
   for(key=0; key < retValue.pairs.length; ++key) {
       g_delearFiveCards.push(retValue.pairs[key]);
   }
   // sort rest
   retValue.restOfArray = this.sortCards(retValue.restOfArray);
   g_delearFiveCards.push(retValue.restOfArray[0]);
   g_delearFiveCards.push(retValue.restOfArray[1]);
   g_delearTwoCards.push(retValue.restOfArray[2]);
   g_delearTwoCards.push(retValue.restOfArray[3]);
   return [];
}

delearCards.arrangeFullhouse = function(retValue) {
   retValue.pairs = this.sortCards(retValue.pairs);
   if (g_cards[retValue.restOfArray[0]].rank == g_cards[retValue.restOfArray[1]].rank) {
       for(key=0; key < retValue.pairs.length; ++key) {
           g_delearFiveCards.push(retValue.pairs[key]);
       }
       g_delearTwoCards.push(retValue.restOfArray[0]);
       g_delearTwoCards.push(retValue.restOfArray[1]);
   }
   else if  (g_cards[retValue.pairs[0]].rank != g_cards[retValue.pairs[1]].rank || g_cards[retValue.pairs[1]].rank != g_cards[retValue.pairs[2]].rank ) {
       for(key=2; key < retValue.pairs.length; ++key) {
           g_delearFiveCards.push(retValue.pairs[key]);
       }
       g_delearTwoCards.push(retValue.pairs[0]);
       g_delearTwoCards.push(retValue.pairs[1]);
       g_delearFiveCards.push(retValue.restOfArray[0]);
       g_delearFiveCards.push(retValue.restOfArray[1]);
   }
   else if  (g_cards[retValue.pairs[0]].rank == g_cards[retValue.pairs[1]].rank && g_cards[retValue.pairs[1]].rank == g_cards[retValue.pairs[2]].rank ) {
       for(key=0; key < 3; ++key) {
           g_delearFiveCards.push(retValue.pairs[key]);
       }
       g_delearTwoCards.push(retValue.pairs[3]);
       g_delearTwoCards.push(retValue.pairs[4]);
       g_delearFiveCards.push(retValue.restOfArray[0]);
       g_delearFiveCards.push(retValue.restOfArray[1]);
   }
   return [];
}

delearCards.arrangeFourOfKind = function(retValue) {
   for(key=0; key < retValue.pairs.length; ++key) {
       g_delearFiveCards.push(retValue.pairs[key]);
   }
   // sort rest
   retValue.restOfArray = this.sortCards(retValue.restOfArray); 
   if (g_cards[retValue.restOfArray[0]].rank == g_cards[retValue.restOfArray[1]].rank) {
       g_delearFiveCards.push(retValue.restOfArray[2]);
       g_delearTwoCards.push(retValue.restOfArray[0]);
       g_delearTwoCards.push(retValue.restOfArray[1]);
   }
   else if (g_cards[retValue.restOfArray[1]].rank == g_cards[retValue.restOfArray[2]].rank) {
       g_delearFiveCards.push(retValue.restOfArray[0]);
       g_delearTwoCards.push(retValue.restOfArray[1]);
       g_delearTwoCards.push(retValue.restOfArray[2]);
   }
   else { 
       g_delearFiveCards.push(retValue.restOfArray[0]);
       g_delearTwoCards.push(retValue.restOfArray[1]);
       g_delearTwoCards.push(retValue.restOfArray[2]);
   }
   return [];
}

delearCards.arrangeFiveOfKind = function(retValue) {
   /*for(key=0; key < retValue.pairs.length; ++key) {
       g_delearFiveCards.push(retValue.pairs[key]);
   }*/
   // sort rest
   g_delearFiveCards.push(retValue.pairs[0]);
   g_delearFiveCards.push(retValue.pairs[1]);
   g_delearFiveCards.push(retValue.pairs[2]);
   g_delearTwoCards.push(retValue.pairs[3]);
   g_delearTwoCards.push(retValue.pairs[4]);

   g_delearFiveCards.push(retValue.restOfArray[0]);
   g_delearFiveCards.push(retValue.restOfArray[1]);
   return [];
}

delearCards.rankForPair = function(retValue) {
   var maxRepeatCout = Math.max.apply(null, retValue.sortCount);
   var rank = 0;
   if (retValue.sortCount.length == 0) {
        retValue = this.arrangeNoPair(retValue);
   }
   else
   if (maxRepeatCout == 4) {
        retValue = this.fiveOfAKind(retValue);
        retValue = this.arrangeFiveOfKind(retValue);
   }
   else if (maxRepeatCout == 3) {
        retValue = this.fiveOfAKind(retValue);
        retValue = this.arrangeFourOfKind(retValue);
   }
   else if (maxRepeatCout == 2 && retValue.sortCount.length >= 2) {
        retValue = this.threeOfAKind(retValue);
        retValue = this.arrangeFullhouse(retValue);
   }
   else if (maxRepeatCout == 2 && retValue.sortCount.length == 1) {
        retValue = this.threeOfAKind(retValue);
        retValue = this.arrangeThreeOfKind(retValue);
   }
   else if (maxRepeatCout == 1 && retValue.sortCount.length >= 2) {
        retValue = this.onePairs(retValue);
        retValue = this.arrangeTwoPairs(retValue);
   }
   else if (maxRepeatCout == 1) {
      retValue = this.onePairs(retValue);
      retValue = this.arrangeOnePair(retValue);
   }
   return;
}

delearCards.chekForStraightFlushSpecialCase = function(data) {
   var firstValue = g_cards[data[0]].rank;
   var secValue = g_cards[data[1]].rank;
   var thirdValue = g_cards[data[2]].rank;
   var fourthValue = g_cards[data[3]].rank;
   var sixthValue = g_cards[data[5]].rank;
   var seventhValue = g_cards[data[6]].rank;
   if (firstValue == 2 && secValue == 3 && thirdValue == 4 && fourthValue == 5 && (seventhValue == 14 || seventhValue == 15)) {
       // g_delearFiveCards = g_delearFiveCards[data[0], data[1], data[2], data[3], data[6]];
       g_delearFiveCards.push(data[0]);
       g_delearFiveCards.push(data[1]);
       g_delearFiveCards.push(data[2]);
       g_delearFiveCards.push(data[3]);
       g_delearFiveCards.push(data[6]);
       g_delearTwoCards.push(data[4]);
       g_delearTwoCards.push(data[5]);
       // g_delearTwoCards  = g_delearTwoCards[data[4],data[5]];
       return true;
   }
   if (sixthValue != 14 && seventhValue != 15) {
       return false;
   }
   if (sixthValue != 14 && seventhValue == 15) {
       return false;
   }
   if(firstValue != 2 && firstValue != 3) { 
      return false;
   }   
   if((firstValue == 2 && secValue == 4 && thirdValue == 5 && sixthValue == 14) || (firstValue == 2 && secValue == 3 && thirdValue == 5 && sixthValue == 14) ||
      (firstValue == 2 && secValue == 3 && thirdValue == 4 && sixthValue == 14) || (firstValue == 3 && secValue == 4 && thirdValue == 5 && sixthValue == 14)) {
       // g_delearFiveCards = g_delearFiveCards[data[0], data[1], data[2], data[5], data[6]];
       // g_delearTwoCards  = g_delearTwoCards[data[3],data[4]];
       g_delearFiveCards.push(data[0]);
       g_delearFiveCards.push(data[1]);
       g_delearFiveCards.push(data[2]);
       g_delearFiveCards.push(data[5]);
       g_delearFiveCards.push(data[6]);
       g_delearTwoCards.push(data[3]);
       g_delearTwoCards.push(data[4]);
       return true;
   }
   return false;
};
