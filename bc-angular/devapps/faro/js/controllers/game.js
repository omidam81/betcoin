'use strict';
/* global BaseGameController */

var Card = function(rank,suit,flipped, lose,currentGame,warCard) {
    this.rank = rank;
    this.suit = suit;
    this.flipped = flipped;
    this.lose = lose;
    this.invisible = true;
    this.currentGame = currentGame;
    this.warCard = warCard;

    this.names = function() {
      var rank, suit;

      switch (this.rank) {
        case "A" :
          rank = "Ace";
          break;
        case "2" :
          rank = "Two";
          break;
        case "3" :
          rank = "Three";
          break;
        case "4" :
          rank = "Four";
          break;
        case "5" :
          rank = "Five";
          break;
        case "6" :
          rank = "Six";
          break;
        case "7" :
          rank = "Seven";
          break;
        case "8" :
          rank = "Eight";
          break;
        case "9" :
          rank = "Nine";
          break;
        case "T" :
          rank = "Ten";
          break;
        case "J" :
          rank = "Jack";
          break;
        case "Q" :
          rank = "Queen";
          break;
        case "K" :
          rank = "King";
          break;
        default :
          rank = null;
          break;
      }

      switch (this.suit) {
        case "C" :
          suit = "Clubs";
          break;
        case "D" :
          suit = "Diamonds";
          break;
        case "H" :
          suit = "Hearts";
          break;
        case "S" :
          suit = "Spades";
          break;
        default :
          suit = null;
          break;
      }

        if (rank === null || suit === null) {
            return {rank:"error",suit:"error", flipped:"flipped", lose:"", currentGame:currentGame,warCard:warCard};
        }
        return {rank:rank, suit:suit, flipped:flipped, lose:lose, invisible: true,currentGame:currentGame,warCard:warCard};
    };
};
var Stack = function() {

    // Create an empty array of cards.

    this.cards = [];

    this.deal      = function() {
        if (this.cards.length > 0) {
            return this.cards.shift();
        }
        else { return null; }
    };
    this.draw      = function(n) {
        var card;

        if (n >= 0 && n < this.cards.length) {
            card = this.cards[n];
            this.cards.splice(n, 1);
        }
        else { card = null; }

        return card;
    };
    this.addCard   = function(card) {
        this.cards.push(card);
    };

    this.combine   = function(stack) {
        this.cards = this.cards.concat(stack.cards);
        stack.cards = [];
    };
    this.cardCount = function() {
        return this.cards.length;
    };
};

var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var gameController = this;
    gameController.gameName = 'faro';
    gameController.Game = Game;
    $scope.timer = 2000;
    $scope.autowar = false;
    $scope.autosurrender = false;
    $scope.gameTime = 2000;
    $scope.bets = {};
    $scope.playercards = new Stack();
    $scope.betCards = new Stack();
    $scope.winnercards = new Stack();
    $scope.losercards = new Stack();
    $scope.selectedCardIndex = 52;

    $scope.currentBets = {
        numberCompare: null,
        color: null
    };
    $scope.betResult = 0;

    // this.isExceedMaxWager = function(wager){
    //     var isExceedPlayerBalance = GameController.super_.prototype.isExceedMaxWager.call(this, wager);
    //     var isExceedGameMaxWagerLimit = wager > 1000000? true : false;
    //     var exceedMaxWager = isExceedPlayerBalance || isExceedGameMaxWagerLimit;
    //     $scope.maxBetErr = exceedMaxWager;
    //     return exceedMaxWager;
    // };


    this.getNewGameParams = function(){
        var gameParams = GameController.super_.prototype.getNewGameParams.call(this);
        gameParams.bet = JSON.stringify([$scope.selectedCardIndex]);
        return gameParams;
    };
    this.newGame_OnStart = function() {
//      this.setGameInProgress(true);
        this.$scope.resultMultiplier = null;
        this.$scope.resultProfit = null;
        this.clearLastResult();
    };
    this.newGame_OnSuccess = function(response){
        $scope.currentGame = response;
        $scope.dealCards(response);
        GameController.super_.prototype.newGame_OnSuccess.call(gameController, response);
        $scope.checkBetStatus(response);
        $scope.clearBets();
        $scope.betResult = 0;
        $scope.selectedCardIndex--;
        $scope.betCards.cards = response.bet_stack;
    };

    this.getNextGame_OnSuccess = function(nextGame){
        GameController.super_.prototype.getNextGame_OnSuccess.call(gameController, nextGame);
        var timer = $scope.gameTime;
        if(!$scope.started){
            timer = 0;
            $scope.started = true;
        }
        $scope.$watch('player', function() {
            if(!$scope.initPlayer){
                if($scope.player){
                    $scope.play();
                    $scope.initPlayer = true;
                }
            }
        });
        if($scope.initPlayer){
            setTimeout(function(){
                $scope.play();
            }, timer);
        }
    };

    this.autospin = function(){
        GameController.super_.prototype.autospin.call(this);
        this.$scope.timer = 2000;
    };

    this.getResultProfit = function() {
        if(this.getLastResult() === null || this.getLastResult() === undefined){
            return 0;
        }
        return this.getLastResult().current_payout;
    };

    this.getResultWager = function() {
        if(this.getLastResult() === null || this.getLastResult() === undefined){
            return 0;
        }
        return this.getWager();
    };

    GameController.super_.apply(this, arguments);

    gameController.finishGameDelay = 2000;

    $scope.getCardRank = function(order) {
        var cards = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K","A"];
        return cards[order];
    };

    $scope.getCardValue = function(rank) {
        return this.cardRanks.indexOf(rank) + 1;
    };

    $scope.getBetCards = function () {
        for(var cardNum = 0; cardNum < 13; cardNum++){
            var rank = "";
            rank = $scope.getCardRank(cardNum);
            var card = {rank:rank, cnt: 0, type: 0};
            $scope.betCards.addCard(card);
        }
    };

    $scope.play = function() {
        $scope.gOptions = false;
        $scope.selectedCardIndex = 52;
        $scope.playercards = new Stack();
        $scope.winnercards = new Stack();
        $scope.losercards = new Stack();
        $scope.betCards = new Stack();
        $scope.getBetCards();
        gameController.startGame();
    };
    $scope.determinePossiblePayout = function() {
        var possibleMultipliers;
        try{
            possibleMultipliers = $scope.lastResultTmp.result.possibleMultipliers;
        }catch(e){
            return;
        }
        var possiblePayout;
        if($scope.bets.color){
            possiblePayout = possibleMultipliers[$scope.bets.color];
        }
        if($scope.bets.numberCompare){
            possiblePayout = possibleMultipliers[$scope.bets.numberCompare];
        }
        var combinedPayout = possibleMultipliers[$scope.bets.numberCompare+'_'+$scope.bets.color];
        if (combinedPayout){
            possiblePayout = combinedPayout;
        }
        possiblePayout *= gameController.getWager();
        if(!possiblePayout){
            return 0;
        }
        return possiblePayout;
    };
    $scope.$watch('bets', function(){
//        $scope.possiblePayout = $scope.determinePossiblePayout();
    }, true);
    $scope.$watch('btcWager', function(){
//        $scope.possiblePayout = $scope.determinePossiblePayout();
    });

    $scope.animateDeal = function(type, index) {
        var lastCardCount,elem;
        if (type === 'winner') {
            lastCardCount = $scope.winnercards.cardCount() - 1;
            elem = document.querySelectorAll( '.livewinnercard' );
        } else if (type === "loser") {
            lastCardCount = $scope.losercards.cardCount() - 1;
            elem = document.querySelectorAll( '.livelosercard' );
        } else {
            lastCardCount = index;
            elem = document.querySelectorAll( '.liveturncard' );
        }
        $(elem[lastCardCount]).animate({
           top:'0px',left:'0px',opacity:1
        }, 400, function() {
            $scope.playSound('dealCard');
            elem[lastCardCount].setAttribute('dealt',true);
        });
    };
    $scope.dealCards = function(data) {
        $scope.winnercards = $scope.winnercards || new Stack();
        $scope.losercards = $scope.losercards || new Stack();
        $scope.playercards = $scope.playercards || new Stack();
        var firstCard;
        if (data.player_stack.length === 1) {
            firstCard = data.player_stack.pop();
        } else {
            firstCard = data.result.winnerCard;
            var loserCard = new Card(data.result.loserCard.rank, data.result.loserCard.suit, "", "","livelosercard");
            $scope.losercards.addCard(loserCard);
            $scope.playercards.addCard(loserCard);
        }
        var winnerCard = new Card(firstCard.rank, firstCard.suit, "", "","livewinnercard");
        $scope.winnercards.addCard(winnerCard);
        $scope.playercards.addCard(winnerCard);
        setTimeout(function() {
            $scope.$apply(function() {
                $scope.animateDeal('winner');
            });
        },100);
        if($scope.losercards.cards.length > 0) {
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.animateDeal('loser');
                });
            },500);
        }
    };
    $scope.showTurnCards = function(turnCards) {
        $scope.turnCards = turnCards;
        setTimeout(function() {
            $scope.$apply(function() {
                setTimeout(function() {
                    $scope.animateDeal('turn', 0);
                },400);
                setTimeout(function() {
                    $scope.animateDeal('turn', 1);
                },800);
                setTimeout(function() {
                    $scope.animateDeal('turn', 2);
                },1200);
            });
        },100);
        
    };
    $scope.presentoptions = function(){
        //display two buttons

        if($scope.autosurrender)
        {
            $scope.nextAction(false);
            return;
        }
        if($scope.autowar)
        {
            $scope.nextAction(true);
            return;
        }

        $scope.gOptions = true;
    };
    $scope.nextAction = function(){
        if (!$scope.initedSound) {
            $scope.playSound('blankSound');
            $scope.initedSound = true;
        }
        if($scope.selectedCardIndex === 3) {
            $scope.bets.turn = $scope.turnCardsArray[$scope.turnIndex].cards;
        }
        
        var game_status = 'gaming';
        var all_bets = {
            flatBets : $scope.betCards.cards,
            turnBets : $scope.bets.turn,
            highBet : $scope.bets.high,
            evenBet : $scope.bets.even,
            oddBet : $scope.bets.odd,
        };
        var game = angular.extend($scope.currentGame,{game_status:game_status, all_bets:JSON.stringify(all_bets), wager: gameController.getWager()});
        $scope.betResult = 0;
        
        Game.nextAction(game, function(data) {
            $scope.betResult = 1;
            if (data.result.payout > 0) {
                $scope.betResult = 2;
            } else if (data.result.payout === 0 && data.result.finished === false) {
                $scope.betResult = 2;
            }
            $scope.lastResultTmp = data;
            $scope.previousCards = $scope.lastResultTmp.player_stack;
            if(($scope.previousCards.length === 52) && (data.status === 'finished')) {
                if (data.result.turnCards.length > 0) {
                    $scope.showTurnCards(data.result.turnCards);
                    $scope.betCards.cards = data.bet_stack;
                    setTimeout(function() {
                        return gameController.finishGame();
                    }, 5000);
                } else {
                    return gameController.finishGame();
                }
                
            } else {
                $scope.dealCards(data);
                $scope.betCards.cards = data.bet_stack;
                $scope.selectedCardIndex = 52 - $scope.playercards.cardCount();
                if($scope.selectedCardIndex === 3) {
                    $scope.clearBets();
                    $scope.tempTurnCards = [];
                    angular.forEach($scope.betCards.cards, function(card){
                        if(card.cnt === 1) {
                            $scope.tempTurnCards.push(card);
                            $scope.tempTurnCards.push(card);
                            $scope.tempTurnCards.push(card);
                        }
                        if(card.cnt === 2) {
                            $scope.tempTurnCards.push(card);
                            $scope.tempTurnCards.push(card);
                        }
                        if(card.cnt === 3) {
                            $scope.tempTurnCards.push(card);
                        }
                    });
                    $scope.turnCardsArray = [];
                    $scope.turnCardsArray[0] = {
                        "cards" : [$scope.tempTurnCards[0], $scope.tempTurnCards[1], $scope.tempTurnCards[2]],
                        "title" : $scope.tempTurnCards[0].rank + ', ' + $scope.tempTurnCards[1].rank + ', ' + $scope.tempTurnCards[2].rank
                    };
                    $scope.turnCardsArray[1] = {
                        "cards" : [$scope.tempTurnCards[0], $scope.tempTurnCards[2], $scope.tempTurnCards[1]],
                        "title" : $scope.tempTurnCards[0].rank + ', ' + $scope.tempTurnCards[2].rank + ', ' + $scope.tempTurnCards[1].rank
                    };
                    $scope.turnCardsArray[2] = {
                        "cards" : [$scope.tempTurnCards[1], $scope.tempTurnCards[0], $scope.tempTurnCards[2]],
                        "title" : $scope.tempTurnCards[1].rank + ', ' + $scope.tempTurnCards[0].rank + ', ' + $scope.tempTurnCards[2].rank
                    };
                    $scope.turnCardsArray[3] = {
                        "cards" : [$scope.tempTurnCards[1], $scope.tempTurnCards[2], $scope.tempTurnCards[0]],
                        "title" : $scope.tempTurnCards[1].rank + ', ' + $scope.tempTurnCards[2].rank + ', ' + $scope.tempTurnCards[0].rank
                    };
                    $scope.turnCardsArray[4] = {
                        "cards" : [$scope.tempTurnCards[2], $scope.tempTurnCards[0], $scope.tempTurnCards[1]],
                        "title" : $scope.tempTurnCards[2].rank + ', ' + $scope.tempTurnCards[0].rank + ', ' + $scope.tempTurnCards[1].rank
                    };
                    $scope.turnCardsArray[5] = {
                        "cards" : [$scope.tempTurnCards[2], $scope.tempTurnCards[1], $scope.tempTurnCards[0]],
                        "title" : $scope.tempTurnCards[2].rank + ', ' + $scope.tempTurnCards[1].rank + ', ' + $scope.tempTurnCards[0].rank
                    };
                    $scope.turnIndex = null;
                } else {
                    $scope.checkBetStatus(data);
                    $scope.lastResult = $scope.lastResultTmp;
                    var multiplier = gameController.getResultMultiplier();
                    if (multiplier < 1) {
                        $scope.resultMultiplier = null;
                        $scope.resultProfit = null;
                    } else {
                        $scope.resultMultiplier = multiplier;
                        $scope.resultProfit = gameController.getResultProfit();
                        $scope.animateMessage();
                        gameController.playWinSounds(multiplier);
                    }
                }
            }
        },
        function() {
            console.log('error');
            $scope.clearError();
            $scope.serverErr = true;

            if(!$scope.gameRetry){
                $scope.gameRetry = true;
                setTimeout(function() {
                    $scope.$apply(function() {
                        $scope.nextAction();
                    });
                }, 2000);
            }
        });
    };
    $scope.startNewGame = function(){
        var game_status = 'finish';
        var all_bets = {};
        var game = angular.extend($scope.currentGame,{game_status:game_status, all_bets:JSON.stringify(all_bets)});
        $scope.betResult = 0;
        Game.nextAction(game, function(data) {
            $scope.lastResultTmp = data;
            gameController.finishGame();
        },
        function() {
            $scope.clearError();
            $scope.serverErr = true;

            if(!$scope.gameRetry){
                $scope.gameRetry = true;
                setTimeout(function() {
                    $scope.$apply(function() {
                        $scope.nextAction();
                    });
                }, 2000);
            }
        });
    };
    $scope.toggleNumberCompare = function(compare){
        if(compare === $scope.bets.numberCompare){
            $scope.bets.numberCompare = null;
        }else{
            $scope.bets.numberCompare = compare;
        }
    };
    $scope.toggleBets = function(betType){
        switch (betType) {
            case 'high':
                $scope.bets.high = !$scope.bets.high;
                break;
            case 'even':
                $scope.bets.even = !$scope.bets.even;
                break;
            case 'odd':
                $scope.bets.odd = !$scope.bets.odd;
                break;
        }
    };

    $scope.checkBetStatus = function (data) {
        var elem = document.querySelectorAll( '.chips' );
        if (data.result.highBet === 0) {
            elem[0].style.display="none";
            elem[0].innerHTML="0";
        }
        if (data.result.evenBet === 0) {
            elem[1].style.display="none";
            elem[1].innerHTML="0";
        }
        if (data.result.oddBet === 0) {
            elem[2].style.display="none";
            elem[2].innerHTML="0";
        }
        $scope.checkFlatBet();
        $scope.bets.turn = data.result.turnBets;
        $scope.bets.high = data.result.highBet;
        $scope.bets.even = data.result.evenBet;
        $scope.bets.odd = data.result.oddBet;
    };

    $scope.clearBets = function() {
        if(gameController.isGameInProgress()) { return false; }
        $scope.bets = {};
        $scope.turnIndex = null;
        $scope.turnCardsArray = [];
        $scope.turnCards = [];
        $scope.calculateTotalBet();
        var elem = document.querySelectorAll( '.chips' );
        for(var x=0;x< elem.length;x++) {
            elem[x].style.display="none"; //chips element
            elem[x].innerHTML="0";
        }
        angular.forEach($scope.betCards.cards, function(card){
            card.type = 0;
        });
    };

    $scope.checkFlatBet = function() {
        $scope.bets.flat = null;
        angular.forEach($scope.betCards.cards, function(card){
            if (card.type === 1 || card.type === 2) {
                $scope.bets.flat = 1;
            }
        });
    };

    $scope.addFlatBet = function(card, type) {
        if (card.cnt !== 4) {
            card.type = type;
            $scope.checkFlatBet();
        } else {

        }
    };

    $scope.getFlippedCards = function() {
        return new Array(52 - $scope.playercards.cardCount());
    };

    $scope.selectCard = function(index){
        $scope.selectedCardIndex = index + 1;
    };

    $scope.getBetAmount = function(i, wantNew) {
        if($scope.bets.hasOwnProperty(i)) {
            if ($scope.bets.hasOwnProperty(i) && wantNew) {
                return ($scope.btcWager * $scope.bets[i]);
            } else {
                return ($scope.btcWager * $scope.bets[i]);
            }
        }
        return 0;
    };

    $scope.getTotalBet = function() {
        var totalbet = 0;
        for(var i in $scope.bets) {
            if($scope.bets.hasOwnProperty(i)) {
                totalbet += $scope.getBetAmount(i, false);
            }
        }
        return totalbet;
    };

    $scope.calculateTotalBet = function() {
        $scope.totalbet = $scope.getTotalBet();
    };

};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
