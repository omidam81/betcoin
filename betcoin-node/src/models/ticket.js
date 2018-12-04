'use strict';

var timestamps = require('modella-timestamps');
var format = require('util').format;

module.exports = function(BaseModel, userModelStore, logger, HTTPError) {
    var Ticket = BaseModel('ticket')
        .attr('userId',     {type: userModelStore.ObjectId})
        .attr('email',      {format: 'email'})
        .attr('closedAt',   {type: Date})
        .attr('flaggedFor', {type: userModelStore.ObjectId})
        .attr('thread',     {type: 'array', defaultValue: []})
        .attr('subject',    {type: 'string', required: true})
        .attr('referUrl',    {type: 'string', required: true});


    Ticket.use(userModelStore);
    Ticket.use(timestamps);

    Ticket.STATUS_PENDING  = 'pending';
    Ticket.STATUS_OPEN     = 'open';
    Ticket.STATUS_CLOSED   = 'closed';

    Ticket.TYPE_SUPPORT    = 'support';
    Ticket.TYPE_INCIDENT   = 'incident';
    Ticket.TYPE_QUESTION   = 'question';
    Ticket.TYPE_PROBLEM    = 'problem';
    Ticket.TYPE_TASK       = 'task';

    Ticket.PRIORITY_LOW    = 'low';
    Ticket.PRIORITY_NORMAL = 'normal';
    Ticket.PRIORITY_HIGH   = 'high';
    Ticket.PRIORITY_URGENT = 'urgent';


    // status attribute declared here so we have the constants set up
    Ticket.attr('status',   {type: 'string', defaultValue: Ticket.STATUS_PENDING});
    Ticket.attr('type',     {type: 'string', defaultValue: Ticket.TYPE_SUPPORT});
    Ticket.attr('priority', {type: 'string', defaultValue: Ticket.PRIORITY_NORMAL});

    ['pending', 'open', 'closed'].forEach(function(status) {
        Object.defineProperty(Ticket.prototype, status, {
            get: function() { return this.status() === status; },
            set: function(set) { if (set === true) { this.status(status); } }
        });
    });

    Object.defineProperty(Ticket.prototype, 'flagged', {
        get: function() { return this.has('flaggedFor') && this.status() !== 'closed'; },
        set: function(oid) {
            this.flaggedFor(oid);
        }
    });

    Object.defineProperty(Ticket.prototype, 'anonymous', {
        get: function() { return !this.has('userId'); }
    });

    // make sure there is an admin flagged when the ticket is marked
    // as flagged
    Ticket.validate(function(ticket) {
        if (ticket.status() === Ticket.STATUS_FLAGGED) {
            if (!ticket.flaggedFor()) {
                ticket.error('Ticket is flagged but there is no admin assigned');
            }
        }
    });

    // Make sure the status is valid
    Ticket.validate(function(ticket) {
        switch(ticket.status()) {
        case Ticket.STATUS_PENDING:
        case Ticket.STATUS_OPEN:
        case Ticket.STATUS_CLOSED:
            break;
        default:
            ticket.error('Invalid status ' + ticket.status());
        }
    });

    Ticket.on('saving', function(ticket, done) {
        if (ticket.dirty.status) {
            if (ticket.status() === Ticket.STATUS_CLOSED && !ticket.has('closedAt')) {
                ticket.closedAt(new Date());
            }
        }
        done();
    });

    Ticket.prototype.addMessage = function(params, cb) {
        var message = params.message;
        var user = params.user;
        var newStatus = params.newStatus;
        var flaggedFor = params.flaggedFor;
        if (!user) return cb(new HTTPError(400, "Missing user"));
        if (!message) {
            if (!newStatus) return cb(new HTTPError(400, "Missing message"));
            message = format("%s marked this ticket as %s", user.username(), newStatus);
        }
        var now = new Date();
        var comment = {
            message: message,
            userId: user.primary(),
            username: user.username(),
            createdAt: now
        };
        var thread = this.thread();
        thread.push(comment);
        this.thread(thread);
        if (newStatus) {
            this.status(newStatus);
        }
        if (flaggedFor) {
            this.flaggedFor(flaggedFor);
        }
        if (this.isNew()) {
            // saving new ticket
            logger.verbose("saving new ticket after adding message");
            this.save(cb);
        } else {
            logger.verbose("updating ticket after adding message");
            this.updatedAt(now);
            var setDoc = {
                updatedAt: now,
            };
            if (newStatus) {
                setDoc.status = newStatus;
            }
            if (flaggedFor) {
                setDoc.flaggedFor = flaggedFor;
            }
            Ticket.db.update({_id: this.primary()}, {
                $set: setDoc,
                $push: {thread: comment}
            }, function(err) {
                if (err) return cb(new HTTPError(err.code, err.message));
                return cb();
            });
        }
    };

    return Ticket;

};
