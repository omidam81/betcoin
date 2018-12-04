(function(angular, Application) {
    'use strict';

    var AffiliateController = function($scope, $routeParams) {
        var affiliateId = $routeParams.id;
        if (!affiliateId) {
            $scope.templateUrl = 'tpl/affiliate/list.html';
        } else {
            $scope.templateUrl = 'tpl/affiliate/detail.html';
        }
    };

    var AffiliateListController = function($scope, Affiliate, WelcomePack) {
        $scope.affiliates = Affiliate.query({}, function() {
            $scope.welcomePacks = WelcomePack.query({}, function () {
                $scope.affiliates.forEach(function(affiliate) {
                    affiliate.income = {};
                    $scope.welcomePacks.forEach(function(wp) {
                        Object.keys(wp.income).forEach(function(currency) {
                            if (!affiliate.income[currency]) {
                                affiliate.income[currency] = 0;
                            }
                            if (affiliate._id === wp.userId) {
                                affiliate.income[currency] += wp.income[currency];
                            }
                        });
                    });
                });
            });
        });
    };

    var AffiliateDetailController = function($scope, $routeParams, Affiliate) {
        $scope.affiliate = Affiliate.get({_id: $routeParams.id});
    };

    Application.Controllers.controller('AffiliateController', [
        '$scope',
        '$routeParams',
        AffiliateController
    ]);

    Application.Controllers.controller('AffiliateListController', [
        '$scope',
        'Affiliate',
        'WelcomePack',
        AffiliateListController
    ]);

    Application.Controllers.controller('AffiliateDetailController', [
        '$scope',
        '$routeParams',
        'Affiliate',
        AffiliateDetailController
    ]);

})(window.angular, window.Application);
