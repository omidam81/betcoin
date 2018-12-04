'use strict';

var SendCryptoController = function($scope, $http, Api, MongoQuery) {
    $scope.currencyOptions = angular.copy($scope.CURRENCIES);

    var COLD_STORAGE="1Dhd2V19w7zLaXrK1zPp2eES6Km1cBVzDs";

    $scope.formData = {
        currency: $scope.currencyOptions[0],
        amountDecimal: 0,
        address: COLD_STORAGE,
        reason: 'coldstorage',
        memo: ''
    };

    $scope.sendCrypto = function() {
        var data = angular.copy($scope.formData);
        data.amount = parseFloat($scope.formData.amountDecimal).toSatoshi();
        if (!window.confirm("Send " + data.amount.toBitcoin() + " " + data.currency + " to " + data.address + "?")) {
            return;
        }
        delete data.amountDecimal;
        $http.post(Api.httpUrl + '/send-crypto', data).success(function() {
            $scope.formData = {
                currency: $scope.currencyOptions[0],
                amountDecimal: 0,
                address: COLD_STORAGE
            };
            $scope.setMessage(data.amount.toBitcoin() + " " + data.currency + " sent to " + data.address);
            $scope.error = null;
        }).error(function(err) {
            $scope.error = err;
        });
    };

    $scope.loading = true;
    MongoQuery.get({
        collection: 'admin_transaction',
        __sort: 'createdAt__desc',
        pageSize: 100,
        page: 1
    }, function(data) {
        $scope.listData = data;
        $scope.loading = false;
    }, function(err) {
        $scope.error = err;
    });
};

Application.Controllers.controller('SendCryptoController', [
    '$scope',
    '$http',
    'Api',
    'MongoQuery',
    SendCryptoController
]);
