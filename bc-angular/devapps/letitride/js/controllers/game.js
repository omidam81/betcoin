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
    gameController.gameName = 'letitride';
    gameController.Game = Game;
    $scope.timer = 2000;
    $scope.gameTime = 2000;

    $scope.bets = {};


    this.isExceedMaxWager = function() {
        if ($scope.totalbet !== 0 && $scope.totalbet > $scope.player.balance.btc) {
            $scope.maxBetErr = true;
            return true;
        }
        return false;
    };

    this.getNewGameParams = function(){
        var gameParams = GameController.super_.prototype.getNewGameParams.call(this);

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

    this.finishGame = function() {
        GameController.super_.prototype.finishGame.call(gameController);
        if ($scope.bets.seed) {
            $scope.bets.first = $scope.bets.seed;
            $scope.bets.second = $scope.bets.seed;
            $scope.calculateTotalBet();
        }
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
            this.playWinSounds(multiplier);
            if(callback){
                callback();
            }
        }
    };

    GameController.super_.apply(this, arguments);

    gameController.finishGameDelay = 2000;

    $scope.play = function() {
        $scope.playercards = null;
        gameController.startGame(Game);
    };

    $scope.animateDealWithHover = function(i, animateCardCount) {
        $scope.$apply(function() {
            $scope.communitycards.cards[i].hover = false;
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
                        $scope.nextAction('letitride');
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
        var playerHand = Array.prototype.slice.call(document.querySelectorAll('#player-cards .livecard'));
        var communityHand = Array.prototype.slice.call(document.querySelectorAll('#community-cards .livecard'));
        var elems = playerHand.concat(communityHand);
        var elem = elems[animateCardCount];
        if (elem === undefined) {
            $scope.animateCardDone(animateCardCount, elems.length, true); //no sound
        }

        $(elem).animate({
            top:'0px',left:'0px',opacity:1
        }, 200, function() {
            $scope.animateCardDone(animateCardCount, elems.length, false);
        });
    };
    $scope.dealCards = function(data) {
        $scope.playercards = new Stack();
        $scope.communitycards = new Stack();
        $scope.animateCardCount = 0;
        $scope.dealingCard = true;
        var i;
        for(var bet in $scope.bets) {
            if (!data.bets.hasOwnProperty(bet)) {
                delete $scope.bets[bet];
            }
        }
        if(data.status !== 'finished'){
            $scope.playercards.rank = data.player_hand.rnk;
            $scope.playercards.subRank = data.player_hand.sub_rnk;

            for(i=0;i<data.community_hand.length;i++) {
                $scope.communitycards.addCard(new Card(data.community_hand[i].rank, data.community_hand[i].suit, "",true));
            }
            for(i=$scope.communitycards.cards.length;i<2;i++) {
                $scope.communitycards.addCard(new Card("", "", "flipped",true));
            }
            for(i=0;i<3;i++) {
                $scope.playercards.addCard(new Card(data.player_hand.initCards[i].rank, data.player_hand.initCards[i].suit, ""));
            }
            if (data.community_hand.length === 0) {
                setTimeout(function() {
                    $scope.animateDeal($scope.animateCardCount);
                },100);
            } else if (data.community_hand.length === 1) {
                $scope.animateCardCount = 5;
                setTimeout(function() {
                    $scope.animateDealWithHover(0, $scope.animateCardCount);
                },100);
            }
        }else{
            $scope.playercards.rank = data.player_hand.rnk;
            $scope.playercards.subRank = data.player_hand.sub_rnk;
            for(i=0;i<data.community_hand.length;i++) {
                $scope.communitycards.addCard(new Card(data.community_hand[i].rank, data.community_hand[i].suit, "", true));
            }
            for(i=0;i<3;i++){
                $scope.playercards.addCard(new Card(data.player_hand.initCards[i].rank, data.player_hand.initCards[i].suit, ""));
            }
            $scope.communitycards.cards[0].hover = false;
            $scope.animateCardCount = 5;
            setTimeout(function() {
                $scope.animateDealWithHover(1, $scope.animateCardCount);
            },100);
        }
    };

    $scope.nextAction = function(action){
        $scope.raiseError = null;
        $scope.dealingCard = true;
        var game = angular.extend($scope.currentGame,{action: action});

        Game.nextAction(game, function(data) {
            $scope.lastResultTmp = data;
            if(data.code === 400){
                $scope.raiseError = true;
                return;
            }
            // if(data.code){
            //     return;
            // }
            $scope.dealCards(data);
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

    $scope.$watch('btcWager', function() {
        if(!$scope.player) { return; }
        if($scope.getTotalBet() > $scope.player.balance.btc) {
            var numtokens = 0;
            for(var i in $scope.bets) {
                if($scope.bets.hasOwnProperty(i)) {
                    numtokens += $scope.bets[i];
                }
            }
            var newvalue = Math.floor($scope.player.balance.btc / numtokens);
            $scope.btcWager = newvalue;
        }
        $scope.calculateTotalBet();
    });

    $scope.$watch('bets', function(){
        $scope.calculateTotalBet();
    }, true);

    $scope.clearBets = function() {
        if(gameController.isGameInProgress()) { return false; }
        $scope.bets = {};
        $scope.calculateTotalBet();
    };

    $scope.getTotalBet = function() {
        var totalbet = 0;
        for(var i in $scope.bets) {
            if($scope.bets.hasOwnProperty(i)) {
                totalbet += $scope.btcWager * $scope.bets[i];
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
