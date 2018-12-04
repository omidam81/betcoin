'use strict';

var UnplayedPlayersController = function($scope, $routeParams, Games) {
    $scope.game = $routeParams.game;
    $scope.players = Games.getUnplayedGamePlayers({game:$scope.game});
};

Application.Controllers.controller('UnplayedPlayersController', ['$scope', '$routeParams', 'Games', UnplayedPlayersController]);