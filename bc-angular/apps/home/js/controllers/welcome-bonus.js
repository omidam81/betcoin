'use strict';

var WelcomeBonusController = function($scope, $location, BCPlayer, BCSession) {

    if (BCSession.user) {
      $scope.offer = BCSession.user.bonuses[0];
    } else {
        BCPlayer.$on('invalid wallet', function() {
          $scope.offer = BCSession.user.bonuses[0];
        });
    }
    var updateBonus = function(bonuses, newbonus){
        var found = false;
        for(var i = 0; i<bonuses.length; i++){
            if(bonuses[i]._id === newbonus._id){
                bonuses[i] = newbonus;
                found = true;
            }
        }
        if(!found){
            bonuses.push(newbonus);
        }
    };
    $scope.acceptBonus = function (id){
        $scope.error = null;
        BCPlayer.Bonus.accept({bonusId: id}, function(bonus){
            BCSession.user.bonuses = BCSession.user.bonuses || [];
            updateBonus(BCSession.user.bonuses, bonus);
            $location.path('/verify/wallet');
        }, function(err){
            $scope.error = err.data;
        });
    };
    $scope.rejectBonus = function (id){
        $scope.error = null;
        BCPlayer.Bonus.cancel({bonusId: id}, function(bonus){
            BCSession.user.bonuses = BCSession.user.bonuses || [];
            updateBonus(BCSession.user.bonuses, bonus);
            $location.path('/verify/wallet');
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
