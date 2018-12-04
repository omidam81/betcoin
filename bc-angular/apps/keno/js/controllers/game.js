'use strict';

/* global BaseGameController, _ */

var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var self = this;
    self.gameName = 'keno';
    self.Game = Game;

    GameController.super_.apply(self, arguments);

    self.animationInterval = 500;
    self.maxBets = 8;
    self.betCountMatchesMap = {
        "1": {
            "0": 0,
            "1": 3
        },
        "2": {
            "0": 0,
            "1": 0,
            "2": 12
        },
        "3": {
            "0": 0,
            "1": 0,
            "2": 1,
            "3": 42
        },
        "4": {
            "0": 0,
            "1": 0,
            "2": 1,
            "3": 3,
            "4": 130
        },
        "5": {
            "0": 0,
            "1": 0,
            "2": 0,
            "3": 1,
            "4": 15,
            "5": 700
        },
        "6": {
            "0": 0,
            "1": 0,
            "2": 0,
            "3": 1,
            "4": 2,
            "5": 85,
            "6": 2000
        },
        "7": {
            "0": 0,
            "1": 0,
            "2": 0,
            "3": 0,
            "4": 2,
            "5": 30,
            "6": 300,
            "7": 5000
        },
        "8": {
            "0": 0,
            "1": 0,
            "2": 0,
            "3": 0,
            "4": 0,
            "5": 5,
            "6": 100,
            "7": 1500,
            "8": 30000
        }
    };

    $scope.numberRange = [
        1,2,3,4,5,6,7,8,9,10,
        11,12,13,14,15,16,17,18,19,20,
        21,22,23,24,25,26,27,28,29,30,
        31,32,33,34,35,36,37,38,39,40,
        41,42,43,44,45,46,47,48,49,50,
        51,52,53,54,55,56,57,58,59,60,
        61,62,63,64,65,66,67,68,69,70,
        71,72,73,74,75,76,77,78,79,80
    ];

    $scope.bets = [];
    $scope.drawn = [];
    $scope.matchCount = false;

    self.getNewGameParams = function() {
        var params = GameController.super_.prototype.getNewGameParams.call(this);

        params.bets = $scope.bets;
        params.game = $scope.gameData.game;

        return params;
    };

    self.isExceedMaxWager = function() {
        if ($scope.btcWager !== 0 && $scope.btcWager > self.getBalance()) {
            $scope.maxBetErr = true;
            return true;
        }

        return false;
    };

    self.newGame_OnSuccess = function(response) {
        GameController.super_.prototype.newGame_OnSuccess.call(this, response);

        self.clearDraw(); // this is here to handle autospin cases

        $scope.playSound('spinSound');
        $scope.matchCount = 0;
        self.animateWin(response.result, function() {
            self.finishGame();
        });
    };

    self.playWinSounds = function() {
    };

    self.animateWin = function(result, callback) {
        if(result.length === 0) {
            callback();
        } else {
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.drawn.push(result[0]);
                    if ($scope.hasBet(result[0])) {
                        $scope.matchCount++;
                    }
                    result.shift();
                    self.animateWin(result, callback);
                });
            }, self.animationInterval);
        }
    };

    $scope.$watch('btcWager', function() {
        if(!$scope.player) {
            return;
        }

        if($scope.btcWager > self.getBalance()) {
            $scope.btcWager = self.getBalance();
        }
    });

    $scope.draw = function() {
        self.clearDraw();
        self.startGame();
    };

    $scope.clearBets = function() {
        if(self.isGameInProgress()) {
            return;
        }

        $scope.bets = [];
    };

    self.refreshOdds = function() {
        // map the count as an integer value instead of a string key for ordering
        $scope.odds = _.map(self.betCountMatchesMap[$scope.bets.length.toString()], function(value, key) { return { "odd":value, "count": parseInt(key) }; });
    };

    $scope.$watch("bets", function() {
        self.refreshOdds();
    }, true);

    $scope.hasBet = function(betNumber) {
        return $scope.bets.indexOf(parseInt(betNumber, 10)) !== -1;
    };

    $scope.wasDrawn = function(betNumber) {
        return $scope.drawn.indexOf(parseInt(betNumber,10)) !== -1;
    };

    $scope.addBet = function(betNumber, callback) {
        if($scope.bets.length === self.maxBets || self.isGameInProgress()) {
            return;
        }

        $scope.bets.push(parseInt(betNumber,10));
        self.clearDraw();
        callback();
    };

    $scope.removeBet = function(betNumber, callback) {
        if(self.isGameInProgress()) {
            return;
        }

        $scope.bets.splice($scope.bets.indexOf(parseInt(betNumber,10)), 1);
        self.clearDraw();
        callback();
    };

    self.clearDraw = function() {
        $scope.drawn = [];
        $scope.matchCount = false;
    };
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
