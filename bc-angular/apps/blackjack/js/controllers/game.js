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
          this.point = 7;
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
        return {rank:rank, suit:suit,flipped:flipped, lose:lose, invisible: true,currentGame:currentGame,warCard:warCard};
    };
    this.getPoint = function(){
       var point = 0;
       switch (this.rank) {
        case "A" :
          point = 1;
          break;
        case "2" :
          point = 2;
          break;
        case "3" :
          point = 3;
          break;
        case "4" :
          point = 4;
          break;
        case "5" :
          point = 5;
          break;
        case "6" :
          point = 6;
          break;
        case "7" :
          point = 7;
          break;
        case "8" :
          point = 8;
          break;
        case "9" :
          point = 9;
          break;
        case "T" :
          point = 10;
          break;
        case "J" :
          point = 10;
          break;
        case "Q" :
          point = 10;
          break;
        case "K" :
          point = 10;
          break;
        default :
          point = 0;
          break;
      }
      return point;

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
    this.cardPoint = function(){
        var sum = 0;
        for(var d in this.cards){
            sum +=this.cards[d].getPoint();
        }
        return sum;
    };
    this.isHaveAce = function(){
        var isHaveAce = false;
        for(var d in this.cards){
            if("Ace" === this.cards[d].rank){
                isHaveAce = true;
                break;
            }

        }
        return isHaveAce;
    };
};

var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var gameController = this;
    gameController.gameName = 'bj';
    gameController.Game = Game;
    $scope.timer = 2000;
    $scope.autowar = false;
    $scope.autosurrender = false;
    $scope.gameTime = 2000;


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
        $scope.gOptions = false;
        $scope.splited=false;
        $scope.playerHands = {};
        $scope.dealingPlayer = true;
        $scope.dealingDealer = true;
        $scope.nomorePlayerCards = false;
        $scope.finished = false;
        $scope.animateCardCount = 0;
        GameController.super_.prototype.newGame_OnSuccess.call(gameController, response);
        $scope.player1cards = new Stack();
        $scope.player2cards = new Stack();
        $scope.dealerHand = response.dealer_hand;
        $scope.playerHands = response.player_hands;
        if(response.status === 'finished'){
            $scope.dealFlippedCard = true;
            $scope.dealCards(response, function(){
                $scope.dealFlippedCard = false;
                gameController.finishGame([$scope.dealerHand.cards.pop()]);
            });
        }else{
            $scope.dealCards(response);
        }
        $scope.actions = 0;
    };

    this.finishGame = function(newCards){
        $scope.dealercards.cards.pop();
        for(var card in newCards){
            if(newCards.hasOwnProperty(card)){
                var newCard = new Card(newCards[card].rank, newCards[card].suit, "", "", "livecard");
                $scope.dealercards.addCard(newCard);
            }
        }
        $scope.gOptions = false;
        $scope.dealingPlayer = true;
        $scope.dealingDealer = true;
        $scope.animateDeal(function(){
            $scope.animateForDealer(function(){
                $scope.finished = true;
                GameController.super_.prototype.finishGame.call(gameController);
            });
        });
    };

    this.playWinSounds = function(multiplier) {
        if (multiplier >= 1.5 && multiplier <= 2) {
            $scope.playSound('winSound');
        } else if (multiplier > 2) {
            $scope.playSound('bigWinSound');
        }
    };

    this.autospin = function(){
        GameController.super_.prototype.autospin.call(this);
        this.$scope.timer = 2000;
    };

    GameController.super_.apply(this, arguments);

    gameController.finishGameDelay = 2000;

    $scope.play = function() {
        gameController.startGame(Game);
    };

    $scope.animateDeal = function(callback) {
        if($scope.nomorePlayerCards === true && callback){
            $scope.animateCardCount = 0;
            $scope.dealingPlayer = false;
            return callback();
        }
        var elem = document.querySelectorAll( '.player-cards .livecard' );

        $scope.isFiredAnimation = false;
        $(elem[$scope.animateCardCount]).animate({
           top:'0px',left:'0px',opacity:1
        }, 300, function(){
            if (elem[$scope.animateCardCount]) {
                if (!elem[$scope.animateCardCount].getAttribute('dealt')) {
                    $scope.playSound('dealCard');
                }
                elem[$scope.animateCardCount].setAttribute('dealt', true);
                $scope.animateCardCount++;
                if ($scope.animateCardCount < elem.length) {
                    $scope.animateDeal(callback);
                }
            }
            if($scope.animateCardCount === elem.length) {
                $scope.animateCardCount = 0;
                setTimeout(function(){
                    $scope.$apply(function(){
                        $scope.isFiredAnimation = true;
                        $scope.dealingPlayer = false;
                        if(callback){
                            callback();
                        }
                    });
                }, 100);
            }
        });
    };
    $scope.animateForDealer = function(callback){
        $scope.animateDealerCardCount = 0;
        $scope.animateDealerDeal(callback);
    };
    $scope.animateDealerDeal = function(callback){
        var elem = document.querySelectorAll( '.dealer-cards .livecard' );
        $scope.isFiredAnimation = false;
        $(elem[$scope.animateDealerCardCount]).animate({
           top:'0px',left:'0px',opacity:1
        }, 300, function(){

            if(!elem[$scope.animateDealerCardCount].getAttribute('dealt')){
                $scope.playSound('dealCard');
            }
            elem[$scope.animateDealerCardCount].setAttribute('dealt',true);
            $scope.animateDealerCardCount++;
            if($scope.animateDealerCardCount < elem.length) {
                $scope.animateDealerDeal(callback);
            }
            if($scope.animateDealerCardCount === elem.length) {
                $scope.animateDealerCardCount = 0;
                setTimeout(function(){
                    $scope.$apply(function(){
                        $scope.isFiredAnimation = true;
                        if(!$scope.dealFlippedCard){
                            $scope.dealingDealer = false;
                        }
                        if(callback){
                            callback();
                        }
                    });
                }, 100);
            }
        });
    };
    $scope.dealCards = function(data, callback) {
        $scope.playercards = new Stack();
        $scope.dealercards = new Stack();

        // for(var d in data.dealer_hand.cards) {
        //     if(data.dealer_hand.cards.hasOwnProperty(d)) {
        //     }
        // }
        var dcard1 = new Card(data.dealer_hand.cards[0].rank, data.dealer_hand.cards[0].suit, "", "","livecard");
        $scope.dealercards.addCard(dcard1);
        // if(data.status !== 'finished'){
        var holdCard = new Card("", "", "flipped", "","livecard");
        $scope.dealercards.addCard(holdCard);
        // }
        for(var p in data.player_hands[0].cards) {
            if(data.player_hands[0].cards.hasOwnProperty(p)) {
                var plcard1 = new Card(data.player_hands[0].cards[p].rank, data.player_hands[0].cards[p].suit, "", "","livecard");
                $scope.playercards.addCard(plcard1);
            }
        }
        $scope.gOptions = true;
        $scope.isFiredAnimation = false;
        setTimeout(function() {
            $scope.$apply(function() {
                $scope.animateForDealer(function(){
                    if(callback){
                        $scope.animateDeal(callback);
                    }else{
                        $scope.animateDeal();
                    }
                });
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

    $scope.hit = function(lastCard){
        lastCard = new Card(lastCard.rank, lastCard.suit, "", "","livecard");
        $scope.playercards.addCard(lastCard);
        $scope.dealingPlayer = true;
        $scope.animateCardCount = document.querySelectorAll( '.player-cards .livecard' ).length - 2;
        if(!$scope.playerHands[0].finished){
            $scope.animateDeal();
        }
    };

     $scope.split = function(playerHands){
        //$scope.playerHands = playerHands;
        var player1cards = new Stack();
        var player2cards = new Stack();
        $scope.player1cards = player1cards;
        $scope.player2cards = player2cards;

        for(var p1 in playerHands[0].cards) {
            if(playerHands[0].cards.hasOwnProperty(p1)) {
                var pcard1 = new Card(playerHands[0].cards[p1].rank, playerHands[0].cards[p1].suit, "", "","livecard");
                $scope.player1cards.addCard(pcard1);
            }
        }

         for(var p2 in playerHands[1].cards) {
            if(playerHands[1].cards.hasOwnProperty(p2)) {
                var pcard2 = new Card(playerHands[1].cards[p2].rank, playerHands[1].cards[p2].suit, "", "","livecard");
                $scope.player2cards.addCard(pcard2);
            }
        }

        $scope.splited=true;
        $scope.gOptions=false;
        if(!playerHands[0].finished || !playerHands[1].finished){
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.animateCardCount = document.querySelectorAll( '.player-cards .livecard' ).length - 4;
                    $scope.dealingPlayer = true;
                    $scope.animateDeal();
                });
            },100);
        }
    };

    $scope.split_hit = function(playerHands){
        var newCardCount = 1;
        if(playerHands[0].cards.length > $scope.player1cards.cards.length){
            $scope.player1cards.addCard(playerHands[0].cards[playerHands[0].cards.length-1]);
            newCardCount ++;
        }
        if(playerHands[1].cards.length > $scope.player2cards.cards.length){
            $scope.player2cards.addCard(playerHands[1].cards[playerHands[1].cards.length-1]);
            newCardCount ++;
        }

        $scope.animateCardCount = document.querySelectorAll( '.player-cards .livecard' ).length - newCardCount;

        $scope.dealingPlayer = true;
        if(!playerHands[1].busted){
            $scope.animateDeal();
        }

    };

    $scope.split_stand = function(playerHands){
        var status = playerHands[1].finished;

        if(status){
            $scope.gOptions = false;
        }else{
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.animateCardCount = document.querySelectorAll( '.player-cards .livecard' ).length - 2;
                    $scope.animateDeal();
                });
            },100);
        }
        if(playerHands[1].cards.length > $scope.player2cards.cards.length){
            $scope.player2cards.addCard(playerHands[1].cards[playerHands[1].cards.length-1]);
        }
    };

    $scope.nextAction = function(action){
        var game = angular.extend($scope.currentGame,{bet:action});
        Game.nextAction(game, function(data) {
            $scope.actions++;
            $scope.lastResultTmp = data;
            var playerCards = $scope.lastResultTmp.player_hands[0].cards;
            var dealerCards = $scope.lastResultTmp.dealer_hand.cards;
            var lastIndex = playerCards.length - 1;
            var lastPlayerCard = playerCards[lastIndex];
            var playerHands = $scope.lastResultTmp.player_hands;
            var newDealerCards = dealerCards.splice($scope.dealercards.cardCount()-1);
            $scope.playerHands = playerHands;
            $scope.dealerHand = $scope.lastResultTmp.dealer_hand;
            if($scope.playerHands.length === 1){
                if($scope.playercards.cardCount() === playerHands[0].cards.length){
                    $scope.nomorePlayerCards = true;
                }
            }else{
                if($scope.player1cards.cardCount() === playerHands[0].cards.length &&
                   $scope.player2cards.cardCount() === playerHands[1].cards.length){
                    $scope.nomorePlayerCards = true;
                }
            }
            if(action === 'hit'){
                if($scope.splited){
                  $scope.split_hit(playerHands,newDealerCards);
                }else{
                   $scope.hit(lastPlayerCard,newDealerCards);
                }
            }
            if(action === 'stand'){
                if($scope.splited){
                    $scope.split_stand(playerHands,newDealerCards);
                }
            }
            if(action === 'double'){
                $scope.hit(lastPlayerCard);
            }
            if(action === 'split'){
                $scope.split(playerHands);
            }
            if(data.status === 'finished'){

                gameController.finishGame(newDealerCards);
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
