'use strict';

/* global BaseGameController, Modernizr */

var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var gameController = this;
    this.gameName = 'fortune';
    this.Game = Game;

    GameController.super_.apply(this, arguments);

    $scope.recentnumbers = [];
    $scope.timer = 3000;

    window.animationInitialized = false;

    gameController.getNewGameParams = function() {
        var params = GameController.super_.prototype.getNewGameParams.call(this);
        params.game = $scope.gameData.game;
        var wager_each = this.getWager();
        var bets = {};
        for(var i in $scope.bets) {
            if($scope.bets.hasOwnProperty(i)) {
                bets[i] = wager_each * $scope.bets[i];
            }
        }
        params.bets = JSON.stringify(bets);
        return params;
    };

    gameController.isExceedMaxWager = function() {
        if ($scope.totalbet !== 0 && $scope.totalbet > gameController.getBalance()) {
            $scope.maxBetErr = true;
            return true;
        }
        return false;
    };

    gameController.newGame_OnSuccess = function(response) {
        GameController.super_.prototype.newGame_OnSuccess.call(this, response);

        $scope.clearWins();
        $scope.playSound('spinSound');
        $scope.payouts = response.payouts;
        $scope.animateWheel(response);

    };

    gameController.playWinSounds = function(multiplier) {
        if (multiplier >= 2 && multiplier < 3) {
            $scope.playSound('winSound');
        } else if (multiplier >= 3 && multiplier <= 15) {
            $scope.playSound('bigWinSound');
        } else if (multiplier > 15) {
            $scope.playSound('hugeWinSound');
        }
    };


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
    });


    $scope.betmap = {
        '1': {
            numbers: [0,2,4,6,9,11,13,15,17,19,21,24,26,28,30,32,35,37,39,41,43,45,47,50],
            payout: 2
        },
        '3': {
            numbers: [1,5,8,14,16,22,27,31,36,40,44,49],
            payout: 4
        },
        '5': {
            numbers: [3,10,18,23,29,34,42,46],
            payout: 6
        },
        '10': {
            numbers: [7,20,33,48],
            payout: 11
        },
        '20': {
            numbers: [12,38],
            payout: 21
        },
        '45': {
            numbers: [25,51],
            payout: 46
        }
    };
    $scope.getResultNumber = function(result) {
        for(var i in $scope.betmap) {
            if($scope.betmap.hasOwnProperty(i)) {
                for(var x=0;x<$scope.betmap[i].numbers.length;x++) {
                    if($scope.betmap[i].numbers[x] === result) {

                        return i;
                    }
                }
            }
        }

    };
    $scope.animateWinCount = 0;

    $scope.longPressTimeout = setTimeout(function() {
                                         // nothing
                                         }, 1);
    $scope.clearOneBet = function(element) {
        //scope.$apply(function() {
        var chips = element.childNodes[0];
        chips.style.display="none";
        chips.innerHTML = "";
        delete($scope.bets[element.getAttr('bet')]);
        $scope.calculateTotalBet();
        //});
    };
    $scope.bets = {};

    $scope.play = function() {
        gameController.startGame();
    };

    BCPlayer.$on("user update", function() {
        // if(!window.animationInitialized){$scope.initAnimation();}
    });
    $scope.$watch('btcWager', function() {
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
    $scope.calculateTotalBet = function() {
        $scope.totalbet = $scope.getTotalBet();
    };
    $scope.clearWins = function() {
        var elem = document.querySelectorAll( '.chips' );
        for(var x=0;x< elem.length;x++) {
            elem[x].classList.remove("won"); //chips element
            elem[x].classList.remove("lost"); //chips element
        }
        var numberels = document.querySelectorAll( '[id^="num-"]' );
        for(var n=0;n< numberels.length;n++) {
            numberels[n].classList.remove("winner"); //chips element
        }
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
    $scope.gameCompleted = function() {
        gameController.finishGame(true);

        while($scope.recentnumbers.length > 50) {
            $scope.recentnumbers.pop();
        }
        $scope.recentnumbers.unshift({color:"red",number:$scope.getResultNumber($scope.lastResult.result)});

    };


    $scope.showWins = function() {
        document.getElementById('num-'+$scope.lastResult.result).classList.add("winner");

        var elem = document.querySelectorAll( '[id^="bet-"]' );
        for(var x=0;x< elem.length;x++) {
            var numbers = elem[x].getAttribute("data-bet");
            numbers = JSON.parse(numbers.toString());

            var won = false;
            var chipel = elem[x].childNodes[0];
            for(var i=0;i<numbers.length;i++) {
                if($scope.lastResult.result === numbers[i] && chipel.style.display === "block") {
                    won = true;
                    showMultiplier(numbers, chipel);
                    chipel.classList.add("won"); //chips element
                    break;
                }
            }
            if(!won && chipel.style.display === "block") {
                chipel.classList.add("lost"); //chips element
            }
        }
    };
    var showMultiplier = function(bet, chipel){
        var multiplier = $scope.betmap[JSON.stringify(bet)];
        var betAmount = chipel.innerHTML;
        chipel.innerHTML = multiplier + document.getElementById('localization-x').innerHTML;
        setTimeout(function(){
            chipel.innerHTML = betAmount;
        }, 5000);
    };
    $scope.animateWinNumber = function() {
        $scope.animateWinCount++;
        var animateWinCount = 2;
        var elname = "#num-"+$scope.lastResult.result;
        $(elname).animate({
                          opacity: 0.1,
                          }, 400, function() {
                          $(elname).animate({
                                            opacity: 1,
                                            }, 400, function() {
                                            if ($scope.animateWinCount > animateWinCount) {
                                            $scope.animateWinCount = 0;
                                            } else {
                                            $scope.animateWinNumber();
                                            }
                                            });
                          });
    };



 $scope.animateWheel = function(gameData) {
        // just grab a random number - used in the cubic-bezier easing
        // functions below.
        var rnum = function (min, max) {
            return Math.random() * (max - min) + min;
        };

        var from, i, randomStop, target_angle, to;
        to = 0;
        from = -0;
        if (!$scope.wheelStart) {
            $scope.wheelStart = 0;
        }
        var wheelSep = 6.9230769;
        randomStop = Math.floor(Math.random() * (to - from + 1) + from);
        target_angle = -(Math.abs($scope.wheelStart) + 720 + (gameData.result+1) * wheelSep - randomStop);
        if ( typeof(Modernizr) === "undefined" || Modernizr.csstransitions ) {
            /*
            i = "transform: rotate(" + target_angle + "deg);" +
                "-webkit-transform: rotate(" + target_angle + "deg);" +
                "-ms-transform: rotate(" + target_angle + "deg);" +
                "-o-transition: -o-transform 7s cubic-bezier(.06, .21, .07, .92) 0s;" +
                "-moz-transition: -moz-transform 7s cubic-bezier(.06, .21, .07, .92) 0s;" +
                "-webkit-transition: -webkit-transform 7s cubic-bezier(.06, .21, .07, .92) 0s;" +
                "transition: transform 7s cubic-bezier(.06, .21, .07, .92) 0s;";
            */

            // grab a couple of random constants for the bezier easing
            var c1 = rnum(0.82, 0.94);
            var c2 = 0.07;

            i = "transform: rotate(" + target_angle + "deg);" +
                "-webkit-transform: rotate(" + target_angle + "deg);" +
                "-ms-transform: rotate(" + target_angle + "deg);" +
                "-o-transition: -o-transform 7s cubic-bezier(.06, .21, "+c2+", " + c1 + ") 0s;" +
                "-moz-transition: -moz-transform 7s cubic-bezier(.06, .21, "+c2+", " + c1 + ") 0s;" +
                "-webkit-transition: -webkit-transform 7s cubic-bezier(.06, .21, "+c2+", "+ c1 + ") 0s;" +
                "transition: transform 7s cubic-bezier(.06, .21, "+c2+", " + c1 + ") 0s;";
            document.getElementById('wheelImage').setAttribute("style", i);
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.gameCompleted();
                });
            }, $scope.gameTime + 300);
        } else {
            $("#wheelImage").rotate({
                angle: $scope.wheelStart,
                animateTo: target_angle,
                duration: 7200,
                center: ["50%", "50%"],
                easing: $.easing.easeInOutQuad,
                callback: function() {
                    $scope.$apply(function() {
                        $scope.gameCompleted();
                    });
                }
            });
        }

        $scope.wheelStart = target_angle - (360 - (Math.abs(target_angle) % 360));
    };
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
