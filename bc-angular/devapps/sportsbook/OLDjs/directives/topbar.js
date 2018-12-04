'use strict';

/* global Application */

Application.Directives.directive("bcTopbar", function () {
    return {
        restrict: "AE",
        transclude: true,
        controller: ['$scope', '$routeParams', '$location', 'GameService', function($scope, $routeParams, $location, GameService) {
            var getSportPath = function() {
                if($scope.isLoading) {
                    return "sports/"+$routeParams.sport;
                }

                return "sports/"+$scope.dropdownSport.slug;
            };

            var getLeaguePath = function() {
                if($scope.isLoading) {
                    return "sports/"+$routeParams.sport+"/leagues/"+$routeParams.league;
                }

                return "sports/"+$scope.dropdownSport.slug+"/leagues/"+$scope.dropdownLeague.slug;
            };

            var reparseRouteParams = function() {
                $scope.dropdownSport = getSportFromRouteParams();
                $scope.dropdownLeague = getLeagueFromRouteParams();
            };

            var getSportFromRouteParams = function() {
                if(!$routeParams.sport) {
                    return null;
                }

                var sport=null;

                for(var i =0; i<$scope.olympiaSports.length; i++) {
                    if($scope.olympiaSports[i].slug === $routeParams.sport) {
                        sport = $scope.olympiaSports[i];
                    }
                }

                return sport;
            };

            var getLeagueFromRouteParams = function() {
                if(!$routeParams.league) {
                    return null;
                }

                var sport = getSportFromRouteParams();

                if(!sport) {
                    return null;
                }

                var league=null;

                for(var i =0; i< sport.sportsLeagues.length; i++) {
                   if(sport.sportsLeagues[i].slug === $routeParams.league) {
                        league = sport.sportsLeagues[i];
                    }
                }

                return league;
            };

            $scope.isLoading = true;

            $scope.olympiaSports = [{name: "Loading sports..." }]; //@TODO: i18n
            $scope.sportLeagues = [{name: "Loading leagues..." }]; //@TODO: i18n
            $scope.dropdownSport= $scope.olympiaSports[0]; // display the loading message
            $scope.dropdownLeague = $scope.sportLeagues[0]; // display the loading message

            GameService.doQuery([
                {name: "olympiaSports" }
            ], function (obj) {
                if (obj.status === "success") {
                    $scope.isLoading = false;

                    $scope.olympiaSports = obj.data.olympiaSports;
                    reparseRouteParams();
                } else {
                    //@TODO display error message or maybe retry?
                }
            });

            $scope.leaguesVisible = function() {
                if($routeParams.league) {
                    return true;
                }

                return false;
            };

            $scope.isResponsiveHide = function() {
                return $location.path() !== "/home";
            };

            $scope.isOlympiaPage = function() {
                return $location.path() === "/home" || typeof $routeParams.sport !== "undefined";
            };

            $scope.$watch("dropdownSport", function() {
                if(!$scope.dropdownSport || $scope.isLoading) {
                    return;
                }

                if(getSportFromRouteParams($routeParams.sport) !== $scope.dropdownSport) {
                    $location.path(getSportPath());
                }

                $scope.sportLeagues = $scope.dropdownSport.sportsLeagues;
            });

            $scope.$watch("dropdownLeague", function() {
                if(!$scope.dropdownLeague || $scope.isLoading) {
                    return;
                }

                if(getLeagueFromRouteParams() !== $scope.dropdownLeague) {
                    $location.path(getLeaguePath());
                }
            });

            $scope.$on("$routeChangeSuccess", function() {
                if($scope.isLoading) {
                    return;
                }

                reparseRouteParams();
            });

            $scope.getBackUrl = function () {
                if($routeParams.event) {
                    return getLeaguePath();
                }

                if($routeParams.league) {
                    return getSportPath();
                }

                return "home";
            };
        }],
        scope: true,
        templateUrl: "tpl/directives/topbar.html"
    };
});