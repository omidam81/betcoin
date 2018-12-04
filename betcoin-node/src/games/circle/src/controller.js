'use strict';

var LAST_GAME_MIN_TIME = 7000; // millisecond minimun between spins
var util = require('util');

module.exports = function(Circle, logger, io, HTTPError, BaseGameController) {
    var CircleController = function() {
        BaseGameController.call(this, Circle, LAST_GAME_MIN_TIME);
    };

    util.inherits(CircleController, BaseGameController);

    // here we override the next function, since circle has a special init
    CircleController.prototype.next = function(req, res, next) {
        // Only get a game if there is an active session.  We have no
        // player id at this point, so the only verification is that
        // it is there. An actual check on the player id happens when
        // the game is played
        var game = parseInt(req.query.game, 10);
        if (game) {
            Circle.init(game, req.user, function(err, newGame) {
                if (err) {
                    logger.error(err);
                    return next(err);
                }
                res.json(newGame);
            });
        } else {
            return next(new HTTPError(400, "missing game from next game request"));
        }
    };

    CircleController.prototype.readGameParams = function(req) {
        logger.verbose("playing %s circle game %s", req.currency, req.body.game);
        var gameParams = {
            game: parseInt(req.body.game, 10)
        };
        if (isNaN(gameParams.game)) {
            throw new HTTPError(400, "Invalid game");
        }
        return gameParams;
    };

    CircleController.prototype.playFinished = function(game, cb) {
        io.playerEmit(game.player_id(), 'player circle added', game.filter());
        io.playerBroadcast(game.player_id(), 'circle added', game.filter());
        return cb();
    };

    return CircleController;
};
