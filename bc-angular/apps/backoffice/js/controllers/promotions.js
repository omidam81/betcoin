(function(angular, Application) {
    'use strict';

    var PromotionsController = function($scope, $routeParams, Config, Promotion) {
        if ($routeParams.promoId) {
            $scope.templateUrl = 'tpl/promotions/detail.html';
        } else {
            $scope.templateUrl = 'tpl/promotions/list.html';
        }

        $scope.newPromo = new Promotion();
        Config.query({search: 'vipLevels'}, function(data) {
            $scope.vipLevels = data[0].value;
        });
        $scope.showBonusForm = false;
        $scope.setupBonus = function() {
            if (!$scope.newPromo.bonus) {
                $scope.newPromo.bonus = {
                    startingVipLevel: 0,
                    rollover: 888,
                    amount: {
                        USD: 11888,
                        CNY: 118888
                    },
                    matchRollover: 888,
                    matchMultipliers: [3.01, 1.88, 1.38],
                    matchMax: (888).toSatoshi()
                };
            } else {
                delete $scope.newPromo.bonus;
            }
        };

        $scope.savePromo = function(promo) {
            if (promo._id) {
                Promotion.update(promo);
            } else {
                promo.$save(function(newPromo) {
                    $scope.promotions.unshift(newPromo);
                    $scope.newPromo = new Promotion();
                });
            }
        };
    };

    var PromotionsListController = function($scope, Promotion) {
        $scope.promotionsList = Promotion.get(function() {
            $scope.promotions = $scope.promotionsList.result;
        });
    };

    var PromotionDetailController = function($scope, $routeParams, Promotion) {
        var promoId = $scope.promoId = $routeParams.promoId;
        $scope.promo = Promotion.get({promoId: promoId}, function() {
            if ($scope.promo.bonus) {
                $scope.showBonusForm = true;
            }
            $scope.users = [];
            Object.keys($scope.promo.users).forEach(function(userId) {
                $scope.users.push($scope.promo.users[userId]);
            });
            // sort users by deposited btc descending
            $scope.users.sort(function(a, b) {
                return b.deposited.bitcoin - a.deposited.bitcoin;
            });
        });
    };

    Application.Controllers.controller('PromotionsController', [
        '$scope',
        '$routeParams',
        'Config',
        'Promotion',
        PromotionsController
    ]);

    Application.Controllers.controller('PromotionsListController', [
        '$scope',
        'Promotion',
        PromotionsListController
    ]);

    Application.Controllers.controller('PromotionDetailController', [
        '$scope',
        '$routeParams',
        'Promotion',
        PromotionDetailController
    ]);

})(window.angular, window.Application);
