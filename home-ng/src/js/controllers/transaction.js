'use strict';

var TransactionController = function($scope, BCPlayer, BCSession) {
    if (BCSession.user) {
        $scope.getTransactions();
    } else {
        BCPlayer.$on('user update', function() {
            $scope.getTransactions();
        });
    }
    $scope.getTransactions = function(page) {
        BCPlayer.User.getTransactions({page: page||1}, function(res){
            $scope.transactions = res.data.txs;
            $scope.total = res.data.total;
        });
    };
};

Application.Controllers.controller('TransactionController', [
    "$scope",
    "BCPlayer",
    "BCSession",
    TransactionController
]);