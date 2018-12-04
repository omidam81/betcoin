'use strict';

var PlayerGameController = function($scope, $routeParams, PlayerInfo) {
    $scope.playerId = $routeParams.playerId;
    console.log($scope.playerId);
    $scope.timeline = [];
    $scope.accountData = null;
    $scope.playerStats = null;
    $scope.expandedTimeline = false;

    $scope.loadingPlayerData = false;
    $scope.loadingTimeline = false;

    $scope.loadPlayerTimeline = function(playerId) {
        if (playerId !== undefined) {
            $scope.playerId = playerId;
        }
        $scope.timeline = [];
        if ($scope.playerId === "") {
            return;
        }
        $scope.loadingTimeline = true;
        var query = {id: $scope.playerId, expanded: $scope.expandedTimeline || undefined};
        $scope.timeline = PlayerInfo.timeline(query, function() {
            $scope.loadingTimeline = false;
        });
    };

    $scope.loadPlayer = function(playerId) {
        if (playerId !== undefined) {
            $scope.playerId = playerId;
        }
        $scope.accountData = null;
        $scope.playerStats = null;
        if ($scope.playerId === "") {
            return;
        }
        $scope.loadingPlayerData = true;
        var query = {id: $scope.playerId};
        PlayerInfo.query(query, function(data) {
            $scope.accountData = data[0];
            $scope.playerStats = data[1];
            $scope.loadingPlayerData = false;
        });
    };

    $scope.$watch('expandedTimeline', function() {
        $scope.loadPlayerTimeline();
    });

    $scope.getTimelineClass = function(type) {
        if (type === 'withdrawal') {
            return 'danger';
        } else if (type === 'deposit') {
            return 'success';
        } else {
            return '';
        }
    };

    $scope.loadPlayer();
    $scope.loadPlayerTimeline();
};

Application.Controllers.controller('PlayerGameController', ['$scope', '$routeParams', 'PlayerInfo', PlayerGameController]);
