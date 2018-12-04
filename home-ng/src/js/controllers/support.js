'use strict';

var SupportController = function($scope, $routeParams, $location, BCPlayer) {
    $scope.loading = false;
    $scope.creatingTicket = false;
    $scope.ticket = {};
    $scope.subtemplate = 'tpl/support/new-ticket.html';

    $scope.statuses = ["", "Open", "Closed", "Pending", "Flagged"];

    $scope.allowComments = false;
    $scope.reply = {};

    $scope.loadTicket = function() {
        $scope.allowComments = false;
        BCPlayer.Ticket.get({id: $scope.ticket._id}, function(ticket) {
            if (ticket.status !== 2) {
                $scope.allowComments = true;
            }
            $scope.ticket = ticket;
        }, function(err) {
            $scope.error = err;
            // console.error(err);
        });
    };
    
    $scope.autofillUser = function() {
        if ($scope.BCSession.user) {
            $scope.ticket.owner = $scope.BCSession.user.alias;
            $scope.ticket.email = $scope.BCSession.user.email;
            $scope.ticket.userId = $scope.BCSession.user._id;
            if ($scope.BCSession.user.email) {
                $scope.ticket.anonymous = false;
            } else {
                $scope.ticket.anonymous = true;
            }
        } else {
            $scope.ticket.anonymous = true;
        }
    };

    BCPlayer.$on('login', function() {
        $scope.autofillUser();
        $scope.loadUserTickets();
    });

    $scope.loadUserTickets = function() {
        BCPlayer.User.query({
            target: "ticket"
        }, function(tickets) {
            $scope.userTickets = tickets;
        }, function(err) {
            $scope.error = err;
            // console.error(err);
        });
    };

    if ($scope.BCSession.user) {
        $scope.loadUserTickets();
    }

    if ($routeParams.ticketId) {
        $scope.subtemplate = 'tpl/support/ticket.html';
        $scope.ticket._id = $routeParams.ticketId;
        $scope.loadTicket();
    } else {
        $scope.autofillUser();
    }

    $scope.leaveComment = function() {
        if (!$scope.reply.message) {
            console.error('no ticket reply text found');
            return;
        }
        $scope.reply._id = $scope.ticket._id;
        if ($scope.ticket.anonymous) {
            BCPlayer.Ticket.comment($scope.reply, function(ticket) {
                console.debug(ticket);
                $scope.ticket = ticket;
                $scope.reply = {};
            }, function(err) {
                $scope.error = err;
                console.error(err);
                $scope.reply = {};
            });
        } else {
            BCPlayer.User.commentTicket($scope.reply, function(ticket) {
                console.debug(ticket);
                $scope.ticket = ticket;
                $scope.reply = {};
            }, function(err) {
                $scope.error = err;
                console.error(err);
                $scope.reply = {};
            });
        }

    };

    $scope.createTicket = function() {
        $scope.creatingTicket = true;
        if ($scope.ticket.anonymous) {
            BCPlayer.Ticket.save($scope.ticket, function(ticket) {
                $location.path('/support/' + ticket._id);
            }, function(err) {
                console.error(err);
            });
        } else {
            BCPlayer.User.newTicket($scope.ticket, function(ticket) {
                $location.path('/support/' + ticket._id);
            }, function(err) {
                console.error(err);
            });
        }
    };

    $scope.viewTicket = function(ticketId) {
        if (ticketId) {
            $location.path('/support/' + ticketId);
        }
    };
};

Application.Controllers.controller('SupportController', [
    '$scope',
    '$routeParams',
    '$location',
    'BCPlayer',
    SupportController
]);

