'use strict';

/* exported BaseGameDetailsController */

function BaseGameDetailsController($scope, $routeParams, $window, BCSession, BCPlayer, Game) {
    this.$scope = $scope;
    this.Game = Game;

    $scope.tableType = $routeParams.type || 'global';
    $scope.gameID = $routeParams.id || "";

    $scope.backToList = function() {
        $window.history.back();
    };

    $scope.loadingCircles = true;
    $scope.game = this.loadGame();
}

BaseGameDetailsController.prototype.getLoadGameDetailsParams = function() {
    return {id: this.$scope.gameID};
};

BaseGameDetailsController.prototype.loadGame = function() {
    return this.Game.get(this.getLoadGameDetailsParams(), this.loadGame_OnSuccess.bind(this));
};

BaseGameDetailsController.prototype.loadGame_OnSuccess = function() {
    this.$scope.loadingCircles = false;

    // in case we need to do some extra processin of the game result data
    this.$scope.$emit('gameResultLoaded');
};