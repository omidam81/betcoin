'use strict';

var SupportController = function($scope, $routeParams, $location, SupportApi) {
    $scope.type = $routeParams.type;
    $scope.loadPendingTickets = function() {
        $scope.tickets = SupportApi.getPendingTickets();
    };
    $scope.loadOpenTickets = function() {
        $scope.tickets = SupportApi.getOpenTickets();
    };
    $scope.loadClosedTickets = function() {
        $scope.tickets = SupportApi.getClosedTickets();
    };
    $scope.loadFlaggedTickets = function() {
        $scope.tickets = SupportApi.getFlaggedTickets();
    };

    if($scope.type === undefined || $scope.type === 'pending-tickets'){
        $scope.type = 'pending-tickets';
        $scope.loadPendingTickets();
    }
    if($scope.type === 'open-tickets'){
        $scope.loadOpenTickets();
    }
    if($scope.type === 'closed-tickets'){
        $scope.loadClosedTickets();
    }
    if($scope.type === 'flagged-tickets'){
        $scope.loadFlaggedTickets();
    }
};

Application.Controllers.controller('SupportController', ['$scope', '$routeParams', '$location', 'SupportApi', SupportController]);