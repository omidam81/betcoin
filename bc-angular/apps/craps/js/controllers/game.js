'use strict';

/* global BaseGameController, g_MainPlay*/

var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game, $window, $modal) {
    var gameController = this;
    this.gameName = 'craps';
    this.Game = Game;

    GameController.super_.apply(this, arguments);

    $scope.recentnumbers = [];
    $scope.timer = 10000;

    //Craps variable
    $scope.currentBetPanel = false;
    $scope.offerPress = true;
    $scope.pressed = [];
    $scope.leaveWinningsBetsUp = true;
    $scope.animating = 0;
    $scope.chipsAnimationTimer = 300;
    $scope.options = {
        field: true,
        pass: true,
        dontpass: true,
        passodds: false,
        dontpassodds: false,
        come: false,
        dontcome: false,
        lay4: true,
        lay5: true,
        lay6: true,
        lay8: true,
        lay9: true,
        lay10: true,
        buy4: false,
        buy10: false,
        place5: false,
        place6: false,
        place8: false,
        place9: false,
        takeodds4: false,
        takeodds5: false,
        takeodds6: false,
        takeodds8: false,
        takeodds9: false,
        takeodds10: false,
        notodds4: false,
        notodds5: false,
        notodds6: false,
        notodds8: false,
        notodds9: false,
        notodds10: false,
        two: true,
        three: true,
        seven: true,
        eleven: true,
        twelve: true,
        anycraps: true,
        hard4: false,
        hard6: false,
        hard8: false,
        hard10: false
    };
    $scope.unitWager = 0;
    $scope.thepoint = 0;
    $scope.returnbets = {}; //online clearable bets
    $scope.onlinebets = {}; //online bets
    $scope.bets = {}; //offline bets
    $scope.max = {};

    /**
     * Animation part begins
     */
    $scope.animationsLoading = true;
    $scope.spinTime = 3000;
    $scope.initAnimation = function(){
        var d = document;
        var c = {
            container:'gameCanvas',
            width: 300,
            height: 100,
            spinTime: 3000,
            diceCount: 2,
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
        var params = GameController.super_.prototype.getNewGameParams.call(this);
        params.game = $scope.gameData.game;

        var bets = {};
        if (Object.keys($scope.bets).length > 0 && Object.keys($scope.onlinebets).length === 0) {
            $scope.unitWager = this.getWager();
        }

        for(var i in $scope.bets) {
            if($scope.bets.hasOwnProperty(i) && (!$scope.onlinebets.hasOwnProperty(i) || $scope.returnbets.hasOwnProperty(i))) {
                bets[i] = $scope.unitWager*$scope.bets[i];
                if ($scope.onlinebets.hasOwnProperty(i)) {
                    bets[i] = bets[i] - $scope.onlinebets[i];
                }
            }
        }

        if (Object.keys($scope.bets).length > 0 && Object.keys($scope.onlinebets).length === 0) {
            $scope.onlinebets = $scope.bets;
        }

        params.win_bets_up = $scope.leaveWinningsBetsUp;
        params.bets = JSON.stringify(bets);
        params.last_game_id = $scope.lastGameId;
        return params;
    };

    gameController.isExceedMaxWager = function() {
        if ($scope.totalbet !== 0 && $scope.totalbet > gameController.getBalance()) {
            $scope.maxBetErr = true;
            return true;
        }
        return false;
    };

    gameController.newGame_OnSuccess = function(response, notNew) {
        GameController.super_.prototype.newGame_OnSuccess.call(this, response);

        if (!notNew) {
            $scope.playSound('spinSound');
        }

        $scope.returnbets = response.options.returnbets;
        $scope.max = response.options.max;
        $scope.onlinebets = response.table.bets;
        $scope.lastGameId = response._id;

        $scope.animateDice(response, notNew);

        var offerNum = null;
        $scope.pressed = [];
        if ($scope.offerPress && response.wins && !notNew) {
            for(var i in response.wins) {
                if (i === 'buy4' || i === 'place5' || i === 'place6' || i === 'place8' || i === 'place9' || i === 'buy10') {
                    if (response.options[i]) {
                        offerNum = i;
                    }
                }
            }
            if (offerNum) {
                var winning = $scope.bets[offerNum]; //winning bets in previous bet panel
                var multiplePressable = false;
                if (winning >= 4) {
                    multiplePressable = true;
                }

                setTimeout(function() {
                    var modalInstance = $modal.open({
                        templateUrl: 'pressModalContent.html',
                        controller: 'PressController',
                        backdrop: 'static',
                        resolve: {
                            multiplePressable: function() {
                                return multiplePressable;
                            },
                            offerNum: function() {
                                return offerNum;
                            }
                        }
                    });
                    modalInstance.result.then(function(selectedPress) {
                        $scope.unitPress = winning;
                        var thepoint = response.table.thepoint;
                        $scope.pressed.push(offerNum);
                        if (selectedPress === 'press') {
                            $scope.pressed.push(offerNum);
                        }
                        if (selectedPress === 'press_in') {
                            var inside = ['place5', 'place6', 'place8', 'place9'];
                            if (thepoint !== 5) {
                                $scope.pressed.push(inside[0]);
                            }
                            if (thepoint !== 6) {
                                $scope.pressed.push(inside[1]);
                            }
                            if (thepoint !== 8) {
                                $scope.pressed.push(inside[2]);
                            }
                            if (thepoint !== 9) {
                                $scope.pressed.push(inside[3]);
                            }
                        } else if (selectedPress === 'press_out') {
                            var outside = ['buy4', 'place5', 'place9', 'buy10'];
                            if (thepoint !== 4) {
                                $scope.pressed.push(outside[0]);
                            }
                            if (thepoint !== 5) {
                                $scope.pressed.push(outside[1]);
                            }
                            if (thepoint !== 9) {
                                $scope.pressed.push(outside[2]);
                            }
                            if (thepoint !== 10) {
                                $scope.pressed.push(outside[3]);
                            }
                        }
                        $scope.unitPress = Math.floor(winning / ($scope.pressed.length - 1));
                        $scope.animatePresses($scope.pressed, $scope.unitPress, response);
                        $scope.animateChips(response, notNew);
                    }, function() {
                        $scope.animateChips(response, notNew);
                    });
                }, $scope.spinTime);
            }
        }
        if (offerNum === null) {
            if (notNew) {
                $scope.animateChips(response, notNew);
            } else {
                setTimeout(function () {
                    $scope.animateChips(response, notNew);
                }, $scope.spinTime);
            }
        }
    };

    gameController.playWinSounds = function(multiplier) {
        if (multiplier <= 2) {
            $scope.playSound('winSound');
        } else if (multiplier <= 15) {
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

    $scope.longPressTimeout = setTimeout(function() {
                                         // nothing
                                         }, 1);
    $scope.clearOneBet = function(bet) {
        if ($scope.bets[bet] && !$scope.onlinebets.hasOwnProperty(bet)) {
            delete($scope.bets[bet]);
            $scope.calculateTotalBet();
            return;
        }
        else if ($scope.returnbets.hasOwnProperty(bet)) {
            var return_bets = {};
            return_bets[bet] = true;
            $scope.deleteOnlineBets(return_bets);
        }
    };

    $scope.play = function() {
        $scope.animating = 1;
        $scope.options = {};
        if(!$scope.playedGame){
            $scope.playedGame = true;
            $scope.BCSession.lockCurrency = true;
        }
        gameController.startGame();
    };

    $scope.$watch('btcWager', function() {
                  $scope.calculateTotalBet();
                  });
    $scope.$watch('bets', function() {
        $scope.calculateTotalBet();
    }, true);

    $scope.getBetAmount = function(i, wantNew) {
        if($scope.bets.hasOwnProperty(i)) {
            if ($scope.onlinebets.hasOwnProperty(i) && wantNew) {
                return ($scope.btcWager * $scope.bets[i] - $scope.onlinebets[i]);
            } else {
                return ($scope.btcWager * $scope.bets[i]);
            }
        }
        return 0;
    };

    $scope.getTotalBet = function() {
        var totalbet = 0;
        for(var i in $scope.bets) {
            if($scope.bets.hasOwnProperty(i)) {
                totalbet += $scope.getBetAmount(i, false);
            }
        }
        return totalbet;
    };
    $scope.calculateTotalBet = function() {

        $scope.totalbet = $scope.getTotalBet();
    };

    $scope.clearBets = function() {
        if(gameController.isGameInProgress()) { return false; }
        if (Object.keys($scope.onlinebets).length === 0) {
            $scope.bets = {};
            $scope.calculateTotalBet();
        } else {
            var return_bets = {};
            for(var i in $scope.onlinebets) {
                if($scope.onlinebets.hasOwnProperty(i) && $scope.returnbets.hasOwnProperty(i)) {
                    return_bets[i] = true;
                }
            }
            if (Object.keys(return_bets).length > 0) {
                $scope.deleteOnlineBets(return_bets);
            }
        }
    };

    $scope.deleteOnlineBets = function(return_bets) {
        var params = {};
        params.player_id = $scope.player._id;
        params.last_game_id = $scope.lastGameId;
        params.game_id = $scope.nextGameId;
        params.client_seed = $scope.gameData.client_seed;
        params.return_bets = JSON.stringify(return_bets);
        $scope.animating = 1;
        $scope.options = {};
        Game.nextAction(params, function (data) {
                for (var i in return_bets) {
                    if (return_bets[i]) {
                        delete($scope.bets[i]);
                    }
                }
                gameController.newGame_OnSuccess(data, true); //no animation = true
            },
            function () {
                $scope.clearError();
                $scope.serverErr = true;

                if (!$scope.gameRetry) {
                    $scope.gameRetry = true;
                    setTimeout(function () {
                        $scope.$apply(function () {
                            $scope.deleteOnlineBets(return_bets);
                        });
                    }, 2000);
                }
            });
    };

    $scope.animatePresses = function(presses, unitPress, data) {
        for(var i = 1; i < presses.length; i++) {
            $scope.animateChip(presses[i], 'press', data, unitPress);
        }
    };

    $scope.animateChips = function(response, notNew) {
        $scope.animateThePoint(response.table, notNew);
        $scope.animateWinLost(response, notNew);
    };
    
    $scope.animateDice = function(res, notNew) {
        if (notNew) {
            return;
        }
        g_MainPlay.runDice(res.dices);
    };

    $scope.animateThePoint = function(table, notNew) {
        if (notNew) {
            $scope.thepoint = table.thepoint;
            return;
        }

        if ($scope.thepoint !== table.thepoint && !($scope.thepoint === undefined && table.thepoint === undefined)) {
            $scope.thepoint = table.thepoint;
            var elem = document.querySelectorAll('.thepoint');
            var left = -80;
            if ($scope.thepoint === 4) {
                left = 260;
            } else if ($scope.thepoint === 5) {
                left = 360;
            } else if ($scope.thepoint === 6) {
                left = 460;
            } else if ($scope.thepoint === 8) {
                left = 560;
            } else if ($scope.thepoint === 9) {
                left = 660;
            } else if ($scope.thepoint === 10) {
                left = 760;
            } else {
                left = -80;
            }
            $(elem[0]).animate({
                left: left + 'px'
            }, $scope.chipsAnimationTimer, function () {

            });
        }
    };

    /**
     * Animate win/lose bets
     * @param bet
     * @param direction true:win|false:lose
     */
    $scope.animateChip = function(bet, direction, data, chipsValue) {
        var top = 0;
        var left = 0;
        var originTop, originLeft;

        var $elem = $("div[bet='" + bet + "'] .chips");

        if (($scope.pressed.indexOf(bet) !== -1 || ($scope.leaveWinningsBetsUp && direction === 'win') || direction === 'press') && data.options[bet]) {

        } else {
            $elem.css('display', 'none');
        }
        originTop = $elem.css('top');
        originLeft = $elem.css('left');
        $elem = $elem.first().clone().insertAfter($elem);
        $elem.css('display', 'block');
        if (chipsValue) {
            $elem.html(chipsValue);
        }
        //var originTop = $elem.css('top');
        var myRe1 = /(notodds|dontcome|come|takeodds)(\d+)/;
        var myRe2 = /(lay|buy|place)(\d+)/;
        var num, matches;
        if (myRe1.test(bet)) {
            matches = myRe1.exec(bet);
            num = parseInt(matches[2], 10);
            var splitBet = matches[1];
            if (num >= 8) {
                num = num - 1;
            }
            num = num - 4;
            if (splitBet === 'notodds' || splitBet === 'dontcome') {
                top = -20;
            } else {
                top = -20 - 28;
            }
            if (splitBet === 'notodds' || splitBet === 'come') {
                left = -(100 * num) - 260;
            } else {
                left = -(100 * num) - 48 - 260;
            }
        } else if (myRe2.test(bet)) {
            matches = myRe2.exec(bet);
            num = parseInt(matches[2], 10);
            if (num >= 8) {
                num = num - 1;
            }
            num = num - 4;
            left = -(100 * num) - 260;
            if (matches[1] !== 'lay') {
                top = -80;
            }
        } else if (bet === 'pass') {
            left = -40;
        } else if (bet === 'dontpassodds') {
            left = -80;
        } else if (bet === 'dontpass') {
            left = -120;
        } else if (bet === 'come') {
            left = -160;
            top = -100;
        } else if (bet === 'field') {
            left = -160;
            top = -200;
        } else if (bet === 'dontcome') {
            left = -160;
        } else if (bet === 'seven') {
            left = -680;
            top = -120;
        } else if (bet === 'anycraps') {
            left = -680;
            top = -390;
        } else if (bet === 'hard4') {
            left = -680;
            top = -190;
        } else if (bet === 'hard10') {
            left = -770;
            top = -190;
        } else if (bet === 'hard6') {
            left = -680;
            top = -240;
        } else if (bet === 'hard8') {
            left = -770;
            top = -240;
        } else if (bet === 'three') {
            left = -680;
            top = -290;
        } else if (bet === 'eleven') {
            left = -770;
            top = -290;
        } else if (bet === 'two') {
            left = -680;
            top = -340;
        } else if (bet === 'twelve') {
            left = -770;
            top = -340;
        }

        $scope.animating++;

        if (direction === 'win') {
            top += 500;
            left += 460;
        } else if (direction === 'lose') {
            top -= 100;
            left -= 100;
        } else if (direction === 'press') {
            top -= 100;
            left += 960;
            $elem.css('top', top + 'px');
            $elem.css('left', left + 'px');
            $elem.animate({left: originLeft, top: originTop}, $scope.chipsAnimationTimer, function () {
                $elem.remove();
            });
            return;
        }
        $elem.animate({left: left + 'px', top: top + 'px'}, $scope.chipsAnimationTimer, function() {
            $elem.remove();
        });
    };

    $scope.animateComeChip = function(result, isDontCome) {
        if (result >= 8) {
            result -= 1;
        }
        var bet = 'come';
        var left = -160;
        var top = -100;
        if (isDontCome) {
            left = -160;
            top = 0;
            bet = 'dontcome';
        }
        result -= 4;

        left += result * 100 + 260;

        if (isDontCome) {
            left += 48;
            top += 20;
        } else {
            top += 48;
        }
        left += 25; //center-aligned margin
        top += 13;

        var $elem = $("div[bet='" + bet + "'] .chips");
        //var originTop = $elem.css('top');
        $elem.css('display', 'none');
        $elem = $elem.first().clone().insertAfter($elem);
        $elem.css('display', 'block');

        $scope.animating++;

        $elem.animate({left: left + 'px', top: top + 'px'}, $scope.chipsAnimationTimer, function() {
            $elem.remove();
        });
    };

    $scope.animateWinLost = function(data, notNew) {
        if (notNew) {
            $scope.gameCompleted(data, notNew);
            return;
        }
        var wins = data.wins;
        var losts = data.losts;

        var result = data.dices[0] + data.dices[1];
        if ($scope.bets.come && (result >= 4 && result <= 10 && result !== 7)) {
            $scope.animateComeChip(result, false);
        }
        if ($scope.bets.dontcome && (result >= 4 && result <= 10 && result !== 7)) {
            $scope.animateComeChip(result, true);
        }
        for (var win in wins) {
            $scope.animateChip(win, 'win', data);
        }
        for (var lost in losts) {
            $scope.animateChip(lost, 'lose', data);
        }

        var timer = 20;

        if ($scope.animating > 1) {
            timer += $scope.chipsAnimationTimer;
        }

        setTimeout(function() {
            $scope.$apply(function() {
                $scope.gameCompleted(data, notNew);
            });
        }, timer);
    };

    $scope.gameCompleted = function(data, notNew) {
        var options = data.options;
        gameController.finishGame();

        if (!notNew) {
            while ($scope.recentnumbers.length > 50) {
                $scope.recentnumbers.pop();
            }

            var temp = {};
            temp.color = 'red';
            temp.number = data.dices.slice(0);
            $scope.recentnumbers.unshift(temp);

            var bets = {};
            if ($scope.unitPress && $scope.pressed.length > 1) {
                for (var p = 0; p < $scope.pressed.length; p++) {
                    var press = $scope.pressed[p];
                    if (options[press]) {
                        if (!$scope.bets[press]) {
                            $scope.bets[press] = 0;
                        }
                        if (p === 0) {
                            bets[press] = $scope.bets[press];
                        } else {
                            bets[press] = $scope.bets[press] + $scope.unitPress; //Press
                        }
                    }
                }
            }

            $scope.bets = bets;

            for (var i in data.table.bets) {
                if (data.table.bets.hasOwnProperty(i) && !$scope.bets[i]) {
                    if ($scope.unitWager) {
                        $scope.bets[i] = data.table.bets[i] / $scope.unitWager;
                    } else {
                        $scope.bets[i] = 1;
                    }
                }
            }
        }

        $(".chips").css('display', 'none');
        for (var j in $scope.bets) {
            if ($scope.bets.hasOwnProperty(j) && $scope.bets[j]) {
                $("div[bet='" + j + "'] .chips").first().css('display', 'block');
            }
        }

        $scope.calculateTotalBet();
        $scope.options = data.options;
        $scope.animating = 0;
    };

    this.getResultWager = function() {
        var lastResult = this.getLastResult();
        if(lastResult === null || lastResult === undefined || !lastResult.affected_wager){
            return 0;
        }
        var wager = lastResult.affected_wager;
        return wager;
    };

    this.getResultProfit = function() { //return total winnings
        var lastResult = this.getLastResult();
        if(lastResult === null || lastResult === undefined || !lastResult.wins){
            return 0;
        }
        var winnings = 0;
        for(var i in lastResult.wins) {
            winnings += lastResult.wins[i];
        }
        return winnings;
    };


    this.getResultMultiplier = function() {
        var profit = this.getResultProfit(), wager = this.getResultWager();
        if(!profit || profit === 0 || !wager || wager ===0){
            return 0;
        }
        var multiplier = parseFloat(profit/wager);
        return multiplier;
    };

    this.processWin = function(callback){
        var self = this;
        var $scope = this.$scope;
        this.$scope.lastResult = this.$scope.lastResultTmp;
        this.$scope.lastResultTmp = {};
        //var options = this.$scope.lastResult.options;
        var multiplier = this.getResultMultiplier();
        if (multiplier < 1) {
            $scope.resultMultiplier = null;
            $scope.resultProfit = null;
            if(callback){
                callback();
            }
        } else {
            $scope.resultMultiplier = multiplier;
            $scope.resultProfit = self.$scope.lastResult.winnings;

            var wager = 0;
            /*if ($scope.unitPress && $scope.pressed.length > 1) {
                wager += $scope.bets[$scope.pressed[0]] * this.$scope.unitWager; //original bets
                for (var p = 1; p < $scope.pressed.length; p++) {
                    wager += $scope.unitPress * this.$scope.unitWager; //Press
                }
            }*/

            $scope.resultProfit -= wager; //Remove leaving bets from profit

            $scope.animateMessage();
            this.playWinSounds(multiplier);
            if(callback){
                callback();
            }
        }
    };

    this.autospin = function() {
        var self = this;
        if(self.$scope.autospin) {
            self.$scope.autobetTimer = setTimeout(function(){
                self.$scope.$apply(function() {
                    self.$scope.play();
                });
            }, self.$scope.timer);
        }
    };
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', '$window', '$modal', GameController]);
