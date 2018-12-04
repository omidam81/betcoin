(function(angular, Application) {
    'use strict';

    var DashboardController = function($scope, BCSession, BCPlayer, WelcomePack) {
        $scope.agent = BCSession.user;
        BCPlayer.$on('user update', function() {
            $scope.agent = BCSession.user;
        });
        $scope.welcomePacks = WelcomePack.query(function() {
            var totals = {
                reps: {},
                affiliates: {}
            };
            $scope.welcomePacks.forEach(function(wp) {
                var repId = wp.repId;
                var affId = wp.userId;
                if (repId && !totals.reps[repId]) {
                    totals.reps[repId] = {};
                }
                if (affId && !totals.affiliates[affId]) {
                    totals.affiliates[affId] = {};
                }
                Object.keys(wp.income).forEach(function(currency) {
                    var income = wp.income[currency];
                    if (repId && !totals.reps[repId][currency]) {
                        totals.reps[repId][currency] = 0;
                    }
                    if (affId && !totals.affiliates[affId][currency]) {
                        totals.affiliates[affId][currency] = 0;
                    }
                    if (repId) {
                        totals.reps[repId][currency] += income;
                    }
                    if (affId) {
                        totals.affiliates[affId][currency] += income;
                    }
                });
            });
            $scope.totals = totals;
        });
    };

    Application.Controllers.controller('DashboardController', [
        '$scope',
        'BCSession',
        'BCPlayer',
        'WelcomePack',
        DashboardController
    ]);

})(window.angular, window.Application);
