'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 10000;

module.exports = function(Roulette, logger, io, HTTPError, BaseGameController) {

    var RouletteController = function() {
        BaseGameController.call(this, Roulette, LAST_GAME_MIN_TIME);
    };
    util.inherits(RouletteController, BaseGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    RouletteController.prototype.readGameParams = function(req) {
        var gameParams = {};
        try {
            gameParams.bets = JSON.parse(req.body.bets);
        } catch(e) {
            throw new HTTPError(400, "Invalid bets");
        }
        gameParams.wager = 0;
        for(var x in gameParams.bets) {
            if(gameParams.bets.hasOwnProperty(x)) {
                if(gameParams.bets[x] >= 0) {
                    gameParams.wager += gameParams.bets[x];
                } else {
                    throw new HTTPError(400, "invalid wager in play request");
                }
            }
        }
        if (isNaN(gameParams.wager)) {
            throw new HTTPError(400, "invalid wager in play request");
        }
        return gameParams;
    };

    RouletteController.prototype.getHouseEdge = function(/*gameParams*/) {
        return 0.027;
    };

    RouletteController.prototype.getOdds = function(game) {
        var betmap = Roulette.betmap;
        var round = /(voisins|orphelins|tiers|round)(\[.+\])/;
        var payoutsum = 0;
        var betpayouts = {};
        var possible = [];
        for (var i in game.bets) {
            if(game.bets.hasOwnProperty(i) && betmap.hasOwnProperty(i)) {
                var isRoundBet = false;
                var j, numbers, number;
                if (round.test(i)) {
                    isRoundBet = true;
                    var matches = round.exec(i);
                    j = matches[2];
                }
                if (!isRoundBet) {
                    numbers = JSON.parse(i);
                    for (var x = 0; x < numbers.length; x++) {
                        number = numbers[x];
                        if (possible.indexOf(number) < 0) possible.push(number);
                    }
                } else {
                    numbers = JSON.parse(j);
                    for (var y = 0; y < numbers.length; y++) {
                        number = numbers[y];
                        if (possible.indexOf(number) < 0) possible.push(number);
                    }
                }
            }
        }
        var result = {
            sum: payoutsum,
            betpayouts: betpayouts,
            gameOdds: possible.length / 37
        };
        return result.gameOdds;
    };

    // override to send a socket.io broadcast when a game is finished
    RouletteController.prototype.playFinished = function(game, cb) {
        io.playerEmit(game.player_id(), 'player roulette added', game.filter());
        io.playerBroadcast(game.player_id(), 'roulette added', game.filter());
        return cb();
    };

    return RouletteController;
};
