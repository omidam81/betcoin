'use strict';

/* exported BaseGameDetailsController */

function BaseGameDetailsController($scope, $routeParams, $window, BCSession, BCPlayer, Game) {

    $scope.tableType = $routeParams.type || 'global';
    $scope.gameID = $routeParams.id || "";

    $scope.backToList = function() {
        $window.history.back();
    };

    $scope.loadingCircles = true;
    $scope.game = Game.get({id: $scope.gameID}, function() {
        $scope.loadingCircles = false;

        // in case we need to do some extra processin of the game result data
        $scope.$emit('gameResultLoaded');
    });
}
