(function(angular, Application) {
    'use strict';

    var DashboardController = function($scope, BCSession, BCPlayer, WelcomePack) {
        $scope.rep = BCSession.user;
        BCPlayer.$on('user update', function() {
            $scope.rep = BCSession.user;
        });
        $scope.welcomePacks = WelcomePack.query();
    };

    Application.Controllers.controller('DashboardController', [
        '$scope',
        'BCSession',
        'BCPlayer',
        'WelcomePack',
        DashboardController
    ]);

})(window.angular, window.Application);
