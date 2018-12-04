
/* global Application */

Application.Controllers.controller('HomeCtrl', ['$scope', '$rootScope', 'GameService', function ($scope, $rootScope, GameService) {
    window.scrollTo(0,0);

    GameService.doQuery([
        {name: "hottestEvents"},
        {name: "upcomingEvents"},
        {name: "latestWins"},
        {name: "spotlightSport"}
    ], function (obj) {
        if (obj.status === "success") {
            $scope.isLoading = false;

            $scope.hottestEvents = obj.data.hottestEvents;
            $scope.upcomingEvents = obj.data.upcomingEvents;
            $scope.latestWins = obj.data.latestWins;
            $scope.spotlightSport = obj.data.spotlightSport;
        } else {
            //@TODO display error message or maybe retry?
        }
    });

    $scope.isLoading = true;

    $scope.hottestEvents = [];
    $scope.upcomingEvents = [];
    $scope.spotlightSport = {};
    $scope.latestWins = [];
}]);