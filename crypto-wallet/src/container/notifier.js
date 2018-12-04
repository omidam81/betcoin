'use strict';

/**
 * Bitcoin Wallet Notifier
 *
 * This module returns a function `listen()` that will generate an event emitter.
 * This emitter will send events when the bitcoin wallet receives a transaction
 *
 * This requires setting the `walletnotify` option in $BITCOIN_DATA_DIR/bitcoin.conf
 * to point to a script that hits the server's http server with the transaction
 * id in the POST body
 */

var events = require('events');
var http = require('http');

var NEW_BLOCK = 'new block';
var TX_RECEIVED = 'transaction received';
var TX_CONFIRMED = 'transaction confirmed';
var TX_SENT = 'transaction sent';
var TX_SEND_CONFIRMED = 'transaction send confirmed';

module.exports = function(blockchain, logger) {

    var listen = function(port, cb) {
        if (cb === undefined) {
            return cb(new Error('you must provide a callback'));
        }
        port = parseInt(port, 10);
        if (!port) {
            return cb(new Error('you must provide a port'));
        }
        var notifier = new events.EventEmitter();
        // make an http server that only listens for one endpoint
        var server = http.createServer(function(req, res) {
            if (req.url === '/walletnotify') {
                req.on('readable', function() {
                    // get the txid from the POST data
                    var chunk = req.read();
                    var txid = chunk.toString();
                    logger.info('incoming transaction %s', txid);
                    blockchain.getTransaction(txid, function(err, tx) {
                        if (err) {
                            var errString = (err.message || err) + " %s";
                            logger.error(errString, txid);
                            res.writeHead(500);
                            return res.end('there was an error processing the transaction');
                        }
                        // if we sent this, emit different events,
                        // otherwise, emit based on confirmations
                        if (tx.category === 'send') {
                            if (tx.confirmations) {
                                notifier.emit(TX_SEND_CONFIRMED, tx);
                            } else {
                                notifier.emit(TX_SENT, tx);
                            }
                        } else if (tx.confirmations) {
                            notifier.emit(TX_CONFIRMED, tx);
                        } else {
                            notifier.emit(TX_RECEIVED, tx);
                        }
                        res.writeHead(202);
                        return res.end();
                    });
                });
            } else if (req.url === '/blocknotify') {
                req.on('readable', function() {
                    // get the txid from the POST data
                    var chunk = req.read();
                    var blockhash = chunk.toString();
                    logger.info('incoming block %s', blockhash);
                    notifier.emit(NEW_BLOCK, blockhash);
                    res.writeHead(202);
                    return res.end();
                });
            } else {
                res.writeHead(418);
                return res.end();
            }
        });
        // start up the server and send back the notifier
        server.listen(port, function(err) {
            if (err) {
                cb(err);
            } else {
                cb(undefined, notifier);
            }
        });
    };


    return {
        listen: listen,
        events: {
            NEW_BLOCK: NEW_BLOCK,
            TX_RECEIVED: TX_RECEIVED,
            TX_CONFIRMED: TX_CONFIRMED,
            TX_SENT: TX_SENT,
            TX_SEND_CONFIRMED: TX_SEND_CONFIRMED
        }
    };
};
