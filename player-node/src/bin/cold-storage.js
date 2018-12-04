'use strict';

require('bitcoin-math');
var bitcoind = require('bitcoin-wallet');
var consoleprompt = require('prompt');
var mongo = require('mongowrap').getConnection();
var async = require('async');
var argv = require('yargs')
    .usage("node cold-storage <to address> <amount>")
    .demand(2)
    .default({confirmations: 100})
    .argv;

mongo.getDb('playerdb', function(err, db) {
    if (err) throw err;
    var Transactions = db.collection('cold_storage_transactions');
    var amount = parseFloat(argv._[1]);
    if (isNaN(amount)) throw "Invalid amount supplied";
    amount = amount.toSatoshi();
    var toAddress = argv._[0];
    async.waterfall([
        function(done) {
            bitcoind.validateAddress(toAddress, function(err, data) {
                if (err) return done(err);
                if (!data.isvalid) return(new Error("invalid to address"));
                return done();
            });
        },
        function(done) {
            var outputs = {};
            outputs[toAddress] = amount;
            bitcoind.prepare({
                inputs: [],
                outputs: outputs,
                txfee: (0.0001).toSatoshi(),
                forceEmptyInputs: true,
                selectFrom: 'all',
                minConf: argv.confirmations
            }, done);
        },
        function promptAndSend(txid, rawTx, done) {
            console.log("Sending %s to %s (txid %s)", amount.toBitcoinString(), toAddress, txid);
            promptInput(function(err, response) {
                if (response === 's') {
                    bitcoind.send(rawTx.signedTx, function(err) {
                        if (err) return done(err);
                        console.log("Sent %s", txid);
                        Transactions.insert({
                            date: new Date(),
                            txid: txid,
                            address: toAddress,
                            amount: amount,
                        }, done);
                    });
                } else if (response === 'v') {
                    console.log(JSON.stringify(rawTx.decodedRaw, null, 2));
                    return promptAndSend(txid, rawTx, done);
                } else {
                    return done();
                }
            });
        }
    ], function(err){
        if (err) throw err;
        process.exit();
    });
});

var promptInput = function(cb) {
    consoleprompt.message = "Action";
    consoleprompt.start();
    var schema = {
        properties: {
            response: {
                description: '[S]end, [V]iew Raw TX, [C]ancel'.blue,
                type: 'string',
                pattern: /[svc]/i,
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
