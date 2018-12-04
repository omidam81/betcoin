'use strict';

require('bitcoin-math');
var container = require('../container');
var AdminTransaction = container.get('AdminTransaction');
var cryptod = container.get('cryptod');
var CURRENCY_REGEXP = container.get('CURRENCY_REGEXP');
var consoleprompt = require('prompt');
var async = require('async');
var argv = require('yargs')
    .usage("node send-currency --confirmations=100 <currency> <to address> <amount>")
    .demand(3)
    .default({
        confirmations: 100,
        type: 'coldstorage'
    })
    .alias('c', 'confirmations')
    .alias('t', 'type')
    .alias('m', 'message')
    .describe('m', 'a message to attach to the transaction (required)')
    .help('help')
    .argv;

var currency = argv._[0];
if (!CURRENCY_REGEXP.test(currency)) throw "Invalid currency";
var amount = parseFloat(argv._[2]);
if (isNaN(amount)) throw "Invalid amount supplied";
amount = amount.toSatoshi();
var toAddress = argv._[1];
var adminTx = new AdminTransaction({
    type: argv.type,
    currency: currency,
    amount: amount,
    message: argv.message || amount.toBitcoin() + " " + currency + " to cold storage at " + toAddress,
    to: toAddress
});
var coind = cryptod(currency);
async.waterfall([
    function(done) {
        coind.validateAddress(toAddress, function(err, data) {
            if (err) return done(err);
            if (!data.isvalid) return done(new Error("invalid " + currency + " address"));
            return done();
        });
    },
    function(done) {
        var outputs = {};
        outputs[toAddress] = amount;
        coind.prepare({
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
                coind.send(rawTx.signedTx, function(err) {
                    if (err) return done(err);
                    console.log("Sent %s", txid);
                    adminTx.refId(txid);
                    adminTx.save(done);
                });
            } else if (response === 'v') {
                console.log(JSON.stringify(rawTx.decodedRaw, null, 2));
                console.log(adminTx.toJSON());
                return promptAndSend(txid, rawTx, done);
            } else {
                return done();
            }
        });
    }
], function(err){
    if (err) console.error(err.message);
    process.exit();
});


var promptInput = function(cb) {
    consoleprompt.message = "Action";
    consoleprompt.start();
    var schema = {
        properties: {
            response: {
                description: '[S]end'.green + ', ' + '[V]iew Raw TX'.blue + ', ' + '[C]ancel'.red,
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
