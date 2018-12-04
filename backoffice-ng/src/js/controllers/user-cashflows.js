'use strict';

var PlayerCashflowController = function($scope, $routeParams, $location, PlayerStats) {
    $scope.sortObj = {datapoint: 'transaction_date', order:-1};
    $scope.load = function(page){
        var query = [{
            datapoints: [{
                name: 'transaction_userid',
                lookup:{
                    operator: 'eq',
                    value: $routeParams.playerId
                }
            },{
                name: 'transaction_type',
                lookup:{
                    operator: 'in',
                    value: ['withdraw', 'deposit']
                }
            },{
                name: 'transaction_meta'
            },{
                name: 'transaction_amount'
            },{
                name: 'transaction_date'
            }],
            sort: $scope.sortObj,
            page: page || 1,
            size: 20
        }];
        $scope.transactions = PlayerStats.genericFilter({q: JSON.stringify(query)}, function(result){
            $scope.total = result.total;
        });
    };
    $scope.onSelectPage = function(page){
        $scope.load(page);
    };
    $scope.load();
};

Application.Controllers.controller('PlayerCashflowController', [
    '$scope',
    '$routeParams',
    '$location',
    'PlayerStats',
    PlayerCashflowController
]);
