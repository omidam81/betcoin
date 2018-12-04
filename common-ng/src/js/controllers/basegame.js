'use strict';

/* exported BaseGameController */

function BaseGameController($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory) {
    var controller = this;
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$filter = $scope;
    this.Sounds = LowLagSounds;
    this.$cookies = $cookies;
    this.$location = $location;
    this.BCPlayer = BCPlayer;
    this.VisibilityFactory = VisibilityFactory;
    this.globalGameStartEventName = 'game in progress';
    this.globalGameFinishEventName = 'game finished';
    this.finishGameDelay = 0;
    this.getNextGameDelay = 0;

    $scope.btcWager = 0;
    if ($cookies.btcWager) {
        $scope.btcWager = parseInt($cookies.btcWager, 10) || 0;
    }

    VisibilityFactory.isPageVisible();
    this.setGameInProgress(true);
    $scope.gameData = {};
    $scope.playerTmp = {};
    $scope.gamesTmp = [];
    $scope.animateCount = 0;
    $scope.autospin = false;
    $scope.isResetSeed = true;
    $scope.clientSeedValue = "";
    $scope.timer = 1000;
    $scope.lastResult = {};
    $scope.currentGame = {};
    $scope.gameName = this.gameName;

    if ($cookies.muted) {
        $scope.muted = true;
        $rootScope.mute = true;
        $scope.soundIcon = './img/sound-mute.png';
    } else {
        $scope.muted = false;
        $rootScope.mute = false;
        $scope.soundIcon = './img/sound.png';
    }

    BCPlayer.$on('login', function() {
        $scope.playSound('introSound');
    });

    $rootScope.$on('new notification', function(event, data) {
        if (data.type === 'socket_disconnected') {
            $scope.autospin = false;
        }
    });

    $scope.playSound = function(soundID) {
        //console.log('playSound:', soundID);
        LowLagSounds.play(soundID);
    };

    var initialized = false;
    $scope.$watch('player', function() {
        if(!initialized && $scope.player){
            // give it extra time to load the animation
            setTimeout(function() {
                $scope.$apply(function() {
                    controller.getNextGame();
                });
            },1000);
            initialized = true;
        }
    });

    BCPlayer.$on('deposit', function() {
        $scope.playSound('depositSound');
    });
    BCPlayer.$on('user update', function(event, newPlayerData) {
        $scope.player = newPlayerData;
    });

    $scope.$on('player game added', function(event, newGame) {
        $scope.$apply(function() {
            newGame.profit = newGame.winnings;
            $scope.lastResult = newGame;
        });
    });

    $scope.animateMessage = function() {
        $scope.animateCount++;
        var animateCount = 2;

        $("#spinmessage").animate({
            opacity: 0.1,
        }, 400, function() {
            $("#spinmessage").animate({
                opacity: 1,
            }, 400, function() {
                if ($scope.animateCount > animateCount) {
                    $scope.animateCount = 0;
                } else {
                    $scope.animateMessage();
                }
            });
        });
    };
    $scope.$on('visibilityChanged', function() {
        if (document.hidden) {
            $scope.autospin = false;
        }
    });
    
    $scope.clearError = function() {
        $scope.serverMsg = false;
        $scope.minbetMsg = false;
        $scope.minconfErr = false;
        $scope.withdrawErr = false;
        $scope.maxBetErr = false;
        $scope.serverErr = false;
    };

    $scope.soundToggle = function() {
        if ($scope.muted === true) {
            LowLagSounds.unmute();
            $scope.muted = false;
            $scope.soundIcon = './img/sound.png';
            $cookies.muted = "";
        } else {
            LowLagSounds.mute();
            $scope.muted = true;
            $scope.soundIcon = './img/sound-mute.png';
            $cookies.muted = "1";
        }
    };
}

BaseGameController.prototype.isGameInProgress = function() {
    return this.$rootScope.BCSession.isGameInProgress;
};

BaseGameController.prototype.setGameInProgress = function(isGameInProgress) {
    this.$rootScope.BCSession.isGameInProgress = isGameInProgress;
    this.$scope.isGameInProgress = isGameInProgress;
    if(isGameInProgress === undefined || isGameInProgress === true){
        this.$rootScope.BCSession.isGameInProgress = true;
        this.$scope.isGameInProgress = true;
        this.$rootScope.$broadcast(this.globalGameInProgressEventName);
    }else{
        this.$rootScope.$broadcast(this.globalGameFinishEventName);
    }
};

BaseGameController.prototype.getClientSeed = function() {
    var clientSeedMax = 9999999999;
    var clientSeedMin = 1000000000;

    return Math.floor(Math.random() * (clientSeedMax - clientSeedMin + 1) + clientSeedMin);
};

BaseGameController.prototype.getWager = function() {
    return parseInt(this.$scope.btcWager, 10);
};

BaseGameController.prototype.getNewGameParams = function () {
    var game = {
        player_id: this.$scope.player._id,
        wager: this.$scope.btcWager,
        game_id: this.$scope.nextGameId,
        client_seed: this.$scope.gameData.client_seed
    };
    return game;
};

BaseGameController.prototype.getNextGameParams = function () {
    return {game: 0};
};

BaseGameController.prototype.isExceedMaxWager = function(wager) {
    if (wager !== 0 && wager > this.$scope.player.balance.btc) {
        this.$scope.maxBetErr = true;
        return true;
    }
    return false;
};

BaseGameController.prototype.isLessMinWager = function(wager) {
    if (wager < 100 && wager !== 0) {
        this.$scope.minbetMsg = true;
        return true;
    }
    return false;
};

BaseGameController.prototype.checkWagerLimit = function(wager) {
    var isValidWager = !this.isExceedMaxWager(wager) && !this.isLessMinWager(wager);
    return isValidWager;
};

BaseGameController.prototype.getNextGame = function() {
    var self = this;
    self.Game.nextGame(self.getNextGameParams(), self.getNextGame_OnSuccess.bind(self), self.getNextGame_OnFail.bind(self));
};

BaseGameController.prototype.getNextGame_OnStart = function() {
    clearTimeout(this.$scope.nextTimeout);
};

BaseGameController.prototype.getNextGame_OnSuccess = function(nextGame) {
    this.$scope.clearError();
    this.$scope.gameRetry = false;
    this.$scope.gameData.game = 0;
    this.$scope.clientSeedValue = this.getClientSeed.call(this);
    this.$scope.gameData.client_seed = this.$scope.isResetSeed ? this.$scope.clientSeedValue : this.$scope.gameData.client_seed;
    this.$scope.nextGameId = nextGame.nextGameId;
    this.$scope.sha256 = nextGame.sha256;
    this.setGameInProgress(false);
};

BaseGameController.prototype.getNextGame_OnFail = function() {
    var self = this;
    this.$scope.serverMsg = true;
    if(!this.$scope.gameRetry) {
        this.$scope.gameRetry = true;
        this.$scope.nextTimeout = setTimeout(function() {
            self.$scope.$apply(function() {
                clearTimeout(self.$scope.nextTimeout);
                self.getNextGame();
            });
        }, 5000);
    }

};

BaseGameController.prototype.startGame = function() {
    this.$scope.clearError();
    if (this.isGameInProgress()) {
        return false;
    }
    if (!this.checkWagerLimit(this.getWager())){
        return false;
    }
    this.newGame_OnStart();
    this.$scope.gameRetry = false;
    this.newGameRequest();
};

BaseGameController.prototype.newGameRequest = function() {
    var self = this;
    this.Game.newGame(this.getNewGameParams(), function(response){
        self.newGame_OnSuccess(response);
    }, function(response){
        self.newGame_OnFail(response);
    });
};

BaseGameController.prototype.newGame_OnStart = function() {
    this.setGameInProgress(true);
    this.$scope.resultMultiplier = null;
    this.$scope.resultProfit = null;
    this.clearLastResult();
    if (!this.$scope.initedSound) {
        this.$scope.playSound('blankSound');
        this.$scope.initedSound = true;
    }
};

BaseGameController.prototype.newGame_OnSuccess = function(data) {
    googleanalytics('send', 'event', this.gameName, 'game', 'spin', data.wager);
    this.filterResult(data);
};

BaseGameController.prototype.newGame_OnFail = function(error) {
    var self = this;
    if (error.data.localeCode === "172") {
        this.$scope.maxBetErr = true;
        this.$scope.animateMessage();
        setTimeout(function(){
            self.$scope.$apply(function() {
                self.getNextGame();
            });
        }, 2000);
        return;
    }
    if (error.data.localeCode === "032") {
        this.$scope.serverErr = true;
    }

    if(!this.$scope.gameRetry){
        this.$scope.gameRetry = true;
        setTimeout(function() {
            self.$scope.$apply(function() {
                self.newGameRequest();
            });
        }, 2000);
    }else{
        self.getNextGame();
    }
};

BaseGameController.prototype.filterResult = function(data) {
    this.$scope.lastResultTmp = data;
    this.$cookies.btcWager = this.getWager()+"";
};

BaseGameController.prototype.getLastResult = function() {
    return this.$scope.lastResult;
};

BaseGameController.prototype.getResultProfit = function() {
    if(this.getLastResult() === null || this.getLastResult() === undefined){
        return 0;
    }
    return this.getLastResult().winnings;
};

BaseGameController.prototype.getResultWager = function() {
    if(this.getLastResult() === null || this.getLastResult() === undefined){
        return 0;
    }
    return this.getLastResult().wager;
};

BaseGameController.prototype.processWin = function(callback){
    var self = this;
    var $scope = this.$scope;
    this.$scope.lastResult = this.$scope.lastResultTmp;
    this.$scope.lastResultTmp = {};
    var multiplier = this.getResultMultiplier();
    if (multiplier < 1) {
        $scope.resultMultiplier = null;
        $scope.resultProfit = null;
        if(callback){
            callback();
        }
    } else {
        $scope.resultMultiplier = multiplier;
        $scope.resultProfit = self.getResultProfit();
        $scope.animateMessage();
        this.playWinSounds(multiplier);
        if(callback){
            callback();
        }
    }
};

BaseGameController.prototype.getResultMultiplier = function() {
    var profit = this.getResultProfit(), wager = this.getResultWager();
    if(!profit || profit === 0 || !wager || wager ===0){
        return 0;
    }
    var multiplier = parseFloat(profit/wager);
    return multiplier;
};

BaseGameController.prototype.clearLastResult = function() {
    this.$scope.lastResult = null;
};

BaseGameController.prototype.spinMessageTimer = function() {
    var messageTimer = 3000;
    return messageTimer;
};

BaseGameController.prototype.playWinSounds = function(multiplier) {
    // play the sounds

    var self = this;
    if (multiplier <= 2) {
        self.$scope.playSound('winSound');
    } else if (multiplier < 25) {

       self.$scope.playSound('bigWinSound');
    } else  {

        self.$scope.playSound('hugeWinSound');

    }

};

BaseGameController.prototype.finishGame = function() {
    this.getNextGame();
    this.processWin(this.autospin.bind(this));
};

BaseGameController.prototype.autospin = function() {
    var self = this;
    if(self.$scope.autospin) {
        self.$scope.autobetTimer = setTimeout(function(){
            self.$scope.$apply(function() {
                self.startGame();
            });
        }, self.$scope.timer);
    }
};
