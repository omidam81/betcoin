'use strict';

/* global BaseGameController, g_MainPlay*/

var GameController = function($rootScope, $scope, $window, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var gameController = this;
    gameController.gameName = 'fantan';
    gameController.Game = Game;

    //GameController.super_.apply(this, arguments);

    $scope.recentnumbers = [];
    $scope.timer = 3000;
    $scope.animationsLoading = true;

    $scope.initAnimation = function(){
        $scope.animationInitialized = true;
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

        while($scope.recentnumbers.length > 50) {
            $scope.recentnumbers.pop();
        }
        var temp = {};
        temp.color = 'red';
        temp.number = $scope.lastResult.result.slice(0);
        $scope.recentnumbers.unshift(temp);

        setTimeout(function() {
            $scope.$apply(function() {
                //$scope.clearWins();
                $scope.clearHighlights();
            });
        },7000);
    };

    $scope.showWins = function(){
        var res = $scope.lastResult.result;
        var result = res.sort();
        var dicesum = 0;

        for(var i=0; i<result.length; i++)
        {
            //display single dice highlight
            $("#single_dice_"+result[i]).addClass("highlight");

            for (var j=i+1; j<result.length;j++)
            {
                if(result[i] === result[j])
                {
                    //display single dice highlight
                    $("#double_"+result[i]).addClass("highlight");
                }
                else if(result[i] !== result[j])
                {
                    //display two dice highlight
                    $("#two_dice_"+result[i]+"_"+result[j]).addClass("highlight");
                }
            }

            dicesum += parseInt(result[i]);

        }
        if(dicesum>=4 && dicesum<=10)
        {
            //display small dice highlight
            $("#small").addClass("highlight");
        }
        else if(dicesum>=11 && dicesum<=17)
        {
            //display big dice highlight
            $("#large").addClass("highlight");
        }
        //display total dice highlight
        $("#total_"+dicesum).addClass("highlight");

        if(result[0] === result[1] && result[0] === result[2])
        {
            //display triple dice highlight
            $("#triple_"+result[0]).addClass("highlight");

            //display any triple dice highlight
            $("#any_triple").addClass("highlight");
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
        },5000);

        g_MainPlay.runDice(res.result);
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
            obj.innerHTML = tempvalue;
        }, 6000);
    };
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$window', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
