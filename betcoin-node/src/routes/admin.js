'use strict';

var express = require('express');

module.exports = function(adminAuth) {
    var router = express.Router({
        mergeParam: true
    });

    router.get('/auth', adminAuth.getToken, function(req, res) {
        return res.status(202).json(req.user.filter());
    });
    router.get('/token', function(req, res, next) {
        adminAuth.checkToken(req, res, function(err) {
            if (err) return next(err);
            return res.status(202).send(req.user.filter());
        });
    });

    router.use(adminAuth.checkToken);

    router.route('/totp')
        .all(adminAuth.checkToken)
        .get(adminAuth.generateTotpSecret)
        .put(adminAuth.activateTotp)
        .delete(adminAuth.deactivateTotp);

    return router;
};
