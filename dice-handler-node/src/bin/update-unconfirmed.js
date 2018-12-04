'use strict';

var mongo = require('mongowrap').getConnection();
var wallet = require('bitcoin-wallet');
require('../lib/loggers');
var logger = require('winston').loggers.get('main');

var MONGO_DB_NAME = 'casinodb';
var DICE_COLLECTION = 'dice';

mongo.getCollection(MONGO_DB_NAME, DICE_COLLECTION, function(err, dice) {
    if (err) throw err;
    var now = new Date();
    var refDate = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));
    dice.find({
        createdAt: {$lt: refDate},
        error: {$exists: false},
        $or: [{confirmed: {$exists: false}}, {confirmed: 0}]
    }).toArray(function(err, unconfirmed) {
        if (err) throw err;
        // sync loop and update if confirmed
        logger.log('debug', 'checking %d txs since %s for confirmations', unconfirmed.length, refDate.toISOString());
        var updated = 0;
        var syncUpdate = function() {
            var game = unconfirmed.shift();
            var badtxs = [
                'f7c8e7667b0d48095fcca811aff820eb45162ff148995486eb86c11f2b86ffe2',
                '9c4c0cf1f2e33d225e077a22f93fbec34b9b7a19f3eb9e395c2903c54a02faca'
            ];
            if (badtxs.indexOf(game.tx_out) >= 0){
                return syncUpdate();
            }
            logger.log('info', 'checking game', game);
            if (game !== undefined && game.tx_in !== undefined) {
                try {
                wallet.findTransaction(game.tx_in, function(err, tx) {
                    if (err) logger.log('error', err);
                    if (tx.confirmations) {
                        logger.log('info', 'updating game', game);
                        dice.update({_id: game._id}, {$set: {confirmed: 1}}, function(err) {
                            if (err) logger.log('error', err);
                            updated ++;
                            syncUpdate();
                        });
                    } else {
                        syncUpdate();
                    }
                });
                } catch (ex) {
                    logger.log('error', ex.message);
                    syncUpdate();
                }
            } else {
                logger.log('info', '%d updated', updated);
                process.exit();
            }
        };
        syncUpdate();
    });
});
