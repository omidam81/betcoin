'use strict';

var LAST_GAME_MIN_TIME = 7000; // millisecond minimun between spins
var util = require('util');

// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 5000;

module.exports = function(Dice, logger, io, HTTPError, BaseGameController, exchangeRate, Config) {

    var DiceController = function() {
        BaseGameController.call(this, Dice, LAST_GAME_MIN_TIME);
    };

    util.inherits(DiceController, BaseGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    DiceController.prototype.readGameParams = function(req) {
        var target = parseInt(req.body.gameTarget, 10);
        var gameParams = {
            gameTarget: target
        };
        if (isNaN(target)) {
            throw new HTTPError(400, "Invalid game target");
        }
        if (target < 1 || target > 64000) {
            throw new HTTPError(400, "Invalid game target");
        }
        return gameParams;
    };

    // override max bet calc
    DiceController.prototype.checkLimits = function(currency, gameParams, cb) {
        // always allow 0 wager
        if (gameParams.wager === 0) return cb();
        var gameTarget = gameParams.gameTarget;
        var maxbet = 0;
        Config.get('diceBetLimits', function(err, diceMaxBets) {
            if (err) return cb(err);
            var targets = Object.keys(diceMaxBets);
            while (maxbet === 0) {
                var target = parseInt(targets.shift());
                if (gameTarget <= target) {
                    maxbet = diceMaxBets[target].max;
                }
            }
            maxbet = exchangeRate.convert(maxbet, currency);
            logger.dice("dice max bet %d %s", maxbet.toBitcoin(), currency);
            if (gameParams.wager > maxbet) {
                return cb(new HTTPError(400, "Wager too high"));
            } else if (gameParams.wager < 300) {
                return cb(new HTTPError(400, "Wager too low"));
            }
            return cb();
        });
    };

    DiceController.prototype.play = function(req, res, next) {
        if (req.wallet.balance() !== req.wallet.availableBalance()) {
            return next(new HTTPError(422, "You may only use your available balance to play dice. " +
                                      "Your total %s balance is %d and your available balance is %d",
                                      req.wallet.currency(),
                                      req.wallet.balance().toBitcoin(),
                                      req.wallet.availableBalance().toBitcoin()));
        }
        BaseGameController.prototype.play.call(this, req, res, next);
    };

    // override to send a socket.io broadcast when a game is finished
    DiceController.prototype.playFinished = function(game, cb) {
        io.playerEmit(game.player_id(), 'player dice added', game.filter());
        io.playerBroadcast(game.player_id(), 'dice added', game.filter());
        return cb();
    };

    DiceController.prototype.getOdds = function(gameParams) {
        return (1 - ((Dice.MAX_ROLL + 1 - gameParams.gameTarget) / (Dice.MAX_ROLL + 1)));
    };

    DiceController.prototype.getHouseEdge = function() {
        return Dice.HOUSE_EDGE;
    };

    return DiceController;
};
