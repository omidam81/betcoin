'use strict';

var express = require('express');

module.exports = function(BackofficeController, SupportController, adminAuth, HTTPError, logger, User, io, getExchangeRate) {
    var router = express.Router({
        mergeParam: true
    });

    router.use(adminAuth.checkToken);

    router.use(function(req, res, next) {
        if (!req.user.totp() || !req.user.totpSecret()) {
            return next(new HTTPError(417, "You must enable 2 factor authentication"));
        }
        return next();
    });

    var supportRouter = express.Router({
        mergeParam: true
    });

    var supportController = new SupportController();

    router.get('/exchange-rate', function(req, res) {
        return res.json(getExchangeRate());
    });

    supportRouter.get('/admins', supportController.getAssignableAdmins.bind(supportController));
    supportRouter.route('/ticket/:ticketId?')
        .all(supportController.readMiddleware.bind(supportController))
        .get(supportController.read.bind(supportController))
        .put(supportController.addResponse.bind(supportController))
        .delete(supportController.closeTicket.bind(supportController));

    router.use('/support', supportRouter);

    var backofficeController = new BackofficeController();

    router.use(function(req, res, next) {
        if (req.query.showIgnored) {
            req.query.showIgnored = (req.query.showIgnored === "true" || req.query.showIgnored === true) ? true : false;
        } else {
            req.query.showIgnored = false;
        }
        next();
    });

    router.get('/active-users', function(req, res) {
        return res.json(io.activeSockets());
    });

    router.get('/query/:collection/:id?', backofficeController.getCollection.bind(backofficeController),
               backofficeController.read.bind(backofficeController));
    router.get('/aggregate/:collection', backofficeController.getCollection.bind(backofficeController),
               backofficeController.aggregate.bind(backofficeController));
    router.get('/count/:collection', backofficeController.getCollection.bind(backofficeController),
               backofficeController.count.bind(backofficeController));
    router.get('/schema/:collection', backofficeController.getCollection.bind(backofficeController),
               backofficeController.getSchema.bind(backofficeController));


    // only super admins from here
    router.use(function(req, res, next) {
        if (req.user.accessLevel() > 1) {
            return next(new HTTPError(401, "You cannot access this data"));
        }
        if (!req.user.totp()) {
            return next(new HTTPError(401, "You musthave 2 factor auth enabled to access this data"));
        }
        next();
    });

    router.get('/bankroll', backofficeController.getBankroll.bind(backofficeController));

    router.get('/reports/:type/', backofficeController.getHistory.bind(backofficeController));
    router.get('/totals/:game', backofficeController.gameTotals.bind(backofficeController));

    router.post('/save/alert', backofficeController.saveEmailAlert.bind(backofficeController));
    router.get('/save/alert/:alertId?', backofficeController.readEmailAlert.bind(backofficeController));
    router.put('/save/alert/:alertId', backofficeController.updateEmailAlert.bind(backofficeController));
    router.delete('/save/alert/:alertId', backofficeController.removeEmailAlert.bind(backofficeController));
    router.post('/save/search', backofficeController.saveSearch.bind(backofficeController));
    router.put('/save/search/:searchId', backofficeController.updateSearch.bind(backofficeController));
    router.delete('/save/search/:searchId', backofficeController.deleteSearch.bind(backofficeController));
    router.post('/message', backofficeController.sendNotification.bind(backofficeController));

    // router for all user functions, all POST calls at the moment
    var userRouter = express.Router({mergeParam: true});
    // extract target user for all routes with userId in them
    userRouter.param('userId', function(req, res, next, userId) {
        User.find(userId, function(err, user) {
            if (err) return next(new HTTPError(err));
            if (!user) return next(new HTTPError(404, "User %s not found", userId));
            req.targetUser = user;
            return next();
        });
    });

    userRouter.post('/:userId/lock', backofficeController.lockUser.bind(backofficeController));
    userRouter.post('/:userId/ignore', backofficeController.ignoreUser.bind(backofficeController));
    userRouter.post('/:userId/disable', backofficeController.disableUser.bind(backofficeController));
    userRouter.post('/:userId/withdraw', backofficeController.changeWithdraw.bind(backofficeController));
    userRouter.post('/:userId/password', backofficeController.changePassword.bind(backofficeController));
    userRouter.post('/:userId/cashout', backofficeController.cashoutUser.bind(backofficeController));
    userRouter.post('/:userId/bonus', backofficeController.giveBonus.bind(backofficeController));
    userRouter.post('/:userId/vip/:action', backofficeController.processVipChange.bind(backofficeController));
    userRouter.post('/:userId/vip-level', backofficeController.changeVipLevel.bind(backofficeController));
    userRouter.post('/:userId/cashout-limits', backofficeController.changeCashoutLimits.bind(backofficeController));

    router.use('/user', userRouter);

    router.post('/notification', backofficeController.sendNotification.bind(backofficeController));

    // only super duper admins from here
    router.use(function(req, res, next) {
        if (req.user.accessLevel() > 0) {
            return next(new HTTPError(401, "You cannot access this data"));
        }
        next();
    });

    router.post('/transaction/:action', backofficeController.creditDebitUser.bind(backofficeController));

    router.post('/send-crypto', backofficeController.sendCrypto.bind(backofficeController));
    router.get('/cashback/pay/:cashbackId', backofficeController.payCashback.bind(backofficeController));
    router.get('/cashout/:txid/:action?', backofficeController.sendCashout.bind(backofficeController));

    var configRouter = express.Router();

    configRouter.get('/', backofficeController.searchConfig.bind(backofficeController));
    configRouter.post('/:confId?', backofficeController.updateConfig.bind(backofficeController));

    router.use('/config', configRouter);

    return router;
};
