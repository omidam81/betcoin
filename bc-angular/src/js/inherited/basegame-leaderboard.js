'use strict';

/* exported BaseGameLeaderboardController */

var BaseGameLeaderboardController = function($scope, GameResource) {
    $scope.loadTable = function() {
        $scope.loadingLeaderboard = true;
        $scope.leaderboard = GameResource.leaderboard({}, function() {
            $scope.loadingLeaderboard = false;
        });
    };

    $scope.loadTable();
};
