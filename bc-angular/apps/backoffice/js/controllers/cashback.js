'use strict';

var CashbackController = function($scope, $http, Api, MongoQuery) {
    $scope.pollTimeout = null;
    $scope.pollCashback = function() {
        console.debug("polling for new record");
        MongoQuery.get({
            collection: 'cashbacks',
            id: $scope.cashbackData._id
        }, function(data) {
            if (data.users === undefined) {
                $scope.pollTimeout = setTimeout(function() {
                    $scope.$apply($scope.pollCashback);
                }, 10000);
            } else {
                $scope.cashbackData = data;
                $scope.processing = false;
            }
        }, function(err) {
            $scope.error = err;
            $scope.pollTimeout = setTimeout(function() {
                $scope.$apply($scope.pollCashback);
            }, 10000);
        });
    };


    $scope.processCashbacks = function() {
        $scope.processing = true;
        $http.get(Api.httpUrl + '/cashback/process').success(function(data) {
            $scope.cashbackData = data;
            $scope.error = null;
            $scope.pollTimeout = setTimeout(function() {
                $scope.$apply($scope.pollCashback);
            }, 10000);
        }).error(function(err) {
            $scope.error = err;
        });
    };

    $scope.payCashbacks = function() {
        $http.get(Api.httpUrl + '/cashback/pay/' + $scope.cashbackData._id).success(function(data) {
            $scope.cashbackData = data;
            $scope.error = null;
            $scope.pollTimeout = setTimeout(function() {
                $scope.$apply($scope.pollCashback);
            }, 10000);
        }).error(function(err) {
            $scope.error = err;
        });
    };

    MongoQuery.get({
        collection: 'cashbacks',
        pageSize: 1,
        page: 1,
        __sort: "__triggeredAt_desc"
    }, function(data) {
        if (!data.result || !data.result[0]) {
            return;
        }
        $scope.cashbackData = data.result[0];
        if (!$scope.cashbackData.users) {
            $scope.processing = true;
            $scope.pollTimeout = setTimeout(function() {
                $scope.$apply($scope.pollCashback);
            }, 10000);
        }
        $scope.error = null;
    }, function(err) {
        $scope.error = err;
    });

};

Application.Controllers.controller('CashbackController', [
    '$scope',
    '$http',
    'Api',
    'MongoQuery',
    CashbackController
]);
