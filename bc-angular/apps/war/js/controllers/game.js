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
    gameController.gameName = 'war';
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
        gameParams.tiebet = $scope.is_tie_bet;
        return gameParams;
    };

    this.newGame_OnSuccess = function(response){
        $scope.currentGame = response;
        $scope.dealCards(response);
        GameController.super_.prototype.newGame_OnSuccess.call(gameController, response);
    };

    this.autospin = function(){
        GameController.super_.prototype.autospin.call(this);
        this.$scope.timer = 2000;
    };

    this.playWinSounds = function() {

        //handled in win function
    };

    GameController.super_.apply(this, arguments);

    gameController.finishGameDelay = 2000;

    $scope.play = function() {
        $scope.gOptions = false;
        $scope.lastWagerAmount = $scope.btcWager;
        gameController.startGame(Game);
    };


    $scope.compare = function(dealercard, playercard)
    {
        var ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

        var dealerrank = ranks.indexOf(dealercard);
        var playerrank = ranks.indexOf(playercard);
        if(playerrank > dealerrank) {
            return 1;
        } else if(playerrank < dealerrank) {
            return -1;
        } else {
            return 0;
        }
    };

    $scope.autoWar = function() {
        $scope.autowar = $scope.autowar ? false : true;
        googleanalytics('send', 'event', gameController.gameName, 'game', 'autowar' + ($scope.autowar ? 'enabled' : 'disabled'));
        $scope.autosurrender = false;
    };

    $scope.autoSurrender = function() {
        $scope.autosurrender = $scope.autosurrender ? false : true;
        googleanalytics('send', 'event', gameController.gameName, 'game', 'autosurrender' + ($scope.autosurrender ? 'enabled' : 'disabled'));
        $scope.autowar = false;
    };

    // $scope.spin = function() {
    //     $scope.play();
    // };
    $scope.animateCardCount = 0;
    $scope.animateDeal = function() {
        var elem = document.querySelectorAll( '.livecard' );
        $(elem[$scope.animateCardCount]).animate({
           top:'0px',left:'0px',opacity:1
        }, 400, function() {
            $scope.playSound('dealCard');
            elem[$scope.animateCardCount].setAttribute('dealt',true);
            $scope.animateCardCount++;
            if($scope.animateCardCount < elem.length) {
                $scope.animateDeal($scope.animateCardCount);
            }
            if($scope.animateCardCount === elem.length) {
                $scope.animateCardCount = 0;
                $scope.$apply(function() {
                    var data = $scope.lastResultTmp;
                    if (!data.dealer_stack) {
                        return;
                    }
                    var dealerrank = data.dealer_stack[0].rank;
                    var playerrank = data.player_stack[0].rank;
                    var compare = $scope.compare(dealerrank, playerrank);
                    if(compare === 0){
                        $scope.presentoptions();
                    } else if (compare === 1) {
                        $scope.win();
                    } else {
                        gameController.finishGame(true);
                    }
                });
            }
        });
    };
    $scope.dealCards = function(data) {
        $scope.playercards = new Stack();
        $scope.dealercards = new Stack();

        var dcount = 1;
        for(var d in data.dealer_stack) {
            if(data.dealer_stack.hasOwnProperty(d)) {

                var dcard = new Card(data.dealer_stack[d].rank, data.dealer_stack[d].suit, "", "","livecard");
                $scope.dealercards.addCard(dcard);

                dcount++;
            }
        }
        var pcount = 2;
        for(var p in data.player_stack) {
            if(data.player_stack.hasOwnProperty(p)) {
                var plcard = new Card(data.player_stack[d].rank, data.player_stack[d].suit, "", "","livecard");
                $scope.playercards.addCard(plcard);
                pcount++;
            }

        }
        setTimeout(function() {
            $scope.$apply(function() {
                $scope.animateDeal();
            });
        },100);
    };
    $scope.win = function(){
        var dealercard = $scope.dealercards.cards[0];
        var playercard = $scope.playercards.cards[0];
        // set auto spin timer
        gameController.$scope.timer = 1000;
        if(dealercard.rank === playercard.rank) {
          gameController.$scope.timer += 4000;
        }

        var sound;
        var delay = 0;
        if(dealercard.rank === playercard.rank) {
          sound = "bigWinSound";
          delay += 4000;
        } else {
          sound = "winSound";
        }
        $scope.playSound(sound);
        setTimeout(function() {
            $scope.$apply(function() {
                gameController.finishGame();
            });
        },delay);
        gameController.finishGame();
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

    $scope.nextAction = function(gotoWar){
        if(!$scope.gOptions && !$scope.autowar && !$scope.autosurrender) { return; }

        var dealerrank = $scope.dealercards.cards[0].rank;
        var playerrank = $scope.playercards.cards[0].rank;
        var compare = $scope.compare(dealerrank, playerrank);
        if(compare !== 0) { return; }

        $scope.gOptions=false;
        var game = angular.extend($scope.currentGame,{gotoWar:gotoWar});

        Game.nextAction(game, function(data) {
            if(gotoWar) { $scope.dealWar(data); }
            else {
                if($scope.is_tie_bet) {
                     $scope.playSound("bigWinSound");
                }
                gameController.finishGame(true);
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
    $scope.animateWarCount = 0;
    $scope.animateWar = function(elem) {
        $(elem[$scope.animateWarCount]).animate({
           top:'0px',left:'0px',opacity:1
        }, 400, function() {
            elem[$scope.animateWarCount].setAttribute('dealt',true);

            $scope.playSound('dealCard');
            $scope.animateWarCount++;
            if($scope.animateWarCount < elem.length) {

                $scope.animateWar(elem);
            }
            if($scope.animateWarCount === elem.length) {
                 $scope.animateWarCount = 0;
            }
        });
    };
    $scope.dealWar = function(data) {

        for(var i=1;i<=3;i++) {
            var bcard = new Card("", "", "flipped","","livecard","warcard");
            $scope.dealercards.addCard(bcard);
        }

        var dealercard = data.dealer_stack[data.dealer_stack.length-1];
        var playercard = data.player_stack[data.player_stack.length-1];

        var dcard = new Card(dealercard.rank, dealercard.suit, "", "","livecard","warcard");
        $scope.dealercards.addCard(dcard);

        var plcard = new Card(playercard.rank, playercard.suit, "", "","livecard","warcard");
        $scope.playercards.addCard(plcard);
        var dealerrank = data.dealer_stack[data.dealer_stack.length-1].rank;
        var playerrank = data.player_stack[data.dealer_stack.length-1].rank;
        setTimeout(function() {
            $scope.$apply(function() {
                var elem = document.querySelectorAll( '.livecard' );
                var elems = [];
                for(var i=0;i<elem.length;i++) {
                    if(!elem[i].getAttribute('dealt')) {
                        elems.push(elem[i]);
                    }
                }
                $scope.animateWar(elems);
            });
        },100);
        setTimeout(function() {
            $scope.$apply(function() {
                var compare = $scope.compare(dealerrank, playerrank);
                if(compare === 0 || compare === 1){
                    $scope.win();
                } else {
                    gameController.finishGame(true);
                }

            });

        },$scope.gameTime);

    };

};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
