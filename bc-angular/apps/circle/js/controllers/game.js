'use strict';

/* global Modernizr */
/* global BaseGameController */

var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {

    var gameController = this;
    this.gameName = 'circle';
    this.Game = Game;

    gameController.getNewGameParams = function(){
        var gameParams = GameController.super_.prototype.getNewGameParams.call(this);
        gameParams.game = $scope.gameData.game;
        return gameParams;
    };

    gameController.getNextGameParams = function(){
        if (!$scope.currentGame) {
            $scope.currentGame = $cookies.selectedcircle;
            if (!$scope.currentGame) {
                $scope.currentGame = 4;
                $cookies.selectedcircle = $scope.currentGame.toString();
            }
        }
        return {game: $scope.currentGame};
    };

    gameController.newGame_OnSuccess = function(response){
        GameController.super_.prototype.newGame_OnSuccess.call(this, response);
        $scope.animateWheel(response);
        $scope.playSound('spinSound');
    };

    gameController.getNextGame_OnSuccess = function(response, callback){
        GameController.super_.prototype.getNextGame_OnSuccess.call(this, response, callback);
        $scope.gameData.game = response.game;
        if(parseInt($scope.currentGame, 10) !== parseInt(response.game, 10)) {
            console.info("The game returned from getNextGame was outdated.");
            return gameController.getNextGame();
        }
    };

    gameController.isExceedMaxWager = function(wager){
        var isExceedPlayerBalance = GameController.super_.prototype.isExceedMaxWager.call(this, wager);
        var invalidWager = isExceedPlayerBalance;
        // right now no error is showing, it should
        $scope.maxBetErr = invalidWager;
        return invalidWager;
    };

    GameController.super_.apply(this, arguments);

    $scope.currentGame = $cookies.selectedcircle;
    if (!$scope.currentGame) {
        $scope.currentGame = 4;
        $cookies.selectedcircle = $scope.currentGame.toString();
    }

    $scope.wheelImages = {
        6: ["25x_inner_wheel.png", "25x_outer_wheel.png", "25x_full_wheel.png"],
        5: ["15x_inner_wheel.png", "15x_outer_wheel.png", "15x_full_wheel.png"],
        3: ["10x_inner_wheel.png", "10x_outer_wheel.png", "10x_full_wheel.png"],
        2: ["5x_inner_wheel.png", "5x_outer_wheel.png", "5x_full_wheel.png"],
        1: ["3x_inner_wheel.png", "3x_outer_wheel.png", "3x_full_wheel.png"],
        4: ["50-50_inner_wheel.png", "50-50_outer_wheel.png", "50-50_full_wheel.png"]
    };


    $scope.spin = function() {
        gameController.startGame();
    };

    $scope.changeWheel = function(newCircle) {
        if (!gameController.isGameInProgress()) {
            if ($scope.currentGame === "" || $scope.currentGame !== newCircle) {
                gameController.setGameInProgress(true);
                $scope.currentGame = newCircle;
                $cookies.selectedcircle = newCircle.toString();
                gameController.getNextGame();
                $scope.playSound('introSound');
            }
            googleanalytics('send', 'event', 'circle', 'game', 'change circle');
        }
    };

    $scope.wheelStopped = function() {
        gameController.finishGame(true);
    };


    $scope.animateWheel = function(gameData) {
        // just grab a random number - used in the cubic-bezier easing
        // functions below.
        var rnum = function (min, max) {
            return Math.random() * (max - min) + min;
        };

        var from, i, randomStop, target_angle, to;
        to = 8;
        from = -8;
        if (!$scope.wheelStart) {
            $scope.wheelStart = 0;
        }
        var wheelSep = 21.176470588;
        if(gameData.game === 6) {
            wheelSep = 13.846153846;
            to = 2;
            from = -2;
        }
        randomStop = Math.floor(Math.random() * (to - from + 1) + from);
        target_angle = -(Math.abs($scope.wheelStart) + 720 + gameData.result * wheelSep - randomStop);
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
            document.getElementById('wheelImage' + $scope.currentGame).setAttribute("style", i);
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.wheelStopped();
                });
            }, $scope.circleSpinTime + 300);
        } else {
            $("#wheelImage" + $scope.currentGame).rotate({
                angle: $scope.wheelStart,
                animateTo: target_angle,
                duration: 7200,
                center: ["50%", "50%"],
                easing: $.easing.easeInOutQuad,
                callback: function() {
                    $scope.$apply(function() {
                        $scope.wheelStopped();
                    });
                }
            });
        }

        $scope.wheelStart = target_angle - (360 - (Math.abs(target_angle) % 360));
    };
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
