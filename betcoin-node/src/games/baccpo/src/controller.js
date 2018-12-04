'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 1000;

module.exports = function(Game, GameLogic, logger, io, HTTPError, BaseMultipartGameController) {

    var BaccpoController = function() {
        BaseMultipartGameController.call(this, Game, LAST_GAME_MIN_TIME);
    };

    util.inherits(BaccpoController, BaseMultipartGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    BaccpoController.prototype.readGameParams = function(req) {
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

    // override to send a socket.io broadcast when a game is finished
    BaccpoController.prototype.playFinished = function(game, cb) {
        var gameJson = game.filter();
        delete gameJson.server_seed;
        delete gameJson.final_array;
        if (game.status() === 'finished') {
            io.playerEmit(game.player_id(),'player baccpo added', gameJson);
            io.playerBroadcast(game.player_id(), 'baccpo added', gameJson);
        }
        return cb(undefined, gameJson);
    };

    // we are doing the exact same transforming here, so just assign
    // the function again
    BaccpoController.prototype.nextActionFinished = BaccpoController.prototype.playFinished;

    // read the params for next action, similar to readGameParams, but
    // omits client_seed and wager
    BaccpoController.prototype.readNextActionParams = function(req) {
        var gameParams = {
            action: req.body.action
        };
        return gameParams;
    };

    BaccpoController.prototype.getHouseEdge = function(gameParams/*, gameModel*/) {
        if (gameParams.bets) {
            return GameLogic.getHouseEdge(gameParams.bets);
        } else {
            return BaseMultipartGameController.DEFAULT_HOUSE_EDGE;
        }
    };

    return BaccpoController;
};
