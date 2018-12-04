'use strict';

var LogController = function($scope, MongoQuery) {
    $scope.exclude = ['silly', 'verbose'];
    $scope.logs = [];

    $scope.refresh = 7;

    $scope.$watch('refresh', function(newVal) {
        if (newVal < 1) {
            $scope.refresh = 1;
        }
    });

    $scope.endDate = new Date();

    $scope.fetchLogs = function() {
        $scope.message = "Fetching logs since " + $scope.endDate.toISOString();
        MongoQuery.get({
            collection: 'logs',
            pageSize: 1000,
            q_timestamp: '__gt_' + $scope.endDate.toISOString(),
            q_level: '__nin_' + $scope.exclude.join('||'),
            'q_meta.username': '__ne_' + $scope.BCAdminSession.user.username,
            __sort: 'timestamp_desc'
        }, function(data) {
            $scope.message = "";
            if (data.result && data.result.length) {
                $scope.globalError = null;
                $scope.logs = data.result.concat($scope.logs);
                $scope.endDate = new Date($scope.logs[0].timestamp);
                $scope.lastFetch = data.result.length + " new message" + ((data.result.length > 1) ? "s" : "");
                $scope.logsStart = $scope.logs[$scope.logs.length - 1].timestamp;
                $scope.logsEnd = $scope.logs[0].timestamp;
            } else {
                $scope.lastFetch = "No new logs this fetch";
            }
            while ($scope.logs.length > 500) {
                $scope.logs.pop();
            }
            setTimeout(function() { $scope.$apply($scope.fetchLogs); }, ($scope.refresh * 1000));
        }, function(err) {
            $scope.loading = false;
            $scope.globalError = err;
            setTimeout(function() { $scope.$apply($scope.fetchLogs); }, ($scope.refresh * 1000));
        });
    };

    $scope.$watch('BCAdminSession.user', function(newVal) {
        if (newVal) {
            $scope.fetchLogs();
        }
    });

};

Application.Controllers.controller('LogController', [
    '$scope',
    'MongoQuery',
    LogController
]);
