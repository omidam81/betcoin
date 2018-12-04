'use strict';

var queue = require('./queue');

module.exports = function(cryptod, logger) {

    var RawTx = require('./rawtx')(cryptod, logger);
    // auto get the change address
    var CHANGE_ADDRESS;
    var getChangeAddress = function(cb) {
        if (CHANGE_ADDRESS) return cb(undefined, CHANGE_ADDRESS);
        cryptod.getAddressesBtAccount('change', function(err, addrs) {
            if (err) return cb(err);
            if (addrs.length) {
                CHANGE_ADDRESS = addrs[0];
                return cb(undefined, addrs[0]);
            } else {
                cryptod.getNewAddress('change', function(err, addr) {
                    if (err) return cb(err);
                    CHANGE_ADDRESS = addr;
                    cb(undefined, addr);
                });
            }
        });
    };
    
    return function(params, cb) {
        getChangeAddress(function(err, changeAddress) {
            if (!params.changeAddress) params.changeAddress = changeAddress;
            try {
                var rawTx = new RawTx(params, {
                    signed: function(txid) {
                        cb(undefined, txid, this);
                    }
                });
                rawTx.on('queue failure', function() { cb(new Error("Transaction failed to send")); });
                queue.push(rawTx);
            } catch (ex) {
                return cb(ex);
            }
        }); 
    };
};
