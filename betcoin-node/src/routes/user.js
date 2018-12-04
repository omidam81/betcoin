'use strict';

var express = require('express');

module.exports = function(auth,
                          UserController,
                          WalletController,
                          TransactionController,
                          AffiliateController,
                          CashbackController,
                          HTTPError) {
    var router = express.Router({
        mergeParam: true
    });

    var userController = new UserController();
    // user updates need the bitcoin wallet injected into the request
    var walletController = new WalletController('bitcoin');

    var verifyUserIsUser = function(req, res, next) {
        if (req.user.primary().toHexString() !== req.params.userId) {
            return next(new HTTPError(418, 'You cannot access another user'));
        }
        return next();
    };

    // auth route
    router.get('/auth', auth.getToken, function(req, res) {
        req.user.incrementLogin();
        return res.status(202).json(req.user.filter());
    });
    router.get('/token', function(req, res, next) {
        auth.checkToken(req, res, function(err) {
            if (err) return next(err);
            return res.status(202).send(req.user.filter());
        });
    });

    router.get('/confirm/email/:emailToken', userController.verifyEmail.bind(userController));
    router.get('/resend-email', auth.checkToken, userController.resendVerificationEmail.bind(userController));
    router.get('/password/challenge', function(req, res) {
        return res.json({challenge: auth.generateToken()});
    });
    router.put('/password/reset', userController.resetPassword.bind(userController));

    var txController = new TransactionController();
    var cbController = new CashbackController();

    router.get('/history/transaction', auth.checkToken, txController.read.bind(txController));
    router.get('/history/wagered', auth.checkToken, txController.readTotalWagered.bind(txController));
    router.get('/history/cashback', auth.checkToken, cbController.read.bind(cbController));

    var affiliateController = new AffiliateController();

    router.get('/affiliate/earnings',
               auth.checkToken,
               affiliateController.getAffiliateStats.bind(affiliateController));
    router.get('/affiliate/transactions',
               auth.checkToken,
               affiliateController.getAffiliateTransactions.bind(affiliateController));
    router.get('/affiliate/:token', affiliateController.getAffiliate.bind(affiliateController));
    router.get('/associates',
               auth.checkToken,
               affiliateController.getAssociates.bind(affiliateController));

    // general user routes, any route with /somehting-here must
    // be put before this declaration
    router.route('/:userId?')
    // leave the post request before the token check so unauthed
    // users can sign up
        .post(userController.create.bind(userController))
    // for all other requests, do a token check
    // this will also inject the user into the request object for
    // future use at `req.user`
        .all(auth.checkToken)
    // make sure the user accessing the endpoint is the user to be operated on
        .all(verifyUserIsUser)
    // the other crud routes (delete is logout)
        .get(userController.read.bind(userController))
        .put(walletController.readMiddleware.bind(walletController), userController.update.bind(userController))
        .patch(walletController.readMiddleware.bind(walletController), userController.update.bind(userController))
        .delete(userController.delete.bind(userController));

    router.route('/:userId/totp')
        .all(auth.checkToken)
        .get(auth.generateTotpSecret)
        .put(auth.activateTotp)
        .delete(auth.deactivateTotp);

    router.use(auth.checkToken);

    return router;
};
