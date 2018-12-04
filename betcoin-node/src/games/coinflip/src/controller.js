'use strict';

var util = require('util');

// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 4000;

module.exports = function(Coinflip, logger, io, HTTPError, BaseGameController) {

    var CoinflipController = function() {
        BaseGameController.call(this, Coinflip, LAST_GAME_MIN_TIME);
    };

    util.inherits(CoinflipController, BaseGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    CoinflipController.prototype.readGameParams = function(req) {
        var gameParams = {};
        try {
            gameParams.bet = JSON.parse(req.body.bet);
        } catch(e) {
            throw new HTTPError(400, "Invalid bets");
        }
        return gameParams;
    };

    // override to send a socket.io broadcast when a game is finished
    CoinflipController.prototype.playFinished = function(game, cb) {
        io.playerEmit(game.player_id(), 'player coinflip added', game.filter());
        io.playerBroadcast(game.player_id(), 'coinflip added', game.filter());
        return cb();
    };

    return CoinflipController;
};
