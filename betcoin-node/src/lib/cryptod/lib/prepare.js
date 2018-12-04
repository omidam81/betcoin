'use strict';

var queue = require('./queue');

module.exports = function(logger) {

    // auto get the change address
    var CHANGE_ADDRESS = {};
    var getChangeAddress = function(cb) {
        if (CHANGE_ADDRESS[this.currency]) return cb(undefined, CHANGE_ADDRESS[this.currency]);
        var self = this;
        logger.verbose("getting change address from %sd", this.currency);
        this.getAddressesByAccount('change', function(err, addrs) {
            if (err) return cb(err);
            if (addrs.length) {
                CHANGE_ADDRESS[self.currency] = addrs[0];
                return cb(undefined, addrs[0]);
            } else {
                self.getNewAddress('change', function(err, addr) {
                    if (err) return cb(err);
                    CHANGE_ADDRESS[self.currency] = addr;
                    cb(undefined, addr);
                });
            }
        });
    };

    return function(params, cb) {
        var RawTx = require('./rawtx')(this, logger);
        var self = this;
        getChangeAddress.call(this, function(err, changeAddress) {
            if (!params.changeAddress) params.changeAddress = changeAddress;
            logger.verbose("using change address %s", params.changeAddress);
            try {
                var failed = function(err) {
                    logger.verbose("a %s transaction failed, returning the error", self.currency);
                    return cb(err);
                };
                logger.verbose("creating raw %s tx", self.currency);
                var rawTx = new RawTx(params, {
                    signed: function(txid) {
                        logger.verbose("raw %s tx signed", self.currency);
                        rawTx.removeListener('failed', failed);
                        cb(undefined, txid, this);
                    }
                });
                rawTx.once('failed', failed);
                queue.push(rawTx);
            } catch (ex) {
                logger.error(ex.stack);
                return cb(ex);
            }
        });
    };
};
