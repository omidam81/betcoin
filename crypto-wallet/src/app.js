'use strict';

// this file is for running the app that listens for transactions and blocks

require('bitcoin-math');


var CryptoSocket = function(container) {
    this.container = container;
};

CryptoSocket.prototype.init = function() {
    this.container.resolve(function(HTTP_LISTEN, CRYPTO_TYPE, notifier, logger, wss, blockchain) {
        logger.info('app init');
        notifier.listen(HTTP_LISTEN, function(err, txNotifier) {
            logger.info('%sd listening', CRYPTO_TYPE);
            txNotifier.on(notifier.events.NEW_BLOCK, function(blockhash) {
                logger.info('new block: %s', blockhash);
                wss.broadcast(notifier.events.NEW_BLOCK + '///' + JSON.stringify(blockhash));
            });
            txNotifier.on(notifier.events.TX_RECEIVED, function(tx) {
                logger.info('new transaction: %s', tx.txid);
                wss.broadcast(notifier.events.TX_RECEIVED + '///' + JSON.stringify(tx));
            });
            txNotifier.on(notifier.events.TX_CONFIRMED, function(tx) {
                logger.info('transaction confirmed: %s', tx.txid);
                wss.broadcast(notifier.events.TX_CONFIRMED + '///' + JSON.stringify(tx));
            });

            var wsConnect = function(ws) {
                logger.debug('socket connection');
                ws.on('message', function(data) {
                    var dataArr = data.split('///');
                    var type = dataArr[0];
                    try {
                        var message = JSON.parse(dataArr[1]);
                        logger.info('got message, type: %s', type, message, {});
                        if (['emit', 'get'].indexOf(type) < 0) {
                            logger.log('warn', 'unknown type received over socket %s', type);
                        } else {
                            if (type === 'emit') {
                                logger.info('emitting transaction %s', message.txid);
                                blockchain.getTransaction(message.txid, function(err, tx) {
                                    if (err) return logger.error(err.message);
                                    if (tx.category === 'send') {
                                        txNotifier.emit(notifier.events.TX_SENT, tx);
                                    } else {
                                        txNotifier.emit(notifier.events.TX_RECEIVED, tx);
                                    }
                                });
                            } else if (type === 'get') {
                                logger.info('getting transaction %s', message.txid);
                                blockchain.getTransaction(message.txid, function(err, tx) {
                                    if (err) {
                                        ws.send(message.txid + "///" + JSON.stringify({error: err}));
                                        return logger.error(err.message);
                                    }
                                    ws.send(message.txid + "///" + JSON.stringify(tx));
                                });
                            }
                        }
                    } catch (e) {
                        logger.log('error', 'error processing socket message %s', dataArr[1]);
                    }
                });
            };

            wss.on('connection', wsConnect);
            wss.on('connect', wsConnect);
        });
    });
};


if (require.main === module) {
    var container = require('./container');
    var cryptoSocket = new CryptoSocket(container);
    cryptoSocket.init();
}

module.exports = CryptoSocket;
