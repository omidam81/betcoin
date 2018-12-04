'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 1000;

module.exports = function(Game, GameLogic, logger, io, HTTPError, BaseMultipartGameController) {

    var CaribbeanController = function() {
        BaseMultipartGameController.call(this, Game, LAST_GAME_MIN_TIME);
    };

    util.inherits(CaribbeanController, BaseMultipartGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    CaribbeanController.prototype.readGameParams = function(req) {
        var gameParams = {};
        var wager = parseInt(req.body.wager, 10);
        if (req.wallet.balance() < wager * 3) {
            throw new HTTPError(412, "Limited Balance");
        }
        return gameParams;
    };

    // override to send a socket.io broadcast when a game is finished
    CaribbeanController.prototype.playFinished = function(game, cb) {
        var gameJson = game.filter();
        delete gameJson.final_array;
        delete gameJson.server_seed;
        if (game.status() === 'finished') {
            io.playerEmit(game.player_id(),'player caribbean added', gameJson);
            io.playerBroadcast(game.player_id(), 'caribbean added', gameJson);
        }
        return cb(undefined, gameJson);
    };

    // we are doing the exact same transforming here, so just assign
    // the function again
    CaribbeanController.prototype.nextActionFinished = CaribbeanController.prototype.playFinished;

    // read the params for next action, similar to readGameParams, but
    // omits client_seed and wager
    CaribbeanController.prototype.readNextActionParams = function(req) {
        var gameParams = {
            raise: req.body.raise
        };
        return gameParams;
    };

    CaribbeanController.prototype.getHouseEdge = function() {
        return 0.0146;
    };

    CaribbeanController.prototype.nextActionDebit = function(wallet, gameParams, gameModel, cb) {
        var raise = gameParams.raise;
        if (raise === true) {
            wallet.debit({
                // we already debited the wager, so debit 2x the wager
                amount: gameModel.wager() * 2,
                refId: "wager:" + gameParams.gameId + ":raise",
                type: this.Game.modelName + ":wager:raise",
                meta: {
                    locale: gameParams.locale,
                    houseEdge: this.getHouseEdge(gameParams),
                    gameOdds: this.getOdds(gameParams)
                }
            }, function(err, transaction) {
                if (err) return cb(err);
                // set the wager on the game model to 3x it's original value
                gameModel.wager(gameModel.wager() * 3);
                return cb(undefined, transaction);
            });
        } else {
            return cb();
        }
    };

    CaribbeanController.prototype.getHouseEdge = function(/*gameParams*/) {
        return 0.0523;
    };

    return CaribbeanController;
};
