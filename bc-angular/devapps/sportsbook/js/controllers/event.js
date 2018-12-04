'use strict';

/* global Application */

Application.Controllers.controller('EventCtrl', ['$scope', '$routeParams', 'GameService', function ($scope, $routeParams, GameService) {
    window.scrollTo(0,0);

    $scope.isLoading = true;

    $scope.betValues ={};

    GameService.doQuery([
        {name: "eventData", params: {eventId: $routeParams.event}}
    ], function (obj) {
        if (obj.status === "success") {
            $scope.event = obj.data.eventData;

            $scope.isLoading = false;
        } else {
            //@TODO display error message or maybe retry?
        }
    });

    $scope.event = null;
}]);
