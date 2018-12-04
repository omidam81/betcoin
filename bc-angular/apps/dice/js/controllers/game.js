'use strict';
/* global BaseGameController, g_MainPlay */


var GameController = function($rootScope, $scope, $window, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {

    var gameController = this;
    gameController.gameName = 'dice';
    gameController.Game = Game;

    // GameController.super_.apply(this, arguments);
    GameController.super_.call(this, $rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game);

    $scope.spinTime = 10000;

    /**
     * Animation part begins
     */
    $scope.animationsLoading = true;
    $scope.initAnimation = function(){
        var d = document;
        var c = {
            container:'gameCanvas',
            width: 650,
            height: 140,
            diceCount: 5,
            spinTime: $scope.spinTime,
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

    gameController.isLessMinWager = function(wager) {
        if (wager < 300 && wager !== 0) {
            this.$scope.minbetMsg = true;
            return true;
        }
        return false;
    };

    gameController.getNewGameParams = function(){
        var params = GameController.super_.prototype.getNewGameParams.call(this);
        params.game = $scope.gameData.game;
        params.gameTarget = $scope.gameTarget;
        return params;
    };

    gameController.newGame_OnSuccess = function(response){
        GameController.super_.prototype.newGame_OnSuccess.call(this, response);
        var resultArr = response.result.toString().split('');
        while(resultArr.length < 5) {
            resultArr.unshift("0");
        }
        $scope.playSound('spinSound');
        g_MainPlay.runDice(resultArr);
        $scope.delayNext();
    };
    gameController.playWinSounds = function(multiplier) {
        // play the sounds
        var self = this;
        if (multiplier <= 5) {
            self.$scope.playSound('winSound');
        } else if (multiplier <= 25) {
            self.$scope.playSound('bigWinSound');
        } else if (multiplier >= 50) {
            self.$scope.playSound('hugeWinSound');
        }
    };

    $scope.gameTarget = 32888;

    $scope.delayNext = function() {
        var self = gameController;
        setTimeout(function() {
            $scope.$apply(function() {
                self.finishGame();
            });
        }, $scope.spinTime);
    };

    $scope.getNextGame = function() {
        gameController.getNextGame();
    };

    $scope.play = function() {
        gameController.startGame();
    };

    var MAX_ROLL = 65535;
    var HOUSE_EDGE = 0.0188;
    var LOSE_PAYOUT = 0.005;
    var HOUSE_EDGE_1 = 0.01838;

    $scope.onSliderValueChanged = function(newValue) {
        var edge = HOUSE_EDGE;
        if (parseInt(newValue, 10) === 1) {
            edge = HOUSE_EDGE_1;
        }
        var odds = 1 - ((MAX_ROLL + 1 - newValue) / (MAX_ROLL + 1));
        var loseOdds = 1 - odds;
        var payout = 1 + (((edge * -1) - (LOSE_PAYOUT - 1) * loseOdds) / (odds));
        odds *= 100;
        $scope.winOdds = odds;
        $scope.payout = payout;
    };
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$window', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game' ,GameController]);
