'use strict';

require('bitcoin-math');
var mongo = require('mongowrap').getConnection();
var bitcoind = require('bitcoin-wallet');
var async = require('async');
var consoleprompt = require('prompt');

mongo.getDb('playerdb', function(err, db) {
    if (err) throw err;
    var Transactions = db.collection('transactions');
    var Users = db.collection('users');
    var processTx = function(tx, cb) {
        if (typeof tx.meta.hex !== 'string') return cb(new Error('hex is not a string!'));
        async.waterfall([
            function(done) {
                Users.findOne({_id: tx.userId}, function(err, user) {
                    if (err) return done(err);
                    console.log('user     : %s', user.alias);
                    console.log('user id  : %s', tx.userId);
                    console.log('amount   : %d', tx.amtOut.toBitcoin());
                    console.log('currency : %s', tx.currency);
                    done();
                });
            },
            promptInput,
            function(response, done) {
                if (response === 's') {
                    bitcoind.send(tx.meta.hex, function(err, txid) {
                        if (err) {
                            console.error('error sending: %s %d', err.message, err.code);
                            if (err.code !== -5) {
                                return done();
                            } else {
                                console.log("marking as sent");
                            }
                        } else {
                            console.log('sent %s', txid);
                        }
                        Transactions.update(tx, {
                            $set: {'meta.status': 'sent'},
                            $unset: {'meta.hex': ''}
                        }, function(err) {
                            if (err) return done(err);
                            return done();
                        });
                    });
                } else if (response === 'v'){
                    bitcoind.decodeRawTransaction(tx.meta.hex, function(err, decoded) {
                        if (err) return done(err);
                        console.log(JSON.stringify(decoded, null, 4));
                        return processTx(tx, cb);
                    });
                } else if (response === 'z') {
                    bitcoind.decodeRawTransaction(tx.meta.hex, function(err, decoded) {
                        if (err) return done(err);
                        Transactions.update({_id: tx._id}, {
                            $set: {'meta.status': 'aborted'},
                            $unset: {'meta.hex': ''}
                        }, function(err) {
                            if (err) return done(err);
                            bitcoind.lockUnspent('unlock', decoded.vin, function(err) {
                                if (err) return done(err);
                                return done();
                            });
                        });
                    });
                } else {
                    return done();
                }
            }
        ], function(err) {
            if (err) console.error(err.message + ", moving on");
            cb();
        });
    };

    var pad = function(string, size, char) {
        var i, pad, prefix, _i, _ref;
        if (char === null || char === undefined) {
            char = ' ';
        }
        prefix = typeof string === 'number';
        if (prefix) {
            _ref = [string, size];
            size = _ref[0];
            string = _ref[1];
        }
        string = string.toString();
        pad = '';
        size = size - string.length;
        for (i = _i = 0; 0 <= size ? _i < size : _i > size; i = 0 <= size ? ++_i : --_i) {
            pad += char;
        }
        if (prefix) {
            return pad + string;
        } else {
            return string + pad;
        }
    };

    var getTxInfo = function(tx, cb) {
        Users.findOne({_id: tx.userId}, function(err, user) {
            if (err) return cb(err);
            return cb(undefined, {
                tx: tx,
                user: user
            });
        });
    };


    Transactions.find({'meta.status': 'prepared', 'meta.hex': {$exists: true}}).toArray(function(err, txs) {
        if (err) throw err;
        txs = txs.filter(function(tx) { return tx.meta.hex; });
        txs.sort(function(a, b) {
            if (a.amtOut > b.amtOut) return -1;
            if (a.amtOut < b.amtOut) return 1;
            if (a.amtOut === b.amtOut) return 0;
        });
        async.map(txs, getTxInfo, function(err, results) {
            if (err) {
                console.error(err.message);
                process.exit(1);
            }
            console.log((new Array(86)).join('-'));
            console.log("%s | %s | %s", pad("Alias", 36), pad("ID", 24), "Amount");
            console.log((new Array(86)).join('-'));
            results.forEach(function(txInfo) {
                console.log("%s | %s | %s", pad(txInfo.user.alias, 36), txInfo.user._id.toHexString(), txInfo.tx.amtOut.toBitcoinString());
            });
            console.log((new Array(86)).join('-'));
            var total = txs.reduce(function(previousTotal, tx) {
                return previousTotal + tx.amtOut;
            }, 0);
            console.log("%d pending payouts", txs.length);
            console.log("%d total", total.toBitcoin());
            async.eachSeries(txs, processTx, function(err) {
                if (err) {
                    console.error(err.message);
                    process.exit(2);
                }
                process.exit();
            });
        });
    });

    var promptInput = function(cb) {
        consoleprompt.message = "Action";
        consoleprompt.start();
        var schema = {
            properties: {
                response: {
                    description: '[S]end, [V]iew Raw TX, S[k]ip, Sie[z]e'.blue,
                    type: 'string',
                    pattern: /[svkz]/i,
                    required: true,
                    before: function(value) { return value.toLowerCase(); }
                }
            }
        };
        consoleprompt.get(schema, function(err, result) {
            if (err) return cb(err);
            cb(undefined, result.response.toLowerCase());
        });
    };

});
