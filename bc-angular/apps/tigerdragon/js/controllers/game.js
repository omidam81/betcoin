'use strict';
/* global BaseGameController */

var Card = function(rank,suit,flipped) {
    this.rank = rank;
    this.suit = suit;
    this.flipped = flipped;
};

var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var gameController = this;
    gameController.gameName = 'tigerdragon';
    gameController.Game = Game;
    $scope.timer = 2000;
    $scope.autowar = false;
    $scope.autosurrender = false;
    $scope.gameTime = 2000;

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
        setTimeout(function(){
            gameController.finishGame();
        }, $scope.gameTime);
    };

    this.playWinSounds = function(multiplier) {
        var self = this;
        if (multiplier > 1 && multiplier <= 2) {
            self.$scope.playSound('winSound');
        } else if (multiplier > 2) {
           self.$scope.playSound('bigWinSound');
        }
    };


    this.autospin = function(){
        GameController.super_.prototype.autospin.call(this);
        this.$scope.timer = 2000;
    };

    // this.playWinSounds = function() {

    //     //handled in win function
    // };

    GameController.super_.apply(this, arguments);

    gameController.finishGameDelay = 2000;

    $scope.play = function() {
        gameController.startGame(Game);
    };

    var dealCount = 0;
    var totalCards = 0;

    var finishDeal = function() {
        dealCount = 0;
        totalCards = 0;
        if ($scope.playercards.rankOrder > $scope.bankercards.rankOrder) {
            $scope.playercards.winLoseTie = 3;
            $scope.bankercards.winLoseTie = 0;
        }
        else if ($scope.playercards.rankOrder < $scope.bankercards.rankOrder) {
            $scope.bankercards.winLoseTie = 3;
            $scope.playercards.winLoseTie = 0;
        } else {
            $scope.bankercards.winLoseTie = 1;
            $scope.playercards.winLoseTie = 1;
        }
    };

    var animateCard = function(cardElement) {
        $(cardElement).animate({
            top:'0px',left:'0px',opacity:1
        }, 300, function(){
            $scope.playSound('dealCard');
            cardElement.setAttribute('dealt',true);
            $scope.$apply(function() {
                dealCount += 1;
                if (dealCount === totalCards) {
                    finishDeal();
                } else {
                    $scope.animateDeal();
                }
            });
        });
    };

    $scope.animateDeal = function() {
        var playerHand = document.querySelectorAll('.player-hand');
        var bankerHand = document.querySelectorAll('.banker-hand');
        totalCards = playerHand.length + bankerHand.length;
        var index = parseInt(dealCount / 2, 10);
        if (dealCount % 2 === 0) {
            animateCard(playerHand[index]);
        } else {
            animateCard(bankerHand[index]);
        }
    };
    $scope.dealCards = function(data) {
        $scope.playercards = {};
        $scope.bankercards = {};
        $scope.playercards.cards = [];
        $scope.bankercards.cards = [];

        if(data.banker_hand.card) {
            var dcard = new Card(data.banker_hand.card.rank, data.banker_hand.card.suit, "");
            $scope.bankercards.cards.push(dcard);
        }

        $scope.bankercards.rankOrder = data.banker_hand.rankOrder;
        if(data.player_hand.card) {
            var plcard = new Card(data.player_hand.card.rank, data.player_hand.card.suit, "");
            $scope.playercards.cards.push(plcard);
        }
        $scope.playercards.rankOrder = data.player_hand.rankOrder;

        setTimeout(function() {
            $scope.$apply(function() {
                $scope.animateDeal();
            });
        },100);
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
