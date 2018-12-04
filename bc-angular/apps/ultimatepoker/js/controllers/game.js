'use strict';
/* global BaseGameController */

var Card = function(rank,suit,flipped) {
    this.rank = rank;
    this.suit = suit;
    this.flipped = flipped;
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

var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, BCSession, Game) {
    var gameController = this;
    gameController.gameName = 'ultimatepoker';
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
        if ($scope.bets.play) {
            delete($scope.bets.play);
        }
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
        gameController.startGame(Game);
    };

    $scope.animateDealWithHover = function(i, count, animateCardCount) {
        $scope.$apply(function() {
            if (i < $scope.communitycards.cards.length) {
                $scope.communitycards.cards[i].hover = true;
            } else {
                $scope.dealercards.cards[i - $scope.communitycards.cards.length].hover = true;
            }

        });
        if (i + 1 === count) {
            setTimeout(function() {
                $scope.animateDeal(animateCardCount);
            }, 500);
        } else if (i + 1 < count) {
            setTimeout(function() {
                $scope.animateDealWithHover(i + 1, count, animateCardCount);
            }, 300);
        }

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
                        $scope.nextAction('raise');
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
        var dealerHand = Array.prototype.slice.call(document.querySelectorAll('#dealer-cards .livecard'));

        var elems;
        if ($scope.status !== 'finished') {
            elems = playerHand.concat(dealerHand).concat(communityHand);
        } else {
            elems = playerHand.concat(communityHand).concat(dealerHand);
        }
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
        $scope.dealercards = new Stack();
        $scope.communitycards = new Stack();
        $scope.animateCardCount = 0;
        $scope.prevStatus = $scope.status;
        $scope.status = data.status;
        $scope.dealingCard = true;

        var i;

        if (data.community_hand) {
            for(i=0;i<data.community_hand.length;i++) {
                $scope.communitycards.addCard(new Card(data.community_hand[i].rank, data.community_hand[i].suit, ""));
            }
        }
        for(i=$scope.communitycards.cards.length;i<5;i++) {
            $scope.communitycards.addCard(new Card("", "", "flipped"));
        }

        if (data.status !== 'began') {
            $scope.animateCardCount = 9;
        }

        if(data.status !== 'finished'){
            for(i=0;i<2;i++) {
                $scope.dealercards.addCard(new Card("", "", "flipped"));
                $scope.playercards.addCard(new Card(data.player_hand.initCards[i].rank, data.player_hand.initCards[i].suit, ""));
            }
        }else{
            $scope.animateCardCount = 9;
            $scope.dealercards.rank = data.dealer_hand.rnk;
            $scope.dealercards.subRank = data.dealer_hand.sub_rnk;
            $scope.playercards.rank = data.player_hand.rnk;
            $scope.playercards.subRank = data.player_hand.sub_rnk;
            $scope.dealercards.opens = data.dealer_hand.opens;
            for(i=0;i<2;i++){
                $scope.dealercards.addCard(new Card(data.dealer_hand.initCards[i].rank, data.dealer_hand.initCards[i].suit, ""));
                $scope.playercards.addCard(new Card(data.player_hand.initCards[i].rank, data.player_hand.initCards[i].suit, ""));
            }
        }

        if ($scope.animateCardCount === 0) {
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.animateDeal($scope.animateCardCount);
                });
            },100);
        } else {
            var hoverStart, hoverEnd;
            if ($scope.status === 'three') {
                hoverStart = 0;
                hoverEnd = 3;
            } else if ($scope.status === 'five') {
                hoverStart = 3;
                hoverEnd = 5;
            } else if ($scope.status === 'finished') {
                hoverEnd = 7;
                if ($scope.prevStatus === 'began') {
                    hoverStart = 0;
                }
                if ($scope.prevStatus === 'three') {
                    hoverStart = 3;
                }
                if ($scope.prevStatus === 'five') {
                    hoverStart = 5;
                }
            }
            for (i = 0; i < hoverStart; i++) {
                $scope.communitycards.cards[i].hover = true;
            }

            setTimeout(function() {
                $scope.animateDealWithHover(hoverStart, hoverEnd, $scope.animateCardCount);
            },100);
        }


    };

    $scope.nextAction = function(action, play){
        $scope.raiseError = null;
        $scope.dealingCard = true;

        if (play && $scope.bets.ante) {
            $scope.bets.play = $scope.bets.ante * play;
        }
        var betsWager = {};
        for(var i in $scope.bets) {
            betsWager[i] = $scope.bets[i] * gameController.getWager();
        }

        var game = angular.extend($scope.currentGame,{action: action, bets: JSON.stringify(betsWager)});
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

            if (data.is_win) {
                $scope.playerWinLoseTie = 3;
            } else if (data.is_push) {
                $scope.playerWinLoseTie = 1;
            } else {
                if (data.is_fold) {
                    $scope.playerWinLoseTie = -1;
                }
                else {
                    $scope.playerWinLoseTie = 0;
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

    $scope.BCSession = BCSession;
    $scope.setBet = function(bet) {
        if (!$scope.player || !BCSession.user.wallets[BCSession.currency].balance) {
            bet = 0;
        } else if (bet <= BCSession.user.wallets[BCSession.currency].balance.toBitcoin()) {
            bet = bet;
        } else {
            bet = 0;
        }
        return bet.toSatoshi();
    };
    $scope.betPercent = function(bet) {
        var wager;
        if (!$scope.player || !BCSession.user.wallets[BCSession.currency].balance) {
            wager = 0;
        } else {
            wager = Math.floor(BCSession.user.wallets[BCSession.currency].balance * bet);
        }
        return Math.ceil(wager);
    };
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'BCSession', 'Game', GameController]);
