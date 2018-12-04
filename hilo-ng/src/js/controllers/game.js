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
    gameController.gameName = 'hilo';
    gameController.Game = Game;
    $scope.timer = 2000;
    $scope.autowar = false;
    $scope.autosurrender = false;
    $scope.gameTime = 2000;
    $scope.bets = {};
    $scope.playercards = new Stack();
    $scope.selectedCardIndex = 12;

    $scope.currentBets = {
        numberCompare: null,
        color: null
    };
    $scope.betResult = 0;

    this.isExceedMaxWager = function(wager){
        var isExceedPlayerBalance = GameController.super_.prototype.isExceedMaxWager.call(this, wager);
        var isExceedGameMaxWagerLimit = wager > 1000000? true : false;
        var exceedMaxWager = isExceedPlayerBalance || isExceedGameMaxWagerLimit;
        $scope.maxBetErr = exceedMaxWager;
        return exceedMaxWager;
    };

    this.getNewGameParams = function(){
        var gameParams = GameController.super_.prototype.getNewGameParams.call(this);
        gameParams.bet = JSON.stringify([$scope.selectedCardIndex]);
        return gameParams;
    };
    this.newGame_OnStart = function() {
        this.setGameInProgress(true);
        this.$scope.resultMultiplier = null;
        this.$scope.resultProfit = null;
        this.clearLastResult();
    };
    this.newGame_OnSuccess = function(response){
        $scope.currentGame = response;
        $scope.dealCards(response);
        GameController.super_.prototype.newGame_OnSuccess.call(gameController, response);
        $scope.bets.color = null;
        $scope.bets.numberCompare = null;
        $scope.betResult = 0;
        $scope.selectedCardIndex--;
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

    $scope.play = function() {
        $scope.gOptions = false;
        $scope.selectedCardIndex = 12;
        $scope.playercards = new Stack();
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
        $scope.possiblePayout = $scope.determinePossiblePayout();
    }, true);
    $scope.$watch('btcWager', function(){
        $scope.possiblePayout = $scope.determinePossiblePayout();
    });

    $scope.animateDeal = function() {
        var lastCardCount = $scope.playercards.cardCount() - 1;
        var elem = document.querySelectorAll( '.livecard' );
        $(elem[lastCardCount]).animate({
           top:'0px',left:'0px',opacity:1
        }, 400, function() {
            $scope.playSound('dealCard');
            elem[lastCardCount].setAttribute('dealt',true);
        });
    };
    $scope.dealCards = function(data) {
        $scope.playercards = $scope.playercards || new Stack();
        var lastCard = data.player_stack.pop();
        var plcard = new Card(lastCard.rank, lastCard.suit, "", "","livecard");
        $scope.playercards.addCard(plcard);
        setTimeout(function() {
            $scope.$apply(function() {
                $scope.animateDeal();
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
        var bet = [], type;
        if($scope.bets.numberCompare && $scope.bets.color){
            type = $scope.bets.numberCompare + '_' + $scope.bets.color;
            bet.push(type);
        }else{
            if($scope.bets.numberCompare){
                bet.push($scope.bets.numberCompare);
            }
            if($scope.bets.color){
                bet.push($scope.bets.color);
            }
        }
        bet.push($scope.selectedCardIndex);
        var game = angular.extend($scope.currentGame,{bet:JSON.stringify(bet), wager: gameController.getWager()});
        $scope.currentBets.numberCompare = $scope.bets.numberCompare;
        $scope.currentBets.color = $scope.bets.color;
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
            $scope.dealCards(data);
            $scope.selectedCardIndex = 12 - $scope.playercards.cardCount();
            $scope.bets.color = null;
            $scope.bets.numberCompare = null;
            if(data.status === 'finished'){
                return gameController.finishGame();
            } else {
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
    $scope.startNewGame = function(){
        var bet = ["finish"];
        var game = angular.extend($scope.currentGame,{bet:JSON.stringify(bet)});
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
    $scope.toggleColor = function(color){
        if(color === $scope.bets.color){
            $scope.bets.color = null;
        }else{
            $scope.bets.color = color;
        }
    };
    $scope.getFlippedCards = function() {
        return new Array(12 - $scope.playercards.cardCount());
    };
    $scope.selectCard = function(index){
        $scope.selectedCardIndex = index + 1;
    };
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
