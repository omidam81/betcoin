'use strict';

var SupportController = function($scope, $routeParams, $location, BCPlayer, ngToast) {
    $scope.loading = false;
    $scope.creatingTicket = false;
    $scope.replyingTicket = false;
    $scope.ticket = {};
    $scope.subtemplate = 'tpl/support/new-ticket.html';

    $scope.statuses = ["", "Open", "Closed", "Pending", "Flagged"];

    $scope.allowComments = false;
    $scope.reply = {};
    $scope.BCSession = BCPlayer.BCSession;

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
            $scope.ticket.owner = $scope.BCSession.user.username;
            $scope.ticket.email = $scope.BCSession.user.email || $scope.BCSession.user.pendingEmail;
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

    BCPlayer.$on('user update', function() {
        $scope.autofillUser();
        // $scope.loadUserTickets();
    });

    $scope.loadUserTickets = function() {
        $scope.userTickets = BCPlayer.Ticket.listStatus();
    };

    // if ($scope.BCSession.user) {
    //     $scope.loadUserTickets();
    // }else {
    //     BCPlayer.$on('user update', function(){
    //         $scope.loadUserTickets();
    //     });
    // }

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
	    $scope.replyingTicket = true;
        if ($scope.ticket.anonymous) {
            BCPlayer.Ticket.comment($scope.reply, function(ticket) {
                console.debug(ticket);
                $scope.ticket = ticket;
                $scope.reply = {};
			    $scope.replyingTicket = false;
            }, function(err) {
                $scope.error = err;
                console.error(err);
                $scope.reply = {};
			    $scope.replyingTicket = false;
            });
        } else {
            BCPlayer.Ticket.commentTicket({id:$scope.reply._id}, $scope.reply, function(ticket) {
                console.debug(ticket);
                $scope.ticket = ticket;
			    $scope.replyingTicket = false;
                $scope.reply = {};
            }, function(err) {
                $scope.error = err;
                console.error(err);
			    $scope.replyingTicket = false;
                $scope.reply = {};
            });
        }

    };

    $scope.createTicket = function() {
        $scope.creatingTicket = true;
        $scope.ticket.referUrl = $location.host();
        if ($scope.ticket.anonymous) {
            BCPlayer.Ticket.save($scope.ticket, function(ticket) {
		        $scope.creatingTicket = false;
				ngToast.create("new-contact-send-success");
				if ($('#supportModal').attr('aria-hidden') === "true") {
	                $location.path('/support/' + ticket._id);
				}
				$('#supportModal').modal('hide');
            }, function(err) {
		        $scope.creatingTicket = false;
                console.error(err);
            });
        } else {
            BCPlayer.Ticket.save($scope.ticket, function(ticket) {
		        $scope.creatingTicket = false;
				ngToast.create("new-contact-send-success");
				if ($('#supportModal').attr('aria-hidden') === "true") {
	                $location.path('/support/' + ticket._id);
				}
				$('#supportModal').modal('hide');
            }, function(err) {
		        $scope.creatingTicket = false;
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
    'ngToast',
    SupportController
]);
