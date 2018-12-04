'use strict';
/* global BaseGameController */
/* global SlotMachine */


var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {

    var gameController = this;
    gameController.gameName = 'reels';
    gameController.Game = Game;

    gameController.getNewGameParams = function() {
        var params = GameController.super_.prototype.getNewGameParams.call(this);
        params.game = $scope.gameData.game;
        return params;
    };

    gameController.newGame_OnSuccess = function(response){
        slotMachine.payout = 0;
        slotMachine.finalScreen = response.result;
        slotMachine.wins = response.wins;
        slotMachine.scatters = response.scatter;
        slotMachine.spin();
        $scope.playSound('spinSound');
        GameController.super_.prototype.newGame_OnSuccess.call(gameController, response);
    };
    gameController.playWinSounds = function(multiplier) {
        // play the sounds
        var self = this;
        if (multiplier <= 2) {
            self.$scope.playSound('winSound');
        } else if (multiplier < 17.6) {

           self.$scope.playSound('bigWinSound');
        } else  {

            self.$scope.playSound('hugeWinSound');

        }
    };

    GameController.super_.apply(this, arguments);

    $("abbr.timeago").timeago();
    $.timeago.settings.allowFuture = true;

    /* slot machine */
    var slotMachine;
    var userIsAdmin;
    var loggedIn = false;
    var defaultBet = 1;
    var defaultLines = 5;
    var can = document.getElementById('slots');
    var ctx = can.getContext('2d');
    var canvasWidth = window.getComputedStyle(can).width.slice(0, -2);
    var canvasHeight = window.getComputedStyle(can).height.slice(0, -2);

    can.width = canvasWidth;
    can.height = canvasHeight;

    window.addEventListener('keydown', function(event) {
        if (event.keyCode === 32) { // spacebar
            // event.stopPropagation();
            // event.preventDefault();

            if (slotMachine.state === "reward") {
                return;
            }
            if (slotMachine.state === "rest" || slotMachine.state === "reward") {
                $scope.play();
            }
            slotMachine.handleSpacebar(event);
        }
    }, true);
    /* paytable */
    function updatePaytableWins(bet) {
        var paytable = $("#paytable");
        var winPrices = paytable.find('.price-box-youwin p');
        for (var priceIndex in winPrices) {
            var winPrice = winPrices.eq(priceIndex);
            var multiplierForBet = paytable.find('.price-box-multiplier p').eq(priceIndex);
            var multiplier = multiplierForBet.find('span').html();
            winPrice.html(parseInt(multiplier) * bet);
        }
    }
    /* /paytable */
    var data = {
        profile: {
            loggedIn: false,
            balance: 10000
        }
    };
    loggedIn = data.profile.loggedIn;
    var betinfoElems = {
        balance: document.getElementById('betinfoBalance'),
        payout: document.getElementById('betinfoPayout'),
        lines: document.getElementById('betinfoLines'),
        bet: document.getElementById('betinfoBet')
    };
    var audioElems = {
        paint: document.getElementById('audio-paint'),
        win: document.getElementById('audio-win'),
        bigwin: document.getElementById('audio-bigwin'),
        spinup: document.getElementById('audio-spinup'),
        reelstop: document.getElementById('audio-reelstop')
    };
    $scope.wheelStopped = function() {
        gameController.finishGame(true);
    };
    slotMachine = new SlotMachine({
        can: can,
        ctx: ctx,
        width: canvasWidth,
        height: canvasHeight,
        betinfoElems: betinfoElems,
        audioElems: audioElems,
        errorElem: document.getElementById('slotmachine-error'),
        // demo: !loggedIn,
        audioEnabled: false,
        demo: false,
        spinFinishedCallback: $scope.wheelStopped,
        sprites: document.getElementById('sprite-sprites').getAttribute('src'),
        debug: false,
        userIsAdmin: (typeof(userIsAdmin) === "undefined") ? false : userIsAdmin
    });
    slotMachine.setLines(defaultLines);
    slotMachine.setBet(defaultBet);
    updatePaytableWins(defaultBet);
    slotMachine.balance = data.profile.balance;
    $('#betinfoBalance').html(parseFloat(slotMachine.balance).toFixed(5));

    $scope.getNextGame = function() {
        gameController.getNextGame();
    };
    $scope.play = function() {
        gameController.startGame();
    };
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);

