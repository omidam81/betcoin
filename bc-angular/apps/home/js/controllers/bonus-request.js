'use strict';

var BonusRequestController = function($scope, BCPlayer, $location, BCSession) {
    $scope.requestBonus = function(type) {
        delete $scope.error;
        BCPlayer.Bonus.request('bitcoin', type, function(){
            $location.path('/account/bonuses');
        }, function(err){
            $scope.error = err.message;
        });
    };

    if (BCSession.user) {
        $scope.user = BCSession.user;
    } else {
        BCPlayer.$on('user update', function(event, user) {
            $scope.user = user;
        });
    }
    BCPlayer.Bonus.getLevel('bitcoin', function(level){
        $scope.level = level;
    }, function(err){
        $scope.error = err.message;
    });
};

Application.Controllers.controller('BonusRequestController', [
    "$scope",
    "BCPlayer",
    "$location",
    "BCSession",
    BonusRequestController
]);
