'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 1000;

module.exports = function(Game, GameLogic, logger, io, HTTPError, BaseMultipartGameController) {

    var TilesController = function() {
        BaseMultipartGameController.call(this, Game, LAST_GAME_MIN_TIME);
    };

    util.inherits(TilesController, BaseMultipartGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    TilesController.prototype.readGameParams = function(/*req*/) {
        var gameParams = {};
        return gameParams;
    };

    // override to send a socket.io broadcast when a game is finished
    TilesController.prototype.playFinished = function(game, cb) {
        var gameJson = game.filter();
        delete gameJson.server_seed;

        if (game.status() === 'finished') {
            io.playerEmit(game.player_id(),'player tiles added', gameJson);
            io.playerBroadcast(game.player_id(), 'tiles added', gameJson);
            delete gameJson.final_array;
        } else {
            delete gameJson.final_array;
            delete gameJson.dealer_hand;
        }
        return cb(undefined, gameJson);
    };

    // we are doing the exact same transforming here, so just assign
    // the function again
    TilesController.prototype.nextActionFinished = TilesController.prototype.playFinished;

    // read the params for next action, similar to readGameParams, but
    // omits client_seed and wager
    TilesController.prototype.readNextActionParams = function(req) {
        var gameParams = {
            house_way: req.body.house_way
        };
        try{
            gameParams.split = JSON.parse(req.body.split);
        }catch(e){
            this.log('parse split json error', e);
            throw new HTTPError(400, "invalid split json string");
        }
        return gameParams;
    };

    TilesController.prototype.getHouseEdge = function(/*gameParams*/) {
        return 0.015;
    };

    return TilesController;
};
