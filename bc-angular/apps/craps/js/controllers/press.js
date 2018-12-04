'use strict';

/* global Application */

var PressController = function($scope, $modalInstance, multiplePressable, offerNum) {
    $scope.multiplePressable = multiplePressable;
    $scope.offerNum = offerNum;
    $scope.close = function() {
        $modalInstance.dismiss('cancel');
    };
    $scope.press = function(value) {
        $modalInstance.close(value);
    };
};

Application.Controllers.controller('PressController', ['$scope', '$modalInstance', 'multiplePressable', 'offerNum', PressController]);
