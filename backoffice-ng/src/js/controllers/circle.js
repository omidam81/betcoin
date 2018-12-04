'use strict';

var CircleController = function($scope, $location, PlayerInfo) {
    $scope.recentPlayers = PlayerInfo.query({pageSize: 20}, function() {
        $scope.loadingList = false;
    });

    $scope.loadPlayer = function(playerId) {
        if (playerId === undefined) {
            playerId = $scope.playerId;
        }
        $location.path('/player/circle/' + playerId);
    };
};

Application.Controllers.controller('CircleController', ['$scope', '$location', 'PlayerInfo', CircleController]);
