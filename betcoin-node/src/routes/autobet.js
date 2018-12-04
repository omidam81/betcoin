'use strict';

var express = require('express');
var async = require('async');

module.exports = function(AutobetController, AutobetWorkflow, HTTPError, logger, User, Wallet, CURRENCIES, getExchangeRate) {
    var router = express.Router({
        mergeParam: true
    });

    var autobetWorkflow = new AutobetWorkflow();
    autobetWorkflow.run();

    var autobetController = new AutobetController();

    var restrictUser = function(req, res, next) {
        if(req.user.username().indexOf('wayne_ab') === -1){
            return next(new HTTPError(401, 'you are not allowed to call this endpoint'));
        }
        next();
    };

    router.post('/player', restrictUser, function(req, res, next) {
        var user = new User({
            username: req.body.username,
            email: 'webmaster@betcoin.tm',
            ip: '0.0.0.0',
            ignore: 'autobet',
            vipLevel: 5
        });
        user.save(function(err) {
            if (err) return next(err);
            async.each(CURRENCIES, function(currency, done) {
                var wallet = new Wallet({
                    currency: currency,
                    userId: user.primary()
                });
                wallet.save(function(err) {
                    if (err) return done(err);
                    wallet.credit({
                        amount: getExchangeRate.convert((10000).toSatoshi(), currency),
                        type: 'autobet',
                        refId: 'autobet:init:' + currency + ":" + new Date().getTime()
                    }, function(err) {
                        if (err) return done(err);
                        req.params.player_id = user.primary().toHexString();
                        return done();
                    });
                });
            }, function(err) {
                if (err) return next(err);
                return autobetController.addNewUser(req, res, next);
            });
        });
    });

    router.get('/credit/:player_id', restrictUser, function(req, res, next) {
        User.get(req.params.player_id, function(err, user) {
            if (err) return next(err);
            if (!user) return next(new HTTPError("invallid user id %s", req.params.player_id));
            async.each(CURRENCIES, function(currency, done) {
                user.wallet(currency, function(err, wallet){
                    if (err) return done(err);
                    wallet.credit({
                        amount: getExchangeRate.convert((10000).toSatoshi(), currency),
                        type: 'autobet',
                        refId: 'autobet:init:' + currency + ":" + new Date().getTime()
                    }, function(err) {
                        if (err) return done(err);
                        req.params.player_id = user.primary().toHexString();
                        return done();
                    });
                });
            }, function(err) {
                if (err) return next(err);
                return res.send();
            });
        });
    });

    router.route('/games')
        .all(restrictUser)
        .get(autobetController.getGames);
    router.route('/:player_id?')
        .all(restrictUser)
        .get(autobetController.read.bind(autobetController))
        .post(autobetController.addNewUser.bind(autobetController));
    router.route('/:player_id/game/:gameId?')
        .all(restrictUser)
        .post(autobetController.addNewGameAutobet.bind(autobetController))
        .put(autobetController.updateGameAutobet.bind(autobetController))
        .delete(autobetController.removeGameAutobet.bind(autobetController));

    return router;
};
