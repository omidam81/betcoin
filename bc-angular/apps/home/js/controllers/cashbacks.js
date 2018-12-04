'use strict';

var CashbacksController = function($scope, BCPlayer, BCSession) {
    if (BCSession.user && BCPlayer.User) {
        BCPlayer.User.getCashbacks({}, function(res){
            $scope.transactions = res.data;
        });
    } else {
        BCPlayer.$on('user update', function() {
            BCPlayer.User.getCashbacks({}, function(res){
                $scope.transactions = res.data;
            });
        });
    }

    $scope.getCashbacks = function(page){
        BCPlayer.User.getCashbacks({page: page}, function(res){
            $scope.transactions = res.data;
        });
    };
};

Application.Controllers.controller('CashbacksController', [
    "$scope",
    "BCPlayer",
    "BCSession",
    CashbacksController
]);