'use strict';

var IPHistoryController = function($scope, $routeParams, PlayerStats) {
    $scope.playerId = $routeParams.playerId;
    $scope.ips = PlayerStats.getIPHistory({target:$scope.playerId});
};

Application.Controllers.controller('IPHistoryController', ['$scope', '$routeParams', 'PlayerStats', IPHistoryController]);