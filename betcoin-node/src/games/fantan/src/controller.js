'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 4000;

module.exports = function(Fantan, GameLogic, logger, io, HTTPError, BaseGameController) {

    var FantanController = function() {
        BaseGameController.call(this, Fantan, LAST_GAME_MIN_TIME);
    };
    util.inherits(FantanController, BaseGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    FantanController.prototype.readGameParams = function(req) {
        var gameParams = {};
        try {
            gameParams.bets = JSON.parse(req.body.bets);
        } catch(e) {
            throw new HTTPError(400, "Invalid bets");
        }
        gameParams.wager = 0;
        for(var x in gameParams.bets) {
            if(gameParams.bets.hasOwnProperty(x)) {
                if(gameParams.bets[x] >= 0) {
                    gameParams.wager += gameParams.bets[x];
                } else {
                    throw new HTTPError(400, "invalid wager in play request");
                }
            }
        }
        if (isNaN(gameParams.wager)) {
            throw new HTTPError(400, "invalid wager in play request");
        }
        return gameParams;
    };

    FantanController.prototype.getHouseEdge = function(gameParams) {
        return GameLogic.getHouseEdge(gameParams.bets);
    };

    // override to send a socket.io broadcast when a game is finished
    FantanController.prototype.playFinished = function(game, cb) {
        io.playerEmit(game.player_id().toHexString(), 'player fantan added', game.filter());
        io.playerBroadcast(game.player_id().toHexString(), 'fantan added', game.filter());
        return cb();
    };

    return FantanController;
};
