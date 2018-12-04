'use strict';

module.exports = function(mongo, mailer, Ticket, AdminUser, HTTPError) {

    var SupportController = function() {
    };

    SupportController.prototype.readStatus = function(req, res, next) {
        var status = req.query.status || Ticket.STATUS_PENDING;
        var query = {status: status};
        if(status === 'all'){
            query = {status: {$ne: 'closed'}};
        }
        Ticket.all(query, {sort: {updatedAt: -1}}, function(err, tickets) {
            if (err) return next(new HTTPError(err.code, err.message));
            return res.json(tickets);
        });
    };

    SupportController.prototype.readMiddleware = function(req, res, next) {
        if (!req.params.ticketId) return next();
        var ticketId = req.params.ticketId;
        Ticket.get(ticketId, function(err, ticket) {
            if (err) return next(err);
            req.ticket = ticket;
            next();
        });
    };

    SupportController.prototype.read = function(req, res, next) {
        if (!req.params.ticketId) return this.readStatus(req, res, next);
        return res.send(req.ticket.filter());
    };

    SupportController.prototype.getAssignableAdmins = function(req, res, next) {
        AdminUser.all({}, function(err, users) {
            if (err) return next(new HTTPError(err.code, err.message));
            return res.json(users.map(function(user) {
                return {
                    _id: user.primary(),
                    username: user.username()
                };
            }));
        });
    };

    SupportController.prototype.addResponse = function(req, res, next) {
        var message = req.body.message;
        var newStatus = req.body.newStatus || Ticket.STATUS_OPEN;
        var flaggedFor = mongo.ensureObjectId(req.body.flaggedFor);
        req.ticket.addMessage({
            message: message,
            newStatus: newStatus,
            flaggedFor: flaggedFor,
            user: req.user
        }, function(err) {
            if (err) return next(err);
            var thread = req.ticket.thread();
            var message = thread[thread.length - 1].message;
            mailer.send(req.ticket.email(), 'backoffice_email', {
                message: message,
                subject: req.ticket.subject()
            }, function(err) {
                if (err) return next(err);
                return res.status(202).json(req.ticket);
            });
        });
    };

    SupportController.prototype.flagTicket = function(req, res, next) {
        var flaggedFor = mongo.ensureObjectId(req.body.flaggedFor);
        req.ticket.status(Ticket.STATUS_CLOSED);
        req.ticket.flaggedFor(flaggedFor);
        req.ticket.save(function(err) {
            if (err) return next(err);
            return res.status(202).json(req.ticket);
        });
    };

    SupportController.prototype.closeTicket = function(req, res, next) {
        req.ticket.status(Ticket.STATUS_CLOSED);
        req.ticket.save(function(err) {
            if (err) return next(err);
            return res.status(202).json(req.ticket);
        });
    };

    return SupportController;

};
