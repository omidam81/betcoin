'use strict';
/* global BaseGameController */

var Card = function(red, white, other, point, flipped) {
    this.red = red;
    this.white = white;
    this.other = other;
    this.point = point;
    this.flipped = flipped;
};
var Stack = function() {

    // Create an empty array of cards.

    this.cards = [];

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
    gameController.gameName = 'tiles';
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

        if(data.status !== 'finished'){
            for(i = 0; i < data.player_hand.tiles.length; i++){
                $scope.dealercards.addCard(new Card(0, 0, false, 0, "flipped"));
                $scope.playercards.addCard(new Card(data.player_hand.tiles[i].red, data.player_hand.tiles[i].white, data.player_hand.tiles[i].other, data.player_hand.tiles[i].point, ""));
            }
        }else{
            $scope.dealerTwoCards.rank = data.dealer_hand.highhand.rank;
            $scope.dealercards.rank = data.dealer_hand.lowhand.rank;
            $scope.playerTwoCards.rank = data.player_hand.highhand.rank;
            $scope.playercards.rank = data.player_hand.lowhand.rank;

            $scope.dealerTwoCards.points = data.dealer_hand.highhand.points;
            $scope.dealercards.points = data.dealer_hand.lowhand.points;
            $scope.playerTwoCards.points = data.player_hand.highhand.points;
            $scope.playercards.points = data.player_hand.lowhand.points;
            for(i = 0;i < 2;i++){
                $scope.dealerTwoCards.addCard(new Card(data.dealer_hand.highhand.tiles[i].red, data.dealer_hand.highhand.tiles[i].white, data.dealer_hand.highhand.tiles[i].other, data.dealer_hand.highhand.tiles[i].point, ""));
                $scope.playerTwoCards.addCard(new Card(data.player_hand.highhand.tiles[i].red, data.player_hand.highhand.tiles[i].white, data.player_hand.highhand.tiles[i].other, data.player_hand.highhand.tiles[i].point, ""));
            }
            for(i = 0;i < 2;i++){
                $scope.dealercards.addCard(new Card(data.dealer_hand.lowhand.tiles[i].red, data.dealer_hand.lowhand.tiles[i].white, data.dealer_hand.lowhand.tiles[i].other, data.dealer_hand.lowhand.tiles[i].point, ""));
                $scope.playercards.addCard(new Card(data.player_hand.lowhand.tiles[i].red, data.player_hand.lowhand.tiles[i].white, data.player_hand.lowhand.tiles[i].other, data.player_hand.lowhand.tiles[i].point, ""));
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

            $scope.dealCards(data);
            if (data.player_hand.lowhand.is_win) {
                $scope.playercards.winLoseTie = 3;
                $scope.dealercards.winLoseTie = 0;
            } else if (data.player_hand.lowhand.is_push) {
                $scope.playercards.winLoseTie = 1;
                $scope.dealercards.winLoseTie = 1;
            } else {
                $scope.playercards.winLoseTie = 0;
                $scope.dealercards.winLoseTie = 3;
            }

            if (data.player_hand.highhand.is_win) {
                $scope.playerTwoCards.winLoseTie = 3;
                $scope.dealerTwoCards.winLoseTie = 0;
            } else if (data.player_hand.highhand.is_push) {
                $scope.playerTwoCards.winLoseTie = 1;
                $scope.dealerTwoCards.winLoseTie = 1;
            } else {
                $scope.playerTwoCards.winLoseTie = 0;
                $scope.dealerTwoCards.winLoseTie = 3;
            }
            if (data.is_win) {
                $scope.playerWinLoseTie = 3;
            } else if (data.is_push) {
                $scope.playerWinLoseTie = 1;
            } else {
                $scope.playerWinLoseTie = 0;
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
