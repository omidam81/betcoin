'use strict';

var AffiliateController = function($scope, BCPlayer, BCSession) {

    $scope.affiliateStats = {};
    $scope.affiliateData = {};

    $scope.range = {
        start: new Date(new Date() - (7 * 24 * 60 * 60 * 1000)),
        end: new Date()
    };

    $scope.updateData = function() {
        var user = BCSession.user;
        if (user && user.affiliateData) {
            $scope.affiliateData = user.affiliateData;

            var income = 0;
            if($scope.affiliateData && $scope.affiliateData.income) {
                income = $scope.affiliateData.income.btc;
            }

            var level, nextLevelAmount, currentMinAmount;
            if(income < 1000000){
                level = 1;
                nextLevelAmount = 1000000;
                currentMinAmount = 0;
            }
            if(income >= 1000000 && income < 10000000){
                level = 2;
                nextLevelAmount = 10000000;
                currentMinAmount = 1000000;
            }
            if(income >= 10000000 && income < 100000000){
                level = 3;
                nextLevelAmount = 100000000;
                currentMinAmount = 10000000;
            }
            if(income >= 100000000){
                level = 4;
            }
            $scope.levelInfo = {level: level, nextLevelAmount: nextLevelAmount, currentMinAmount: currentMinAmount, currentAmount: income};

            $scope.affiliateStats = null;
            BCPlayer.Affiliate.stats({
                start: $scope.range.start.toISOString(),
                end: $scope.range.end.toISOString()
            }, function(data) {
                $scope.affiliateStats = data;
            }, function(err) {
                console.error(err);
            });
            $scope.associates = BCPlayer.Affiliate.getAssociatesTotals({});
        }
        $scope.user = BCSession.user;
    };

    if (BCSession.user && BCSession.user.affiliateData) {
        $scope.updateData();
    }

    $scope.rangeChanged = function(range) {
        $scope.range.start = range.start;
        $scope.range.end = range.end;
        $scope.updateData();
    };


    BCPlayer.$on("user update", $scope.updateData);
};

Application.Controllers.controller("AffiliateController", [
    "$scope",
    "BCPlayer",
    "BCSession",
    AffiliateController
]);
