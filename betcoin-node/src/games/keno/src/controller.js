'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 9000;
var maxBets = 8;

module.exports = function(Keno, logger, io, HTTPError, BaseGameController) {

    var KenoController = function() {
        BaseGameController.call(this, Keno, LAST_GAME_MIN_TIME);
    };
    util.inherits(KenoController, BaseGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    KenoController.prototype.readGameParams = function(req) {
        var gameParams = {
            bets: req.body.bets,
            wager: req.body.wager
        };

        if(!gameParams.bets || !Array.isArray(gameParams.bets) || gameParams.bets.length > maxBets) {
            throw new HTTPError(400, "Invalid bets");
        }

        var num = 0;
        for(var i=0; i< gameParams.bets.length; i++) {
            num = parseInt(gameParams.bets[i], 10);
            if(isNaN(num)) {
                throw new HTTPError(400, "Invalid bets");
            }
            gameParams.bets[i] = num;
        }

        var betsTmp = [];
        gameParams.bets.forEach(function(bet) {
            if (betsTmp.indexOf(bet) >= 0) {
                throw new HTTPError(418, "You can only place a bet once on each number");
            } else {
                betsTmp.push(bet);
            }
        });

        if (isNaN(gameParams.wager) || gameParams.wager < 0) {
            throw new HTTPError(400, "invalid wager in play request");
        }

        return gameParams;
    };

    // override to send a socket.io broadcast when a game is finished
    KenoController.prototype.playFinished = function(game, cb) {
        io.playerEmit(game.player_id(), 'player keno added', game.filter());
        io.playerBroadcast(game.player_id(), 'keno added', game.filter());
        return cb();
    };

    return KenoController;
};
