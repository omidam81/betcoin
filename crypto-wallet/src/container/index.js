'use strict';

var container = require('dependable').container();
var cryptoRPC = require('bitcoin');
var WebSocketServer = require('ws').Server;

// register constants
container.register('CRYPTO_TYPE', process.env.CRYPTO_TYPE);
container.register('HTTP_LISTEN', process.env.HTTP_LISTEN || 1339);
container.register('SOCKET_LISTEN', process.env.SOCKET_LISTEN || 1337);

// register mongo and the mongo based logger
container.register('mongo', require('mongo-npm'));
container.register('logger', function(mongo, CRYPTO_TYPE) {
    var logdb = mongo.getDb({dbname: 'logs'});
    var appLogs = logdb.collection(CRYPTO_TYPE);
    return require('logger-npm')(appLogs);
});

// register the web socket server, and give it a broadcast method
container.register('wss', function(SOCKET_LISTEN) {
    var wss = new WebSocketServer({port: SOCKET_LISTEN});
    wss.broadcast = function(data) {
        for (var i in this.clients) {
            if (this.clients.hasOwnProperty(i)) {
                this.clients[i].send(data);
            }
        }
    };
    return wss;
});

// read the config from the config file in the user's home directory
// for the specific crypto type
container.register('config', require('./read-config'));
container.register('cryptod', function(logger, config) {
    var cryptod = new cryptoRPC.Client(config);
    return cryptod;
});

// register the blockchain parser and the notifier
container.register('blockchain', require('./blockchain'));
container.register('notifier', require('./notifier'));

module.exports = container;
