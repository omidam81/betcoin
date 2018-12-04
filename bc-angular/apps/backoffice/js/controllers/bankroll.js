'use strict';

var BankrollController = function($scope, $http, Api) {
    $scope.refresh = 600;
    $scope.updateBankroll = function() {
        $http.get(Api.httpUrl + '/bankroll').success(function(data) {
            $scope.bankroll = data;
        }) .error(function(err) {
            $scope.error = err;
        });
    };
    $scope.updateBankroll();
    setInterval(function() { $scope.$apply($scope.updateBankroll); }, ($scope.refresh * 1000));

    $scope.getProfitHistory = function() {
        $scope.loading = true;
        $scope.message = "Fetching report";
        $http.get(Api.httpUrl + '/reports/profit', {
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

    $scope.range = {
        start: new Date(),
        end: new Date()
    };

    $scope.rangeChanged = function(range) {
        $scope.range = range;
        $scope.getProfitHistory();
    };

    $scope.getProfitHistory();
};

Application.Controllers.controller('BankrollController', [
    '$scope',
    '$http',
    'Api',
    BankrollController
]);
