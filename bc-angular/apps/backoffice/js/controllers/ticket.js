'use strict';

var TicketController = function($scope, $routeParams, $location, SupportApi) {
    $scope.ticketId = $routeParams.ticketId;
    if($scope.ticketId === undefined) {
        $location.path('support');
    }
    $scope.newStatusOptions = ['closed', 'pending', 'flagged', 'open'];
    $scope.admins = SupportApi.query({target:'admins'});
    $scope.ticket = SupportApi.get({ticketId: $scope.ticketId}, function(ticket) {
        $scope.newStatus = ticket.status;
    });

    $scope.comment = function() {
        var data = {
            message: $scope.newMessage,
            newStatus: $scope.newStatus
        };
        if ($scope.newStatus === 'flagged') {
            data.flaggedFor = $scope.flaggedFor._id;
        }
        $scope.ticket = SupportApi.comment({
            ticketId: $scope.ticketId,
        }, data, function() {
        }, function(err) {
            $scope.error = err;
        });

    };


};

Application.Controllers.controller('TicketController', [
    '$scope',
    '$routeParams',
    '$location',
    'SupportApi',
    TicketController
]);
