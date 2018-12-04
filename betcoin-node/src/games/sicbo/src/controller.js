'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 4000;

module.exports = function(Sicbo, GameLogic, logger, io, HTTPError, BaseGameController) {

    var SicboController = function() {
        BaseGameController.call(this, Sicbo, LAST_GAME_MIN_TIME);
    };
    util.inherits(SicboController, BaseGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    SicboController.prototype.readGameParams = function(req) {
        var gameParams = {};
        try {
            gameParams.bets = JSON.parse(req.body.bets);
        } catch(e) {
            throw new HTTPError(400, "Invalid bets: " + req.body.bets);
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

    SicboController.prototype.getHouseEdge = function(gameParams) {
        return GameLogic.getHouseEdge(gameParams.bets);
    };

    // override to send a socket.io broadcast when a game is finished
    SicboController.prototype.playFinished = function(game, cb) {
        io.playerEmit(game.player_id(), 'player sicbo added', game.filter());
        io.playerBroadcast(game.player_id(), 'sicbo added', game.filter());
        return cb();
    };

    SicboController.prototype.getOdds = function(game) {
        var betmap = GameLogic.betmap;
        var possible = [];
        var totalRolls = 216;
        for (var i in game.bets) {
            if(game.bets.hasOwnProperty(i) && betmap.hasOwnProperty(i)) {
                // var wager = game.bets[i];
                // var multiplier = betmap[i];
                var bet = JSON.parse(i);
                var betType = bet.shift();
                if (betType === 'small' || betType === 'big') {
                    // 105 possible rolls win for each of these
                    possible.push(105 / totalRolls);
                } else if (betType === 'single_dice') {
                    // 91 rolls have at least a single
                    possible.push(91 / totalRolls);
                } else if (betType === 'two_dice') {
                    // 30 rolls will match
                    possible.push(30 / totalRolls);
                } else if (betType === 'total') {
                    var rolls;
                    switch (bet[0]) {
                    case 4:
                    case 17:
                        rolls = 3;
                        break;
                    case 5:
                    case 16:
                        rolls = 6;
                        break;
                    case 6:
                    case 15:
                        rolls = 10;
                        break;
                    case 7:
                    case 14:
                        rolls = 15;
                        break;
                    case 8:
                    case 13:
                        rolls = 21;
                        break;
                    case 9:
                    case 12:
                        rolls = 25;
                        break;
                    case 10:
                    case 11:
                        rolls = 27;
                        break;
                    }
                    possible.push(rolls / totalRolls);
                } else if (betType === 'double') {
                    // 16 rolls contain a double
                    possible.push(16 / totalRolls);
                } else if (betType === 'any_triple') {
                    // 6 triples available
                    possible.push(6 / totalRolls);
                } else if (betType === 'triple') {
                    // only 1 of each triple
                    possible.push(1 / totalRolls);
                }
            }
        }
        var totalOdds = 0;
        possible.forEach(function(odd) {
            totalOdds += odd;
        });
        return Math.min(totalOdds, 1);
    };

    return SicboController;
};
