'use strict';

var async = require('async');

/**
 * Blockchain module
 *
 * Allows searching for a transaction by txid and
 * returns a parsed object in the callback
 *
 * Also has method for getting the transaction
 * category (sent or received)
 */

module.exports = function(cryptod, logger) {
    /**
     * getRaw(txid, cb)
     * 
     * get the raw transaction data from the crypto wallet daemon
     *
     * @param {String} txid A transaction ID
     * @param {Function} cb Callback, gets sent (err, rawTx)
     */
    var getRaw = function(txid, cb) {
        logger.info('getting raw %s', txid);
        cryptod.getRawTransaction(txid, 1, function(err, rawTx) {
            if (err) return cb(err);
            logger.info('raw found');
            cb(undefined, rawTx);
        });
    };

    /**
     * getTransactionCategory(txid, cb)
     *
     * get the category for the supplied txid
     *
     * cb function will be sent a string, either
     * 'receive' or 'send'
     */
    var getTransactionCategory = function(txid, cb) {
        cryptod.getTransaction(txid, function(err, txdata) {
            if (err) return cb(err);
            var cat = 'receive';
            txdata.details.forEach(function(detail) {
                if (detail.category === 'send') {
                    cat = 'send';
                }
            });
            cb(undefined, cat);
        });
    };

    /**
     * getTxFee(tx, cb)
     *
     * Gets the transaction fee by loking up the previous transactions
     *
     * @param {Object|String} tx the txid or a transaction object from processRaw()
     * @param {function} cb Callback, gets (err, fee). Fee is in Satoshi
     */
    var getTxFee = function(tx, cb) {
        if (typeof tx === 'string') {
            getRaw(tx, function(err, raw) {
                if (err) return cb(err);
                try {
                    var actualTx = processRaw(raw);
                    return getTxFee(actualTx, cb);
                } catch (ex) {
                    return cb(ex);
                }
            });
        } else {
            var totalOut = tx.outputs.reduce(function(total, output) { return total + output.amount; }, 0);
            var totalIn = 0;
            async.each(tx.inputs, function(input, done) {
                getRaw(input.txid, function(err, inputRaw) {
                    if (err) return done(err);
                    var inputTx;
                    var ex;
                    try {
                        inputTx = processRaw(inputRaw);
                        totalIn += inputTx.outputs[input.vout].amount;
                    } catch (exception) {
                        ex = exception;
                    }
                    done(ex);
                });
            }, function(err) {
                if (err) return cb(err);
                return cb(undefined, totalIn - totalOut);
            });
        }
    };

    /**
     * processRaw(raw)
     *
     * Process a raw transaction, putting the data into a more usefule and streamlined structure
     *
     * @param {Object} rawTx A raw tx object from getRaw()
     */
    var processRaw = function(raw) {
        var tx = {
            txid: raw.txid,
            time: new Date()
        };
        tx.confirmations = raw.confirmations || 0;
        // process input and output scripts
        logger.info('processesing', tx);
        tx.outputs = [];
        raw.vout.forEach(function(script) {
            if(!script.scriptPubKey.addresses) {
                logger.error('cannot decode address for txid %s script', raw.txid);
                throw new Error("cannot decode address for output");
            }
            var address = script.scriptPubKey.addresses[0];
            var vout = script.n;
            var amount = script.value.toSatoshi();
            tx.outputs[vout] = {vout: vout, amount: amount, address: address};
        });
        logger.info('outputs found', tx.outputs);
        tx.inputs = [];
        raw.vin.forEach(function(input) {
            tx.inputs.push({txid: input.txid, vout: input.vout});
        });
        return tx;
    };


    /**
     * getTransaction(txid, cb)
     *
     * Uses the other functions in this module to get a complete data
     * representation of a transaction
     *
     * @param {String} txid The transaction ID as a string
     * @param {Function} cb Callback, gets (err, tx)
     */
    var getTransaction = function(txid, cb) {
        async.waterfall([
            function(done) {
                getTransactionCategory(txid, done);
            },
            function(category, done) {
                getRaw(txid, function(err, raw) {
                    if(err) return done(err);
                    try {
                        var tx = processRaw(raw);
                        tx.category = category;
                        done(undefined, tx);
                    } catch (ex) {
                        return done(ex);
                    }

                });
            },
            function(tx, done) {
                getTxFee(tx, function(err, fee) {
                    if (err) return done(err);
                    tx.fee = fee;
                    return done(undefined, tx);
                });
            }
        ], function(err, tx) {
            if (err) return cb(err);
            return cb(undefined, tx);
        });
    };

    return {
        getTransaction: getTransaction,
        getTxFee: getTxFee,
        getTransactionCategory: getTransactionCategory,
        getRaw: getRaw,
        processRaw: processRaw
    };
};

