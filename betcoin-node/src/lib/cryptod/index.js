'use strict';

var cryptoRPC = require('bitcoin');
var Socket = require('ws');
var events = require('events');
var async = require('async');

var NEW_BLOCK = 'new block';
var TX_RECEIVED = 'transaction received';
var TX_CONFIRMED = 'transaction confirmed';

module.exports = function(cryptotype, testnet, logger, HTTPError, CURRENCIES) {

    var SUPPORTED_TYPES = CURRENCIES;
    var DEFAULT_PORTS = {
        'bitcoin' : {mainnet: 8332,  testnet: 18332},
        'litecoin': {mainnet: 9332,  testnet: 19332},
        'dogecoin': {mainnet: 22555, testnet: 44555},
        'ppcoin': {mainnet: 9902, testnet: 9902},
        'namecoin': {mainnet: 8336, testnet: 18336},
    };

    var DEFAULT_TX_FEE = {
        bitcoin: (0.0001).toSatoshi(),
        litecoin: (0.0001).toSatoshi(),
        dogecoin: (1).toSatoshi(),
        ppcoin: (0.0001).toSatoshi(),
        namecoin: (0.0001).toSatoshi()
    };

    if (SUPPORTED_TYPES.indexOf(cryptotype) < 0) throw new Error("Invalid cryptocurrency type " + cryptotype);

    var userEnv = cryptotype.toUpperCase() + "_RPCUSER";
    var passEnv = cryptotype.toUpperCase() + "_RPCPASSWORD";
    var rpcuser = process.env[userEnv];
    var rpcpassword = process.env[passEnv];

    if (!rpcuser) throw new Error("Missing " + userEnv + " from environment");
    if (!rpcpassword) throw new Error("Missing " + passEnv + " from environment");

    var prepare = require('./lib/prepare')(logger);
    var send = require('./lib/send')(logger);

    cryptoRPC.Client.prototype.prepare = prepare;
    cryptoRPC.Client.prototype.send = send;

    cryptoRPC.Client.prototype.events = {
        NEW_BLOCK: NEW_BLOCK,
        TX_RECEIVED: TX_RECEIVED,
        TX_CONFIRMED: TX_CONFIRMED
    };

    cryptoRPC.Client.prototype.DEFAULT_TX_FEE = (0.0001).toSatoshi();
    cryptoRPC.Client.prototype.MIN_OUTPUT_SIZE = 5460;

    cryptoRPC.Client.prototype.getNotifier = function(host, port, cb) {
        if (cb === undefined && 'function' === typeof port) {
            cb = port;
            port = 1337;
        } else if (cb === undefined && port === undefined && 'function' === typeof host) {
            cb = host;
            host = this.currency + 'd';
            port = 1337;
        }
        var self = this;
        var socketString = 'ws://' + host + ':' + port;
        var ws = this.ws = new Socket(socketString);
        var notifier = this.notifier = new events.EventEmitter();
        this.ws.on('message', function(data) {
            var dataArr = data.split('///');
            var type = dataArr[0];
            try {
                var message = JSON.parse(dataArr[1]);
                if ([NEW_BLOCK, TX_RECEIVED, TX_CONFIRMED].indexOf(type) < 0) {
                    logger.warn('unknown type received over socket %s', type);
                    notifier.emit(type, message);
                } else {
                    notifier.emit(type, message);
                }
            } catch (e) {
                logger.error('error processing socket message %s', dataArr[1]);
            }
        });
        // try to reconnect on error or close
        var reconnect = function() {
            setTimeout(self.getNotifier, 3000, host, port, function() { logger.verbose("reconnected"); });
        };
        ws.once('error', reconnect);
        ws.once('close', reconnect);
        // return the notifier when the socket is ready
        ws.once('open', function() {
            cb(undefined, notifier);
        });
    };

    cryptoRPC.Client.prototype.emitTransaction = function(txid) {
        logger.verbose("re-emitting %s transaction %s", this.currency, txid);
        this.ws.send("emit///" + JSON.stringify({txid: txid}));
    };

    cryptoRPC.Client.prototype.getTransaction = function(txid, cb) {
        // logger.verbose("getting %s transaction %s", this.currency, txid);
        // this.notifier.once(txid, function(txData) {
        //     if (txData.error) return cb(new Error(txData.error.message));
        //     return cb(undefined, txData);
        // });
        // this.ws.send("get///" + JSON.stringify({txid: txid}));
        this.getRawTransaction(txid, 1, function(err, rawTx) {
            if (err) return cb(new HTTPError(err.code, err.message));
            return cb(undefined, rawTx);
        });
    };

    cryptoRPC.Client.prototype.getUserAddresses = function(cb) {
        return this.getAddressesByAccount("users", cb);
    };

    cryptoRPC.Client.prototype.getBankroll = function(minconf, cb) {
        if (!cb && 'function' === typeof minconf) {
            cb = minconf;
            minconf = 30;
        }
        var self = this;
        async.parallel({
            unconfirmed: function(done) {
                self.listUnspent(0, 0, function(err, unspent) {
                    if (err) return done(err);
                    var total = 0;
                    unspent.forEach(function(input) {
                        total += input.amount.toSatoshi();
                    });
                    return done(undefined, total);
                });
            },
            unavailable: function(done) {
                self.listUnspent(1, minconf, function(err, unspent) {
                    if (err) return done(err);
                    var total = 0;
                    unspent.forEach(function(input) {
                        total += input.amount.toSatoshi();
                    });
                    return done(undefined, total);
                });
            },
            available: function(done) {
                self.listUnspent(minconf, function(err, unspent) {
                    if (err) return done(err);
                    var total = 0;
                    unspent.forEach(function(input) {
                        total += input.amount.toSatoshi();
                    });
                    return done(undefined, total);
                });
            }
        }, cb);
    };

    var cryptod = new cryptoRPC.Client({
        host: cryptotype + 'd',
        port: (testnet) ? DEFAULT_PORTS[cryptotype].testnet : DEFAULT_PORTS[cryptotype].mainnet,
        user: rpcuser,
        pass: rpcpassword
    });

    cryptod.currency = cryptotype;
    cryptod.DEFAULT_TX_FEE = DEFAULT_TX_FEE[cryptotype];
    cryptod.MIN_OUTPUT_SIZE = 5460;

    return cryptod;
};
