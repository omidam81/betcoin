'use strict';

/* global BaseGameController */

var GameController = function($rootScope, $scope, $window, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var gameController = this;
    this.gameName = 'minesweeper';
    this.Game = Game;

    // GameController.super_.apply(this, arguments);
    GameController.super_.call(this, $rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game);

    $scope.recentnumbers = [];
    $scope.timer = 3000;
    $scope.animationsLoading = true;
    

    window.animationInitialized = false;



    $scope.isPlaying = 0;
    $scope.currentPlayRow = 0;
    $scope.minePos = [];


    $scope.boxSize = [
        {name:'2*3', index: 0, nRows: 2, nCols: 3},
        {name:'3*6', index: 1, nRows: 3, nCols: 6},
        {name:'4*9', index: 2, nRows: 4, nCols: 9},
        {name:'5*12', index: 3, nRows: 5, nCols: 12},
        {name:'6*15', index: 4, nRows: 6, nCols: 15}
    ];

    $scope.gameData = [
        {
            "rows":[
                {show: 1, type: 1, className: 'brick'},
                {show: 1, type: 1, className: 'brick'}
            ],
            "magnification": 1.92,
            "className": "brick-group"
        },
        {
            "rows":[
                {show: 1, type: 1, className: 'brick'},
                {show: 1, type: 1, className: 'brick'}
            ],
            "magnification": 3.84,
            "className": "brick-group"
        },
        {
            "rows":[
                {show: 1, type: 1, className: 'brick'},
                {show: 1, type: 1, className: 'brick'}
            ],
            "magnification": 7.52,
            "className": "brick-group"
        }
    ];


    $scope.Magnification = [
        [1.92, 3.84, 7.52],
        [1.47, 2.16, 3.17, 4.66, 6.83, 10.02],
        [1.31, 1.71, 2.23, 2.91, 3.79, 4.94, 6.44, 8.39, 10.92],
        [1.23, 1.5, 1.84, 2.25, 2.75, 3.36, 4.1, 5.01, 6.11, 7.45, 9.08, 11.06],
        [1.18, 1.38, 1.62, 1.91, 2.24, 2.63, 3.08, 3.61, 4.23, 4.95, 5.8, 6.78, 7.92, 9.24, 10.78]
    ];

    $scope.selectedFieldSize = $scope.boxSize[0];

    $scope.modifyGameData = function(nRows, nCols)
    {
        $scope.gameData = [];
        var cell = [];
        var tmpMagnification = 0;

        for(var nCountRow = 0 ; nCountRow < nRows ; nCountRow ++)
        {
            cell = [];
            for(var nCountCol = 0 ; nCountCol < nCols ; nCountCol ++)
            {
                cell.push({show: 1, type: 1, className:$scope.getClassName(false)});
                tmpMagnification = $scope.Magnification[$scope.selectedFieldSize.index][nCountRow];
            }
            
            $scope.gameData.push({"rows" : cell, "magnification": tmpMagnification, "className": "brick-group"});
        }

    };

    $scope.selectBoxSize = function() {
        $scope.modifyGameData($scope.selectedFieldSize.nCols, $scope.selectedFieldSize.nRows);
    };

    $scope.getClassName = function(bSelected)
    {
        var className = '';

        switch($scope.selectedFieldSize.index)
        {
            case 0:
            case 1:
            case 2:
                if(bSelected)
                {
                    className = 'brick activerow';
                }
                else
                {
                    className = 'brick';
                }
                break;
            case 3:
                if(bSelected)
                {
                    className = 'brick middle activerow';
                }
                else
                {
                    className = 'brick middle';
                }
                break;
            case 4:
                if(bSelected)
                {
                    className = 'brick small activerow';
                }
                else
                {
                    className = 'brick small';
                }
                break;
        }
        return className;
    };

    $scope.randomCreateMine = function()
    {
        var nRow = $scope.gameData[0].rows.length;
        var nCol = $scope.gameData.length;
        for(var nCount = 0 ; nCount < nCol ; nCount ++)
        {
            $scope.minePos.push(Math.floor(Math.random() * nRow));
        }

        console.log($scope.minePos);
    };

    $scope.checkMine = function(nColIndex, nParentIndex)
    {
        //console.log(nColIndex);
        //console.log(nParentIndex);
        if($scope.isPlaying === 0)
        {
            return;
        }
        if(nParentIndex !== $scope.currentPlayRow)
        {
            return;
        }
        if(nColIndex !== $scope.minePos[nParentIndex])
        {
            angular.forEach($scope.gameData[$scope.currentPlayRow].rows, function(value, key) {
                console.log($scope.getClassName(true));
                if(key === nColIndex)
                {
                    value.className = $scope.getClassName(false) + ' step';
                }
                else if(key === $scope.minePos[nParentIndex])
                {
                    value.className = $scope.getClassName(false) + ' bomb';
                }
                else
                {
                    value.className = $scope.getClassName(false) + ' open';
                }
            });
            $scope.currentPlayRow ++;

            angular.forEach($scope.gameData[$scope.currentPlayRow].rows, function(value) {
                value.className = $scope.getClassName(true);
            });

        }
        else
        {
            angular.forEach($scope.gameData, function(value, key) {
                //if(key < $scope.currentPlayRow) { continue; }
                angular.forEach(value.rows, function(value1, key1) {
                    if(key1 === $scope.minePos[key])
                    {
                        value1.className = $scope.getClassName(false) + ' bomb';
                    }
                    else
                    {
                        value1.className = $scope.getClassName(false) + ' open';
                    }
                });
            });
        }

    };


    gameController.newGame_OnSuccess = function(response) {
        GameController.super_.prototype.newGame_OnSuccess.call(this, response);

        $scope.playSound('spinSound');
        $scope.nextAction(response);
    };

    gameController.playWinSounds = function(multiplier) {
        if (multiplier >= 2 && multiplier < 3) {
            $scope.playSound('winSound');
        } else if (multiplier >= 3 && multiplier <= 10) {
            $scope.playSound('bigWinSound');
        } else if (multiplier > 10) {
            $scope.playSound('hugeWinSound');
        }
    };


    $scope.animateWinCount = 0;

    $scope.longPressTimeout = setTimeout(function() {
                                         // nothing
                                         }, 1);



    $scope.play = function() {
        $scope.isPlaying = 1;
        $scope.currentPlayRow = 0;
        angular.forEach($scope.gameData[$scope.currentPlayRow].rows, function(value, key) {
            console.log($scope.getClassName(true));
            value.className = $scope.getClassName(true);
            console.log(key);
        });
        //$scope.gameData[$scope.currentPlayRow].rows.className = 'brick activerow';
        $scope.randomCreateMine();
        gameController.startGame();
    };



    $scope.gameCompleted = function() {
        gameController.finishGame(true);
    };





    $scope.nextAction = function(res) {
        console.log("res = " + res);
        //hard code these for now
        res.rows = 4;
        res.columns = 8;



    };

};


angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$window', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
