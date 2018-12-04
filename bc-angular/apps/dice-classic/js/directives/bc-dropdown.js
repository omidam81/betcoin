'use strict';

Application.Directives.directive('bcDropdown', [
    function() {
        return {
            restrict: 'E',
            templateUrl: 'tpl/bc-dropdown.html',
            controller: ['$scope', '$http', function($scope, $http) {
                $scope.select = function (game){
                    $scope.currentSelectedGame = game;
                };

                var gamesReq = $http({
                    method: 'GET',
                    url: './game-data.json'
                });
                gamesReq.success(function(data) {
                    $scope.games = data;

                    $scope.currentSelectedGame = data[6];
                });
            }]
        };
    }
]);
