'use strict';

var WelcomeBonusController = function($scope, $location, BCPlayer, BCSession) {

    if (BCSession.user) {
      var keys = Object.keys(BCSession.user.bonusOffers.btc);
      $scope.offer = BCSession.user.bonusOffers.btc[keys[0]];
    } else {
        BCPlayer.$on('user update', function() {
          var keys = Object.keys(BCSession.user.bonusOffers.btc);
          $scope.offer = BCSession.user.bonusOffers.btc[keys[0]];
        });
    }

    $scope.acceptBonus = function (id){
        $scope.error = null;
        BCPlayer.User.acceptBonus({range: id}, function(){
            window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/verify/wallet';
        }, function(err){
            $scope.error = err.data;
        });
    };
    $scope.rejectBonus = function (id){
        $scope.error = null;
        BCPlayer.User.rejectBonus({range: id}, function(){
            window.location.href = $location.protocol()+'://'+$location.host()+':'+$location.port()+'/verify/wallet';
        }, function(err){
            $scope.error = err.data;
        });
    };
};

Application.Controllers.controller('WelcomeBonusController', [
    "$scope",
    "$location",
    "BCPlayer",
    "BCSession",
    WelcomeBonusController
]);
