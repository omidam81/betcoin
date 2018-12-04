'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 1000;

module.exports = function(Game, GameLogic, logger, io, HTTPError, BaseMultipartGameController) {

    var VideopokerController = function() {
        BaseMultipartGameController.call(this, Game, LAST_GAME_MIN_TIME);
    };

    util.inherits(VideopokerController, BaseMultipartGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    VideopokerController.prototype.readGameParams = function(/*req*/) {
        var gameParams = {};
        return gameParams;
    };

    // override to send a socket.io broadcast when a game is finished
    VideopokerController.prototype.playFinished = function(game, cb) {
        var gameJson = game.filter();
        delete gameJson.final_array;
        delete gameJson.server_seed;
        if (game.status() === 'finished') {
            io.playerEmit(game.player_id(),'player videopoker added', gameJson);
            io.playerBroadcast(game.player_id(), 'videopoker added', gameJson);
        }
        return cb(undefined, gameJson);
    };

    // we are doing the exact same transforming here, so just assign
    // the function again
    VideopokerController.prototype.nextActionFinished = VideopokerController.prototype.playFinished;

    // read the params for next action, similar to readGameParams, but
    // omits client_seed and wager
    VideopokerController.prototype.readNextActionParams = function(req) {
        var gameParams = {
        };
        try{
            gameParams.holds = JSON.parse(req.body.holds);
        }catch(e){
            throw new HTTPError(400, "invalid holds json string");
        }
        return gameParams;
    };

    VideopokerController.prototype.getHouseEdge = function(/*gameParams*/) {
        return GameLogic.getHouseEdge();
    };

    return VideopokerController;
};
