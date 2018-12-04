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
        if (user) {
            $scope.affiliateToken = user.affiliateToken;
            BCPlayer.Affiliate.earnings(function(earnings) {
                $scope.earnings = earnings;
                $scope.levelInfo = {};
                Object.keys(earnings).forEach(function(currency) {
                    var income = earnings[currency];
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
                    $scope.levelInfo[currency] = {
                        level: level,
                        nextLevelAmount: nextLevelAmount,
                        currentMinAmount: currentMinAmount,
                        currentAmount: income
                    };
                });
            });
            $scope.transactions = BCPlayer.Affiliate.transactions({
                since: $scope.range.start.toISOString(),
                until: $scope.range.end.toISOString()
            });
            $scope.associates = BCPlayer.Affiliate.associates();
        }
        $scope.user = BCSession.user;
    };

    if (BCSession.user) {
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
