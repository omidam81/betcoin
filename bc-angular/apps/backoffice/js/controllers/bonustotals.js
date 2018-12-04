'use strict';

/* global Application */

var BonusTotalsController = function($scope, MongoQuery) {
    $scope.totalData = {};
    $scope.currencies = angular.copy($scope.CURRENCIES);
    $scope.rangeChanged = function(range) {
        $scope.range = range;
        $scope.getBonuses();
    };

    $scope.getBonuses = function() {
        $scope.bonusData = MongoQuery.get({
            collection: 'bonus',
            q_offeredAt: ['__gte_' + $scope.range.start.toISOString(), '__lt_' + $scope.range.end.toISOString()],
            __sort: 'offeredAt__desc',
            pageSize: 5000,
            mapUsers: true
        }, function(data) {
            var stats = {};
            var totals = {};
            data.result.forEach(function(bonus) {
                var currency = bonus.currency || 'unactivated match';
                if (!stats[currency]) {
                    stats[currency] = {
                        offered: 0,
                        accepted: 0,
                        rejected: 0,
                        activated: 0,
                        exhausted: 0,
                        unlocked: 0
                    };
                }
                var currencyStats = stats[currency];
                Object.keys(currencyStats).forEach(function(status) {
                    if (bonus[status + 'At']) {
                        currencyStats[status] += 1;
                    }
                });
                // add total only for bonuses that actually have a
                // currency assigned
                if (bonus.currency) {
                    if (!totals[currency]) {
                        totals[currency] = {
                            initialValue: 0,
                            wagered: 0,
                            value: 0
                        };
                    }
                    var currencyTotals = totals[currency];
                    currencyTotals.initialValue += bonus.initialValue;
                    currencyTotals.wagered += bonus.wagered;
                    currencyTotals.value += (bonus.value > 0) ? bonus.value : 0;
                }
            });
            $scope.stats = stats;
            $scope.totals = totals;
        });
    };

    $scope.$watch('range', function(newVal, oldVal) {
        if (newVal && oldVal === undefined) {
            $scope.getBonuses();
        }
    });
};


Application.Controllers.controller('BonusTotalsController', [
    '$scope',
    'MongoQuery',
    BonusTotalsController
]);
