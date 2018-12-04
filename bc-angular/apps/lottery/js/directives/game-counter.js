'use strict';

/* global Application */

var GameCounterController = function($scope, $rootScope, Game, $element) {

    $scope.timers = {};
    $scope.exchange = $rootScope.exchange;
    $scope.$on('exchange-update', function(event, rate) {
        $scope.exchange = rate;
    });

    $scope.animateCount = 0;
    $scope.animateWinner = function() {
        $scope.animating = true;
        $scope.animateCount++;
        var animateCount = 2;

        $($element).find('.winner-name').animate({
            opacity: 0.1,
        }, 400, function() {
            $($element).find('.winner-name').animate({
                opacity: 1,
            }, 400, function() {
                if ($scope.animateCount > animateCount) {
                    $scope.animateCount = 0;
                    $scope.animating = false;
                } else {
                    $scope.animateWinner();
                }
            });
        });
    };

    $scope.$watch('gamedata.winner.player_alias', function(newVal, oldVal){
        if(newVal && oldVal && !$scope.animating){
            $scope.animateWinner();
        }
    });

    $scope.$watch('gamedata', function(gamedata){
        if(!gamedata){
            $scope.playerInvolved = false;
        }
        if (gamedata){
            if($scope.player && $scope.gamedata._id && !$scope.init){
                if(!gamedata.winner){
                    Game.getLottery({id: gamedata._id}, function(winner){
                        $scope.gamedata.winner = winner;
                    }, function(){
                        $scope.gamedata.winner = null;
                    });
                }
                $scope.init = true;
                Game.query({player_id: $scope.player._id,lottery_id: $scope.gamedata._id}, function(data){
                    if(data.length > 0){
                        $scope.playerInvolved = true;
                    }
                });
            }
        }
    });

    $scope.$watch('gamedata.played', function(played){
        if(played){
            $scope.playerInvolved = true;
        }
    });
    
    $scope.$on('global game added', function(event, game){
        if(game._id === $scope.gamedata._id){
            $scope.gamedata.jackpot = game.jackpot;
        }
    });

    $scope.playGame = function(game) {
        $scope.onAddBet({game: game, callback: function(data){
            $scope.gamedata.total_wagered += data.wager;
            $scope.animateWinner();
        }});
    };

    var refreshFails = 0;
    var refreshActiveLottery = function(){
        Game.getActiveLottery({interval: $scope.gamedata.interval, currency: $scope.gamedata.currency}, function(gamedata){
            // $rootScope.$broadcast('refresh selected game', gamedata);
            $scope.gamedata = gamedata;
            Game.query({player_id: $scope.player._id,lottery_id: gamedata._id}, function(data){
                if(data.length > 0){
                    $scope.playerInvolved = true;
                    var totalWagered = 0;
                    data.forEach(function(game){
                        totalWagered += game.wager;
                    });
                    $scope.gamedata.total_wagered = totalWagered;
                }
            }, function(){
                refreshFails ++;
            });
        });
    };
    var timerTimeout;
    var updateTimer = function() {
        $scope.$apply(function(){
            var game = $scope.gamedata;
            if (!game){
                return;
            }
            if (game.end === undefined) {
                $scope.timers[game.game] = "loading...";
            } else {
                var endDate = new Date(game.end);
                var endSec = endDate.getTime();
                var now = new Date();
                var nowSec = now.getTime(); // GMT!

                var timeUntilEnd = (endSec-nowSec)/1000;
                var days = Math.floor(timeUntilEnd/86400);
                var todaySecLeft = timeUntilEnd%86400;

                var hours = Math.floor(todaySecLeft/3600);
                var hourSecLeft = todaySecLeft%3600;

                var minutes = Math.floor(hourSecLeft/60);
                var minSecLeft = Math.floor(hourSecLeft%60);
                //console.log(todaySec);
                var seconds = Math.floor(minSecLeft);

                days = Math.max(0, days);
                hours = Math.max(0, hours);
                minutes = Math.max(0, minutes);
                seconds = Math.max(0, seconds);
                if(hours < 10) {
                    hours = "0"+hours;
                }if(minutes < 10) {
                    minutes = "0"+minutes;
                }if(seconds < 10) {
                    seconds = "0"+seconds;
                }
                var timeString = hours+":"+minutes+":"+seconds;

                // $scope.$apply(function(){
                    $scope.timers[game.game] = {daysLeft:days,timeString:timeString};
                    // console.log($scope.timers[game.game]);
                // });
                if(hours === "00" && minutes === "00" && seconds === "00"){
                    $scope.playerInvolved = false;
                    setTimeout(function(){
                        refreshActiveLottery();
                        if($scope.winner){
                            $scope.winner = {};
                        }
                    }, 2000);
                }
            }
        });
        if(refreshFails < 5){
            timerTimeout = setTimeout(updateTimer, 1000);
        }
    };
    timerTimeout = setTimeout(updateTimer, 1000);
    $scope.$on("$destroy",function() {
        clearTimeout(timerTimeout);
    });
};

Application.Directives.directive('gamecounter', function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'tpl/directives/game-counter.html',
        scope: {
            gamedata: '=',
            winner: '=',
            player: '=',
            hidecup: '=',
            onAddBet: '&',
            isGameInProgress: '=',
            disableBet: '='
        },
        controller: ['$scope', '$rootScope', 'Game', '$element', GameCounterController]
    };
});

