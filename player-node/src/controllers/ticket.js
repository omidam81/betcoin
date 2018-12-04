'use strict';
var HTTPError = require('../lib/httperror');
var ensureObjectId = require('mongowrap').ensureObjectId;
var async = require('async');

module.exports = function(Tickets) {
    var TicketController = {};

    TicketController.setContainer = function(container) {
        TicketController.container = container;
    };

    TicketController.getContainer = function() {
        return TicketController.container;
    };

    var verifyTicketAccess = function(ticketId, userId, callback){
        Tickets.findOne({_id: ensureObjectId(ticketId)}, function(err, doc){
            if(err) return callback(new HTTPError(500, err.message));
            if(doc === null) return callback(new HTTPError(404, 'No ticket found for id ' + ticketId, '047'));
            if(userId && userId.toString() !== doc.userId.toString()){
                return callback(new HTTPError(403, 'The user does not have right to access this ticket.', '048'));
            }
            callback();
        });
    };

    TicketController.get = function(ticketId, callback) {
        Tickets.findOne({
            _id: ensureObjectId(ticketId)
        }, function(err, ticket) {
            if (err) return callback(new HTTPError(500, err.message));
            if (!ticket) return callback(new HTTPError(404, "Ticket " + ticketId + " not found"), '047');
            callback(undefined, ticket);
        });
    };

    TicketController.getUserTickets = function(userId, cb) {
        userId = ensureObjectId(userId);
        if (userId === null) return cb(new HTTPError(400, "invalid userId", '004'));
        Tickets.find({userId: userId, status: {$ne: 2}}).sort({dateCreated: -1}).toArray(function(err, tickets) {
            if (err) return cb(new HTTPError(500, err.message));
            if (tickets.length === 0) return cb(new HTTPError(204, "No tickets for user", '049'));
            return cb(undefined, tickets);
        });
    };

    TicketController.getTicketsByStatus = function(status, callback) {
        // check if the status is being supplied    
        if(typeof status === 'undefined' || typeof status === null){
            return callback(new HTTPError(400, 'Request invalid, missing parameters', '050'));
        }
        Tickets.find({status: status}).sort({dateCreated: -1}).toArray(function(err, tickets){
            if(err){
                return callback(new HTTPError(204, "No tickets", '049'));
            } else {
                return callback(undefined, {result: true, data: tickets, length: tickets.length});
            }
        });
    };


    TicketController.createForAnonymous = function(ticketParams, callback) {
        var ticket = {};
        ticket.owner = ticketParams.owner;
        ticket.userId = null;
        ticket.email = ticketParams.email;
        ticket.subject = ticketParams.subject;
        ticket.description = ticketParams.description;
        ticket.priority = ticketParams.priority;
        ticket.type = ticketParams.type;
        ticket.anonymous = true;
        ticket.dateCreated = new Date();
        //default status to pending
        ticket.status = 3;
        Tickets.insert(ticket, function(err, docs) {
            if (err) return callback(new HTTPError(500, err.message));
            callback(undefined, docs[0]);
        });
    };

    TicketController.createForUser = function(ticketParams, user, callback) {
        var ticket = {};
        ticket.owner = user.alias;
        ticket.userId = user._id;
        ticket.email = user.email || null;
        ticket.subject = ticketParams.subject;
        ticket.description = ticketParams.description;
        ticket.priority = ticketParams.priority;
        ticket.type = ticketParams.type;
        ticket.anonymous = user.anonymous;
        ticket.dateCreated = new Date();
        //default status to pending
        ticket.status = 3;
        if(ticketParams.userId)
            ticket.userId = ensureObjectId(ticketParams.userId);
        Tickets.insert(ticket, function(err, docs) {
            if (err) return callback(new HTTPError(500, err.message));
            callback(undefined, docs[0]);
        });
    };

    TicketController.update = function(params, callback) {
        var ticketId = params.ticketId;
        var status = params.status;
        var userId = params.userId;
        // checks if the id is being supplied
        if (ticketId === undefined || ticketId === null) {
            callback(new HTTPError(400, 'Request invalid, missing ticket id parameter', '051'));
        }
        // checks if the status is being supplied
        if (status === undefined || status === null) {
            callback(new HTTPError(400, 'Request invalid, missing ticket status parameter', '050'));
        }

        var ticket;
        async.series([
            function checkAccess(cb){
                verifyTicketAccess(ticketId, userId, function(err){
                    cb(err);
                });
            },
            function updateTicket(cb){
                Tickets.update({
                    _id: ensureObjectId(ticketId),
                }, {
                    $set: {
                        status: status
                    }
                }, function(err) {
                    if (err) return cb(new HTTPError(500, err.message));
                    Tickets.findOne({
                        _id: ensureObjectId(ticketId)
                    }, function(err, _ticket) {
                        if (err) return cb(new HTTPError(500, err.message));
                        ticket = _ticket;
                        cb();
                    });
                });
            }
        ], function(err){
            callback(err, ticket);
        });

    };

    TicketController.updateComment = function(params, callback) {
        var commentObj = {}, ticket;
        commentObj.message = params.message;
        commentObj.isAdmin = params.isAdmin;
        commentObj.dateModified = new Date();
        var update = (!params.isAdmin) ? {
            $push: {
                comments: commentObj
            }
        } : {
            $push: {
                comments: commentObj
            },
            $set: {
                status: params.status
            }
        };
        // delete commentObj.isAdmin;
        async.series([
            function checkAccess(cb){
                verifyTicketAccess(params.ticketId, params.userId, function(err){
                    cb(err);
                });
            },
            function addComment(cb){
                Tickets.update({
                    _id: ensureObjectId(params.ticketId)
                }, update, function(err) {
                    if (err) return cb(new HTTPError(500, err.message));
                    Tickets.findOne({
                        _id: ensureObjectId(params.ticketId)
                    }, function(err, _ticket) {
                        ticket = _ticket;
                        if (commentObj.isAdmin === true) {
                            TicketController.getContainer().get('mailer').send(ticket.email, 'ticket', {
                                ticketObject: ticket,
                                subject: 'BetCoin ™ Support Ticket Response RE: ' + ticket.subject,
                                message: ticket.comments[ticket.comments.length - 1].message
                            }, function(err) {
                                if (err) return cb(new HTTPError(500, 'Failed to send the ticket comment update email', '052'));
                                cb(undefined, ticket);
                            });
                        } else {
                            cb(undefined, ticket);
                        }
                    });
                });
            }
            ], function(err){
                callback(err, ticket);
            });
    };

    return TicketController;
};
