'use strict';

/* global BaseGameController, g_MainPlay */

var GameController = function($rootScope, $scope, $window, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {

    var gameController = this;
    this.gameName = 'coinflip';
    this.Game = Game;
    this.lastResult = ["0","0"];
    $scope.animationsLoading = true;

    gameController.getNewGameParams = function(){
        var gameParams = GameController.super_.prototype.getNewGameParams.call(this);
        if($scope.coins === 1){
            $scope.bet.sides = [$scope.bet.sides[0]];
        }
        gameParams.bet = JSON.stringify($scope.bet);
        return gameParams;
    };

    gameController.newGame_OnSuccess = function(response){
        GameController.super_.prototype.newGame_OnSuccess.call(this, response);
        $scope.playSound('spinSound');
        setTimeout(function() {
            $scope.$apply(function() {
                gameController.finishGame(true);
                $scope.showResult(response.result);
            });
        },5500);
        var resultarray = [];
        var responseresult = response.result.split(',');
        if($scope.coins === 1)
            {
                resultarray.push( responseresult[0]);
                resultarray.push("0");
                g_MainPlay.runDice1(this.lastResult, resultarray);
                //this.lastResult.pop();
                this.lastResult = resultarray;

            }
            else if($scope.coins === 2)
                {
                    resultarray.push( responseresult[0]);
                    resultarray.push( responseresult[1]);
                    g_MainPlay.runDice2(this.lastResult, resultarray);
                    this.lastResult=resultarray;
                }

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

    $scope.$watch("player", function(player){
        if(player && !$scope.animationLoaded){
            $scope.initAnimation();
            $scope.animationLoaded = true;
        }
    });

    // gameController.isExceedMaxWager = function(wager){
    //     var isExceedPlayerBalance = GameController.super_.prototype.isExceedMaxWager.call(this, wager);
    //     var isExceedMaxWager = wager > 5000000000? true: false;
    //     var invalidWager = isExceedMaxWager || isExceedPlayerBalance;
    //     $scope.maxBetErr = invalidWager;
    //     return invalidWager;
    // };

    // GameController.super_.apply(this, arguments);
    GameController.super_.call(this, $rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game);

    $scope.initAnimation = function() {
        $scope.animationInitialized = true;
        var d = document;
        var c = {
            COCOS2D_DEBUG:2, //0 to turn debug off, 1 for basic debug, and 2 for full debug
            box2d:false,
            chipmunk:false,
            showFPS:true,
            frameRate:60,
            loadExtension:true,
            renderMode:1,       //Choose of RenderMode: 0(default), 1(Canvas only), 2(WebGL only)
            tag:'gameCanvas', //the dom element to run cocos2d on
            // engineDir:'../cocos2d/',
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

    $scope.HideAnimation = function() {
        $scope.showResultFlag = false;
        g_MainPlay.initDice($scope.coins);
    };

    $scope.spin = function() {
        gameController.startGame();
        $scope.showResultFlag = false;
    };

    $scope.showResult = function(res) {
        var result = res.split(',');
        var chooseval;
        var flag1, flag2;

        $scope.showResultFlag = true;

        if($scope.coins === 1) {
            if(result[0]=== "0") {
                $("#coinmsg1").html($("#headsmsg").html());
            } else if(result[0]=== "1") {
                $("#coinmsg1").html($("#tailsmsg").html());
            }

            chooseval = $scope.bet.sides[0].toString();
            if(chooseval === result[0]) {
                $("#gamemessage").html($("#winmsg").html());
            } else {
                $("#gamemessage").html("");
            }

        } else if($scope.coins === 2) {

            if(result[0]=== "0") {
                $("#coinmsg1").html($("#headsmsg").html());
            } else if(result[0] === "1") {
                $("#coinmsg1").html($("#tailsmsg").html());
            }
            if(result[1]=== "0") {
                $("#coinmsg2").html($("#headsmsg").html());
            } else if(result[1] === "1") {
                $("#coinmsg2").html($("#tailsmsg").html());
            }

            chooseval = $scope.bet.sides[0].toString();
            if(chooseval === result[0]) {
                flag1 = true;
            } else {
                flag1 = false;
            }

            chooseval = $scope.bet.sides[1].toString();
            if(result[1]=== chooseval) {
                flag2 = true;
            } else {
                flag2 = false;
            }

            if(flag1 === flag2 && flag1 === true) {
                $("#gamemessage").html($("#winmsg").html());
            } else {
                $("#gamemessage").html("");
            }
        }
    };
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$window', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);

