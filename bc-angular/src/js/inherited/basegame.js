'use strict';

/* exported BaseGameController */

function BaseGameController($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory) {
    var controller = this;
    var maintenance_mode = "<%= maintenance %>";
    if(maintenance_mode === "true"){
        $rootScope.maintenance_mode = true;
    }
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$filter = $scope;
    this.Sounds = LowLagSounds;
    this.$cookies = $cookies;
    this.$location = $location;
    this.BCPlayer = BCPlayer;
    this.$scope.BCSession = BCPlayer.BCSession;
    this.VisibilityFactory = VisibilityFactory;
    this.globalGameStartEventName = 'game in progress';
    this.globalGameFinishEventName = 'game finished';
    this.finishGameDelay = 0;
    this.getNextGameDelay = 0;

    this.$scope.wagersCount = 0;


    $scope.btcWager = 0;
    if ($cookies.btcWager) {
        $scope.btcWager = parseInt($cookies.btcWager, 10) || 0;
    }

    VisibilityFactory.isPageVisible();
    this.setGameInProgress(false);
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
    $rootScope.BCSession.inGameView = true;

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
    // BCPlayer.$on('user update', function(event, newPlayerData) {
    //     $scope.player = newPlayerData;
    // });
    BCPlayer.$on('valid wallet', function(event, user){
        $scope.player = user;
    });

    $scope.$on('player game added', function(event, newGame) {
        $scope.$apply(function() {
            newGame.profit = newGame.winnings;
            $scope.lastResult = newGame;
        });
    });

    $scope.$on('balance update', function(event, newbalance){
        $scope.currentBalance = newbalance;
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
        $scope.error = null;
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

    if(this.$scope.ShowModalOnnext){
        this.$scope.ShowModalOnnext = false;
        this.$scope.autospin = false;
        $("#emailnotverify").modal('show');

    }
    if(isGameInProgress === undefined || isGameInProgress === true && this.$rootScope.BCSession.user.pendingEmail){
        //console.log(this.$scope.wagersCount);

        if(this.$scope.wagersCount > 0 && this.$scope.wagersCount <= 90) {
            if(this.$scope.wagersCount % 30 === 0){
                //show modal
                this.$scope.ShowModalOnnext = true;
            }
        } else if (this.$scope.wagersCount > 90 && this.$scope.wagersCount < 200) {
            if(this.$scope.wagersCount % 10 === 0){
                //show modal
                this.$scope.ShowModalOnnext = true;
            }
        } else if (this.$scope.wagersCount >= 200) {
                this.$scope.ShowModalOnnext = true;
        }
    }


    this.$rootScope.BCSession.isGameInProgress = isGameInProgress;
    window.isGameInProgress = this.$scope.isGameInProgress = isGameInProgress;
    if(isGameInProgress === undefined || isGameInProgress === true){
        this.$rootScope.BCSession.isGameInProgress = true;
        this.$scope.isGameInProgress = true;
        window.isGameInProgress = true;
        this.$rootScope.$broadcast(this.globalGameInProgressEventName);
    }else{
        this.$rootScope.$broadcast(this.globalGameFinishEventName);
        window.isGameInProgress = false;
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

BaseGameController.prototype.getBalance = function() {
    if(!this.$rootScope.BCSession.user.wallets){
        return 0;
    }
    return this.$rootScope.BCSession.user.wallets[this.$rootScope.BCSession.currency].balance;
};

BaseGameController.prototype.getNewGameParams = function () {
    var game = {
        player_id: this.$scope.player._id,
        wager: this.$scope.btcWager,
        id: this.$scope.nextGameId,
        gameId: this.$scope.nextGameId,
        client_seed: this.$scope.gameData.client_seed
    };
    return game;
};

BaseGameController.prototype.getNextGameParams = function () {
    return {game: 0};
};

BaseGameController.prototype.isExceedMaxWager = function(wager) {
    if (wager !== 0 && wager > this.$rootScope.BCSession.user.wallets[this.$rootScope.BCSession.currency].balance) {
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

BaseGameController.prototype.getNextGame = function(callback) {
    var self = this;
    self.Game.nextGame(self.getNextGameParams(), function(nextGame){
        self.getNextGame_OnSuccess(nextGame, callback);
    }, self.getNextGame_OnFail.bind(self));
};

BaseGameController.prototype.getNextGame_OnStart = function() {
    clearTimeout(this.$scope.nextTimeout);
};

BaseGameController.prototype.getNextGame_OnSuccess = function(nextGame, callback) {
    this.$scope.clearError();
    this.$scope.gameRetry = false;
    this.$scope.gameData.game = 0;
    this.$scope.clientSeedValue = this.getClientSeed.call(this);
    this.$scope.gameData.client_seed = this.$scope.isResetSeed ? this.$scope.clientSeedValue : this.$scope.gameData.client_seed;
    this.$scope.nextGameId = nextGame.nextGameId;
    this.$scope.sha256 = nextGame.sha256;
    this.setGameInProgress(false);
    if(callback){
        callback();
    }
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
    if(this.getWager() === this.getBalance()){
        if(this.getWager() > 0){
            // removed Jan 10 2015 Wayne
            // if(!window.confirm($('#confirm_max_wager').text())){
            //     return;
            // }
        }
    }
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
    try{
        if(this.$scope.currentGame){
            this.$scope.currentGame.gameId = data.gameId||data._id||data.game_id;
        }
    }catch(ex){
    }
    this.$scope.wagersCount = data.wagerCount;
    this.filterResult(data);
};

BaseGameController.prototype.newGame_OnFail = function(error) {
    var self = this;
    // if (error.data.localeCode === "172") {
    //     this.$scope.maxBetErr = true;
    //     this.$scope.animateMessage();
    //     setTimeout(function(){
    //         self.$scope.$apply(function() {
    //             self.getNextGame();
    //         });
    //     }, 2000);
    //     return;
    // }
    // if (error.data.localeCode === "032") {
    //     this.$scope.serverErr = true;
    // }
    this.$scope.error = error.data;
    // if(error){
    //     this.$scope.animateMessage();
    //     setTimeout(function(){
    //         self.$scope.$apply(function() {
    //             self.getNextGame();
    //         });
    //     }, 2000);
    //     return;
    // }

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
    var self = this;
    this.processWin(function(){
        self.getNextGame(function(){
            self.autospin();
        });
    });
    if(this.$scope.currentBalance){
        this.$rootScope.BCSession.user.wallets[this.$scope.currentBalance.currency].balance = this.$scope.currentBalance.balance;
        this.BCPlayer.$emit('game finished', this.$rootScope.BCSession.user);
    }
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
