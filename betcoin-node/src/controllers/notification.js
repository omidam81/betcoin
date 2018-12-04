'use strict';

module.exports = function(Notification, mailer, logger, User, HTTPError) {

    var NotificationController = function() {
    };
    /*
     * CRUD
     */

    NotificationController.prototype.create = function(user, params, cb) {
        var self = this;
        if (user instanceof User.db.id || 'string' === typeof user) {
            return User.get(user, function(err, _user) {
                if (err) return cb(err);
                if (!_user) return cb(new HTTPError(400, "Invalid user id"));
                return self.create(_user, params, cb);
            });
        }
        var message = params.message;
        var subject = params.subject;
        var emailTemplate = params.sendEmail || false;
        var emailOpts = params.emailOptions || {};
        if ('string' !== typeof message) return cb(new HTTPError(400, "Invalid message"));
        var notification = new Notification({
            userId: user.primary(),
            subject: subject,
            message: message
        });
        notification.save(function(err) {
            if (err) return cb(new HTTPError(err.code, err.message));
            if (!emailTemplate) return cb(undefined, notification);
            mailer.send(user.activeEmail, emailTemplate, emailOpts, function(err) {
                if (err) logger.error("Error %d sending email: %s", err.code, err.message);
                return cb(undefined, notification);
            });
        });
    };

    NotificationController.prototype.userNotifications = function(userId, includeRead, cb) {
        if ('string' === typeof userId) userId = new Notification.db.ObjectId(userId);
        if (cb === undefined && 'function' === typeof includeRead) {
            cb = includeRead;
            includeRead = false;
        }
        var query = {userId: userId};
        if (!includeRead) query.readAt = {$exists: false};
        Notification.all(query, function(err, notes) {
            if (err) return cb(new HTTPError(err.code, err.message));
            return cb(undefined, notes);
        });
    };

    /*
     * Express responders
     */

    NotificationController.prototype.read = function(req, res, next) {
        var noteId = req.params.noteId;
        if (!noteId) return this.readUser(req, res, next);
        Notification.get(noteId, function(err, note) {
            if (err) return next(new HTTPError(err.code, err.message));
            if (!note) return next(new HTTPError(404, "Notification not found"));
            return res.json(note.filter());
        });

    };

    NotificationController.prototype.readUser = function(req, res, next) {
        var userId = req.user.primary();
        var includeRead = req.query.includeRead;
        this.userNotifications(userId, includeRead, function(err, notes) {
            if (err) return next(err);
            if (!notes.length) res.status(204);
            res.send(notes);
        });
    };

    NotificationController.prototype.markRead = function(req, res, next) {
        var noteId = req.params.noteId;
        if (!noteId) return next(new HTTPError(400, "Missing notification id"));
        Notification.get(noteId, function(err, note) {
            if (err) return next(err);
            if (!note.userId().equals(req.user.primary())) {
                return next(new HTTPError(418, "You cannot edit someone else's notification"));
            }
            note.beenRead = true;
            note.save(function(err) {
                if (err) return next(new HTTPError(err.code, err.message));
                return res.status(202).send(note);
            });
        });

    };

    return NotificationController;

};
