'use strict';

/* global BaseGameController, g_MainPlay */

var GameController = function($rootScope, $scope, $window, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var gameController = this;
    this.gameName = 'roulette';
    this.Game = Game;

    // GameController.super_.apply(this, arguments);
    GameController.super_.call(this, $rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game);

    $scope.recentnumbers = [];
    $scope.timer = 3000;

    /**
     * Animation part begins
     */
    $scope.animationsLoading = true;
    $scope.spinTime = 8500;
    $scope.initAnimation = function(){
        var d = document;
        var c = {
            container:'gameCanvas',
            width: 460,
            height: 460,
            spinTime: $scope.spinTime,
            initSpeed: 1.5,
            initBallRadius: 200,
            SingleEngineFile:'src/kinetic-v5.0.2.min.js',
            MainPlayFile:'src/MainPlay.js'
        };
        document.kcConfig = c; //Kinetic config

        if(!d.createElement('canvas').getContext){
            var divel = d.createElement('div');
            divel.innerHTML = '<h2>Your browser does not support HTML5 canvas!</h2>' +
                '<p>Google Chrome is a browser that combines a minimal design with sophisticated technology to make the web faster, safer, and easier.Click the logo to download.</p>' +
                '<a href="http://www.google.com/chrome" target="_blank"><img src="http://www.google.com/intl/zh-CN/chrome/assets/common/images/chrome_logo_2x.png" border="0"/></a>';
            var p = d.getElementById(c.tag).parentNode;
            p.style.background = 'none';
            p.style.border = 'none';
            p.insertBefore(divel);

            d.body.style.background = '#ffffff';
            return;
        }

        var s = d.createElement('script');
        s.src = c.SingleEngineFile;
        s.id = 'kinetic-html5';
        d.body.appendChild(s);
        s.onload = function() {
            var m = d.createElement('script');
            m.src = c.MainPlayFile;
            m.id = 'mainplay';
            m.setAttribute('defer', 'defer');
            d.body.appendChild(m);

            var digestInterval = setInterval(function() {
                if ($scope.animationsLoading) {
                    $scope.$digest();
                }
            }, 300);

            $scope.$watch(
                function() {
                    return $window.animationInitialized;
                }, function(n) {
                    // animations loaded now
                    if (n === "done") {
                        $scope.animationsLoading = false;
                        clearInterval(digestInterval);
                    }
                }
            );
        };
    };

    $scope.initAnimation();
    /** Animation part ends */

    gameController.getNewGameParams = function() {
        $scope.clearWins();
        var params = GameController.super_.prototype.getNewGameParams.call(this);
        params.game = $scope.gameData.game;
        var wager_each = this.getWager();

        $scope.prevBets = {};
        for (var i in $scope.bets) {
            if($scope.bets.hasOwnProperty(i)) {
                $scope.prevBets[i] = $scope.bets[i];
            }
        }

        var j;
        for (j = 0; j <= 36; j++) {
            if ($scope.bets["round[" + j + "]"]) {
                increaseBet("[" + j + "]", $scope.bets["round[" + j + "]"]);
                delete($scope.bets["round[" + j + "]"]);
            }
        }
        var voisins = $scope.bets["voisins[15,12,32,35,0,3,26,26]"];
        var orphelins = $scope.bets["orphelins[6,9,14,17,17,20,31,34,1,1]"];
        var tiers = $scope.bets["tiers[5,8,10,11,13,16,23,24,27,30,33,36]"];
        delete($scope.bets["voisins[15,12,32,35,0,3,26,26]"]);
        delete($scope.bets["orphelins[6,9,14,17,17,20,31,34,1,1]"]);
        delete($scope.bets["tiers[5,8,10,11,13,16,23,24,27,30,33,36]"]);
        if (voisins) {
            increaseBet("[12,15]", voisins / 4);
            increaseBet("[32,35]", voisins / 4);
            increaseBet("[0,3]", voisins / 4);
            increaseBet("[26]", voisins / 4);
        }
        if (orphelins) {
            increaseBet("[6,9]", orphelins / 5);
            increaseBet("[14,17]", orphelins / 5);
            increaseBet("[17,20]", orphelins / 5);
            increaseBet("[31,34]", orphelins / 5);
            increaseBet("[1]", orphelins / 5);
        }
        if (tiers) {
            increaseBet("[5,8]", tiers / 6);
            increaseBet("[10,11]", tiers / 6);
            increaseBet("[13,16]", tiers / 6);
            increaseBet("[23,24]", tiers / 6);
            increaseBet("[27,30]", tiers / 6);
            increaseBet("[33,36]", tiers / 6);
        }

        var bets = {};
        for(i in $scope.bets) {
            if($scope.bets.hasOwnProperty(i)) {
                bets[i] = wager_each*$scope.bets[i];
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

        $scope.animating = true;
        $scope.playSound('spinSound');
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
    $scope.betmap = {
        "[0]":36,
        "[1]":36,
        "[2]":36,
        "[3]":36,
        "[4]":36,
        "[5]":36,
        "[6]":36,
        "[7]":36,
        "[8]":36,
        "[9]":36,
        "[10]":36,
        "[11]":36,
        "[12]":36,
        "[13]":36,
        "[14]":36,
        "[15]":36,
        "[16]":36,
        "[17]":36,
        "[18]":36,
        "[19]":36,
        "[20]":36,
        "[21]":36,
        "[22]":36,
        "[23]":36,
        "[24]":36,
        "[25]":36,
        "[26]":36,
        "[27]":36,
        "[28]":36,
        "[29]":36,
        "[30]":36,
        "[31]":36,
        "[32]":36,
        "[33]":36,
        "[34]":36,
        "[35]":36,
        "[36]":36,
        "[0,1]":18,
        "[0,2]":18,
        "[0,3]":18,
        "[1,2]":18,
        "[2,3]":18,
        "[4,5]":18,
        "[5,6]":18,
        "[7,8]":18,
        "[8,9]":18,
        "[10,11]":18,
        "[11,12]":18,
        "[13,14]":18,
        "[14,15]":18,
        "[16,17]":18,
        "[17,18]":18,
        "[19,20]":18,
        "[20,21]":18,
        "[22,23]":18,
        "[23,24]":18,
        "[25,26]":18,
        "[26,27]":18,
        "[28,29]":18,
        "[29,30]":18,
        "[31,32]":18,
        "[32,33]":18,
        "[34,35]":18,
        "[35,36]":18,
        "[1,4]":18,
        "[2,5]":18,
        "[3,6]":18,
        "[4,7]":18,
        "[5,8]":18,
        "[6,9]":18,
        "[7,10]":18,
        "[8,11]":18,
        "[9,12]":18,
        "[10,13]":18,
        "[11,14]":18,
        "[12,15]":18,
        "[13,16]":18,
        "[14,17]":18,
        "[15,18]":18,
        "[16,19]":18,
        "[17,20]":18,
        "[18,21]":18,
        "[19,22]":18,
        "[20,23]":18,
        "[21,24]":18,
        "[22,25]":18,
        "[23,26]":18,
        "[24,27]":18,
        "[25,28]":18,
        "[26,29]":18,
        "[27,30]":18,
        "[28,31]":18,
        "[29,32]":18,
        "[30,33]":18,
        "[31,34]":18,
        "[32,35]":18,
        "[33,36]":18,
        "[0,1,2]":12,
        "[0,2,3]":12,
        "[1,2,3]":12,
        "[4,5,6]":12,
        "[7,8,9]":12,
        "[10,11,12]":12,
        "[13,14,15]":12,
        "[16,17,18]":12,
        "[19,20,21]":12,
        "[22,23,24]":12,
        "[25,26,27]":12,
        "[28,29,30]":12,
        "[31,32,33]":12,
        "[34,35,36]":12,
        "[1,2,4,5]":9,
        "[2,3,5,6]":9,
        "[4,5,7,8]":9,
        "[5,6,8,9]":9,
        "[7,8,10,11]":9,
        "[8,9,11,12]":9,
        "[10,11,13,14]":9,
        "[11,12,14,15]":9,
        "[13,14,16,17]":9,
        "[14,15,17,18]":9,
        "[16,17,19,20]":9,
        "[17,18,20,21]":9,
        "[19,20,22,23]":9,
        "[20,21,23,24]":9,
        "[22,23,25,26]":9,
        "[23,24,26,27]":9,
        "[25,26,28,29]":9,
        "[26,27,29,30]":9,
        "[28,29,31,32]":9,
        "[29,30,32,33]":9,
        "[31,32,34,35]":9,
        "[32,33,35,36]":9,
        "[0,1,2,3]":9,
        "[1,2,3,4,5,6]":6,
        "[4,5,6,7,8,9]":6,
        "[7,8,9,10,11,12]":6,
        "[10,11,12,13,14,15]":6,
        "[13,14,15,16,17,18]":6,
        "[16,17,18,19,20,21]":6,
        "[19,20,21,22,23,24]":6,
        "[22,23,24,25,26,27]":6,
        "[25,26,27,28,29,30]":6,
        "[28,29,30,31,32,33]":6,
        "[31,32,33,34,35,36]":6,
        "[1,4,7,10,13,16,19,22,25,28,31,34]":3,
        "[2,5,8,11,14,17,20,23,26,29,32,35]":3,
        "[3,6,9,12,15,18,21,24,27,30,33,36]":3,
        "[1,2,3,4,5,6,7,8,9,10,11,12]":3,
        "[13,14,15,16,17,18,19,20,21,22,23,24]":3,
        "[25,26,27,28,29,30,31,32,33,34,35,36]":3,
        "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]":2,
        "[2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36]":2,
        "[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]":2,
        "[2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]":2,
        "[1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35]":2,
        "[19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36]":2
    };

    $scope.prevBets = false;
    $scope.bets = {};
    $scope.prevNeighbours = false;
    $scope.neighbours = [];
    $scope.animating = false;

    $scope.play = function() {
        gameController.startGame();
    };

    $scope.repeatBets = function() {
        $scope.bets = {};
        for (var i in $scope.prevBets) {
            $scope.bets[i] = $scope.prevBets[i];
        }
        $scope.neighbours = $scope.prevNeighbours;
        $scope.calculateTotalBet();
    };

    // poll the angular $digest to catch our animation ready flag watcher
    // below - if not this way we have to wait for a $digest to auto run and
    // that seems to take too long most times
    var digestInterval = setInterval(function() {
        if ($scope.animationsLoading) {
            $scope.$digest();
        }
    }, 500);
    
    // watch for the window.animationsLoaded flag set in MainPlay
    // and update our animationsLoading flag accordingly.
    // -
    // using animationsLoading to override the BaseGameController 
    // isGameInProgress flag to keep the bet/play button disabled
    // whilst we load the animations.
    $scope.$watch(
        function() {
            return $window.animationInitialized;
        }, function(n) {
            // animations loaded now
            if (n === "done") {
                $scope.animationsLoading = false;
                clearInterval(digestInterval);
            }
        }
    );

    $scope.getColor = function(result) {
        var red = JSON.parse("[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]");
        var black = JSON.parse("[2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]");
        if(result === 0) {
            return "green";
        }
        for(var r in red) {
            if(red[r] === result) {
                return "red";
            }
        }
        for(var b in black) {
            if(black[b] === result) {
                return "black";
            }
        }
    };
    $scope.$watch('btcWager', function() {
                  $scope.calculateTotalBet();
                  });

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
        var elem = document.querySelectorAll( '.chips.won, .chips.lost' );
        for(var x=0;x< elem.length;x++) {
            var bet = $(elem[x]).parent().attr('data-bet');
            if ($scope.bets.hasOwnProperty(bet)) {
                elem[x].innerHTML = $scope.bets[bet];
            }
            elem[x].classList.remove("won"); //chips element
            elem[x].classList.remove("lost"); //chips element
        }
    };
    $scope.clearBets = function() {
        if(gameController.isGameInProgress()) { return false; }
        $scope.bets = {};
        $scope.calculateTotalBet();
        var elem = document.querySelectorAll( '.chips' );
        for(var x=0;x< elem.length;x++) {
            elem[x].style.display="none"; //chips element
            elem[x].innerHTML = "";
        }
    };
    $scope.gameCompleted = function() {
        gameController.finishGame(true);

        while($scope.recentnumbers.length > 50) {
            $scope.recentnumbers.pop();
        }
        $scope.recentnumbers.unshift({color:$scope.getColor($scope.lastResult.result),number:$scope.lastResult.result});

    };

    var increaseBet = function(bet, amount) {
        if (!$scope.bets[bet]) {
            $scope.bets[bet] = 0;
        }
        if (!amount) {
            amount = 1;
        }
        $scope.bets[bet] += amount;
    };

    $scope.showWins = function() {
        if ($scope.lastResult && $scope.lastResult.payouts) {
            var wons = 0;
            for (var i in $scope.lastResult.payouts) {
                var elem = document.querySelectorAll( '[data-bet="' + i + '"]' );
                if (elem.length) {
                    var chipel = elem[0].childNodes[0];
                    showMultiplier($scope.lastResult.payouts[i], chipel);
                    chipel.classList.add("won");
                    wons++;
                }
            }
            $scope.prevNeighbours = $scope.neighbours;
            $scope.neighbours = [];
            if (wons === 0) {
                for (i in $scope.bets) {
                    delete($scope.bets[i]);
                }
                $scope.animating = false;
            } else {
                setTimeout(function() {
                    $scope.$apply(function() {
                        for (var j in $scope.bets) {
                            delete($scope.bets[j]);
                        }
                        $scope.animating = false;
                    });
                }, 2000);
            }
        }
    };
    var showMultiplier = function(bet, chipel){
        //var multiplier = $scope.betmap[JSON.stringify(bet)];
        var multiplier = bet;
        var betAmount = chipel.innerHTML;
        chipel.innerHTML = multiplier + document.getElementById('localization-x').innerHTML;
        setTimeout(function(){
            chipel.innerHTML = betAmount;
            chipel.classList.remove('won');
        }, 2000);
    };
    $scope.animateWinNumber = function() {
        $scope.animateWinCount++;
        var animateWinCount = 2;
        var elname = "#num-"+$scope.lastResult.result;
        $(elname).animate({
            opacity: 0.1
        }, 400, function() {
            $(elname).animate({
                opacity: 1
            }, 400, function() {
                if ($scope.animateWinCount > animateWinCount) {
                    $scope.animateWinCount = 0;
                } else {
                    $scope.animateWinNumber();
                }
            });
        });
    };

    $scope.animateWheel = function(res) {

        setTimeout(function() {
           $scope.$apply(function() {
                         $scope.gameCompleted();
                         $scope.showWins();
                         // $scope.animateWinNumber();
                         $(".rouletteCanvasContainer").animate({opacity:"0"},400, function() {

                            $(".rouletteCanvasContainer").css({zIndex:"-2"});
                        });
                         $("#wheel_placeholder").animate({opacity:"1",top:"0px",left:"0px",width:"150px",height:"150px"},400);

            });
           },$scope.spinTime);
        $("#wheel_placeholder").animate({opacity:"0",left:"-200px",top:"-100px",width:"300",height:"300"},600);
        $(".rouletteCanvasContainer").css({zIndex:"2"},400);
        $(".rouletteCanvasContainer").animate({opacity:"1"},400);


        g_MainPlay.runWheel(parseInt(res.result,10));
    };
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$window', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
