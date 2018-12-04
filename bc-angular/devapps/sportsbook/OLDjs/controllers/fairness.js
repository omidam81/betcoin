'use strict';

/* global Application */

Application.Controllers.controller('FairnessCtrl', ['$scope', function ($scope) {  //@TODO move to common once per-project concatenation works
    window.scrollTo(0,0);

    $scope.isLoading = false;

    $scope.moot = true;
}]);