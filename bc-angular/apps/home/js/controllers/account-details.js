'use strict';

var AccountDetails = function($scope) {
    $scope.activemenu = 'account_details';
    $scope.setActiveTab = function(menuname) {
       $scope.activemenu = menuname;
    };
};

Application.Controllers.controller('AccountDetails', [
    '$scope',
    'BCPlayer',
    'BCSession',
    '$location',
    AccountDetails
]);