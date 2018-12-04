'use strict';



var MIN_FEE = (0.0001).toSatoshi();

module.exports = function() {
    var that = this;

    this.getContainer = function(){
        return this.container;
    };

    this.setContainer = function(container){
        this.container = container;
    };

    var processTx = function(tx) {
        var logger = that.getContainer().get('logger');
        logger.debug("processing tx: %s", tx.txid);
        var bitcoind = that.getContainer().get('bitcoind');
        var UserController = that.getContainer().get('UserController');
        var io = that.getContainer().get('notification');
        tx.outputs.addresses.forEach(function(address, vout) {
            UserController.getByDepositAddress(address, "btc", function(err, user) {
                if (err) {
                    if (err.code === 404) {
                        return;
                    } else {
                        return logger.error(err.message);
                    }
                }
                if (tx.inputs.length === 0) {
                    if (tx.confirmations < 100) {
                        logger.warn('not using coinbase transaction with %d confirmations, require 100', tx.confirmations);
                        return UserController.saveNotification(user._id, {
                            subject: "Coinbase Transaction Rejected",
                            message: "A coinbase transaction requires 100 confirmations to be deposited"
                        }, function(err) {
                            if (err) logger.error("error notifying player about coinbase tx: %s", err.message);
                        });
                    }
                }
                bitcoind.getTxFee(tx.txid, function(err, fee) {
                    if (err) {
                        logger.error(err.message);
                        fee = 0;
                    }
                    if (fee < MIN_FEE && tx.confirmations < 6) {
                        logger.warn('not using zero fee transaction with %d confirmations, require 6', tx.confirmations);
                        return UserController.saveNotification(user._id, {
                            subject: "Zero Fee Transaction Rejected",
                            message: "A zero fee transaction requires 6 confirmations to be deposited. " + tx.confirmations + " confirmations so far."
                        }, function(err) {
                            if (err) logger.error("error notifying player about zero fee tx: %s", err.message);
                        });
                    }
                    // logger.info("deposit for user %s", user._id, {});
                    var amount = tx.outputs.amounts[vout];
                    UserController.credit(user, amount, {
                        refId: tx.txid + ":" + vout,
                        meta: { address: address, txid: tx.txid, vout: vout },
                        currency: "btc",
                        type: "deposit"
                    }, function(err, _user, transaction) {
                        if (err) {
                            if (err.code === 409) {
                                return;
                            } else {
                                return logger.error(err.message);
                            }
                        }
                        logger.info('deposited %s for user %s (%s) (internal id %s)', amount.toBitcoin(), _user.alias, _user._id, transaction._id, {});
                        if (_user.socket) {
                            io.emit('deposit', _user.socket, transaction.refId, transaction.amtIn, _user);
                        } else {
                            logger.warn('user %s received deposit with no socket!', _user._id, {});
                        }
                    });
                });
            });
        });
    };

    var processBlock = function(blockHash) {
        var bitcoind = that.getContainer().get('bitcoind');
        var logger = that.getContainer().get('logger');
        logger.info('incoming block %s', blockHash);
        bitcoind.getAddressesByAccount("users", function(err, userAddresses) {
            if (err) return logger.error(err.message);
            bitcoind.listUnspent(1, 6, userAddresses, function(err, unspentLow) {
                if (err) return logger.error(err.message);
                logger.silly('%d outputs with >= 1 && <= 6 confirmations', unspentLow.length);
                bitcoind.listUnspent(100, 100, userAddresses, function(err, unspentHigh) {
                if (err) return logger.error(err.message);
                    logger.silly('%d outputs with 100 confirmations', unspentHigh.length);
                    var unspent = unspentLow.concat(unspentHigh);
                    if (err) return logger.error(err.message);
                    var txids = [];
                    var txsToPlay = [];
                    // there may be more than one output for a singe transaction, so
                    // filter the outputs so we only play each transaction once (the
                    // processTx will catch all applicable outputs from a
                    // single transaction)
                    unspent.forEach(function(output) {
                        if (txids.indexOf(output.txid) < 0) {
                            txids.push(output.txid);
                            txsToPlay.push(output);
                        }
                    });
                    txids.forEach(function(txid) {
                        bitcoind.findTransaction(txid, function(err, tx) {
                            if (err) return logger.error(err.message);
                            processTx(tx);
                        });
                    });
                });
            });
        });
    };

    this.listen = function(){
        var bitcoind = that.getContainer().get('bitcoind');
        var logger = that.getContainer().get('logger');
        logger.debug("connecting to bitcoind at %s", bitcoind.config.host);
        bitcoind.notifier.socketListen(bitcoind.config.host, 1337, function(err, bitcoinNotifier) {
            if (err) throw err;
            logger.debug('bitcoind listening');
            bitcoinNotifier.on(bitcoind.notifier.events.TX_RECEIVED, processTx);
            bitcoinNotifier.on(bitcoind.notifier.events.NEW_BLOCK, processBlock);
        });
    };
};
