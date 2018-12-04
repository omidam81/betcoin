'use strict';

var DateRangeController = function($scope) {
    $scope.dateOptions = {
        changeYear: true,
        changeMonth: true,
        yearRange: '2013:-0'
    };
    $scope.endDate = new Date();
    $scope.startDate = new Date($scope.endDate.getTime() - (7 * 24 * 60 * 60 * 1000));
    $scope.rangeType = 'today';
    $scope.requireRange = false;

    $scope.$watch('rangeType', function(newVal) {
        if (newVal === 'range') {
            $scope.requireRange = true;
        } else {
            $scope.requireRange = false;
        }
    });
    $scope.$watch('startDate', function() { $scope.rangeSubmitted = false; });
    $scope.$watch('endDate', function() { $scope.rangeSubmitted = false; });
    $scope.rangeSubmitted = false;
    $scope.rangeSubmit = function() {
        $scope.rangeSubmitted = true;
    };
};

Application.Controllers.controller('DateRangeController', ['$scope', DateRangeController]);
