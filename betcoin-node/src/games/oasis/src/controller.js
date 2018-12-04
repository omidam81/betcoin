'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 1000;

module.exports = function(Game, GameLogic, logger, io, HTTPError, BaseMultipartGameController) {
    var OasisController = function() {
        BaseMultipartGameController.call(this, Game, LAST_GAME_MIN_TIME);
    };

    util.inherits(OasisController, BaseMultipartGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    OasisController.prototype.readGameParams = function(req) {
        var gameParams = {};
        var wager = parseInt(req.body.wager, 10);
        if (req.wallet.balance() < wager * 6) {
            throw new HTTPError(412, "Limited Balance");
        }
        return gameParams;
    };

    // override to send a socket.io broadcast when a game is finished
    OasisController.prototype.playFinished = function(game, cb) {
        var gameJson = game.filter();
        delete gameJson.final_array;
        delete gameJson.server_seed;
        if (game.status() === 'finished') {
            io.playerEmit(game.player_id(),'player oasis added', gameJson);
            io.playerBroadcast(game.player_id(), 'oasis added', gameJson);
        }
        return cb(undefined, gameJson);
    };

    // we are doing the exact same transforming here, so just assign
    // the function again
    OasisController.prototype.nextActionFinished = OasisController.prototype.playFinished;

    // read the params for next action, similar to readGameParams, but
    // omits client_seed and wager
    OasisController.prototype.readNextActionParams = function(req) {
        var gameParams = {
            action: req.body.action
        };
        try {
            gameParams.holds = JSON.parse(req.body.holds);
            var drawCount = 0;
            for(var i = 0; i < 5; i++) {
                if (!gameParams.holds[i]) {
                    drawCount++;
                }
            }
            var drawAmount = drawCount;
            if (drawCount === 4) {
                drawAmount = 2;
            } else if (drawCount === 5) {
                drawAmount = 1;
            }
            gameParams.drawCount = drawCount;
            gameParams.drawAmount = drawAmount;
        } catch(e) {
            throw new HTTPError(400, "invalid holds json string");
        }
        return gameParams;
    };

    OasisController.prototype.nextActionDebit = function(wallet, gameParams, gameModel, cb) {
        var action = gameParams.action;
        var self = this;
        if (action === 'raise') {
            wallet.debit({
                amount: gameModel.ante() * 2,
                refId: "wager:" + gameParams.gameId + ":raise",
                type: this.Game.modelName + ":wager:raise",
                meta: {
                    locale: gameParams.locale,
                    houseEdge: 0.0146
                }
            }, function (err, transaction) {
                if (err) return cb(err);
                gameModel.wager(gameModel.wager() + gameModel.ante() * 2);
                return cb(undefined, transaction);
            });
        } else if (action === 'fold') {
            return cb();
        } else if (action === 'draw' && gameModel.status() === 'began') {
            if (gameParams.drawAmount > 0) {
                wallet.debit({
                    amount: gameModel.ante() * gameParams.drawAmount,
                    refId: "wager:" + gameParams.gameId + ":draw",
                    type: this.Game.modelName + ":wager:draw",
                    meta: {
                        locale: gameParams.locale,
                        houseEdge: 1
                    }
                }, function(err, transaction) {
                    if (err) return cb(err);
                    gameModel.wager(gameModel.wager() + gameModel.ante() * gameParams.drawAmount);
                    if (gameParams.drawCount === 5) {
                        wallet.debit({
                            amount: gameModel.ante() * 2,
                            refId: "wager:" + gameParams.gameId + ":raise",
                            type: self.Game.modelName + ":wager:raise",
                            meta: {
                                locale: gameParams.locale,
                                houseEdge: 0.0146
                            }
                        }, function(err, transaction) {
                            if (err) return cb(err);
                            gameModel.wager(gameModel.wager() + gameModel.ante() * 2);
                            return cb(undefined, transaction);
                        });
                    } else {
                        return cb(undefined, transaction);
                    }
                });
            } else {
                return cb(new HTTPError(400, "invalid holds json string"));
            }
        } else {
            return cb(new HTTPError(400, "invalid params"));
        }
    };

    OasisController.prototype.getHouseEdge = function(/*gameParams, gameModel*/) {
        return 0.0523;
    };

    return OasisController;
};
