'use strict';

var AssociateTransactionsController = function($scope, $routeParams, BCPlayer, BCSession) {
    $scope.sort = {
        datapoint: 'date',
        order : -1
    };
    $scope.updateData = function(page) {
        BCPlayer.Affiliate.getAssociateTransactions({
            targetId: $routeParams.associateId,
            sort: $scope.sort.datapoint,
            order: $scope.sort.order,
            page: page,
            size: 500
        }, function(data){
            $scope.total = data.total;
            $scope.transactions = data.transactions;
            $scope.associateUsername = data.associateUsername;
        });
    };
    if (BCSession.user) {
        $scope.updateData();
    }

    $scope.rangeChanged = function(range) {
        $scope.range.start = range.start;
        $scope.range.end = range.end;
        $scope.updateData();
    };

    BCPlayer.$on('user update', $scope.updateData);
};

Application.Controllers.controller('AssociateTransactionsController', ['$scope', '$routeParams', 'BCPlayer', 'BCSession', AssociateTransactionsController]);
