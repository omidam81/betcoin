'use strict';

var GameTotalsController = function($scope, GameTotals) {
    $scope.dataLoading = true;
    var rangeLoader = function(range) {
        $scope.data = GameTotals.get({
            game: $scope.game,
            type: $scope.type || 'human',
            since: range.start.toISOString(),
            until: range.end.toISOString()
        }, function() {
            $scope.dataLoading = false;
        });
    };
    $scope.$watch('range', function(newVal) {
        if (newVal) {
            rangeLoader(newVal);
        }
    });
};

var gameTotals = function() {
    return {
        restrict: 'EA',
        template: '<div ng-transclude></div>',
        transclude: true,
        scope: {
            game: '@',
            type: '@',
            range: '=',
            data: '='
        },
        controller: ['$scope', 'GameTotals', GameTotalsController]
    };
};

Application.Directives.directive('gameTotals', [gameTotals]);
