'use strict';
/* global BaseGameController */

var Card = function(rank,suit,flipped, lose,currentGame,warCard, scoreSum, stack) {
    this.rank = rank;
    this.suit = suit;
    this.flipped = flipped;
    this.lose = lose;
    this.invisible = true;
    this.currentGame = currentGame;
    this.warCard = warCard;
    this.stack = stack;

    this.getScore = function () {
        if (this.rank === "A") {
            return 1;
        } else if (this.rank === "2" || this.rank === "3" || this.rank === "4" || this.rank === "5" ||
            this.rank === "6" || this.rank === "7" || this.rank === "8" || this.rank === "9") {
            return parseInt(this.rank);
        }
        return 0;
    };

    this.score = this.getScore();
    this.scoreSum = (scoreSum + this.score) % 10;
};
var Stack = function() {

    // Create an empty array of cards.

    this.cards = [];
    this.scoreSum = 0;
    this.finalScore = 0;
    this.winLoseTie = -1;

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
    gameController.gameName = 'baccarat';
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
        $scope.gOptions = false;
        gameController.startGame(Game);
    };

    // $scope.spin = function() {
    //     $scope.play();
    // };
    var dealCount = 0;
    var totalCards = 0;

    var finishDeal = function() {
        dealCount = 0;
        totalCards = 0;
        if ($scope.playercards.finalScore > $scope.bankercards.finalScore) {
            $scope.playercards.winLoseTie = 3;
            $scope.bankercards.winLoseTie = 0;
        }
        else if ($scope.playercards.finalScore < $scope.bankercards.finalScore) {
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
            var cardScope = angular.element(cardElement).scope().$parent;
            $scope.$apply(function() {
                cardScope.card.stack.scoreSum = cardScope.card.scoreSum;
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
        // deal first four cards
        if (dealCount < 4) {
            // modulo to select player or banker hand
            // 0 for player
            if (dealCount % 2 === 0) {
                animateCard(playerHand[index]);
            } else {
                animateCard(bankerHand[index]);
            }
        } else {
            if (playerHand.length === bankerHand.length) {
                if (dealCount % 2 === 0) {
                    animateCard(playerHand[index]);
                } else {
                    animateCard(bankerHand[index]);
                }
            } else if (playerHand.length > bankerHand.length) {
                animateCard(playerHand[index]);
            } else {
                animateCard(bankerHand[index]);
            }
        }
    };
    $scope.dealCards = function(data) {
        $scope.playercards = new Stack();
        $scope.bankercards = new Stack();

        var dcount = 1;
        var scoreSum = 0;
        for(var d in data.banker_hand.cards) {
            if(data.banker_hand.cards.hasOwnProperty(d)) {

                var dcard = new Card(data.banker_hand.cards[d].rank, data.banker_hand.cards[d].suit, "", "","livecard", NaN, scoreSum, $scope.bankercards);
                $scope.bankercards.addCard(dcard);
                scoreSum = dcard.scoreSum;

                dcount++;
            }
        }
        $scope.bankercards.finalScore = data.banker_hand.score;
        var pcount = 2;
        scoreSum = 0;
        for(var p in data.player_hand.cards) {
            if(data.player_hand.cards.hasOwnProperty(p)) {
                var plcard = new Card(data.player_hand.cards[p].rank, data.player_hand.cards[p].suit, "", "","livecard", NaN, scoreSum, $scope.playercards);
                $scope.playercards.addCard(plcard);
                scoreSum = plcard.scoreSum;
                pcount++;
            }

        }
        $scope.playercards.finalScore = data.player_hand.score;
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
