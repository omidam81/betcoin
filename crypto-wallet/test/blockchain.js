'use strict';

/* global it */
/* global describe */
var assert = require('assert');
require('bitcoin-math');
var MOCK_BLOCKCHAIN = require('./mock/mock-blockchain');

var blockchain = require('../src/container/blockchain')({
    getRawTransaction: function(txid, decode, cb) {
        if (MOCK_BLOCKCHAIN[txid]) {
            var data = JSON.parse(JSON.stringify(MOCK_BLOCKCHAIN[txid].raw));
            return cb(undefined, data);
        } else {
            var err = new Error("No information available about transaction");
            err.code = -5;
            return cb(err);
        }
    },
    getTransaction: function(txid, cb) {
        if (MOCK_BLOCKCHAIN[txid]) {
            var data = JSON.parse(JSON.stringify(MOCK_BLOCKCHAIN[txid].transaction));
            return cb(undefined, data);
        } else {
            var err = new Error("Invalid or non-wallet transaction id");
            err.code = -5;
            return cb(err);
        }
    }
}, {
    info: function(){},
    debug: function(){},
    error: function(){}
});

describe('blockchain', function() {
    describe('#getRaw()', function() {
        it('should get raw transaction data from the crypto wallet', function(done) {
            var txid = "8729e27eeee4d333665b1ef9fe0e28fee037ef2e6ad32d22653d6647554eb49b";
            blockchain.getRaw(txid, function(err, rawTx) {
                assert.ifError(err);
                assert.equal(rawTx.txid, txid);
                done();
            });
        });
        it('should return an error when it cannot find a transaction', function(done) {
            var txid = "thiswillnotwork";
            blockchain.getRaw(txid, function(err) {
                assert.ok(err);
                assert.equal(err.code, -5);
                done();
            });
        });
    });
    describe('#getTransactionCategory()', function() {
        it('should get the category of a transaction', function(done) {
            var txid = "f00c8fc5d7c7dccf79c4f027a3d6529c2e050e6f563245caddec406dc8cbd20d";
            blockchain.getTransactionCategory(txid, function(err, category) {
                assert.ifError(err);
                assert.equal(category, 'receive');
                done();
            });
        });
        it('should properly identify a send transaction', function(done) {
            var txid = "7e45945acc7d9505b5252c01c0595a000a28867e822ad0c560d5fc8f82d05528";
            blockchain.getTransactionCategory(txid, function(err, category) {
                assert.ifError(err);
                assert.equal(category, 'send');
                done();
            });
        });
        it('should return an error when it cannot find a transaction', function(done) {
            var txid = "thiswillnotwork";
            blockchain.getTransactionCategory(txid, function(err) {
                assert.ok(err);
                assert.equal(err.code, -5);
                done();
            });
        });
    });
    describe('#processRaw()', function() {
        it('should process a raw transaction', function(done) {
            var txid = "8729e27eeee4d333665b1ef9fe0e28fee037ef2e6ad32d22653d6647554eb49b";
            blockchain.getRaw(txid, function(err, rawTx) {
                assert.ifError(err);
                var tx = blockchain.processRaw(rawTx);
                assert.equal(tx.txid, txid);
                done();
            });
        });
        it('should throw an exception when it gets something it cannot process', function(done) {
            var txid = "8729e27eeee4d333665b1ef9fe0e28fee037ef2e6ad32d22653d6647554eb49b";
            blockchain.getRaw(txid, function(err, rawTx) {
                assert.ifError(err);
                delete rawTx.vout[0].scriptPubKey.addresses;
                assert.throws(function() {
                    blockchain.processRaw(rawTx);
                }, Error);
                done();
            });
        });
    });
    describe('#getTxFee()', function() {
        it('should get the transaction fee when supplied a raw transaction', function(done) {
            var txid = "8729e27eeee4d333665b1ef9fe0e28fee037ef2e6ad32d22653d6647554eb49b";
            blockchain.getRaw(txid, function(err, rawTx) {
                assert.ifError(err);
                var tx = blockchain.processRaw(rawTx);
                blockchain.getTxFee(tx, function(err, txfee) {
                    assert.ifError(err);
                    assert.equal(txfee, 10000);
                    done();
                });
            });
        });
    });
    describe('#getTransaction()', function() {
        it('should get full transaction info', function(done) {
            var txid = "8729e27eeee4d333665b1ef9fe0e28fee037ef2e6ad32d22653d6647554eb49b";
            blockchain.getTransaction(txid, function(err, tx) {
                assert.ifError(err);
                assert.equal(tx.txid, txid);
                assert.equal(tx.fee, 10000);
                assert.equal(tx.inputs[0].txid, "f00c8fc5d7c7dccf79c4f027a3d6529c2e050e6f563245caddec406dc8cbd20d");
                assert.equal(tx.category, 'receive');
                done();
            });
        });
    });
});
