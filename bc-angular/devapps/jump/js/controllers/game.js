'use strict';

/* global BaseGameController */

var GameController = function($rootScope, $scope, $window, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
    var gameController = this;
    this.gameName = 'jump';
    this.Game = Game;

    // GameController.super_.apply(this, arguments);
    GameController.super_.call(this, $rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game);

    $scope.recentnumbers = [];
    $scope.timer = 3000;
    $scope.animationsLoading = true;

    window.animationInitialized = false;

    $scope.boxSize = [
        {name:'2*3', index: 0},
        {name:'3*6', index: 1},
        {name:'4*9', index: 2},
        {name:'5*12', index: 3},
        {name:'6*15', index: 4}
    ];

    $scope.gameData = [
        [
            {show: 1, type: 1, className: 'row_1_2_3 cell_1_2_3'},
            {show: 1, type: 1, className: 'row_1_2_3 cell_2_2_3'},
            {show: 1, type: 1, className: 'row_1_2_3 cell_3_2_3'}
        ],
        [
            {show: 1, type: 1, className: 'row_2_2_3 cell_1_2_3'},
            {show: 1, type: 1, className: 'row_2_2_3 cell_2_2_3'},
            {show: 1, type: 1, className: 'row_2_2_3 cell_3_2_3'}
        ]

    ];

    $scope.selectedFieldSize = $scope.boxSize[0];

    $scope.selectBoxSize = function() {
        switch($scope.selectedFieldSize.index)
        {
            case 0:
                $scope.modifyGameData(2, 3);
                break;
            case 1:
                $scope.modifyGameData(3, 6);
                break;
            case 2:
                $scope.modifyGameData(4, 9);
                break;
            case 3:
                $scope.modifyGameData(5, 12);
                break;
            case 4:
                $scope.modifyGameData(6, 15);
                break;
            default:
                break;
        }

        //$scope.number_red = "<div id='num-1' class='number_2_3 red'></div>";
    };

    $scope.getClassName = function(nRow, nCol)
    {
        var className = '';

        switch(nRow)
        {
            case 0:
                switch($scope.selectedFieldSize.index)
                {
                    case 0:
                        className = className + 'row_1_2_3';
                        break;
                    case 1:
                        className = className + 'row_1_3_6';
                        break;
                    case 2:
                        className = className + 'row_1_4_9';
                        break;
                    case 3:
                        className = className + 'row_1_5_12';
                        break;
                    case 4:
                        className = className + 'row_1_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 1:
                switch($scope.selectedFieldSize.index)
                {
                    case 0:
                        className = className + 'row_2_2_3';
                        break;
                    case 1:
                        className = className + 'row_2_3_6';
                        break;
                    case 2:
                        className = className + 'row_2_4_9';
                        break;
                    case 3:
                        className = className + 'row_2_5_12';
                        break;
                    case 4:
                        className = className + 'row_2_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 2:
                switch($scope.selectedFieldSize.index)
                {
                    case 1:
                        className = className + 'row_3_3_6';
                        break;
                    case 2:
                        className = className + 'row_3_4_9';
                        break;
                    case 3:
                        className = className + 'row_3_5_12';
                        break;
                    case 4:
                        className = className + 'row_3_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 3:
                switch($scope.selectedFieldSize.index)
                {
                     case 2:
                        className = className + 'row_4_4_9';
                        break;
                    case 3:
                        className = className + 'row_4_5_12';
                        break;
                    case 4:
                        className = className + 'row_4_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 4:
                switch($scope.selectedFieldSize.index)
                {
                    case 3:
                        className = className + 'row_5_5_12';
                        break;
                    case 4:
                        className = className + 'row_5_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 5:
                switch($scope.selectedFieldSize.index)
                {
                    case 4:
                        className = className + 'row_6_6_15';
                        break;
                    default:
                        break;
                }
                break;
            default:
                break;
        }

        switch(nCol)
        {
            case 0:
                switch($scope.selectedFieldSize.index)
                {
                    case 0:
                        className = className + ' cell_1_2_3 number_2_3';
                        break;
                    case 1:
                        className = className + ' cell_1_3_6 number_2_3';
                        break;
                    case 2:
                        className = className + ' cell_1_4_9 number_2_3';
                        break;
                    case 3:
                        className = className + ' cell_1_5_12 number';
                        break;
                    case 4:
                        className = className + ' cell_1_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 1:
                switch($scope.selectedFieldSize.index)
                {
                    case 0:
                        className = className + ' cell_2_2_3 number_2_3';
                        break;
                    case 1:
                        className = className + ' cell_2_3_6 number_2_3';
                        break;
                    case 2:
                        className = className + ' cell_2_4_9 number_2_3';
                        break;
                    case 3:
                        className = className + ' cell_2_5_12 number';
                        break;
                    case 4:
                        className = className + ' cell_2_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 2:
                switch($scope.selectedFieldSize.index)
                {
                    case 0:
                        className = className + ' cell_3_2_3 number_2_3';
                        break;
                    case 1:
                        className = className + ' cell_3_3_6 number_2_3';
                        break;
                    case 2:
                        className = className + ' cell_3_4_9 number_2_3';
                        break;
                    case 3:
                        className = className + ' cell_3_5_12 number';
                        break;
                    case 4:
                        className = className + ' cell_3_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 3:
                switch($scope.selectedFieldSize.index)
                {
                    case 1:
                        className = className + ' cell_4_3_6 number_2_3';
                        break;
                    case 2:
                        className = className + ' cell_4_4_9 number_2_3';
                        break;
                    case 3:
                        className = className + ' cell_4_5_12 number';
                        break;
                    case 4:
                        className = className + ' cell_4_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 4:
                switch($scope.selectedFieldSize.index)
                {
                     case 1:
                        className = className + ' cell_5_3_6 number_2_3';
                        break;
                    case 2:
                        className = className + ' cell_5_4_9 number_2_3';
                        break;
                    case 3:
                        className = className + ' cell_5_5_12 number';
                        break;
                    case 4:
                        className = className + ' cell_5_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 5:
                switch($scope.selectedFieldSize.index)
                {
                   case 1:
                        className = className + ' cell_6_3_6 number_2_3';
                        break;
                    case 2:
                        className = className + ' cell_6_4_9 number_2_3';
                        break;
                    case 3:
                        className = className + ' cell_6_5_12 number';
                        break;
                    case 4:
                        className = className + ' cell_6_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 6:
                switch($scope.selectedFieldSize.index)
                {
                    case 2:
                        className = className + ' cell_7_4_9 number_2_3';
                        break;
                    case 3:
                        className = className + ' cell_7_5_12 number';
                        break;
                    case 4:
                        className = className + ' cell_7_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 7:
                switch($scope.selectedFieldSize.index)
                {
                    case 2:
                        className = className + ' cell_8_4_9 number_2_3';
                        break;
                    case 3:
                        className = className + ' cell_8_5_12 number';
                        break;
                    case 4:
                        className = className + ' cell_8_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 8:
                switch($scope.selectedFieldSize.index)
                {
                    case 2:
                        className = className + ' cell_9_4_9 number_2_3';
                        break;
                    case 3:
                        className = className + ' cell_9_5_12 number';
                        break;
                    case 4:
                        className = className + ' cell_9_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 9:
                switch($scope.selectedFieldSize.index)
                {
                    case 3:
                        className = className + ' cell_10_5_12 number';
                        break;
                    case 4:
                        className = className + ' cell_10_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 10:
                switch($scope.selectedFieldSize.index)
                {
                    case 3:
                        className = className + ' cell_11_5_12 number';
                        break;
                    case 4:
                        className = className + ' cell_11_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 11:
                switch($scope.selectedFieldSize.index)
                {
                    case 3:
                        className = className + ' cell_12_5_12 number';
                        break;
                    case 4:
                        className = className + ' cell_12_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 12:
                switch($scope.selectedFieldSize.index)
                {
                    case 4:
                        className = className + ' cell_13_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 13:
                switch($scope.selectedFieldSize.index)
                {
                    case 4:
                        className = className + ' cell_14_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;
            case 14:
                switch($scope.selectedFieldSize.index)
                {
                    case 4:
                        className = className + ' cell_15_6_15 number_6_15';
                        break;
                    default:
                        break;

                }
                break;


        }
        return className;
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


    $scope.modifyGameData = function(nRows, nCols)
    {
        $scope.gameData = [];
        var cell = [];

        for(var nCountRow = 0 ; nCountRow < nRows ; nCountRow ++)
        {
            cell = [];
            for(var nCountCol = 0 ; nCountCol < nCols ; nCountCol ++)
            {
                cell.push({show: 1, type: 1});
            }

            $scope.gameData.push(cell);
        }

    };

    $scope.play = function() {
        gameController.startGame();
    };



    $scope.gameCompleted = function() {
        gameController.finishGame(true);
    };





    $scope.nextAction = function(res) {
        console.log(res);
        //hard code these for now
        res.rows = 4;
        res.columns = 8;



    };
    // this doesn't work
    // GameController.directive("addbuttonsbutton", function() {
    //     return {
    //         restrict: "E",
    //         template: "<button addbuttons> Click to add buttons</button>"
    //     };
    // });
};


angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$window', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
