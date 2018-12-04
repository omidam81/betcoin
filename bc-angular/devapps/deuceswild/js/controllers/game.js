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
    this.rank = null;
};

var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var gameController = this;
    gameController.gameName = 'deuceswild';
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
        $scope.playercards = null;
        $scope.skipHoldedCards = false;
        $scope.holds = [false, false, false, false, false];
        gameController.startGame(Game);
    };

    $scope.animateDeal = function(animateCardCount, skipHoldedCards) {
        animateCardCount = animateCardCount||0;
        var cardInterval = 200;
        if ($scope.holds[animateCardCount] && skipHoldedCards) {
            cardInterval = 0;
        }
        $scope.dealingCard = true;
        var elem = document.querySelectorAll( '.livecard' );
        $(elem[animateCardCount]).animate({
           top:'0px',left:'0px',opacity:1
        }, cardInterval, function() {
            $scope.playSound('dealCard');
            elem[animateCardCount].setAttribute('dealt',true);
            animateCardCount++;
            $scope.$apply(function () {
                $scope.animateCardCount = animateCardCount;
            });
            if(animateCardCount < elem.length) {
                $scope.animateDeal(animateCardCount, skipHoldedCards);
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
        $scope.playercards = new Stack();
        var i;
        $scope.skipHoldedCards = false;
        if(data.status !== 'finished'){
            $scope.playercards.rank = data.player_hand.rnk;
            $scope.playercards.subRank = data.player_hand.sub_rnk;
            for(i=0;i<5;i++){
                $scope.playercards.addCard(new Card(data.player_hand.initCards[i].rank, data.player_hand.initCards[i].suit, "", "","livecard"));
            }
            if (data.player_hand.holds) {
                $scope.holds = data.player_hand.holds;
            }
        }else{
            $scope.skipHoldedCards = true;
            $scope.playercards.rank = data.player_hand.rnk;
            $scope.playercards.subRank = data.player_hand.sub_rnk;
            for(i=0;i<5;i++){
                $scope.playercards.addCard(new Card(data.player_hand.finalCards[i].rank, data.player_hand.finalCards[i].suit, "", "","livecard"));
            }
        }

        $scope.animateCardCount = 0;
        $scope.dealingCard = true;
        setTimeout(function() {
            $scope.animateDeal($scope.animateCardCount, $scope.skipHoldedCards);
        },100);
    };

    $scope.pickCard = function(order){
        if(!$scope.isGameInProgress){
            return;
        }
        $scope.holds = $scope.holds || [false, false, false, false, false];
        $scope.holds[order] = !$scope.holds[order];
    };

    $scope.nextAction = function(){
        $scope.holdsError = null;
        $scope.dealingCard = true;

        var game = angular.extend($scope.currentGame,{holds: JSON.stringify($scope.holds)});

        Game.nextAction(game, function(data) {
            $scope.lastResultTmp = data;
            if(data.code === 400){
                $scope.holdsError = true;
                return;
            }
            $scope.dealCards(data);
            if (data.is_win) {
                $scope.playerWinLoseTie = 3;
            }
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
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
