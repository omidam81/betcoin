'use strict';

/* global Application */

var GameTotalsController = function($scope) {
    $scope.rangeChanged = function(range) {
        $scope.rangeAlert = false;
        if(range.start.getYear() <= 114 && range.start.getMonth() < 3){
            $scope.rangeAlert = true;
            return;
        }
        $scope.range = range;
    };
};


Application.Controllers.controller('GameTotalsController', [
    '$scope',
    GameTotalsController
]);
