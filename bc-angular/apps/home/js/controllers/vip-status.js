'use strict';

var VIPStatusController = function($scope, BCPlayer, BCSession) {
    $scope.currency = 'bitcoin';
    $scope.determineVIPLevel = function(totals, currency) {
        var level, nextLevelAmount;
        var baseAmount = 1000000;
        $scope.currency = currency || 'bitcoin';
        $scope.totals = totals;
        var totalWagered = totals[$scope.currency];
        if(totalWagered < baseAmount){
            level = 0;
            nextLevelAmount = baseAmount * 1;
        }
        if(totalWagered >= baseAmount && totalWagered < (baseAmount * 10)){
            level = 1;
            nextLevelAmount = baseAmount * 10;
        }
        if(totalWagered >= (baseAmount * 10) && totalWagered < (baseAmount * 100)){
            level = 2;
            nextLevelAmount = baseAmount * 100;
        }
        if(totalWagered >= (baseAmount * 100) && totalWagered < (baseAmount * 1000)){
            level = 3;
            nextLevelAmount = baseAmount * 1000;
        }
        if(totalWagered >= (baseAmount * 1000) && totalWagered < (baseAmount * 10000)){
            level = 4;
            nextLevelAmount = baseAmount * 10000;
        }
        if(totalWagered >= (baseAmount * 10000)){
            level = 5;
        }
        $scope.vipLevelInfo = {
            level: level,
            currentAmount: totalWagered,
            baseAmount: baseAmount,
            nextLevelAmount: nextLevelAmount,
            currentMinAmount: level===0? 0: nextLevelAmount/10
        };
    };

    if (BCSession.user) {
        $scope.user = BCSession.user;
        BCPlayer.User.getTransactionTotals({}, function(data){
            $scope.determineVIPLevel(data);
        });
    } else {
        BCPlayer.$on('user update', function(event, user) {
            $scope.user = user;
            BCPlayer.User.getTransactionTotals({}, function(data){
                $scope.determineVIPLevel(data);
            });
        });
    }
};

Application.Controllers.controller('VIPStatusController', [
    '$scope',
    'BCPlayer',
    'BCSession',
    '$location',
    VIPStatusController
]);