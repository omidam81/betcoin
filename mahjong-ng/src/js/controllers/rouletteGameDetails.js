'use strict';

/* global BaseGameDetailsController */

var mahjongGameDetailsController = function($scope, $routeParams, $window, BCSession, BCPlayer, Game) {
    mahjongGameDetailsController.super_.call(this, $scope, $routeParams, $window, BCSession, BCPlayer, Game);

    // use the result from the game data to access the x,y coords for
    // displaying the ball in a graphic of the wheel via absolute css positions
    $scope.$on('gameResultLoaded', function() {

        var resultXpos = [223,142,322,183,296,
                            214,339,125,272,
                            107,234,304,149,
                            327,118,262,175,
                            337,108,280,128,
                            311,105,253,194,
                            332,203,336,135,
                            114,289,110,243,
                            158,341,165,318
        ];

        var resultYpos = [100,300,153,105,124,
                            331,229,155,321,
                            230,331,298,124,
                            267,268,104,322,
                            190,190,112,286,
                            136,210,328,329,
                            170,99,248,137,
                            172,311,250,100,
                            312,209,112,284
        ];

        var result = $scope.game.result;

        $scope.game.resultXpos = resultXpos[result];
        $scope.game.resultYpos = resultYpos[result];

    });
};

angular.inherits(mahjongGameDetailsController, BaseGameDetailsController);
Application.Controllers.controller('mahjongGameDetailsController', ["$scope", "$routeParams", "$window", "BCSession", "BCPlayer", "Game", mahjongGameDetailsController]);

