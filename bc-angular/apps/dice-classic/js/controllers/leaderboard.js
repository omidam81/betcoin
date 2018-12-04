
'use strict';

/* global Application */

var LeaderboardController = function($scope, $routeParams, Dice) {
    $scope.leaderboardTab = $routeParams.type || 'global';
    $scope.getLeaderboardTabClass = function(tabName) {
        if (tabName === $scope.leaderboardTab) {
            return "active";
        } else {
            return "";
        }
    };
    $scope.$watch('leaderboardTab', function() {
        $scope.leaderboard = Dice.leaderboard({
            league: $scope.leaderboardTab
        });
    });
};

Application.Controllers.controller('LeaderboardController', ["$scope", "$routeParams", "Dice", LeaderboardController]);
