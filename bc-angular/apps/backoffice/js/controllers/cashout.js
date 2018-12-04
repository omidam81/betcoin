'use strict';

var CashoutController = function($scope, Cashout, MongoQuery) {

    $scope.getPending = function(page) {
        $scope.loading = true;
        $scope.pending = MongoQuery.get({
            page: page || 1,
            pageSize: 50,
            mapUsers: true,
            collection: 'cashout_request',
            q_status: 'open'
        }, function() {
            $scope.loading = false;
        });
    };
    $scope.getPending();

    $scope.currentPage = 1;
    $scope.pageChange = function(page) {
        $scope.currentPage = page;
        console.debug("page change ", $scope.query.page, " -> ", $scope.currentPage);
        if ($scope.loading || $scope.currentPage === $scope.query.page) { return; }
        $scope.getPending($scope.currentPage);
    };

    $scope.sendCashout = function(action, index) {
        console.debug(action, index, $scope.pending.result[index]);
        var tx = $scope.pending.result[index];
        var doIt = window.confirm(action.toUpperCase() + " " + tx.currency +
                                  " cashout to " + tx.user.username +
                                  " for " + tx.amount.toBitcoin());
        if (doIt) {
            Cashout[action]({
                action: action,
                txid: tx._id
            }, function() {
                $scope.error = null;
                $scope.getPending();
            }, function(err) {
                $scope.error = err;
                $scope.getPending();
            });
        }
    };
};

Application.Controllers.controller('CashoutController', [
    '$scope',
    'Cashout',
    'MongoQuery',
    CashoutController
]);
