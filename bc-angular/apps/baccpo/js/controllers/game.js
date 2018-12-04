'use strict';
/* global BaseGameController */

var Card = function(rank,suit,flipped,hover) {
    this.rank = rank;
    this.suit = suit;
    this.flipped = flipped;
    this.hover = hover;
};
var Stack = function() {
    // Create an empty array of cards.

    this.cards = [];

    this.addCard   = function(card) {
        this.cards.push(card);
    };

    this.cardCount = function() {
        return this.cards.length;
    };
    this.winLoseTie = null;
    this.rank = null;
};

var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var gameController = this;
    gameController.gameName = 'baccpo';
    gameController.Game = Game;
    $scope.timer = 2000;
    $scope.gameTime = 2000;

    $scope.playerWinLoseTie = false;

    this.isExceedMaxWager = function() {
        if ($scope.totalbet !== 0 && $scope.totalbet > gameController.getBalance()) {
            $scope.maxBetErr = true;
            return true;
        }
        return false;
    };

    this.getNewGameParams = function(){
        var gameParams = GameController.super_.prototype.getNewGameParams.call(this);
        //this needs to get the multiple bets, once the game board has been setup

        var betsWager = {};
        for(var i in $scope.bets) {
            betsWager[i] = $scope.bets[i] * gameController.getWager();
        }

        gameParams.bets = JSON.stringify(betsWager);
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
        if (multiplier === 0) {
            $scope.resultMultiplier = null;
            $scope.resultProfit = null;
            if(callback){
                callback();
            }
        } else {
            $scope.resultMultiplier = multiplier;
            $scope.resultProfit = self.getResultProfit();
            $scope.animateMessage();
            this.playWinSounds(multiplier);
            if(callback){
                callback();
            }
        }
    };

    GameController.super_.apply(this, arguments);

    gameController.finishGameDelay = 2000;

    $scope.play = function() {
        $scope.playerWinLoseTie = false;
        $scope.playercards = null;
        gameController.startGame(Game);
    };

    $scope.animateDealWithHover = function(animateCardCount) {
        $scope.$apply(function() {
            $scope.dealercards.cards[1].hover = false;
        });
        setTimeout(function() {
            $scope.animateDeal(animateCardCount);
        }, 500);
    };

    $scope.animateCardDone = function(animateCardCount, length, noSound) {
        if (!noSound) {
            $scope.playSound('dealCard');
        }

        animateCardCount++;
        $scope.$apply(function () {
            $scope.animateCardCount = animateCardCount;
        });
        if(animateCardCount < length) {
            $scope.animateDeal(animateCardCount);
        } else {
            $scope.$apply(function(){
                $scope.dealingCard = false;
                if($scope.lastResultTmp.status !== 'finished' && $scope.autospin){
                    setTimeout(function(){
                        $scope.nextAction('hit');
                    }, $scope.timer);
                }
                if($scope.lastResultTmp.status === 'finished'){
                    gameController.finishGame(true);
                }
            });
        }
    };

    $scope.animateDeal = function(animateCardCount) {
        animateCardCount = animateCardCount||0;
        $scope.dealingCard = true;
        var playerHand = document.querySelectorAll('#player-cards .livecard');
        var dealerHand = document.querySelectorAll('#dealer-cards .livecard');
        var elem;
        if (animateCardCount % 2 === 0) {
            elem = playerHand[animateCardCount / 2];
            if (elem === undefined) {
                elem = dealerHand[animateCardCount / 2];
            }
        } else {
            elem = dealerHand[(animateCardCount - 1) / 2];
        }
        if (elem === undefined) {
            $scope.animateCardDone(animateCardCount, playerHand.length + dealerHand.length, true); //no sound
        }

        $(elem).animate({
           top:'0px',left:'0px',opacity:1
        }, 200, function() {
            $scope.animateCardDone(animateCardCount, playerHand.length + dealerHand.length, false);
        });
    };
    $scope.dealCards = function(data) {
        $scope.playercards = new Stack();
        $scope.dealercards = new Stack();
        $scope.animateCardCount = 0;
        $scope.dealingCard = true;
        var i;

        if(data.status !== 'finished'){
            $scope.dealercards.addCard(new Card(data.dealer_hand.initCards[0].rank, data.dealer_hand.initCards[0].suit, ""));
            $scope.dealercards.addCard(new Card("", "", "flipped"));
            $scope.dealercards.point = data.dealer_hand.point;

            $scope.playercards.rank = data.player_hand.rank;
            $scope.playercards.point = data.player_hand.point;
            for(i=0;i<2;i++) {
                $scope.playercards.addCard(new Card(data.player_hand.initCards[i].rank, data.player_hand.initCards[i].suit, ""));
            }

            setTimeout(function() {
                $scope.animateDeal($scope.animateCardCount);
            },100);
        }else{
            $scope.animateCardCount = 4;
            $scope.playercards.rank = data.player_hand.rank;
            $scope.playercards.point = data.player_hand.point;
            $scope.dealercards.point = data.dealer_hand.point;

            for(i=0;i<data.dealer_hand.finalCards.length;i++) {
                var hover = false;
                if (i === 1) {
                    hover = true;
                }
                $scope.dealercards.addCard(new Card(data.dealer_hand.finalCards[i].rank, data.dealer_hand.finalCards[i].suit, "", hover));
            }
            for(i=0;i<data.player_hand.finalCards.length;i++) {
                $scope.playercards.addCard(new Card(data.player_hand.finalCards[i].rank, data.player_hand.finalCards[i].suit, ""));
            }

            if (data.is_win) {
                $scope.playerWinLoseTie = 3;
            } else if (data.is_push) {
                $scope.playerWinLoseTie = 1;
            } else {
                $scope.playerWinLoseTie = 0;
            }

            setTimeout(function() {
                $scope.animateDealWithHover($scope.animateCardCount);
            },100);
        }
    };

    $scope.nextAction = function(action){
        $scope.dealingCard = true;
        var game = angular.extend($scope.currentGame,{action: action});

        Game.nextAction(game, function(data) {
            $scope.lastResultTmp = data;
            $scope.dealCards(data);
        },
        function() {
            $scope.clearError();
            $scope.serverErr = true;

            if(!$scope.gameRetry){
                $scope.gameRetry = true;
                setTimeout(function() {
                    $scope.$apply(function() {
                        $scope.nextAction(action);
                    });
                }, 2000);
            }
        });
    };

    $scope.bets = {};

    $scope.$watch('btcWager', function() {
        if(!$scope.player) { return; }
        if($scope.getTotalBet() > gameController.getBalance()) {
            var numtokens = 0;
            for(var i in $scope.bets) {
                if($scope.bets.hasOwnProperty(i)) {
                    numtokens += $scope.bets[i];
                }
            }
            var newvalue = Math.floor(gameController.getBalance() / numtokens);
            $scope.btcWager = newvalue;
        }
        $scope.calculateTotalBet();
    });

    $scope.$watch('bets', function(){
        $scope.calculateTotalBet();
    }, true);

    $scope.getTotalBet = function() {
        var totalbet = 0;
        for(var i in $scope.bets) {
            if($scope.bets.hasOwnProperty(i)) {
                totalbet += $scope.btcWager * $scope.bets[i];
            }
        }
        return totalbet;
    };
    $scope.clearBets = function() {
        if(gameController.isGameInProgress()) { return false; }
        $scope.bets = {};
        $scope.calculateTotalBet();
        var elem = document.querySelectorAll( '.chips' );
        for(var x=0;x< elem.length;x++) {
            elem[x].style.display="none"; //chips element
            elem[x].innerHTML="0";
        }
    };
    $scope.calculateTotalBet = function() {
        $scope.totalbet = $scope.getTotalBet();
    };
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
