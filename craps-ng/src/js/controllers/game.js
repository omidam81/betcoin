'use strict';

/* global BaseGameController, g_MainPlay*/

var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var gameController = this;
    this.gameName = 'sicbo';
    this.Game = Game;

    GameController.super_.apply(this, arguments);

    $scope.recentnumbers = [];
    $scope.timer = 3000;

    window.animationInitialized = false;
    
    $scope.initAnimation = function(){
        var d = document;
        var c = {
            COCOS2D_DEBUG : 2,
        box2d: false,
        chipmunk:false,
        showFPS:true,
        frameRate:60,
        loadExtension:true,
        renderMode:1,
        tag:'gameCanvas',
        SingleEngineFile:'src/Cocos2d-html5-v2.2.3.min.js',
        appFiles:[
                  'src/MainPlay.js',
                  'src/GameData.js'
                  ]
        };
        
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
        
        //first load engine file if specified
        var s = d.createElement('script');
        /*********Delete this section if you have packed all files into one*******/
        if (c.SingleEngineFile && !c.engineDir) {
            s.src = c.SingleEngineFile;
        }
        else if (c.engineDir && !c.SingleEngineFile) {
            s.src = c.engineDir + 'jsloader.js';
        }
        else {
            window.alert('You must specify either the single engine file OR the engine directory in "cocos2d.js"');
        }
        
        document.ccConfig = c;
        s.id = 'cocos2d-html5';
        d.body.appendChild(s);
    };
    
    BCPlayer.$on("user update", function() {
                 setTimeout(function() {
                            
                            if(!$scope.animationInitialized) { $scope.initAnimation(); }
                            }, 500);
                 });

    gameController.getNewGameParams = function() {
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
        if ($scope.totalbet !== 0 && $scope.totalbet > $scope.player.balance.btc) {
            $scope.maxBetErr = true;
            return true;
        }
        return false;
    };

    gameController.newGame_OnSuccess = function(response) {
        GameController.super_.prototype.newGame_OnSuccess.call(this, response);

        $scope.clearWins();
        $scope.playSound('spinSound');
        
        $scope.animateDice(response);
    };

    gameController.playWinSounds = function(multiplier) {
        if (multiplier === 2) {
            $scope.playSound('winSound');
        } else if (multiplier >= 3 && multiplier <= 15) {
            $scope.playSound('bigWinSound');
        } else if (multiplier > 15) {
            $scope.playSound('hugeWinSound');
        }
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

    BCPlayer.$on("user update", function() {
    });

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
        var elem = document.querySelectorAll( '.chips' );
        for(var x=0;x< elem.length;x++) {
            elem[x].classList.remove("won"); //chips element
            elem[x].classList.remove("lost"); //chips element
        }
    };
    $scope.clearHighlights = function(){
        var numberels = document.querySelectorAll( '[class^="number"]' );
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

        /*while($scope.recentnumbers.length > 50) {
            $scope.recentnumbers.pop();
        }
        
        $scope.recentnumbers.unshift({color:'red',number:$scope.lastResult.result});
        
        setTimeout(function() {
            $scope.$apply(function() {
                //$scope.clearWins();
                $scope.clearHighlights();
            });
        },6000);*/
    };
    
    $scope.showWins = function(){
        
    };
    
    $scope.animateDice = function(res) {
        
        setTimeout(function() {
            $scope.$apply(function() {
                $scope.gameCompleted();
                $scope.showWins();
            });
        },4000);

        g_MainPlay.runDice(res.result);
    };
    
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
