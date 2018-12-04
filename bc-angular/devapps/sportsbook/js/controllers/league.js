'use strict';

/* global Application */

Application.Controllers.controller('LeagueCtrl', ['$scope', '$routeParams', 'GameService', function ($scope, $routeParams, GameService) {
    window.scrollTo(0,0);

    $scope.isLoading = true;
    $scope.evenLeagueEvents = [];
    $scope.oddLeagueEvents = [];

    GameService.doQuery([
        {name: "leagueData", params: {leagueSlug: $routeParams.league }}
    ], function (obj) {
        if (obj.status === "success") {
            $scope.league = obj.data.leagueData.league;
            $scope.leagueEvents = obj.data.leagueData.events;

            $scope.isLoading = false;
        } else {
            //@TODO display error message or maybe retry?
        }
    });

    $scope.league = null;
    $scope.leagueEvents = null;
}]);
