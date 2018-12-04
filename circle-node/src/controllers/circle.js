'use strict';

var HTTPError = require('httperror-npm');

var LAST_GAME_MIN_TIME = 7000; // millisecond minimun between spins

var sendError = function(err, res) {
    res.json(err.code || 500, err);
};

module.exports = function(Circle, logger, io, betLimits, PlayerInterface) {
    var CircleController = function() {

    };
    CircleController.prototype.read = function(req, res) {
        var id = req.params.id;
        logger.debug('CircleController#read');
        if (id) {
            Circle.find(id, function(err, game) {
                if (err) return sendError(err, res);
                if (!game) return sendError(new HTTPError(404), res);
                if (game.has('client_seed')) {
                    return res.json(game);
                } else {
                    return res.json({
                        nextGameId: game.primary(),
                        sha256: game.initial_hash(),
                        game: game.game()
                    });
                }
            });
        } else {
            logger.debug('read list');
            var limit = req.query.limit || 30;
            var player_id = req.query.player_id || false;
            var query = { client_seed: { $exists: true } };
            var sort = {createdAt: -1};
            if (player_id) {
                query.player_id = player_id;
            }
            Circle.all(query, {sort: sort, limit: limit}, function(err, games) {
                if (err) return sendError(err, res);
                if (!games.length) return res.send(204);
                return res.json(games);
            });
        }
    };

    CircleController.prototype.next = function(req, res) {
        logger.debug('CircleController#next');
        // Only get a game if there is an active session.  We have no
        // player id at this point, so the only verification is that
        // it is there. An actual check on the player id happens when
        // the game is played
        if (!req.token) return sendError(new HTTPError(400, "missing auth token"), res);
        var game = parseInt(req.query.game, 10);
        if (game) {
            Circle.init(game, function(err, newGame) {
                if (err) {
                    logger.error(err);
                    return sendError(err, res);
                }
                res.json(newGame);
            });
        } else {
            return sendError(new HTTPError(400, "missing game from next game request"), res);
        }
    };

    var getGameInterval = function(playerId, cb) {
        Circle.query().find({player_id: playerId}).sort({createdAt: -1}).limit(1).exec(function(err, lastGame) {
            if (err) return cb(err);
            lastGame = lastGame[0];
            if (lastGame) {
                var refDate = new Date();
                return cb(undefined, refDate - lastGame.createdAt());
            } else {
                return cb(undefined, LAST_GAME_MIN_TIME + 1); // if no game found, return a passing value
            }
        });
    };


    CircleController.prototype.play = function(req, res) {
        // make sure a token came up with the request
        if (!req.token) return sendError(new HTTPError(400, "missing auth token"), res);
        var gameId = req.body.game_id;
        if (!gameId) {
            return sendError(new HTTPError(400, "missing game id from play request"), res);
        }
        var gameParams = {
            client_seed: req.body.client_seed,
            game: parseInt(req.body.game, 10),
            wager: parseInt(req.body.wager, 10),
            player_id: req.body.player_id,
            ip: req.ip
        };
        // check if the game is locked, if not, this will lock it
        Circle.checkLock(gameId, function(err, gameData) {
            if (err) return sendError(err, res);
            // check the token against the player id
            PlayerInterface.verifyToken(gameParams.player_id, req.token, function(err, isValid) {
                if (err) return sendError(new HTTPError(500, err.message), res);
                if (!isValid) return sendError(new HTTPError(418, "you can't spin for another player, shame on you"), res);
                if (!gameData) return sendError(new HTTPError(404, "game not found"), res);
                betLimits(function(err, limits) {
                    if (err) return sendError(err, res);
                    if (gameParams.wager !== 0) {
                        if (gameParams.wager > limits.max) return sendError(new HTTPError(400, "Wager too high", "172"), res);
                        if (gameParams.wager < limits.min) return sendError(new HTTPError(400, "Wager too low", "173"), res);
                    }
                    // check the game interval
                    // games played faster than LAST_GAME_MIN_TIME are not allowed
                    getGameInterval(gameParams.player_id, function(err, millisecs) {
                        if (err) return sendError(new HTTPError(500, err.message), res);
                        if (millisecs < LAST_GAME_MIN_TIME) {
                            return sendError(new HTTPError(429, "You must wait " + ((LAST_GAME_MIN_TIME - millisecs) / 1000) + "s to play again"), res);
                        }
                        // check to make sure the game they say they are playing is the game originally created
                        gameData.play(gameParams, function(err, gameResult) {
                            if (err) return sendError(err, res);
                            io.send(gameResult.player_id(), 'player game added', gameResult);
                            io.excludeRoom(gameResult.player_id(), 'game added', gameResult);
                            res.json(gameResult);
                        });
                    });
                });
            });
        });
    };

    CircleController.prototype.leaderboard = function(req, res) {
        var cutoff = new Date(new Date() - (7 * 24 * 60 * 60 * 1000));
        Circle.aggregate(true).match({
            createdAt: {$gte: cutoff},
            wager: {$gt: 0},
            player_id: {$exists: true}
        }).group({
            _id: '$player_alias',
            wagered: {$sum: '$wager'},
            bets: {$sum: 1}
        }).sort({wagered: -1}).limit(300).exec(function(err, docs) {
            if (err) return sendError(err, res);
            res.json(docs);
        });
    };

    return new CircleController();
};
