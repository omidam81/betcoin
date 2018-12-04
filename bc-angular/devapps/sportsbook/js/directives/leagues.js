'use strict';

/* global Application */

Application.Directives.directive("bcLeagues", function () {
    return {
        restrict: "AE",
        scope: {
        },
        controller: ["$scope", "$rootScope", "$routeParams", "GameService", function ($scope, $rootScope, $routeParams, GameService) {
            GameService.doQuery([
                {name: "sportData", params: {sportSlug: $routeParams.sport }}
            ], function (obj) {
                if (obj.status === "success") {
                    $scope.data = obj.data.sportData;

                    $scope.isLoading = false;
                } else {
                    //@TODO display error message or maybe retry?
                }
            });

            $scope.data = null;
            $scope.orderProp = "hotness";
            $scope.isCurrentLeague = $rootScope.isCurrentLeague;
        }],
        templateUrl: "tpl/directives/leagues.html"
    };
});