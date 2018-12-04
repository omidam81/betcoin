'use strict';

module.exports = function(Ticket, logger, HTTPError, mailer) {

    var TicketController = function() {
    };
    /*
     * CRUD
     */

    TicketController.prototype.create = function(req, res, next) {
        var user = req.user;
        var message = req.body.message;
        var ticket = new Ticket({
            email: user.email() || user.pendingEmail(),
            subject: req.body.subject,
            priority: req.body.priority,
            type: req.body.type,
            referUrl: req.body.referUrl
        });
        if (user.primary()) ticket.userId(user.primary());
        logger.verbose("creating ticket for user %s", user.primary() || "non vip user");
        ticket.addMessage({message: message, user: user}, function(err) {
            if (err) return next(new HTTPError(err.code, err.message));
            mailer.send(mailer.ADMINS, 'contact_us', {
                message: message,
                user: user,
                subject: ticket.subject()
            }, function(err) {
                if (err) return next(err);
                return res.status(201).json(ticket.filter());
            });
        });
    };

    // a method for extracting the ticket to be used in further
    // requests, assigned to req.ticket
    TicketController.prototype.readMiddleware = function(req, res, next) {
        if (!req.params.ticketId) return next();
        var ticketId = req.params.ticketId;
        Ticket.get(ticketId, function(err, ticket) {
            if (err) return next(err);
            if (req.user.primary())  {
                if (!ticket.userId().equals(req.user.primary())) {
                    return next(new HTTPError(418, "You cannot access another user's ticket"));
                }
            } else {
                if (!ticket.anonymous)
                    return next(new HTTPError(418, "You cannot access a VIP ticket as an anonymous user"));
            }
            req.ticket = ticket;
            next();
        });
    };

    TicketController.prototype.read = function(req, res, next) {
        if (!req.params.ticketId) return this.readUser(req, res, next);
        return res.send(req.ticket.filter());
    };

    TicketController.prototype.readUser = function(req, res, next) {
        var userId = req.user.primary();
        var status = req.query.status || 'all';
        if (!userId) return next(new HTTPError(401, "You cannot access a ticket list"));
        logger.verbose("getting %s tickets for %s", status, userId);
        this.userTickets(userId, status, function(err, tickets) {
            if (err) return next(err);
            if (!tickets.length) res.status(204);
            res.send(tickets);
        });
    };

    TicketController.prototype.userComment = function(req, res, next) {
        var message = req.body.message;
        // TODO: we should sanitize this input here
        req.ticket.addMessage({
            message: message,
            user: req.user
        }, function(err) {
            if (err) return next(err);
            return res.status(202).json(req.ticket.filter());
        });
    };

    /*
     * Helpers
     */

    TicketController.prototype.userTickets = function(userId, status, cb) {
        if ('string' === typeof userId) userId = new Ticket.db.ObjectId(userId);
        if (cb === undefined && 'function' === typeof status) {
            cb = status;
            status = 'all';
        }
        var query = {userId: userId};
        if (status === 'all') {
            logger.verbose("getting all tickets for %s", userId);
            // query.status = {$nin:[Ticket.STATUS_CLOSED]};
        } else {
            query.status = status;
        }
        Ticket.all(query, function(err, tickets) {
            if (err) return cb(new HTTPError(err.code, err.message));
            return cb(undefined, tickets);
        });
    };

    return TicketController;

};
