'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 1000;

module.exports = function(Game, GameLogic, logger, io, HTTPError, BaseMultipartGameController) {

    var ThreecardController = function() {
        BaseMultipartGameController.call(this, Game, LAST_GAME_MIN_TIME);
    };

    util.inherits(ThreecardController, BaseMultipartGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    ThreecardController.prototype.readGameParams = function(req) {
        var gameParams = {};
        try {
            gameParams.bets = JSON.parse(req.body.bets);
        } catch(e) {
            throw new HTTPError(400, "Invalid bets");
        }
        if (!gameParams.bets.ante) {
            gameParams.bets.ante = 0;
        }
        if (!gameParams.bets.pairplus) {
            gameParams.bets.pairplus = 0;
        }
        gameParams.wager = gameParams.bets.ante + gameParams.bets.pairplus;
        if (isNaN(gameParams.wager)) {
            throw new HTTPError(400, "invalid wager in play request");
        }
        if (req.wallet.balance() < gameParams.wager + gameParams.bets.ante) {
            throw new HTTPError(412, "Limited Balance");
        }
        return gameParams;
    };

    // override to send a socket.io broadcast when a game is finished
    ThreecardController.prototype.playFinished = function(game, cb) {
        var gameJson = game.filter();
        delete gameJson.final_array;
        delete gameJson.server_seed;
        if (game.status() === 'finished') {
            io.playerEmit(game.player_id(),'player threecard added', gameJson);
            io.playerBroadcast(game.player_id(), 'threecard added', gameJson);
        } else {
            delete gameJson.dealer_hand;
        }
        return cb(undefined, gameJson);
    };

    // we are doing the exact same transforming here, so just assign
    // the function again
    ThreecardController.prototype.nextActionFinished = ThreecardController.prototype.playFinished;

    // read the params for next action, similar to readGameParams, but
    // omits client_seed and wager
    ThreecardController.prototype.readNextActionParams = function(req) {
        var gameParams = {
            action: req.body.action
        };
        return gameParams;
    };

    ThreecardController.prototype.nextActionDebit = function(wallet, gameParams, gameModel, cb) {
        var action = gameParams.action;
        if (action === 1) {
            wallet.debit({
                amount: gameModel.ante(),
                refId: "wager:" + gameParams.gameId + ":raise",
                type: this.Game.modelName + ":wager:raise",
                meta: {
                    locale: gameParams.locale,
                    houseEdge: this.getHouseEdge(gameParams, gameModel),
                    gameOdds: this.getOdds(gameParams)
                }
            }, function(err, transaction) {
                if (err) return cb(err);
                gameModel.wager(gameModel.wager() + gameModel.ante());
                return cb(undefined, transaction);
            });
        } else {
            return cb();
        }
    };

    ThreecardController.prototype.getHouseEdge = function(gameParams, gameModel) {
        if (gameParams.bets) {
            return GameLogic.getHouseEdge(gameParams.bets.ante, gameParams.bets.pairplus);
        } else if (gameModel) {
            return GameLogic.getHouseEdge(gameModel.ante(), gameModel.pairplus());
        } else {
            return BaseMultipartGameController.DEFAULT_HOUSE_EDGE;
        }
    };

    return ThreecardController;
};
