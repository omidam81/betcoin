'use strict';

var TransactionController = function($scope, BCPlayer, BCSession) {
    $scope.getTransactions = function(page) {
        BCPlayer.User.getTransactions({page: page||1, pageSize:50, currency:'all'}, function(res){
            $scope.transactions = res.data.result;
            $scope.total = res.data.total;
        });
    };
    if (BCSession.user) {
        $scope.getTransactions();
    } else {
        BCPlayer.$on('user update', function() {
            $scope.getTransactions();
        });
    }
};

Application.Controllers.controller('TransactionController', [
    "$scope",
    "BCPlayer",
    "BCSession",
    TransactionController
]);
