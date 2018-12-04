'use strict';

var async = require('async');
var format = require('util').format;

module.exports = function(cryptod, Wallet, Transaction, logger, io, NotificationController, Config, CURRENCIES) {

    var noteController = new NotificationController();

    var processOutput = function(output, cb) {
        // this === tx parent of the output
        var self = this;
        var currency;
        async.waterfall([
            // get the wallet
            function getTheWallet(done) {
                Wallet.get({depositAddress: output.address}, function(err, wallet) {
                    if (err) return done(err);
                    if (!wallet) {
                        err = new Error("Wallet not found");
                        err.code = 404;
                        return done(err);
                    }
                    currency = wallet.currency();
                    return done(undefined, wallet);
                });
            },
            function getConfirmationConfiguration(wallet, done) {
                Config.get(currency + 'Confirmations', function(err, confirmationConf) {
                    if (err) return done(err);
                    return done(undefined, wallet, confirmationConf);
                });
            },
            function checkAndDeposit(wallet, confirmationConf, done) {
                var errString;
                var noteString;
                logger.crypto("processing %s tx: %s", wallet.currency(), self.txid);
                if (self.inputs.length === 0 && self.confirmations < confirmationConf.coinbase) {
                    // reject coinbase txs with less than 100 confs
                    noteString = "We received a deposit using a coinbase transaction. " +
                        "This deposit will be credited when the transaction has reached " +
                        confirmationConf.coinbase + " confirmations";
                    return noteController.create(wallet.userId(), {
                        subject: format('Witheld %s deposit', wallet.currency()),
                        message: noteString
                    }, function(err) {
                        if (err) logger.error(err.message);
                        errString = format('not using coinbase %s transaction with %d confirmations, require %d'.yellow,
                                           wallet.currency(),
                                           self.confirmations,
                                           confirmationConf.coinbase);
                        return done(new Error(errString));
                    });
                }
                if (self.fee < confirmationConf.minfee && self.confirmations < confirmationConf.lowfee) {
                    // reject txs with low fees AND low confirmations,
                    // this prevents double spend attacks (kinda)
                    noteString = "We received a deposit with a low transaction fee. " +
                        "This deposit will be credited when the transaction has reached " +
                        confirmationConf.lowfee + " confirmations";
                    return noteController.create(wallet.userId(), {
                        subject: format('Witheld %s deposit', wallet.currency()),
                        message: noteString
                    }, function(err) {
                        if (err) logger.error(err.message);
                        errString = format('not using low fee %s transaction with %d confirmations, require %d'.yellow,
                                           wallet.currency(),
                                           self.confirmations,
                                           confirmationConf.lowfee);
                        return done(new Error(errString));
                    });
                }
                wallet.credit({
                    amount: output.amount,
                    refId: self.txid + ":" + output.vout,
                    type: 'deposit',
                    meta: {
                        txid: self.txid,
                        vout: output.vout
                    }
                }, function walletFinishedCredit(err, transaction) {
                    if (err) return done(err);
                    io.playerEmit(transaction.userId(), 'deposit', transaction, wallet);
                    noteString = "Successful deposit for " + output.amount.toBitcoinString() + ' ' + transaction.currency();
                    noteController.create(wallet.userId(), {
                        subject: format("Deposited %s", wallet.currency()),
                        message: noteString
                    }, function(err) {
                        if (err) logger.error(err.message);
                        logger.crypto('deposited %d %s for user %s',
                                      output.amount.toBitcoinString(),
                                      transaction.currency(),
                                      transaction.userId(), {});
                        done(undefined, transaction);
                    });
                });
            }
        ], function(err) {
            if (err) {
                if (err.code === 409) {
                    logger.verbose("ignoring duplicate %s transaction: %s", currency, self.txid);
                } else {
                    logger.crypto(err.message);
                }
            }
            // if there is an error, do not block the rest of the
            // deposits, just continue on after loggin it, maybe there
            // should be some kind of admin notification here
            cb();
        });
    };

    var processTx = function(tx) {
        // filter the outputs so we are only dealing with outputs
        // that actually have a wallet and do not exist already in the database
        async.filter(tx.outputs, function(output, isGood) {
            Wallet.get({depositAddress: output.address}, function(err, wallet) {
                if (err) return isGood(false);
                if (!wallet) return isGood(false);
                Transaction.get({refId: tx.txid + ":" + output.vout}, function(err, transaction) {
                    if (err) return isGood(false);
                    if (transaction) {
                        logger.verbose("ignoring duplicate transaction: %s", tx.txid);
                        return isGood(false);
                    }
                    return isGood(true);
                });
            });
        }, function(depositOutputs) {
            // bind the output processor to the tx and run each
            // eligable deposit output
            async.each(depositOutputs, processOutput.bind(tx), function(err) {
                if (err) return logger.error(err);
            });
        });
    };

    var getBlockProcessor = function(currency) {
        var coind = cryptod(currency);
        return function(blockHash) {
            logger.silly('incoming %s block %s', coind.currency, blockHash);
            async.waterfall([
                coind.getUserAddresses.bind(coind),
                function(userAddresses, junkdata, done) {
                    Config.get(currency + 'Confirmations', function(err, confirmationConf) {
                        if (err) return done(err);
                        return done(undefined, confirmationConf, userAddresses);
                    });
                },
                function(confirmationConf, userAddresses, done) {
                    logger.silly('got %s user addresses (%d)', coind.currency, userAddresses.length);
                    coind.listUnspent(1, confirmationConf.lowfee, userAddresses, function(err, unspentLow) {
                        if (err) return done(err);
                        return done(undefined, confirmationConf, userAddresses, unspentLow);
                    });
                },
                function(confirmationConf, userAddresses, unspentLow, done) {
                    logger.silly('%d %s outputs with >= 1 && <= %d confirmations', unspentLow.length, coind.currency, confirmationConf.lowfee);
                    coind.listUnspent(confirmationConf.coinbase, confirmationConf.coinbase, userAddresses, function(err, unspentHigh) {
                        if (err) return done(err);
                        logger.silly('%d %s outputs with %d confirmations', unspentHigh.length, coind.currency, confirmationConf.coinbase);
                        var unspent = unspentLow.concat(unspentHigh);
                        if (err) return done(err);
                        var txids = [];
                        var txsToDeposit = [];
                        // there may be more than one output for a singe transaction, so
                        // filter the outputs so we only play each transaction once (the
                        // processTx will catch all applicable outputs from a
                        // single transaction)
                        unspent.forEach(function(output) {
                            if (txids.indexOf(output.txid) < 0) {
                                txids.push(output.txid);
                                txsToDeposit.push(output);
                            }
                        });
                        txids.forEach(function(txid) {
                            coind.emitTransaction(txid);
                        });
                        done();
                    });
                }
            ], function(err) {
                if (err) return logger.error(err.message);
            });
        };
    };

    return {
        listen: function (cb) {
            async.each(CURRENCIES, function(currency, done) {
                var coind = cryptod(currency);
                logger.verbose('connecting to %sd', coind.currency);
                coind.getNotifier(function(err, notifier) {
                    if (err) return done(err);
                    logger.crypto("%sd listening", currency);
                    notifier.on(coind.events.TX_RECEIVED, processTx);
                    notifier.on(coind.events.NEW_BLOCK, getBlockProcessor(currency));
                    done();
                });
            }, function(err) {
                return cb(err);
            });
        }
    };
};
