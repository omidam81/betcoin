'use strict';

var SupportController = function($scope, $routeParams, SupportApi) {
    $scope.status = $routeParams.status;
    if($scope.status === undefined) {
        $scope.status = 'all';
    }
    $scope.tickets = SupportApi.query({status: $scope.status});
    $scope.newStatusOptions = ['closed', 'pending', 'flagged', 'open'];
    $scope.admins = SupportApi.query({target:'admins'});

    $scope.viewTicket = function(ticketId) {
        $scope.ticket = SupportApi.get({ticketId: ticketId}, function(ticket) {
            $scope.newStatus = ticket.status;
        });
    };

    $scope.closeTicket = function(ticketId) {
        SupportApi.delete({ticketId: ticketId}, function(ticket) {
            $scope.tickets = $scope.tickets.filter(function(t) {
                return t._id !== ticket._id;
            });
        });
    };

    $scope.comment = function(ticketId) {
        var data = {
            message: $scope.newMessage,
            newStatus: $scope.newStatus
        };
        if ($scope.newStatus === 'flagged') {
            data.flaggedFor = $scope.flaggedFor._id;
        }
        $scope.ticket = SupportApi.comment({
            ticketId: ticketId,
        }, data, function(data) {
            for(var i=0;i<$scope.tickets.length;i++){
                if($scope.tickets[i]._id === data._id){
                    $scope.tickets[i] = data;
                }
            }
        }, function(err) {
            $scope.error = err;
        });

    };
};

Application.Controllers.controller('SupportController', [
    '$scope',
    '$routeParams',
    'SupportApi',
    SupportController
]);
