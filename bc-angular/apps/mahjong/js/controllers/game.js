'use strict';
/* global BaseGameController */

var Card = function(val, flipped, blink, stolen, dealt) {
    this.val = val;
    this.blink = blink;
    this.stolen = stolen;

    if (!dealt) {
        dealt = true;
    }
    this.dealt = dealt;

    if (val < 0) {
        this.flipped = 'flipped';
    } else {
        this.flipped = '';//flipped ? 'flipped':'';
    }
};
var Hand = function(seat) {

    // Create an empty array of cards.
    this.seat = seat;
    this.unmeldedTiles = [];
    this.melds = [];
    this.bonusTiles = [];
    this.removedTiles = [];
};

var GameController = function($rootScope, $scope, $window, $filter, LowLagSounds, $cookies, $location, BCPlayer, BCSession, VisibilityFactory, Game) {
    var gameController = this;
    gameController.gameName = 'mahjong';
    gameController.Game = Game;
    $scope.timer = 2000;
    $scope.gameTime = 2000;

    $scope.playerWinLoseTie = false;
    $scope.playerSeat = null;
    $scope.btcWager = 0;
    $scope.unfinishedGameId = false;

    var winds = ['east', 'south', 'west', 'north'];

    var nextSeat = function(seat) {
        if (seat === 'east') {
            seat = 'south';
        } else if (seat === 'south') {
            seat = 'west';
        } else if (seat === 'west') {
            seat = 'north';
        } else if (seat === 'north') {
            seat = 'east';
        }
        return seat;
    };

    this.isExceedMaxWager = function() {
        if ($scope.btcWager * 64 !== 0 && $scope.totalbet > gameController.getBalance()) {
            $scope.maxBetErr = true;
            return true;
        }
        return false;
    };

    $scope.$watch('btcWager', function() {
        if(!$scope.player) { return; }
        if($scope.btcWager * 64 > gameController.getBalance()) {
            var newvalue = Math.floor(gameController.getBalance() / 64);
            $scope.btcWager = newvalue;
        }
    });

    this.getNewGameParams = function(){
        var gameParams = GameController.super_.prototype.getNewGameParams.call(this);
        if ($scope.lastGameId) {
            gameParams.last_game_id = $scope.lastGameId;
        }
        if ($scope.unfinishedGameId) {
            gameParams.unfinished_game_id = $scope.unfinishedGameId;
        }

        return gameParams;
    };

    this.newGame_OnSuccess = function(response){
        $scope.currentGame = response;
        $scope.lastGameId = response._id;
        $scope.unfinishedGameId = false;
        $scope.melds = {};
        $scope.dealCards(response);
        GameController.super_.prototype.newGame_OnSuccess.call(gameController, response);
    };

    this.getNextGame_OnSuccess = function(nextGame, callback) {
        if (nextGame.unfinishedGameId) {
            $scope.unfinishedGameId = nextGame.unfinishedGameId;
        }
        GameController.super_.prototype.getNextGame_OnSuccess.call(gameController, nextGame, callback);
        if ($scope.unfinishedGameId) {
            $scope.play(true);
        }
    };
    this.getNextGameParams = function(){
        return {game: 0, player_id:BCSession.user._id};
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

    this.playWinSounds = function(multiplier) {
        // play the sounds
        if (multiplier < 10) {
            $scope.playSound('bigWinSound');
        } else  {
            $scope.playSound('hugeWinSound');
        }
    };

    GameController.super_.call(this, $rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game);

    gameController.finishGameDelay = 2000;

    $scope.play = function(playUnfinished) {
        if (playUnfinished !== true) {
            $scope.unfinishedGameId = false;
        }
        $scope.gOptions = false;
        $scope.playerWinLoseTie = false;
        $scope.payouts = false;
        gameController.startGame(Game);
    };

    $scope.dealCards = function(data) {
        $scope.split = [];
        $scope.allHands = [];
        $scope.remainingLength = data.remaining_length;
        $scope.removable = false;
        $scope.activeSeat = null;
        $scope.roundWind = winds[Math.floor((data.hand_number / 10 - 1) / 4)];
        $scope.playerSeat = data.player_seat;
        var i, j;
        var seat, hand;
        var newMeld = false;

        if(data.status === 'began') {
            seat = $scope.playerSeat;
            for(i = 0; i < 4; i++) {
                $scope.melds[seat] = 0;
                hand = new Hand(seat);
                for(j = 0; j < data.all_hands[seat].unmeldedTiles.length; j++) {
                    hand.unmeldedTiles.push(new Card(data.all_hands[seat].unmeldedTiles[j], seat !== $scope.playerSeat));
                }
                for(j = 0; j < data.all_hands[seat].bonusTiles.length; j++) {
                    hand.bonusTiles.push(new Card(data.all_hands[seat].bonusTiles[j]));
                }
                $scope.allHands.push(hand);

                seat = nextSeat(seat);
            }
        } else if(data.status === 'drawn' || data.status === 'finished'){
            seat = $scope.playerSeat;
            var blink = false;
            if (!$scope.melds) {
                $scope.melds = {};
            }
            for(i = 0; i < 4; i++) {
                if ($scope.melds[seat] === undefined) {
                    $scope.melds[seat] = data.all_hands[seat].melds.length;
                    seat = nextSeat(seat);
                }
            }

            for(i = 0; i < 4; i++) {
                hand = new Hand(seat);

                for(j = 0; j < data.all_hands[seat].unmeldedTiles.length; j++) {
                    hand.unmeldedTiles.push(new Card(data.all_hands[seat].unmeldedTiles[j], seat !== $scope.playerSeat));
                }
                for(j = 0; j < data.all_hands[seat].bonusTiles.length; j++) {
                    hand.bonusTiles.push(new Card(data.all_hands[seat].bonusTiles[j]));
                }
                if (data.all_hands[seat].newTile !== null && data.all_hands[seat].newTile >= 0) {
                    blink = true && data.status !== 'finished';
                    hand.newTile = new Card(data.all_hands[seat].newTile, false, blink);
                }
                for(j = 0; j < data.all_hands[seat].removedTiles.length; j++) {
                    var b = false;
                    if (!blink && seat === data.active_seat && j === data.all_hands[seat].removedTiles.length - 1) {
                        b = true && data.status !== 'finished';
                    }
                    hand.removedTiles.push(new Card(data.all_hands[seat].removedTiles[j].val, false, b, data.all_hands[seat].removedTiles[j].stolen));
                }

                for(j = 0; j < data.all_hands[seat].melds.length; j++) {
                    var tiles = [];
                    for (var k = 0; k < data.all_hands[seat].melds[j].tiles.length; k++) {
                        var card = new Card(data.all_hands[seat].melds[j].tiles[k]);
                        if (data.all_hands[seat].melds[j].type === 36) { //hidden Kong
                            if (k === 0 || k === 3) {
                                card.flipped = 'flipped';
                            }
                        }
                        if (data.all_hands[seat].melds[j].type === 30 || data.all_hands[seat].melds[j].type === 35) {
                            if (k === 3) {
                                card.flipped = 'flipped';
                            }
                        }
                        tiles.push(card);
                    }

                    hand.melds.push({type: data.all_hands[seat].melds[j].type, tiles: tiles});
                }
                if (hand.melds.length !== $scope.melds[seat] && data.status === 'drawn' && seat !== $scope.playerSeat) {
                    $scope.melds[seat] = hand.melds.length;
                    $scope.playSound('blankSound');
                    newMeld = true;
                    $scope.notification = hand.melds[hand.melds.length - 1].type;
                    $scope.notificationSeat = seat;
                }

                $scope.allHands.push(hand);

                seat = nextSeat(seat);
            }
            if (!newMeld) {
                $scope.playSound('dealCard');
            }

            $scope.activeSeat = data.active_seat;
        }

        if (data.status === 'finished') {
            $scope.payouts = data.payouts;
            if (!data.is_push) {
                $scope.payouts.winner = data.winner;
                $scope.payouts.fan = data.fan;
            }
            gameController.finishGame(true);
        }

        if (data.status !== 'finished' && (!data.available_actions || data.available_actions.length === 0)) {
            var meldedTime = 0;
            if (newMeld) {
                setTimeout(function() {
                    $scope.notification = 0;
                    $scope.notificationSeat = '';
                }, 2000);
                meldedTime = 2200;
            }
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.nextAction();
                });
            }, 1600 + meldedTime);
        } else {
            $scope.gOptions = data.available_actions;
            if ($scope.gOptions && $scope.gOptions.length) {
                $scope.activeSeat = $scope.playerSeat;
                for(i = 0; i < $scope.gOptions.length; i++) {
                    if ($scope.gOptions[i].type === -10) {
                        $scope.removable = true;
                        break;
                    }
                }
            }
        }
    };

    $scope.nextAction = function(action, actionTile){
        $scope.nextActionError = null;
        $scope.gOptions = false;
        if (action === -10) {
            var exists = false;
            if ($scope.allHands && $scope.allHands[0] && $scope.allHands[0].unmeldedTiles) {
                for (var j = 0; j < $scope.allHands[0].unmeldedTiles.length; j++) {
                    if ($scope.allHands[0].unmeldedTiles[j].val === actionTile) {
                        exists = true;
                        break;
                    }
                }
                if (!exists && $scope.allHands[0].newTile) {
                    if ($scope.allHands[0].newTile.val === actionTile) {
                        exists = true;
                    }
                }
            }
            if (!exists) {
                return;
            }
        }
        var option;
        if (action) {
            option = {
                type: action.type
            };
            if (action.tiles) {
                option.tiles = [];
                for(var i = 0; i < action.tiles.length; i++) {
                    option.tiles.push(action.tiles[i]);
                }
            }
            if (action.type === 10 || action.type === 20 || action.type === 30) {
                $scope.playSound('winSound');
            }
        }

        var game = angular.extend($scope.currentGame, {action: JSON.stringify(option), tile: JSON.stringify(actionTile)});

        Game.nextAction(game, function(data) {
            $scope.lastResultTmp = data;
            if(data.code === 400){
                $scope.nextActionError = true;
                return;
            }
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
                }, 1600);
            }
        });
    };

    $scope.removeTile = function(card) {
        if ($scope.gOptions && $scope.gOptions.length) {
            for(var i = 0; i < $scope.gOptions.length; i++) {
                if ($scope.gOptions[i].type === -10 && card >= 0) {
                    $scope.nextAction($scope.gOptions[i], card);
                    break;
                }
            }
        }
    };
    $scope.BCSession = BCSession;
    $scope.initialized = false;
    $scope.$watch('BCSession.currency', function() {
        if ($scope.initialized) {
            $window.location.reload();
        } else {
            $scope.initialized = true;
        }
    });
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$window', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'BCSession', 'VisibilityFactory', 'Game', GameController]);
