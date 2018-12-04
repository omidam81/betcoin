(function(angular, Application) {
    'use strict';

    var GameTotalsController = function($scope, $http, $location, GameTotals, Api) {
        $scope.query = $location.search();
        var DEFAULT_QUERY = {};
        $scope.totalData = {};
        $scope.currencies = angular.copy($scope.CURRENCIES);
        $scope.includeBonus = false;

        $scope.rangeChanged = function(range) {
            $scope.range = range;
            $scope.rangeAlert = false;
            if(range.start.getYear() <= 114 && range.start.getMonth() < 3){
                $scope.rangeAlert = true;
                return;
            }
            $scope.GAMES.forEach(function(game) {
                var query = angular.extend(DEFAULT_QUERY, $scope.query);
                query = angular.extend(query, {
                    game: game,
                    since: range.start.toISOString(),
                    until: range.end.toISOString()
                });
                GameTotals.get(query, function(data) {
                    $scope.totalData[game] = data;
                });
            });
            $scope.refreshHistory();
        };

        $scope.buttonClass = function(term, value) {
            if ($scope.query[term] !== undefined && $scope.query[term] === value) {
                return 'btn-success';
            } else {
                return 'btn-primary';
            }
        };

        $scope.toggleSearch = function(term, value) {
            if ($scope.query[term] !== undefined && $scope.query[term] === value) {
                delete $scope.query[term];
            } else {
                $scope.query[term] = value;
            }
            $location.search($scope.query);
        };


        $scope.$watch('query.includeBonusWager', function(newVal) {
            if (newVal === undefined) {
                return;
            }
            $location.search($scope.query);
        });

        $scope.getProfitHistory = function() {
            $scope.loading = true;
            $scope.message = "Fetching report";
            $http.get(Api.httpUrl + '/reports/games', {
                params: $scope.historyRange
            }).success(function(data, status) {
                if (status === 206) {
                    $scope.message = "Report processing";
                    if (data.toProcess) {
                        $scope.toProcess = data.toProcess;
                        $scope.processed = data.processed;
                        $scope.percentCompleted = ($scope.processed / $scope.toProcess)*100;
                    }
                    setTimeout(function() {
                        $scope.$apply($scope.getProfitHistory);
                    }, (3 * 1000));
                } else {
                    $scope.profitHistory = data;
                    $scope.historyRange = {};
                    $scope.historyRange.start = new Date(data.start);
                    $scope.historyRange.end = new Date(data.end);
                    delete $scope.profitHistory.start;
                    delete $scope.profitHistory.end;
                    $scope.loading = false;
                }
            }).error(function(err) {
                $scope.error = err;
                $scope.loading = false;
            });
        };

        $scope.refreshHistory = function() {
            $scope.historyRange = angular.copy($scope.range);
            $scope.getProfitHistory();
        };

    };


    Application.Controllers.controller('GameTotalsController', [
        '$scope',
        '$http',
        '$location',
        'GameTotals',
        'Api',
        GameTotalsController
    ]);
})(window.angular, window.Application);
