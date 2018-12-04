'use strict';

var async = require('async');

module.exports = function(Admin, auth, logger, HTTPError) {

    /*
     * Helper functions
     */

    var ADMINNAME_REGEXP = /[a-zA-Z0-9._]{6,24}/;
    var validAdminname = function(adminname) {
        return ADMINNAME_REGEXP.test(adminname);
    };

    var validPassword = function(password) {
        if (password.length < 10) return false;
        return true;
    };

    var scrubUpdateData = function(data) {
        if (data.adminname && !validAdminname(data.adminname)) {
            throw new HTTPError(400, 'Invalid username');
        }
        if (data.password) {
            if (data.password !== data.passwordConfirm) {
                throw new HTTPError(400, 'Passwords do not match');
            } else {
                delete data.passwordConfirm;
            }
        }
        return data;
    };

    var AdminController = function() {
    };

    /*
     * CRUD
     */

    AdminController.prototype.create = function(req, res, next) {
        var adminData = req.body;
        adminData.ip = req.ip;
        // check that the password confirmation matches the password
        if (adminData.password !== adminData.passwordConfirm) {
            return next(new HTTPError(400, 'Passwords do not match'));
        }
        // check the adminname
        if (!validAdminname(adminData.adminname)) {
            return next(new HTTPError(400, 'Invalid adminname'));
        }
        // check the password
        if (!validPassword(adminData.password)) {
            return next(new HTTPError(400, 'Invalid password'));
        }
        async.waterfall([
            // hash the apossword and create the admin object
            function(done) {
                auth.hashPassword(adminData.password, function(err, passHash) {
                    if (err) return done(new HTTPError(err.code || 500, err.message));
                    adminData.password = passHash;
                    // remove the password confirmation
                    delete adminData.passwordConfirm;
                    return done(undefined, new Admin(adminData));
                });
            },
            // save the admin so we get an _id
            function(admin, done) {
                admin.save(function(err) {
                    if (err) return done(new HTTPError(500, err.message));
                    return done(undefined, admin);
                });
            }
        ], function(err, admin) {
            if (err) return res.json(err);
            return res.status(201).json(admin.filter());
        });
    };

    AdminController.prototype.read = function(req, res) {
        // the admin object is set on the request by the middleware, so
        // just return the object filtered
        res.json(req.admin.filter());
    };

    AdminController.prototype.update = function(req, res, next) {
        var newData = req.body;
        try {
            newData = scrubUpdateData(newData);
        } catch (ex) {
            return res.send(ex);
        }
        req.admin.set(newData);
        req.admin.save(function(err) {
            if (err) return next(new HTTPError(err.code || 500, err.message));
            res.status(202).json(req.admin.filter());
        });
    };

    AdminController.prototype.delete = function(req, res, next) {
        // in this context, delete just means delete the token,
        // effectivly logging the admin out
        req.admin.token(false);
        req.admin.save(function(err) {
            if (err) return next(new HTTPError(err.code || 500, err.message));
            res.status(202).json();
        });
    };

    return AdminController;

};
