'use strict';

var LeaderboardController = function($scope, Game) {

    $scope.loadTable = function() {
        $scope.loadingLeaderboard = true;
        $scope.leaderboard = Game.leaderboard({}, function() {
            $scope.loadingLeaderboard = false;
        });
    };

    $scope.loadTable();

};

Application.Controllers.controller('LeaderboardController', ["$scope", "Game", LeaderboardController]);
