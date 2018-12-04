'use strict';

module.exports = function(logger) {

    var RawTx = require('./rawtx')(this, logger);

    return function(rawTx, cb) {
        var self = this;
        if (rawTx instanceof RawTx) {
            var failed = function(err) { return cb(err); };
            rawTx.cbs.sent = function(txid) {
                var fee = this.txfee;
                rawTx.removeListener('failed', failed);
                return cb(undefined, txid, fee);
            };
            rawTx.once('failed', failed);
            rawTx.send();
        } else if ('string' === typeof rawTx) {
            this.sendRawTransaction(rawTx, function(err, txid) {
                if (err) return cb(err);
                self.decodeRawTransaction(rawTx, function(err, decoded) {
                    if (err) {
                        logger.warn("error decoding hex to unlock the outputs");
                        return cb(undefined, txid);
                    }
                    self.lockUnspent(true, decoded.vin, function(err) {
                        if (err) logger.warn("error decoding hex to unlock the outputs");
                        return cb(undefined, txid);
                    });
                });
            });
        } else {
            return cb(new Error("Invalid raw tx passed to send function"));
        }
    };
};
