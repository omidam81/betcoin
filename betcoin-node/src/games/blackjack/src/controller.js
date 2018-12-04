'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 1000;

module.exports = function(Game, GameLogic, logger, io, HTTPError, BaseMultipartGameController) {

    var BlackjackController = function() {
        BaseMultipartGameController.call(this, Game, LAST_GAME_MIN_TIME);
    };

    util.inherits(BlackjackController, BaseMultipartGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    BlackjackController.prototype.readGameParams = function() {
        return {};
    };

    // override to send a socket.io broadcast when a game is finished
    BlackjackController.prototype.playFinished = function(game, cb) {
        var gameJson = game.filter();
        delete gameJson.server_seed;
        delete gameJson.remainingcards;
        delete gameJson.final_array;
        if (game.status() === 'finished') {
            io.playerEmit(game.player_id(),'player blackjack added', gameJson);
            io.playerBroadcast(game.player_id(), 'blackjack added', gameJson);
        } else {
            // filter the second card from dealer hand in JSON
            gameJson.dealer_hand.cards.splice(gameJson.dealer_hand.cards.length - 1, 1);
        }
        return cb(undefined, gameJson);
    };

    // we are doing the exact same transforming here, so just assign
    // the function again
    BlackjackController.prototype.nextActionFinished = BlackjackController.prototype.playFinished;

    // read the params for next action, similar to readGameParams, but
    // omits client_seed and wager
    BlackjackController.prototype.readNextActionParams = function(req) {
        var gameParams = {
            bet: req.body.bet
        };
        if (!gameParams.bet) throw new HTTPError(400, "Missing bet from request");
        return gameParams;
    };

    BlackjackController.prototype.nextActionDebit = function(wallet, gameParams, gameModel, cb) {
        var betType = gameParams.bet;
        if (betType === 'double' || betType === 'split') {
            var betIndex = 0;
            if (gameModel.player_hands().betHistory) {
                betIndex = gameModel.player_hands().betHistory.length || 0;
            }
            wallet.debit({
                amount: gameModel.wager() / 2,
                refId: "wager:" + gameParams.gameId + ":" + betType + betIndex,
                type: this.Game.modelName + ":wager:" + betType,
                meta: {
                    locale: gameParams.locale,
                    houseEdge: this.getHouseEdge(gameParams),
                    gameOdds: this.getOdds(gameParams)
                }
            }, function(err, transaction) {
                if (err) return cb(err);
                return cb(undefined, transaction);
            });
        } else {
            return cb();
        }
    };

    return BlackjackController;
};
