'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 5000;

module.exports = function(Reels, logger, io, HTTPError, BaseGameController) {
    var ReelsController = function() {
        BaseGameController.call(this, Reels, LAST_GAME_MIN_TIME);
    };
    util.inherits(ReelsController, BaseGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    ReelsController.prototype.readGameParams = function(req) {
        var gameParams = {
            game: req.body.game
        };
        return gameParams;
    };

    ReelsController.prototype.getHouseEdge = function(/*gameParams*/) {
        return 0.027;
    };

    // override to send a socket.io broadcast when a game is finished
    ReelsController.prototype.playFinished = function(game, cb) {
        io.playerEmit(game.player_id(), 'player reels added', game.filter());
        io.playerBroadcast(game.player_id(), 'reels added', game.filter());
        return cb();
    };

    return ReelsController;
};
