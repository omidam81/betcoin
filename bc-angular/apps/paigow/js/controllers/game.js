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
    this.winLoseTie = null;
    this.rank = null;
};

var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var gameController = this;
    gameController.gameName = 'paigow';
    gameController.Game = Game;
    $scope.timer = 2000;
    $scope.gameTime = 2000;

    $scope.playerWinLoseTie = false;


    // this.isExceedMaxWager = function(wager){
    //     var isExceedPlayerBalance = GameController.super_.prototype.isExceedMaxWager.call(this, wager);
    //     var isExceedGameMaxWagerLimit = wager > 1000000? true : false;
    //     var exceedMaxWager = isExceedPlayerBalance || isExceedGameMaxWagerLimit;
    //     $scope.maxBetErr = exceedMaxWager;
    //     return exceedMaxWager;
    // };

    this.getNewGameParams = function(){
        var gameParams = GameController.super_.prototype.getNewGameParams.call(this);
        return gameParams;
    };

    this.newGame_OnSuccess = function(response){
        $scope.currentGame = response;
        $scope.dealCards(response);
        GameController.super_.prototype.newGame_OnSuccess.call(gameController, response);
    };

    this.autospin = function(){
        setTimeout(function(){
            GameController.super_.prototype.autospin.call(gameController);
        }, 4000);
    };

    this.processWin = function(callback){
        var self = this;
        var $scope = this.$scope;
        this.$scope.lastResult = this.$scope.lastResultTmp;
        this.$scope.lastResultTmp = {};
        var multiplier = this.getResultMultiplier();
        if (multiplier < 1) {
            $scope.resultMultiplier = null;
            $scope.resultProfit = null;
            if(callback){
                callback();
            }
        } else {
            $scope.resultMultiplier = multiplier;
            $scope.resultProfit = self.getResultProfit();
            $scope.animateMessage();
            if (!$scope.lastResult.is_push) {
                this.playWinSounds(multiplier);
            }
            if(callback){
                callback();
            }
        }
    };

    GameController.super_.apply(this, arguments);

    gameController.finishGameDelay = 2000;

    $scope.play = function() {
        $scope.gOptions = false;
        $scope.playerWinLoseTie = false;
        gameController.startGame(Game);
    };

    $scope.animateDeal = function(animateCardCount) {
        animateCardCount = animateCardCount||0;
        $scope.dealingCard = true;
        var elem = document.querySelectorAll( '.livecard' );
        $(elem[animateCardCount]).animate({
           top:'0px',left:'0px',opacity:1
        }, 200, function() {
            $scope.playSound('dealCard');
            elem[animateCardCount].setAttribute('dealt',true);
            animateCardCount++;
            $scope.$apply(function () {
                $scope.animateCardCount = animateCardCount;
            });
            if(animateCardCount < elem.length) {
                $scope.animateDeal(animateCardCount);
            }
            if(animateCardCount === elem.length) {
                $scope.$apply(function(){
                    $scope.dealingCard = false;
                    if($scope.lastResultTmp.status !== 'finished' && $scope.autospin){
                        setTimeout(function(){
                            $scope.nextAction(true);
                        }, $scope.timer);
                    }
                    if($scope.lastResultTmp.status === 'finished'){
                        gameController.finishGame(true);
                    }
                });
            }
        });
    };
    $scope.dealCards = function(data) {
        $scope.split = [];
        $scope.playercards = new Stack();
        $scope.dealercards = new Stack();
        $scope.dealerTwoCards = new Stack();
        $scope.playerTwoCards = new Stack();
        var i;
        var dcount = 1;
        for(var d in data.dealer_stack) {
            if(data.dealer_stack.hasOwnProperty(d)) {

                var dcard = new Card(data.dealer_stack[d].rank, data.dealer_stack[d].suit, "", "","livecard");
                $scope.dealercards.addCard(dcard);

                dcount++;
            }
        }
        if(data.status !== 'finished'){
            for(i=0;i<7;i++){
                $scope.dealercards.addCard(new Card("", "", "flipped","","livecard"));
                $scope.playercards.addCard(new Card(data.player_hand.initCards[i].rank, data.player_hand.initCards[i].suit, "", "","livecard"));
            }
        }else{
            $scope.dealerTwoCards.rank = data.banker_hand.twoRankObj.rnk;
            $scope.dealerTwoCards.subRank = data.banker_hand.twoRankObj.sub_rnk;
            $scope.dealercards.rank = data.banker_hand.fiveRankObj.rnk;
            $scope.dealercards.subRank = data.banker_hand.fiveRankObj.sub_rnk;
            $scope.playerTwoCards.rank = data.player_hand.twoRankObj.rnk;
            $scope.playerTwoCards.subRank = data.player_hand.twoRankObj.sub_rnk;
            $scope.playercards.rank = data.player_hand.fiveRankObj.rnk;
            $scope.playercards.subRank = data.player_hand.fiveRankObj.sub_rnk;
            for(i=0;i<2;i++){
                $scope.dealerTwoCards.addCard(new Card(data.banker_hand.twoCards[i].rank, data.banker_hand.twoCards[i].suit, "", "","livecard"));
                $scope.playerTwoCards.addCard(new Card(data.player_hand.twoCards[i].rank, data.player_hand.twoCards[i].suit, "", "","livecard"));
            }
            for(i=0;i<5;i++){
                $scope.dealercards.addCard(new Card(data.banker_hand.fiveCards[i].rank, data.banker_hand.fiveCards[i].suit, "", "","livecard"));
                $scope.playercards.addCard(new Card(data.player_hand.fiveCards[i].rank, data.player_hand.fiveCards[i].suit, "", "","livecard"));
            }
        }

        $scope.animateCardCount = 0;
        setTimeout(function() {
            $scope.$apply(function() {
                $scope.animateDeal();
            });
        },100);
    };

    $scope.pickCard = function(order){
        if(!$scope.isGameInProgress){
            return;
        }
        $scope.split = $scope.split || [];
        var exist = $scope.getSplitIndex(order);
        if(exist !== -1){
            $scope.split.splice(exist, 1);
            return;
        }
        if($scope.split.length === 2){
            return;
        }
        $scope.split.push(order);
    };

    $scope.getSplitIndex = function(order){
        $scope.split = $scope.split || [];
        var exist = $scope.split.indexOf(order);
        return exist;
    };

    $scope.nextAction = function(houseWay){
        $scope.splitError = null;
        $scope.dealingCard = true;
        var game = angular.extend($scope.currentGame,{split: JSON.stringify($scope.split), house_way:houseWay});

        Game.nextAction(game, function(data) {
            $scope.lastResultTmp = data;
            if(data.code === 400){
                $scope.splitError = true;
                return;
            }
            // if(data.code){
            //     return;
            // }
            $scope.dealCards(data);
            if (data.player_hand.fiveCardsResult === "player") {
                $scope.playercards.winLoseTie = 3;
                $scope.dealercards.winLoseTie = 0;
            } else if (data.player_hand.fiveCardsResult === "dealer") {
                $scope.playercards.winLoseTie = 0;
                $scope.dealercards.winLoseTie = 3;
            } else {
                $scope.playercards.winLoseTie = 1;
                $scope.dealercards.winLoseTie = 1;
            }

            if (data.player_hand.twoCardsResult === "player") {
                $scope.playerTwoCards.winLoseTie = 3;
                $scope.dealerTwoCards.winLoseTie = 0;
            } else if (data.player_hand.twoCardsResult === "dealer") {
                $scope.playerTwoCards.winLoseTie = 0;
                $scope.dealerTwoCards.winLoseTie = 3;
            } else {
                $scope.playerTwoCards.winLoseTie = 1;
                $scope.dealerTwoCards.winLoseTie = 1;
            }
            if (data.is_win) {
                $scope.playerWinLoseTie = 3;
            } else if (data.is_push) {
                $scope.playerWinLoseTie = 1;
            } else {
                $scope.playerWinLoseTie = 0;
            }
        },
        function(err) {
            if (err.status === 400) {
                $scope.splitError = true;
                $scope.dealingCard = false;
                return;
            }
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
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
