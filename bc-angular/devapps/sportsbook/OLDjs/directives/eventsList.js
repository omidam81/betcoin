'use strict';

/* global Application */

Application.Directives.directive("bcEventsList", function () {
    return {
        restrict: "AE",
        scope: {
            data: "=",
            columns: "="
        },
        controller: ["$scope", "$rootScope", function ($scope, $rootScope) {
            $scope.getSideOddValue = $rootScope.getSideOddValue;
            $scope.eventCanTie = $rootScope.eventCanTie;
            $scope.getSideParticipantName = $rootScope.getSideParticipantName;
        }],
        templateUrl: "tpl/directives/eventsList.html"
    };
});