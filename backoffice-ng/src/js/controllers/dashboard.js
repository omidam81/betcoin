'use strict';

var DashboardController = function($scope) {
    $scope.type = 'bankroll';
};

Application.Controllers.controller('DashboardController', [
    '$scope',
    DashboardController
]);
