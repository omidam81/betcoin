'use strict';

var util = require('util');
var extend = util._extend;
var events = require('events');
var DEFAULT_TX_FEE = 0.0001;
var MIN_OUTPUT_SIZE = 5460;

// change this to 'message' for less verbose error messages
var ERROR_PRINT = 'message';

module.exports = function(cryptod, logger) {

    /**
     * BitcoinRawTransaction
     *
     * A class that will construct, sign, and send a raw BTC transaction
     *
     * @param {Array} inputs An array of input objects, each containing (at least)
     * txid, vout, and amount (in Satoshi)
     * @param {Object} outputs A has of addresses and output amounts (in Satoshi)
     * @param txfee
     * @param changeAddress
     * @constructor
     *
     * Any amount not provided by the inputs that is needed for the outputs will be
     * retrieved from outputs available to the change address provided
     */
    var BitcoinRawTransaction = function(params, callbacks) {

        if (callbacks === undefined) callbacks = {};

        // you're gonna need it
        //
        // this is an example of why we should not do
        // real OO programming on an event driven stack
        var self = this;

        var requiredArgs = [
            'changeAddress'
        ];
        if (!params.inputs) {
            throw("No inputs");
        }
        this.inputs = params.inputs.slice();
        if (!params.outputs) {
            throw("No outputs");
        }
        // add up amounts from outputs object
        this.amount = 0;
        this.outputs = extend({}, params.outputs);
        Object.keys(this.outputs).forEach(function(outAddr) {
            this.amount += this.outputs[outAddr];
        }, this);
        this.cbs = {
            'outputs available': function() {
                this.prepareInputs();
            },
            'filled': function() {
                this.prepareRawTx();
            },
            'ready': function() {
                this.sign();
            },
            'signed': function() {
                this.send();
            },
            'sent': function() {

            },
            'already spent': function() {
                logger.error('double spend');
                this.emit('failed', BitcoinRawTransaction.FAIL_ALREADY_SPENT);
            },
            'insufficient funds': function() {
                logger.error('insufficient funds');
                this.emit('failed', BitcoinRawTransaction.FAIL_INSUFFICIENT_FUNDS);
            },
            'empty inputs': function() {
                logger.error('empty inputs passed, use forceEmptyInputs to override');
                this.emit('failed', BitcoinRawTransaction.FAIL_EMPTY_INPUTS);
            },
            'invalid inputs': function() {
                logger.error('invalid inputs passed, could not sign tx');
                this.emit('failed', BitcoinRawTransaction.FAIL_INVALID_INPUTS);
            }
        };
        var errs = [];

        this.failedFunc = function() {
            clearTimeout(self.timeout);
            this.inputs = params.inputs.slice();
            this.outputs = extend({}, params.outputs);
            if (params.txfee === undefined) {
                this.txfee = DEFAULT_TX_FEE;
                this.txfee = this.txfee.toSatoshi();
            } else if (params.txfee < 1) {
                this.txfee = this.txfee.toSatoshi();
            } else {
                this.txfee = params.txfee;
            }
            this.amountNeeded = this.amount + this.txfee;
            this.removeAllListeners('failed');
            for (var event in this.cbs) {
                if (this.cbs.hasOwnProperty(event)) {
                    this.removeAllListeners(event);
                }
            }
        };

        this.setupCallbacks = function() {
            // this.removeAllListeners();
            this.on('failed', this.failedFunc);
            for (var cbName in this.cbs) {
                if (this.cbs.hasOwnProperty(cbName)) {
                    if (callbacks.hasOwnProperty(cbName)) {
                        if (typeof callbacks[cbName] === 'function') {
                            this.cbs[cbName] = callbacks[cbName];
                        } else {
                            errs.push(cbName + ' callback provided is not a function');
                        }
                    }
                    this.on(cbName, this.cbs[cbName]);
                }
            }
        };



        requiredArgs.forEach(function(arg) {
            if (params.hasOwnProperty(arg)) {
                this[arg] = params[arg];
            } else {
                errs.push(arg + ' missing from params');
            }
        }, this);

        if (errs.length) {
            throw errs.join(', ');
        }



        // safeguard stupidity
        if (/\./.test(this.amount.toString())) {
            throw "satoshi should be an integer";
        }

        if (this.amount < MIN_OUTPUT_SIZE) {
            this.amount = MIN_OUTPUT_SIZE;
        }

        if (params.txfee === undefined) {
            this.txfee = DEFAULT_TX_FEE;
            this.txfee = this.txfee.toSatoshi();
        } else if (params.txfee < 1) {
            this.txfee = this.txfee.toSatoshi();
        } else {
            this.txfee = params.txfee;
        }

        this.amountNeeded = this.amount;
        this.amountNeeded += this.txfee;
        this.referenceAddresses = params.referenceAddresses;

        this.rawTx = '';
        this.signedTx = '';
        this.txid = '';

        if (params.minconf === undefined) {
            this.minconf = 1;
        } else {
            this.minconf = parseInt(params.minconf);
            if (isNaN(this.minconf) || this.minconf < 0) throw "invalid minconf parameter";
        }

        if (params.selectFrom) {
            if (Array.isArray(params.selectFrom)) {
                if (!params.selectFrom.length) throw "You cannot pass an empty array for selectFrom, use 'all' to actually select from anywhere";
                this.selectFrom = params.selectFrom.slice();
            } else if (params.selectFrom === 'all') {
                // this will select any output
                this.selectFrom = [];
            } else {
                throw "invalid selectFrom parameter";
            }
        } else {
            this.selectFrom = [this.changeAddress];
        }

        this.timeout = null;

        this.setTimer = function() {
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(function() {
                self.emit('failed', BitcoinRawTransaction.FAIL_TIMEOUT);
            }, 60000);
        };
        

        // if you know what address you are looking for, it will speed up the filtering
        // because bitcoind will send back fewer responses
        this.start = this.checkRefTxs = function() {
            // if this tx has already been processed, just send it
            // if it fails, it will clear itself out and try again anyway
            if (this.signedTx) return this.send();
            this.setupCallbacks();
            this.setTimer();
            logger.debug('sending %d to %j', this.amount.toBitcoin(), this.outputs, {});
            if (!this.inputs.length) {
                if (params.forceEmptyInputs === true) {
                    return self.emit('outputs available');
                } else {
                    return self.emit('empty inputs');
                }
            }
            var responseFunc = function(err, unspent) {
                if (err) {
                    logger.error(err[ERROR_PRINT]);
                    self.emit('failed', BitcoinRawTransaction.FAIL_BITCOIND_ERROR);
                } else {
                    var outputsFound = [];
                    var outputsToFind = self.inputs.length;
                    logger.info('provided inputs: %s', JSON.stringify(self.inputs));
                    unspent.forEach(function(availableOutput) {
                        var txid = availableOutput.txid;
                        var vout = availableOutput.vout;
                        self.inputs.forEach(function(ref) {
                            if (ref.txid === txid && ref.vout === vout) {
                                outputsFound.push(txid);
                                if (outputsFound.length === outputsToFind) {
                                    clearTimeout(self.timeout);
                                    // triggers prepareInputs by default
                                    return self.emit('outputs available');
                                }
                            }
                        });
                    });
                    if (outputsFound.length !== outputsToFind) {
                        clearTimeout(self.timeout);
                        // removes all listeners by default
                        return self.emit('already spent');
                    }
                }
            };

            cryptod.listUnspent(0, 9999999, responseFunc);
        };


        var mapfunc = function(e) {
            return {txid: e.txid, vout: e.vout, amount: e.amount.toSatoshi(), confirmations: e.confirmations};
        };
        var confirmsort = function(a,b) {
            return (a.confirmations > b.confirmations) ? -1 : 1;
        };

        var qualifiedFilter = function(mapped, threshold) {
            var subTotal = 0;
            var filtered = mapped.filter(function(output) {
                var qualified = (output.amount >= (self.amountNeeded / threshold)) && (output.amount <= (self.amountNeeded * threshold));
                if (qualified) {
                    subTotal += output.amount;
                }
                return qualified;
            });
            return {qualified: filtered, subTotal: subTotal};
        };

        this.getViableOutputs = function(cb) {
            this.setTimer();
            var self = this;
            cryptod.listUnspent(this.minconf, 9999999, this.selectFrom, function(err, unspent) {
                if (err) return cb(err);
                logger.debug('choosing from %d outputs belonging to %s', unspent.length, self.selectFrom, {});
                var mapped = unspent.map(mapfunc);
                var threshold = 1;
                var suitableFound = false;
                while (!suitableFound && threshold < 100) {
                    var thisResult = qualifiedFilter(mapped, threshold);
                    if (thisResult.qualified.length && thisResult.subTotal >= (self.amountNeeded + MIN_OUTPUT_SIZE)) {
                        suitableFound = true;
                        logger.debug('found %d outputs totaling %d', thisResult.qualified.length, thisResult.subTotal.toBitcoin());
                        return cb(undefined, thisResult.qualified.sort(confirmsort));
                    }
                    threshold += 0.2;
                }
                clearTimeout(self.timeout);
                cb(undefined, mapped.sort(confirmsort));
            });
        };

        this.prepareInputs = function() {
            this.setTimer();
            var refs = {};
            this.inputs.forEach(function(input) {
                this.amountNeeded -= input.amount;
                refs[input.txid] = input.vout;
            }, this);
            if (this.amountNeeded > (-1 * MIN_OUTPUT_SIZE) && this.amountNeeded !== 0) {
                this.getViableOutputs(function(err, unspent) {
                    if (err) {
                        logger.error(err[ERROR_PRINT]);
                        self.emit('failed', BitcoinRawTransaction.FAIL_BITCOIND_ERROR);
                    } else {
                        unspent.forEach(function(availableOutput) {
                            if (self.inputs.length > 15) {
                                self.txfee += 2000;
                                self.amountNeeded += 2000;
                            }
                            if (self.amountNeeded > (-1 * MIN_OUTPUT_SIZE) && self.amountNeeded !== 0) {
                                var ref = refs[availableOutput.txid];
                                if (ref !== undefined && ref === availableOutput.vout) return;
                                self.amountNeeded -= availableOutput.amount;
                                self.inputs.push({
                                    txid: availableOutput.txid,
                                    vout: availableOutput.vout
                                });
                            }
                        });
                        clearTimeout(self.timeout);
                        // triggers prepareRawTx by default
                        self.emit('filled');
                    }
                });
            } else {
                clearTimeout(self.timeout);
                // triggers prepareRawTx by default
                this.emit('filled');
            }
        };

        this.prepareRawTx = function() {
            var self = this;
            this.setTimer();
            Object.keys(this.outputs).forEach(function(outAddr) {
                this.outputs[outAddr] = this.outputs[outAddr].toBitcoin();
            }, this);
            logger.debug('inputs: %s, outputs: %s, amount needed: %d', JSON.stringify(this.inputs), JSON.stringify(this.outputs), this.amountNeeded.toBitcoin());
            if (this.amountNeeded <= 0) {
                if (this.amountNeeded !== 0 && (this.amountNeeded * -1) > MIN_OUTPUT_SIZE) {
                    if (! this.outputs.hasOwnProperty(this.changeAddress)) {
                        this.outputs[this.changeAddress] = 0;
                    }
                    this.outputs[this.changeAddress] += ((this.amountNeeded * -1.0)).toBitcoin();
                }
                logger.debug('generated outputs', this.outputs);
                cryptod.createRawTransaction(this.inputs, this.outputs, function(err, rawTx) {
                    if (err) {
                        logger.error('error preparing raw tx: %s', err[ERROR_PRINT]);
                        self.emit('failed', BitcoinRawTransaction.FAIL_BITCOIND_ERROR);
                    } else {
                        self.rawTx = rawTx;
                        // lock the outputs so they no longer show up in
                        // listUnspent
                        cryptod.lockUnspent(false, self.inputs, function(err) {
                            if (err) {
                                logger.error('error locking outputs: %s', err[ERROR_PRINT]);
                                self.emit('failed', BitcoinRawTransaction.FAIL_BITCOIND_ERROR);
                            } else {
                                clearTimeout(self.timeout);
                                // triggers sign() by default
                                self.emit('ready');
                            }
                        });
                    }
                });
            } else {
                clearTimeout(self.timeout);
                // removes all listeners by default
                this.emit('insufficient funds');
            }
        };

        this.getDecodedRaw = function(cb) {
            if (self.decodedRaw === null) {
                cryptod.decodeRawTransaction(self.signedTx, function(err, decoded) {
                    if (err) cb(err);
                    self.decodedRaw = decoded;
                    cb(undefined, self.decodedRaw);
                });
            } else {
                cb(undefined, self.decodedRaw);
            }
        };

        this.sign = function() {
            var self = this;
            this.setTimer();
            cryptod.signRawTransaction(this.rawTx, function(err, signedTx) {
                if (err) {
                    logger.error('error signing tx: %s', err[ERROR_PRINT]);
                    self.emit('failed', BitcoinRawTransaction.FAIL_BITCOIND_ERROR);
                } else {
                    if (signedTx.complete) {
                        self.signedTx = signedTx.hex;
                        logger.info('signed');
                        clearTimeout(self.timeout);
                        self.decodedRaw = null;
                        // triggers send() by default
                        // if you want to not send yet, just pass in a 'signed'
                        // parameter in the cbs object upon creation
                        self.getDecodedRaw(function(err, decoded) {
                            if (err) {
                                logger.error('error decoding raw: %s', err.message);
                                decoded = {txid: 'decode error'};
                            }
                            self.emit('signed', decoded.txid);
                        });
                    } else {
                        self.emit('invalid inputs');
                    }
                }

            });
        };

        this.send = function() {
            var self = this;
            this.setTimer();
            cryptod.sendRawTransaction(this.signedTx, function(err, txId) {
                if (err) {
                    logger.error('error sending tx: %s', err[ERROR_PRINT]);
                    self.emit('failed', BitcoinRawTransaction.FAIL_BITCOIND_ERROR);
                } else {
                    self.txId = txId;
                    self.txid = txId;
                    clearTimeout(self.timeout);
                    logger.debug('tx sent: %s', txId);
                    cryptod.lockUnspent(true, self.inputs, function(err) {
                        // if this fails, still emit the send, since the outputs
                        // can remain "locked" after they have been sent, we can;t
                        // use them anymore anyway
                        if (err) logger.warn("There was an error unlocking some spent outputs, not really a big deal: %s", err[ERROR_PRINT]);
                        self.emit('sent', self.txId); // this is usually overridden, does nothing by default
                    });
                }
            });
        };
    };

    BitcoinRawTransaction.FAIL_ALREADY_SPENT = 1;
    BitcoinRawTransaction.FAIL_INSUFICCIENT_FUNDS = 2;
    BitcoinRawTransaction.FAIL_TIMEOUT = 3;
    BitcoinRawTransaction.FAIL_BITCOIND_ERROR = 4;
    BitcoinRawTransaction.FAIL_EMPTY_INPUTS = 5;
    BitcoinRawTransaction.FAIL_INVALID_INPUTS = 6;

    util.inherits(BitcoinRawTransaction, events.EventEmitter);

};
