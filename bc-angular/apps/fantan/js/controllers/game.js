'use strict';

/* global BaseGameController, g_MainPlay*/

var GameController = function($rootScope, $scope, $window, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var gameController = this;
    gameController.gameName = 'fantan';
    gameController.Game = Game;

    //GameController.super_.apply(this, arguments);

    $scope.recentnumbers = [];
    $scope.timer = 3000;

    /**
     * Animation part begins
     */
    $scope.spinTime = 4000;
    $scope.animationsLoading = true;
    $scope.initAnimation = function(){
        var d = document;
        var c = {
            container:'gameCanvas',
            width: 300,
            height: 100,
            spinTime: $scope.spinTime,
            diceCount: 3,
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
            }, 500);

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
        $scope.clearHighlights();

        var params = GameController.super_.prototype.getNewGameParams.call(this);
        params.game = $scope.gameData.game;
        var wager_each = this.getWager();
        var bets = {};
        for(var i in $scope.bets) {
            if($scope.bets.hasOwnProperty(i)) {
                // console.log(i,$scope.bets[i],wager_each);
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
        $scope.playSound('spinSound');

        $scope.animateDice(response);
    };

    gameController.playWinSounds = function(multiplier) {
        if (multiplier > 1 && multiplier <= 2) {
            $scope.playSound('winSound');
        } else if (multiplier > 2 && multiplier <= 15) {
            $scope.playSound('bigWinSound');
        } else if (multiplier > 15) {
            $scope.playSound('hugeWinSound');
        }
    };

    GameController.super_.call(this, $rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game);


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

//    BCPlayer.$on("user update", function() {
//    });

    $scope.$watch('btcWager', function() {
                  $scope.calculateTotalBet();
                  });
    $scope.$watch('bets', function() {
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
    $scope.clearHighlights = function(){
        var numberels = document.querySelectorAll( '.highlight' );
        for(var n=0;n< numberels.length;n++) {
            numberels[n].classList.remove("highlight");
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
        var temp = {};
        temp.color = 'red';
        temp.number = $scope.lastResult.result;
        $scope.recentnumbers.unshift(temp);
    };

    $scope.showWins = function(){
        var result = $scope.lastResult.payouts;

        for(var i in result) {
            if (result.hasOwnProperty(i) && result[i] > 0) {
                $('[data-bet=\''+i+'\']').addClass("highlight");
            }
        }

        $(".chips").each(function(){
            if($(this).parent().hasClass("highlight"))
            {
                var value = $scope.lastResult.payouts[$(this).parent().attr('data-bet')]+$("#ratestr").html();
                showMultiplier($(this)[0], value);
                $(this).addClass("won");
            }
            else
            {
                // $(this).addClass("lost");
            }
        });
    };

    $scope.animateDice = function(res) {

        setTimeout(function() {
            $scope.$apply(function() {
                $scope.gameCompleted();
                $scope.showWins();
            });
        },$scope.spinTime);

        g_MainPlay.runDice(res.dices);
    };

    $(window).resize(function(){
        if($(window).width()>$(window).height()) {
            $("#g-fantan").removeClass("vertical");
            $("#g-fantan").addClass("horizontal");
        }
        else {
            $("#g-fantan").removeClass("horizontal");
            $("#g-fantan").addClass("vertical");
        }
    });

    $(document).ready(function(){
        if($(window).width()>$(window).height()) {
            $("#g-fantan").removeClass("vertical");
            $("#g-fantan").addClass("horizontal");
        }
        else {
            $("#g-fantan").removeClass("horizontal");
            $("#g-fantan").addClass("vertical");
        }
    });

    var showMultiplier = function(obj, value){
        var tempvalue = obj.innerHTML;
        obj.innerHTML = value;

        setTimeout(function(){
            obj.classList.remove('won');
            obj.innerHTML = tempvalue;
        }, $scope.spinTime + 1000);
    };
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$window', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
