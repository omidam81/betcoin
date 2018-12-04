'use strict';

/* global Application */

Application.Controllers.controller('SportCtrl', ['$scope', '$routeParams', 'GameService', function ($scope, $routeParams, GameService) {
    window.scrollTo(0,0);

    $scope.isLoading = true;

    GameService.doQuery([
        {name: "sportData", params: {sportSlug: $routeParams.sport }},
        {name: "hottestEvents", params: {sportSlug: $routeParams.sport }},
        {name: "upcomingEvents", params: {sportSlug: $routeParams.sport }},
        {name: "spotlightLeague", params: {sportSlug: $routeParams.sport }}
    ], function (obj) {
        if (obj.status === "success") {
            $scope.sport = obj.data.sportData;
            $scope.hottestEvents = obj.data.hottestEvents;
            $scope.upcomingEvents = obj.data.upcomingEvents;
            $scope.spotlightLeague = obj.data.spotlightLeague;

            $scope.isLoading = false;
        } else {
            //@TODO display error message or maybe retry?
        }
    });

    $scope.sport = null;
    $scope.hottestEvents = null;
    $scope.upcomingEvents = null;
    $scope.spotlightLeague = null;
}]);

