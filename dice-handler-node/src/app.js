'use strict';

if (process.env.USE_NEWRELIC) {
    require('newrelic');
}
var argv = require('yargs').default('minconf', 1).argv;
var bitcoinWallet = require('bitcoin-wallet');
var mongo = require('mongowrap').getConnection();
var dice = require('./lib/dice.js');
var io = require('./lib/socket-server')(1338);
require('./lib/number-prototypes');
require('./lib/loggers');
var logger = require('winston').loggers.get('main');

var BITCOIN_DB_NAME = 'bitcoin';
var RECEIVED_COLLECTION = 'received';

var PREVIOUS_INPUT_MIN_CONF = 1;

var CUSTOM_WITHRAWAL_TRIGGER = (0.00519990).toSatoshi();

var diceAddresses = [];

bitcoinWallet.getAddressesByAccount('dice', function(err, addresses) {
    if (err) throw err;
    diceAddresses = addresses;
    var bitcoinNotifierReady = function(err, txNotifier) {
        logger.log('silly', 'bitcoind listener running');
        txNotifier.on(bitcoinWallet.notifier.events.NEW_BLOCK, newBlockFunc);
        txNotifier.on(bitcoinWallet.notifier.events.TX_RECEIVED, checkFee);
    };
    if (bitcoinWallet.config.host === 'localhost') {
        logger.log('silly', 'listening to bitcoind on localhost');
        bitcoinWallet.notifier.listen(1339, bitcoinNotifierReady);
    } else {
        logger.log('silly', 'attempting to listen to bitcoind over websocket from %s', bitcoinWallet.config.host);
        bitcoinWallet.notifier.socketListen(bitcoinWallet.config.host, 1337, bitcoinNotifierReady);
    }
});

var checkFee = function(tx) {
    var tries = 0;
    var tryTxFee = function(tx) {
        bitcoinWallet.getTxFee(tx.txid, function(err, fee) {
            if (err) {
                if (tries < 10) {
                    tries ++;
                    return setTimeout(tryTxFee, 3000, tx);
                } else {
                    return logger.log('error', 'Error getting tx fee: %s', err.message, {txid: tx.txid});
                }
            }
            if (fee >= (0.00001).toSatoshi()) {
                logger.debug("tx %s passed fee check", tx.txid);
                checkInputs(tx);
            } else {
                logger.log('warn', 'not processing bet with non standard tx fee', tx, {});
            }
        });
    };
    tryTxFee(tx);
};


var checkInputs = function(tx) {
    var inputs = tx.inputs.slice();
    var looper = function() {
        var input = inputs.shift();
        if (!input) {
            logger.debug("tx %s passed input check", tx.txid);
            return newTxFunc(tx);
        }
        bitcoinWallet.findTransaction(input.txid, function(err, inputTx) {
            if (err) return logger.error("error getting input tx, waiting for 1 confirmation");
            if (inputTx.confirmations >= PREVIOUS_INPUT_MIN_CONF) {
                return looper();
            } else {
                return logger.warn("previous input with fewer than %s confirmations, waiting for bet to confirm", PREVIOUS_INPUT_MIN_CONF);
            }
        });
    };
    looper();
};

var newBlockFunc = function(blockHash) {
    logger.log('info', 'incoming block %s', blockHash);
    bitcoinWallet.listUnspent(argv.minconf, 9999999, diceAddresses, function(err, unspent) {
        logger.log('info',unspent);
        logger.log('info', '%d bets with >= %d confirmations', unspent.length, argv.minconf);
        mongo.getCollection(BITCOIN_DB_NAME, RECEIVED_COLLECTION, function(err, collection) {
            if (err) return logger.log('error', err.message);
            var txids = [];
            var txsToPlay = [];
            // there may be more than one output for a singe transaction, so
            // filter the outputs so we only play each transaction once (the
            // newTxFunc will catch all applicable outputs from a
            // single transaction)
            unspent.forEach(function(output) {
                if (txids.indexOf(output.txid) < 0) {
                    txids.push(output.txid);
                    txsToPlay.push(output);
                }
            });
            txsToPlay.forEach(function(tx) {
                // look in the db first, then get fram a raw tx if needed
                // this functionality should probably be moved into the
                // bitcoin-wallet module
                collection.findOne({_id: tx.txid}, function(err, txDoc) {
                    if (err) return logger.log('error', err.message);
                    if (txDoc) {
                        txDoc.confirmations = tx.confirmations;
                        newTxFunc(txDoc);
                    } else {
                        bitcoinWallet.findTransaction(tx.txid, function(err, tx) {
                            if (err) return logger.log('error', err.message);
                            tx.seenBy = [];
                            tx.usedBy = false;
                            newTxFunc(tx);
                        });
                    }
                });
            });
            dice.checkUnconfirmed(function(err, updatedCount) {
                if (err) return logger.log('error', err.message);
                logger.log('info', 'Updated %d games to be confirmed', updatedCount);
            });
            dice.sendSuspended(function(err, count, txid) {
                if (err) return logger.log('error', 'error sending suspended losses: %s', err.message);
                if (count) {
                    logger.log('info', 'sent %d losses %s', count, JSON.stringify(txid));
                } else {
                    logger.log('info', 'no losses or threshold not met');
                }
            });
        });
    });
};

var newTxFunc = function(tx, cb) {
    if (cb === undefined) {
        cb = function(err) {
            if (err) return logger.error(err.message || err);
        };
    }
    if (tx.seenBy.indexOf('dice') < 0) {
        mongo.getCollection(BITCOIN_DB_NAME, RECEIVED_COLLECTION, function(err, collection) {
            if (err) return cb(err);
            collection.update({
                _id: tx._id
            }, {
                $push: {
                    seenBy: 'dice'
                }
            }, function(err) {
                if (err) return cb(err);
            });
        });
    } else {
        if (tx.confirmations === 0) {
            return;
        }
    }
    // player_id will hold the withdrawl address
    // either provided by the bettor, or selected by us
    // from the tx inputs
    var player_id = false;
    // look through the tx outputs and see if
    // there is a custom withdrawl address
    tx.outputs.amounts.forEach(function(amount, vout) {
        if (amount === CUSTOM_WITHRAWAL_TRIGGER) {
            player_id = tx.outputs.addresses[vout];
        }
    });
    if (!player_id) {
        player_id = tx.from[0];
    }
    var gamesToPlay = [];
    dice.getGameConfig(function(err, games) {
        if (err) return cb(err);
        games = games.filter(function(e) {
            return diceAddresses.indexOf(e.address) >= 0;
        });
        games.forEach(function(game) {
            tx.outputs.addresses.forEach(function(address, index) {
                // tx.toAdfdresses is a map of addresses to vout and amount
                if (address === game.address) {
                    var vout = index;
                    // add an object to the gamesToPlay array that
                    // can be passed to DiceController.create
                    var gameToPlay = {};
                    gameToPlay.game = game._id;
                    logger.log('info', 'found bet for %s', game._id);
                    gameToPlay.tx_in = tx.txid;
                    gameToPlay.minBet = game.minBet;
                    gameToPlay.maxBet = game.maxBet;
                    gameToPlay.output_number = vout;
                    gameToPlay.wager = tx.outputs.amounts[vout];
                    gameToPlay.player_id = player_id;
                    gameToPlay.confirmed = tx.confirmations;
                    gamesToPlay.push(gameToPlay);
                }
            });
        });
        var completedGames = [];
        if (gamesToPlay.length) {
            // update the tx doc saying that dice is going to use it
            mongo.getCollection(BITCOIN_DB_NAME, RECEIVED_COLLECTION, function(err, collection) {
                if (err) return cb(err);
                collection.update({
                    _id: tx._id
                }, {
                    $set: {
                        usedBy: 'dice'
                    }
                }, function(err) {
                    if (err) return cb(err);
                });
            });
            var gameCb = function(err, rollData) {
                if (err) return cb(err);
                if (rollData.confirmed) {
                    logger.log('info', 'dice confirmed %s:%d', rollData.tx_in, rollData.output_number);
                } else if (rollData.winnings > rollData.wager) {
                    logger.log('info', 'dice won %s:%d payout: %d', rollData.tx_in, rollData.output_number, rollData.winnings.toBitcoin());
                } else {
                    logger.log('info', 'dice lost %s:%d payout: %d', rollData.tx_in, rollData.output_number, rollData.winnings.toBitcoin());
                }
                io.broadcast('new-dice', rollData);
                completedGames.push(rollData);
                if (cb && completedGames.length === gamesToPlay.length) {
                    return cb(undefined, completedGames);
                }
            };
            gamesToPlay.forEach(function(gameData) {
                dice.getSuspendedLoss(gameData.tx_in, gameData.output_number, function(err, loss) {
                    if (err) {
                        logger.error("error getting suspended loss: %s", err.message);
                        return dice.play(gameData, gameCb);
                    }
                    if (loss) {
                        logger.warn("a suspended loss tried to play again");
                        bitcoinWallet.lockUnspent('lock', [{txid: gameData.tx_in, vout: gameData.output_number}], function(err) {
                            if (err) return logger.error("error locking suspended loss %s", err.message);
                        });
                    } else {
                        dice.play(gameData, gameCb);
                    }
                });
                dice.play(gameData, gameCb);
            });
        }
    });
};

module.exports.recoverTx = function(txid, cb) {
    bitcoinWallet.findTransaction(txid, function(err, tx) {
        if (err) return logger.log('error', err.message);
        tx.seenBy = [];
        tx.usedBy = false;
        newTxFunc(tx, cb);
    });
};
