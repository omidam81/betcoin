'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 1000;

module.exports = function(Game, GameLogic, logger, io, HTTPError, BaseMultipartGameController) {

    var WarController = function() {
        BaseMultipartGameController.call(this, Game, LAST_GAME_MIN_TIME);
    };

    util.inherits(WarController, BaseMultipartGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    WarController.prototype.readGameParams = function(req) {
        var gameParams = {
            isTieBet: req.body.tiebet,
            wager: parseInt(req.body.wager, 10)
        };
        if (gameParams.isTieBet) {
            gameParams.wager = gameParams.wager * 2;
        }
        return gameParams;
    };

    // override to send a socket.io broadcast when a game is finished
    WarController.prototype.playFinished = function(game, cb) {
        var gameJson = game.filter();
        delete gameJson.server_seed;
        if (game.status() === 'finished') {
            io.playerEmit(game.player_id(),'player war added', gameJson);
            io.playerBroadcast(game.player_id(), 'war added', gameJson);
        } else {
            delete game.init_array;
            delete game.result;
            delete game.deck_stack;
        }
        return cb(undefined, gameJson);
    };

    // we are doing the exact same transforming here, so just assign
    // the function again
    WarController.prototype.nextActionFinished = WarController.prototype.playFinished;

    // read the params for next action, similar to readGameParams, but
    // omits client_seed and wager
    WarController.prototype.readNextActionParams = function(req) {
        var gameParams = {
            gotoWar: req.body.gotoWar
        };
        return gameParams;
    };

    WarController.prototype.nextActionDebit = function(wallet, gameParams, gameModel, cb) {
        var gotoWar = gameParams.gotoWar;
        if (gotoWar) {
            var amount = (gameModel.is_tie_bet() ? gameModel.wager()/2 : gameModel.wager());
            wallet.debit({
                amount: amount,
                refId: "wager:" + gameParams.gameId + ":tie",
                type: this.Game.modelName + ":wager:tie",
                meta: {
                    houseEdge: this.getHouseEdge(gameParams),
                    gameOdds: this.getOdds(gameParams),
                    locale: gameParams.locale
                }
            }, function(err, transaction) {
                if (err) return cb(err);
                gameModel.wager(gameModel.wager() + amount);
                return cb(undefined, transaction);
            });
        } else {
            return cb();
        }
    };

    WarController.prototype.getHouseEdge = function(gameParams) {
        var isTieBet = gameParams.isTieBet;
        var houseEdge = 0.0288;
        if(isTieBet) {
            houseEdge = 0.12205;
        }
        return houseEdge;
    };

    return WarController;
};
