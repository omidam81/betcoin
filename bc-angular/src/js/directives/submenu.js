'use strict';

/* global Application */

Application.Directives.directive("bcSubmenu", function () {
    return {
        restrict: "AE",
        transclude: true,
        controller: ['$scope', '$rootScope','$routeParams', '$location', function($scope, $rootScope,$routeParams, $location) {
            $scope.isCurrentSport = $rootScope.isCurrentSport;
            $scope.isCurrentLeague = $rootScope.isCurrentLeague;

            $scope.isResponsiveHide = function() {
                return $location.path() !== "/home";
            };

        }],
        scope: true,
        templateUrl: "tpl/directives/submenu.html"
    };
});