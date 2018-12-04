'use strict';

var SocketServer = require('ws').Server;
var SocketClient = require('ws');

module.exports = function(port) {
    var io = new SocketServer({port: port});

    io.broadcast = function(event, data) {
        var sendString = event + '/' + JSON.stringify(data);
        for (var i in this.clients) {
            if (this.clients.hasOwnProperty(i)) {
                if (this.clients[i].readyState === SocketClient.OPEN) {
                    this.clients[i].send(sendString);
                }
            }
        }
    };
    return io;
};
