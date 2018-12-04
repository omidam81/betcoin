'use strict';

var socketio = require('socket.io');

module.exports = function(server) {
    // return a container injectable function
    return function(logger) {
        var io = socketio.listen(server, {log: false});
        io.set('log level', 1);

        var playerSockets = {};
        // add subscribe handing
        io.sockets.on('connection', function(socket) {
            socket.on('subscribe', function(playerId) {
                if (!playerId) return logger.warn('got subscribe event with empty playerId');
                playerSockets[playerId] = socket.id;
                logger.info('player %s subscribed to socket %s', playerId, socket.id);
            });
        });

        // emits an event to the player's socket
        io.playerEmit = function(event, playerId) {
            var emitArgs = Array.prototype.slice.call(arguments, 2);
            emitArgs.unshift(event);
            var socketId = playerSockets[playerId];
            var socket = io.sockets.sockets[socketId];
            if(socket){
                socket.emit.apply(socket, emitArgs);
            } else {
                logger.warn('socket %s not found!', socketId);
            }
        };

        // emits an event to all sockets **excpt** player socket
        io.playerBroadcast = function(event, playerId) {
            var emitArgs = Array.prototype.slice.call(arguments, 2);
            emitArgs.unshift(event);
            var socketId = playerSockets[playerId];
            var socket = io.sockets.sockets[socketId];
            if(socket){
                socket.broadcast.emit.apply(socket, emitArgs);
            } else {
                logger.warn('socket %s not found!', socketId);
            }
        };

        return io;
    };
};
