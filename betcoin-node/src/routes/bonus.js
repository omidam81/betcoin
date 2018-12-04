'use strict';

var express = require('express');

module.exports = function(BonusController, WalletController) {
    var router = express.Router({
        mergeParam: true
    });

    var readWallet = function(req, res, next) {
        var wc = new WalletController(req.currency);
        wc.readMiddleware(req, res, next);
    };

    var bonusController = new BonusController();
    router.route('/level')
        .get(readWallet, bonusController.getBonusLevel.bind(bonusController));
    router.route('/request/:type')
        .get(readWallet, bonusController.create.bind(bonusController));
    router.route('/:bonusId?')
        .get(bonusController.read.bind(bonusController))
        .put(bonusController.update.bind(bonusController))
        .delete(bonusController.delete.bind(bonusController));

    return router;
};
