'use strict';

var TicketDetailsController = function($scope, $routeParams, $location, SupportApi) {
    $scope.comment = {};
    $scope.getTicketDetails = function(id) {
        $scope.ticket = SupportApi.getTicketDetails({}, {id: id}, function(ticket){
            $scope.ticket = ticket;
            $scope.comments = $scope.ticket.comments;
        });
    };
    $scope.commentTicket = function(id, status) {
        SupportApi.commentTicket({}, {id: id, comment: $scope.comment.message, status: status}, function(ticket){
            $scope.comments = ticket.comments;
            $scope.comment.message = "";
        });
    };
    $scope.updateTicketStatus = function(id, status) {
        SupportApi.changeTicketStatus({}, {id: id, status: status}, function(){
            $location.path('support/pending-tickets');
        });
    };
    $scope.getTicketDetails($routeParams.id);
};

Application.Controllers.controller('TicketDetailsController', ['$scope', '$routeParams', '$location', 'SupportApi', TicketDetailsController]);