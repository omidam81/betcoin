'use strict';

var express = require('express');

module.exports = function(auth, WalletController, HTTPError) {
    var router = express.Router({
        mergeParam: true
    });

    router.get('/challenge', auth.checkToken, function(req, res, next) {
        req.user.challenge(auth.generateToken());
        req.user.save(function(err) {
            if (err) return next(new HTTPError(err.code || 500, err.message));
            return res.send({challenge: req.user.challenge()});
        });
    });

    // all of the update operations use the bitcoin wallet as the
    // "main" wallet for testing message signatures, this loads the
    // bitcoin wallet controller and user's bitcoin wallet into the
    // request object for use in the update functions
    var loadBitcoin = function(req, res, next) {
        req.controller = new WalletController('bitcoin');
        req.controller.readMiddleware(req, res, next);
    };

    router.route('/:userId')
    // make sure the user accessing the endpoint is the user to be operated on
        .all(function(req, res, next) {
            if (req.user.primary().toHexString() !== req.params.userId) {
                return next(new HTTPError(418, 'You cannot access another user'));
            }
            return next();
        })
    // crud for wallets
        .post(function(req, res, next) {
            new WalletController('bitcoin').create(req, res, next);
        })
        .get(function(req, res, next) {
            new WalletController('bitcoin').read(req, res, next);
        })
        .put(loadBitcoin, function(req, res, next) {
            req.controller.update(req, res, next);
        })
        .patch(loadBitcoin, function(req, res, next) {
            req.controller.update(req, res, next);
        })
    // delete is withdraw
        .delete(function(req, res, next) {
            req.controller = new WalletController(req.currency);
            req.controller.readMiddleware(req, res, next);
        }, function(req, res, next) {
            req.controller.withdraw(req, res, next);
        });

    return router;
};
