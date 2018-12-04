'use strict';

var BonusesController = function($scope, $routeParams, $location, BCPlayer, BCSession) {
    var getAcceptedBonuses = function(user) {
        var bonuses = [];
        var currency = 'btc';
        if(user.bonusOffers){
            Object.keys(user.bonusOffers[currency]).forEach(function(bonusId){
                bonuses.push(angular.extend({}, user.bonusOffers[currency][bonusId]));
            });
        }
        if(user.activeBonuses){
            Object.keys(user.activeBonuses[currency]).forEach(function(bonusId){
                bonuses.push(angular.extend({}, user.activeBonuses[currency][bonusId]));
            });
        }
        if(user.exhaustedBonuses){
            Object.keys(user.exhaustedBonuses[currency]).forEach(function(bonusId){
                bonuses.push(angular.extend({}, user.exhaustedBonuses[currency][bonusId]));
            });
        }
        for(var i=0;i<bonuses.length;i++){
            var bonus = bonuses[i];
            if(bonus.offered){
                var offeredDate = new Date(bonus.offered);
                var expiratedDate = new Date();
                bonus.expires = expiratedDate.setDate(offeredDate.getDate() + 10);
            }
        }
        return bonuses;
    };
    if (BCSession.user) {
        $scope.user = BCSession.user;
        $scope.bonuses = getAcceptedBonuses($scope.user);
    } else {
        BCPlayer.$on('user update', function(event, user) {
            $scope.user = user;
            $scope.bonuses = getAcceptedBonuses(user);
        });
    }

};

Application.Controllers.controller('BonusesController', [
    '$scope',
    '$routeParams',
    '$location',
    'BCPlayer',
    'BCSession',
    BonusesController
]);

