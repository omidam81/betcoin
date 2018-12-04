'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 1000;

module.exports = function(Game, GameLogic, logger, io, HTTPError, BaseMultipartGameController) {

    var UltimatepokerController = function() {
        BaseMultipartGameController.call(this, Game, LAST_GAME_MIN_TIME);
    };

    util.inherits(UltimatepokerController, BaseMultipartGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    UltimatepokerController.prototype.readGameParams = function(req) {
        var gameParams = {};
        try {
            gameParams.bets = JSON.parse(req.body.bets);
        } catch(e) {
            throw new HTTPError(400, "Invalid bets");
        }
        if (!gameParams.bets.ante) {
            gameParams.bets.ante = 0;
        }
        if (!gameParams.bets.blind) {
            gameParams.bets.blind = 0;
        }
        if (!gameParams.bets.trips) {
            gameParams.bets.trips = 0;
        }
        if (gameParams.bets.ante !== gameParams.bets.blind) {
            throw new HTTPError(400, "invalid wager in play request");
        }
        gameParams.wager = 0;
        for(var x in gameParams.bets) {
            if(gameParams.bets.hasOwnProperty(x)) {
                if(gameParams.bets[x] >= 0) { //ante, blind, trips
                    gameParams.wager += gameParams.bets[x];
                } else {
                    throw new HTTPError(400, "invalid wager in play request");
                }
            }
        }
        if (isNaN(gameParams.wager)) {
            throw new HTTPError(400, "invalid wager in play request");
        }
        if (req.wallet.balance() < gameParams.wager + gameParams.bets.ante * 4) {
            throw new HTTPError(412, "Limited Balance");
        }
        return gameParams;
    };

    // override to send a socket.io broadcast when a game is finished
    UltimatepokerController.prototype.playFinished = function(game, cb) {
        var gameJson = game.filter();
        delete gameJson.final_array;
        delete gameJson.server_seed;
        if (game.status() === 'finished') {
            io.playerEmit(game.player_id(),'player ultimatepoker added', gameJson);
            io.playerBroadcast(game.player_id(), 'ultimatepoker added', gameJson);
        } else {
            delete gameJson.dealer_hand;
        }
        return cb(undefined, gameJson);
    };

    // we are doing the exact same transforming here, so just assign
    // the function again
    UltimatepokerController.prototype.nextActionFinished = UltimatepokerController.prototype.playFinished;

    // read the params for next action, similar to readGameParams, but
    // omits client_seed and wager
    UltimatepokerController.prototype.readNextActionParams = function(req) {
        var gameParams = {
            action: req.body.action
        };
        try {
            gameParams.bets = JSON.parse(req.body.bets);
        } catch(e) {
            throw new HTTPError(400, "Invalid bets");
        }
        return gameParams;
    };

    UltimatepokerController.prototype.nextActionDebit = function(wallet, gameParams, gameModel, cb) {
        var action = gameParams.action;
        var bets = gameModel.bets();
        var play = gameParams.bets.play;
        if (action === 'raise' && bets.ante && play) {
            var ante = bets.ante;
            var status = gameModel.status();

            if (status === "began") {
                if (play !== ante * 3 && play !== ante * 4) {
                    return cb(new HTTPError(423, 'invalid bet param'));
                }
            }
            if (status === "three") {
                if (play !== ante * 2) {
                    return cb(new HTTPError(423, 'invalid bet param'));
                }
            }
            if (status === "five") {
                if (play !== ante) {
                    return cb(new HTTPError(423, 'Invalid bet param'));
                }
            }

            wallet.debit({
                amount: play,
                refId: "wager:" + gameParams.gameId + ":raise",
                type: this.Game.modelName + ":wager:raise",
                meta: {
                    locale: gameParams.locale,
                    houseEdge: this.getHouseEdge(gameParams, gameModel),
                    gameOdds: this.getOdds(gameParams)
                }
            }, function(err, transaction) {
                if (err) return cb(err);
                gameModel.wager(gameModel.wager() + play);
                return cb(undefined, transaction);
            });
        } else {
            return cb();
        }
    };

    UltimatepokerController.prototype.getHouseEdge = function(gameParams, gameModel) {
        if (gameParams.bets) {
            return GameLogic.getHouseEdge(gameParams.bets.ante, gameParams.bets.blind);
        } else if (gameModel) {
            return GameLogic.getHouseEdge(gameModel.bets().ante, gameModel.bets().blind());
        } else {
            return BaseMultipartGameController.DEFAULT_HOUSE_EDGE;
        }
    };

    return UltimatepokerController;
};