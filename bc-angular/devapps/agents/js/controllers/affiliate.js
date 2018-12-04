(function(angular, Application) {
    'use strict';

    var AffiliateController = function($scope, $routeParams) {
        var affiliateId = $routeParams.id;
        if (affiliateId) {
            $scope.templateUrl = 'tpl/affiliate/list.html';
        } else {
            $scope.templateUrl = 'tpl/affiliate/detail.html';
        }
    };

    var AffiliateListController = function($scope, Affiliate) {
        $scope.affiliates = Affiliate.query();
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
        AffiliateListController
    ]);

    Application.Controllers.controller('AffiliateDetailController', [
        '$scope',
        '$routeParams',
        'Affiliate',
        AffiliateDetailController
    ]);

})(window.angular, window.Application);
