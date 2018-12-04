'use strict';

var socketio = require('socket.io');
var async = require('async');

var DEAD_SOCKET_TIMEOUT = (30 * 1000); // 30 seconds

module.exports = function(server, logger, User, Wallet, mongo) {
    var io = socketio(server);
    var playerSockets = {};
    var sockets = {};
    var deadSockets = {};

    var handleDeadSocket = function(playerId) {
        async.waterfall([
            function(done) {
                User.get(playerId, function(err, user) {
                    if (err) return done(err);
                    if (!user) return done(new Error("user id " + playerId + " not found, but socket claims disconnect"));
                    return done(undefined, user);
                });
            },
            function(user, done) {
                user.unset('token');
                user.save(done);
            }, function(user, done) {
                if (!user.anonymous()) return done();
                // cashout an anonymous user
                Wallet.all({userId: mongo.ensureObjectId(playerId)}, function(err, wallets) {
                    if (err) return done(err);
                    async.each(wallets, function(wallet, fin) {
                        wallet.withdraw(wallet.availableBalance(), user, function(err) {
                            if (err) return fin(err);
                            logger.verbose('processed cashout for %s %s',
                                           wallet.userId(), wallet.currency());
                            return fin();
                        });
                    } , function(err) {
                        if (err) {
                            if (err.code === 423 && /^Not all deposits have at least/.test(err.message)) {
                                deadSockets[playerId] = setTimeout(handleDeadSocket, DEAD_SOCKET_TIMEOUT, playerId);
                            }
                            return done(err);
                        } else {
                            logger.info('all cashouts processed for anonymous user %s', playerId);
                            return done();
                        }
                    });
                });
            }
        ], function(err) {
            if (err) logger.error(err.message);
            if (playerSockets[playerId]) {
                delete sockets[playerSockets[playerId]];
                delete playerSockets[playerId];
            }
            io.emit('active users', io.activeSockets());
            logger.info('%s logged out from dead socket', playerId);
        });
    };

    io.activeSockets = function() {
        return Object.keys(playerSockets).length;
    };

    io.logout = function(playerId) {
        // they are still connected, technically, but are logged out,
        // so no longer "subscribed"
        handleDeadSocket(playerId);
    };

    io.sockets.on('connection', function(socket) {
        // add subscribe handing
        socket.on('subscribe', function(playerId) {
            if (!playerId) return;
            playerSockets[playerId] = socket.id;
            sockets[socket.id] = playerId;
            if (deadSockets[playerId]) {
                clearTimeout(deadSockets[playerId]);
            }
            logger.info('%s subscribed to socket %s', playerId, socket.id);
            io.emit('active users', io.activeSockets());
        });
        socket.on('disconnect', function() {
            var playerId = sockets[socket.id];
            if (!playerId) return;
            logger.info('%s disconnected from socket %s', playerId, socket.id);
            deadSockets[playerId] = setTimeout(handleDeadSocket, DEAD_SOCKET_TIMEOUT, playerId);
        });
    });

    /**
     * playerEmit(playerId, event)
     *
     * Emits an event to a single player
     *
     * @param {ObjectId} playerId The player to emit to
     * @param {String} event The event to emit
     * @param {Multiple} data Any remaining arguments will be the data that is emitted
     */
    io.playerEmit = function(playerId, event) {
        var emitArgs = Array.prototype.slice.call(arguments, 2);
        emitArgs.unshift(event);
        playerId = playerId.toString();
        var socketId = playerSockets[playerId];
        var socket = io.sockets.connected[socketId];
        if(socket){
            socket.emit.apply(socket, emitArgs);
        }
    };

    /**
     * playerBroadcast(playerId, event)
     *
     * Emits an event to everyone but the player specified
     *
     * @param {ObjectId} playerId The player to omit from the broadcast
     * @param {String} event The event to broadcast
     * @param {Multiple} data Any remaining arguments will be the data that is emitted
     */
    io.playerBroadcast = function(playerId, event) {
        var emitArgs = Array.prototype.slice.call(arguments, 2);
        emitArgs.unshift(event);
        playerId = playerId.toString();
        var socketId = playerSockets[playerId];
        var socket = io.sockets.connected[socketId];
        if(socket){
            socket.broadcast.emit.apply(socket, emitArgs);
        }
    };

    return io;
};
