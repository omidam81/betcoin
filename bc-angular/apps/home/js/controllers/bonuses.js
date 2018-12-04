'use strict';

var BonusesController = function($scope, $routeParams, $location, BCPlayer, BCSession, PlayerApi, exchangeRate) {

    $scope.activemenu = 'bonus_information';
    $scope.setActiveTab = function(menuname) {
       $scope.activemenu = menuname;
    };

    $scope.lang = PlayerApi.lang;
    var fiat = ($scope.lang === 'en_US') ? 'USD': 'CNY';
    $scope.fiat = fiat;

    $scope.getExchange = function(btcValue)  {
        var retval = exchangeRate.convert(btcValue, $scope.fiat);
        return retval;
    };

    var getAcceptedBonuses = function(bonuses) {
        if(!bonuses){
            return null;
        }
        for(var i=0;i<bonuses.length;i++){
            var bonus = bonuses[i];
            if(bonus.offeredAt){
                var offeredDate = new Date(bonus.offeredAt);
                var expiratedDate = new Date();
                bonus.expires = expiratedDate.setDate(offeredDate.getDate() + 10);
                if (bonus.unlockedAt) {
                    bonus.status = 'unlocked';
                } else if (bonus.expiredAt) {
                    bonus.status = 'expired';
                } else if (bonus.activatedAt) {
                    bonus.status = 'activated';
                } else {
                    bonus.status = 'offered';
                }
            }
        }
        return bonuses;
    };
    if (BCSession.user) {
        $scope.user = BCSession.user;
        BCPlayer.Bonus.query({
            unlocked: true,
        }, function(bonuses){
            $scope.bonuses = getAcceptedBonuses(bonuses);
        });
    } else {
        BCPlayer.$on('bonus update', function(event, user) {
            $scope.user = user;
            BCPlayer.Bonus.query({
                unlocked: true,
            }, function(bonuses){
                $scope.bonuses = getAcceptedBonuses(bonuses);
            });
        });
    }

};

Application.Controllers.controller('BonusesController', [
    '$scope',
    '$routeParams',
    '$location',
    'BCPlayer',
    'BCSession',
    'PlayerApi',
    'exchangeRate',
    BonusesController
]);
