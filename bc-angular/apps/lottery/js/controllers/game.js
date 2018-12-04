'use strict';
/* global BaseGameController */

var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var gameController = this;
    gameController.gameName = 'lottery';
    gameController.Game = Game;
    $scope.timer = 2000;
    $scope.gameTime = 2000;
    $scope.winner = {};
    $scope.lotteries = {};
    this.getNewGameParams = function(){
        var gameParams = GameController.super_.prototype.getNewGameParams.call(this);
        gameParams.id = gameParams.game_id;
        gameParams.lottery_id = $scope.selectedGame._id;
        gameParams.wager = gameController.getWager();
        return gameParams;
    };

    this.newGame_OnSuccess = function(data){
        GameController.super_.prototype.newGame_OnSuccess.call(this, data);
        $scope.newGameCallback(data);
        $scope.refreshPlayerGames();
        // $scope.playerGames = Game.getActivePlayerLotteries({player_id: $scope.player._id});
    };

    GameController.super_.apply(this, arguments);

    $scope.refreshGames = function(){
        $scope.lotteries = {};
        Game.getActiveLotteries({}, function(data){
            data.sort(function(a, b){
                var aVal = parseInt(a.interval);
                var bVal = parseInt(b.interval);
                if(a.interval.indexOf('h') !== -1){
                    aVal += 10;
                }
                if(a.interval.indexOf('d') !== -1){
                    aVal += 20;
                }
                if(b.interval.indexOf('h') !== -1){
                    bVal += 10;
                }
                if(b.interval.indexOf('d') !== -1){
                    bVal += 20;
                }

                return aVal - bVal;
            });
            data.forEach(function(game){
                var currency = game.currency;
                if (!$scope.lotteries[currency]) {
                    $scope.lotteries[currency] = [];
                }
                $scope.lotteries[currency].push(game);
            });
            if(!$scope.playerGames){
                $scope.refreshPlayerGames();
            }
            if(!$scope.selectedGame){
                $scope.selectedGame = $scope.lotteries.bitcoin[0];
            }
        });
    };

    $scope.$on('winner selected', function(event, data){
        var winner = data.lottery||data;
        if(winner.finished && winner.result === $scope.BCSession.user._id){
            $scope.BCSession.user.wallets[data.transaction.currency].balance = data.transaction.balance;
        }
        if($scope.playerGames){
            $scope.playerGames.forEach(function(playerGame){
                if(playerGame._id === winner._id && winner.finished){
                    playerGame.winner = winner;
                    $scope.refreshPlayerGames();
                }
            });
        }
        Object.keys($scope.lotteries).forEach(function(gameType){
            $scope.lotteries[gameType].forEach(function(game){
                if(game._id === winner._id){
                    game.jackpot = winner.jackpot;
                    game.winner = winner;
                    game.total_wagered = winner.total_tickets * 1000;
                }
            });
        });
        if($scope.selectedGame && $scope.selectedGame._id === winner._id){
            $scope.currentWinner = winner;
            $scope.animateIntros();
        }
        if($scope.player._id === winner.result){
            $scope.processWin(winner);
        }
        if($scope.selectedGame._id === winner._id && winner.server_seed !== 'hidden'){
            $scope.currentWinner = null;
        }
    });

    $scope.processWin = function(winner){
        if(!$scope.wins){
            $scope.wins = [];
        }
        $scope.wins.push(winner);
        if($scope.processTimeout){
            clearTimeout($scope.processTimeout);
            delete $scope.processTimeout;
        }
        $scope.processTimeout = setTimeout(function(){
            var winnings = 0;
            var playerWager = 0;
            $scope.wins.forEach(function(win){
                if(win.currency === $scope.BCSession.currency){
                    winnings += win.jackpot;
                    playerWager += win.tickets_by_player * win.ticket_price;
                }
            });
            if($scope.wins[0].finished){
                $scope.winLottery = $scope.wins[0];
                if(winnings >= playerWager){
                    $scope.resultMultiplier = winnings / playerWager;
                    $scope.resultProfit = winnings;
                    $scope.animateMessage();
                    if($scope.resultMultiplier >= 1){
                        $scope.playSound('hugeWinSound');
                    }
                }
            }else{
                $scope.playSound('winSound');
            }
            $scope.tmpWins = $scope.wins;
            delete $scope.wins;
        }, 1000);
    };

    $scope.$watch('btcWager', function(val){
        if(typeof val === 'number'){
            $scope.ticketsToBuy = Math.floor(val/1000);
        }
    });

    $scope.playGame = function(game, callback){
        $scope.selectedGame = game;
        $scope.selectedGame.played = true;
        $scope.newGameCallback = callback;
        gameController.startGame();
        setTimeout(function(){
            gameController.finishGame();
        }, 5000);
    };

    $scope.selectGame = function(game, index){
        $scope.selectedGame = game;
        $scope.$index = index;
        $scope.winner = {};
        document.querySelector('#buybtn').focus();
    };

    $scope.refreshPlayerGames = function() {
        $scope.playerGames = [];
        Game.getActivePlayerLotteries({player_id: $scope.player._id}, function(data){
            Object.keys($scope.lotteries).forEach(function(gameType){
                $scope.lotteries[gameType].forEach(function(game){
                    data.forEach(function(playerGame){
                        if(game._id === playerGame._id && playerGame.total_player_wagered > 0){
                            game.total_player_wagered = playerGame.total_player_wagered;
                            game.total_wagered = playerGame.total_wagered;
                            $scope.playerGames.push(game);
                        }
                    });
                });
            });
            if($scope.playerGames.length > 0){
                $scope.playerGames.sort(function(a, b){
                    return (new Date(a.end)).getTime() - (new Date(b.end)).getTime();
                });
                $scope.nextGames = [];
                $scope.nextDraws = [];
                $scope.playerGames.forEach(function(game){
                    if($scope.nextDraws.length === 0 || ($scope.nextDraws.length > 0 && $scope.nextDraws[$scope.nextDraws.length - 1].end === game.end)){
                        $scope.nextDraws.push(game);
                    }
                    $scope.nextGames.push(game);
                });
            }
        });
    };

    $scope.animateCount = 0;
    $scope.animateIntros = function() {
        $scope.animating = true;
        $scope.animateCount++;
        var animateCount = 2;

        $('#play-intros').animate({
            opacity: 0.1,
        }, 400, function() {
            $('#play-intros').animate({
                opacity: 1,
            }, 400, function() {
                if ($scope.animateCount > animateCount) {
                    $scope.animateCount = 0;
                    $scope.animating = false;
                } else {
                    $scope.animateIntros();
                }
            });
        });
    };

    BCPlayer.$on('valid wallet', function(player){
        if(player && !$scope.lotteries.bitcoin){
            $scope.refreshGames();
        }
    });
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
