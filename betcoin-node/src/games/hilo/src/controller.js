'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 1000;

module.exports = function(Game, GameLogic, logger, io, HTTPError, BaseMultipartGameController) {

    var HiloController = function() {
        BaseMultipartGameController.call(this, Game, LAST_GAME_MIN_TIME);
    };

    util.inherits(HiloController, BaseMultipartGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    HiloController.prototype.readGameParams = function(req) {
        var gameParams = {};
        try {
            gameParams.bet = JSON.parse(req.body.bet);
            gameParams.wager = 0;
        } catch(e) {
            throw new HTTPError(400, "Invalid bets");
        }
        return gameParams;
    };

    // override to send a socket.io broadcast when a game is finished
    HiloController.prototype.playFinished = function(game, cb) {
        var gameJson = game.filter();

        delete gameJson.server_seed;
        delete gameJson.seed_hash;
        delete gameJson.final_array;
        delete gameJson.dealer_stack;
        delete gameJson.result.remainingCards;

        if (game.status() === 'finished') {
            io.playerEmit(game.player_id(),'player hilo added', gameJson);
            io.playerBroadcast(game.player_id(), 'hilo added', gameJson);
        }
        return cb(undefined, gameJson);
    };

    // we are doing the exact same transforming here, so just assign
    // the function again
    HiloController.prototype.nextActionFinished = HiloController.prototype.playFinished;

    // read the params for next action, similar to readGameParams, but
    // omits client_seed and wager
    HiloController.prototype.readNextActionParams = function(req) {
        var gameParams = {
            wager: parseInt(req.body.wager, 10)
        };
        if (isNaN(gameParams.wager)) {
            throw new HTTPError(400, "invalid wager in play request");
        }
        try {
            gameParams.bet = JSON.parse(req.body.bet);
        } catch(e) {
            throw new HTTPError(400, "Invalid bets");
        }
        if (gameParams.bet.length < 1) {
            throw new HTTPError(400, "At least one bet is required");
        }

        return gameParams;
    };

    HiloController.prototype.getNextActionWaterfall = function(user, wallet, gameParams) {
        var waterfall = HiloController.super_.prototype.getNextActionWaterfall.apply(this, arguments);
        var self = this;
        // add in a check for the wager again, since they may have
        // changed it
        waterfall.unshift(function(done) {
            self.checkLimits(wallet.currency(), gameParams, done);
        });
        return waterfall;
    };

    HiloController.prototype.nextActionDebit = function(wallet, gameParams, gameModel, cb) {
        if (gameParams.bet && gameParams.bet[0]) {
            var lastPlayerStack = gameModel.player_stack();
            var lastDealerStack = gameModel.dealer_stack().concat(lastPlayerStack.pop());
            if (lastPlayerStack.length === 0) {
                logger.warn('hilo lastPlayerStack is empty!');
                gameParams.odds = 0;
            } else {
                var odds = GameLogic.getGameOdds(lastDealerStack, lastPlayerStack);
                gameParams.odds = odds[gameParams.bet[0]];
            }
        }
        wallet.debit({
            amount: gameParams.wager,
            refId: "wager:" + gameParams.gameId + ":stage_" + gameModel.player_stack().length,
            type: this.Game.modelName + ":wager",
            meta: {
                locale: gameParams.locale,
                houseEdge: this.getHouseEdge(gameParams),
                gameOdds: this.getOdds(gameParams),
            }
        }, function(err, transaction) {
            if (err) return cb(err);
            return cb(undefined, transaction);
        });
    };

    HiloController.prototype.nextActionCredit = function(wallet, gameParams, gameModel, cb) {
        if (gameModel.current_payout()) {
            wallet.credit({
                amount: gameModel.current_payout(),
                refId: "winnings:" + gameParams.gameId + ":stage_" + gameModel.player_stack().length,
                type: this.Game.modelName + ":winnings"
            }, function(err, transaction) {
                if (err) return cb(err);
                return cb(undefined, transaction);
            });
        } else {
            return cb();
        }
    };

    HiloController.prototype.getOdds = function(gameParams) {
        return gameParams.odds || 0;
    };

    return HiloController;
};
