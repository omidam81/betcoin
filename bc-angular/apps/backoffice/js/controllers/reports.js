'use strict';

var ReportController = function($scope, $routeParams, $http, Api) {
    $scope.type = $routeParams.type || 'profit';
    $scope.getProfitHistory = function() {
        $scope.loading = true;
        $scope.message = "Fetching report";
        $http.get(Api.httpUrl + '/reports/' + $scope.type, {
            params: $scope.range
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
                $scope.range.start = new Date(data.start);
                $scope.range.end = new Date(data.end);
                delete $scope.profitHistory.start;
                delete $scope.profitHistory.end;
                $scope.loading = false;
            }
        }).error(function(err) {
            $scope.error = err;
            $scope.loading = false;
        });
    };

    $scope.dailyCurrency = "bitcoin";
    $scope.filterDailyTable = function(currency) {
        $scope.dailyCurrency = currency;
    };

    var stripTime = function(date) {
        var newDate = new Date();
        newDate.setUTCDate(date.getDate());
        newDate.setUTCMonth(date.getMonth());
        newDate.setUTCFullYear(date.getFullYear());
        newDate.setUTCHours(0);
        newDate.setUTCMinutes(0);
        newDate.setUTCSeconds(0);
        newDate.setUTCMilliseconds(0);
        return newDate;
    };

    var today = stripTime(new Date());
    $scope.range = {
        start: new Date(today - (365 * 24 * 60 * 60 * 1000)),
        end: today
    };

    $scope.rangeChanged = function(range) {
        $scope.range = range;
        $scope.getProfitHistory();
    };

    $scope.getProfitHistory();
};

Application.Controllers.controller('ReportController', [
    '$scope',
    '$routeParams',
    '$http',
    'Api',
    ReportController
]);
