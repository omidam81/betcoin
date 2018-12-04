'use strict';

var HTTPError = require('httperror-npm');
var async = require('async');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 9000;
var maxBets = 8;

module.exports = function(Game, logger, io, betLimits, PlayerInterface) {

    var GameController = function() {

    };

    GameController.prototype.read = function(req, res) {
        var id = req.params.id;
        logger.debug('GameController#read');
        if (id) {
            Game.find(id, function(err, game) {
                if (err) return err.send(res);
                if (!game) {
                    return new HTTPError(404, null, res);
                }
                // if the game has not been played yet, only return
                // the seed hash and id, otherwise return the full
                // game
                // ... game.filter() is the default model filter. It removes any fields with filtered;true in the model definition
                // .. but if there is "player_id" then that means if a player saw that they could see the outcome of the game before playing, so we ONLY return the SHA256 hash and the info needed to actually trigger the gameplay, no server seed or anything else they could use to determine outcome.

                    if (game.has('player_id')) {
                    return res.json(game.filter());
                } else {
                    return res.json({
                        nextGameId: game.primary(),
                        sha256: game.seed_hash()
                    });
                }
            });
        } else {
            logger.debug('read list');
            var limit = req.query.limit || 30;
            var player_id = req.query.player_id || false;
            var sort = {createdAt: -1};

            var query = { player_id: { $exists: true } };
            if (player_id) {
                query.player_id = player_id;
            } else {
                query.player_id = { $exists: true };
            }

            Game.all(query, {sort: sort, limit: limit}, function(err, games) {
                if (err) return new HTTPError(500, err.message, res);
                if (!games.length) return res.send(204);
                var filteredGames = [];
                games.forEach(function(game) {
                    filteredGames.push(game.filter());
                });
                return res.json(filteredGames);
            });
        }
    };

    // initialize a new game and send the hash to the user
    GameController.prototype.next = function(req, res) {
        logger.debug('GameController#next');
        Game.init(function(err, newGame) {
            if (err) {
                logger.error(err);
                return err.send(res);
            }
            res.json(newGame);
        });
    };

    /**
     * getGameInterval
     *
     * A function to get the time in milliseconds since the last time
     * a player played the game, this is used to prevent script
     * kiddies from spamming the game, and the interval is generally
     * related to the animation on the client side
     */
    var getGameInterval = function(playerId, cb) {
        Game.query().find({player_id: playerId}).sort({createdAt: -1}).limit(1).exec(function(err, lastGame) {
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

    // Functions for playing a game, declared once at init rather than
    // inside the play function. The 'this' variable is bound to the
    // game params from the user's request
    var checkPlayerToken = function(cb) {
        var self = this;
        PlayerInterface.verifyToken(this.player_id, this.token, function(err, isValid) {
            if (err) return cb(new HTTPError(500, err.message));
            if (!isValid) return cb(new HTTPError(418, "You cannot play for another player, you jerk"));
            // return the gameId in the callback, the next stage in
            // the waterfall is Game.checkLock which consumes a
            // gameId string
            return cb(undefined, self.gameId);
        });
    };
    // the betLimits function is injected by the depency manager, see
    // container/index.js
    var checkLimits = function(gameData, cb) {
        var self = this;
        betLimits(function(err, limits) {
            if (err) return cb(err);
            if (self.wager !== 0) {
                if (self.wager > limits.max) {
                    return cb(new HTTPError(400, "Wager too high", "172"));
                }
                if (self.wager < limits.min) {
                    return cb(new HTTPError(400, "Wager too low", "173"));
                }
            }
            cb(undefined, gameData);
        });
    };
    // check the game interval
    // games played faster than LAST_GAME_MIN_TIME are not allowed
    var checkInterval = function(gameData, cb) {
        getGameInterval(this.player_id, function(err, millisecs) {
            if (err) {
                return cb(new HTTPError(500, err.message));
            }
            if (millisecs < LAST_GAME_MIN_TIME) {
                var errString = "You must wait " + ((LAST_GAME_MIN_TIME - millisecs) / 1000) + "s to play again";
                return cb(new HTTPError(429, errString));
            }
            cb(undefined, gameData);
        });
    };
    // then have the game play itself
    var playGame = function(gameData, cb) {
        gameData.play(this, function(err, gameResult) {
            if (err) return cb(err);
            io.send(gameResult.player_id(), 'player game added', gameResult);
            io.excludeRoom(gameResult.player_id(), 'game added', gameResult);
            cb(undefined, gameResult);
        });
    };


    GameController.prototype.play = function(req, res) {
        var gameParams = {
            gameId: req.body.game_id,
            game: req.body.game,
            client_seed: req.body.client_seed,
            player_id: req.body.player_id,
            token: req.token,
            bets: req.body.bets,
            wager: req.body.wager,
            ip: req.ip
        };


        if(!gameParams.bets) {
            return new HTTPError(400, "missing bets", res);
        }

        if(!Array.isArray(gameParams.bets)) {
            return new HTTPError(400, "invalid bets", res);
        }

        if(gameParams.bets.length > maxBets) {
            return new HTTPError(400, "invalid bet length", res);
        }

        var num = 0;
        for(var i=0; i< gameParams.bets.length; i++) {
            num = parseInt(gameParams.bets[i], 10);
            if(isNaN(num)) {
                return new HTTPError(400, "invalid bets", res);
            }

            gameParams.bets[i] = num;
        }


        if (!gameParams.gameId) {
            return new HTTPError(400, "missing game id from play request", res);
        }
        if (!gameParams.client_seed) {
            return new HTTPError(400, "missing client seed from play request", res);
        }
        if (!gameParams.player_id) {
            return new HTTPError(400, "missing player id from play request", res);
        }
        if (isNaN(gameParams.wager) || gameParams.wager < 0) {
            return new HTTPError(400, "invalid wager in play request", res);
        }
        // waterfall the play functions declared above, binding
        // gameParams to 'this' inside the functions
        async.waterfall([
            // checks player token with supplied player_id, returns
            // gameId to the next function
            checkPlayerToken.bind(gameParams),
            // checkLock is used directly, no binding needed, it
            // returns a ready to play game object to the next
            // function
            Game.checkLock,
            // checks bet against bet limits, supplies gameData to the
            // next function
            checkLimits.bind(gameParams),
            // check the play speed, supplied gameData to the next
            // function
            checkInterval.bind(gameParams),
            // actually play the game, supplies the finished game data
            // to the callback function
            playGame.bind(gameParams)
        ], function(err, result) {
            if (err) return err.send(res);
            res.json(result.filter());
        });
    };

    GameController.prototype.leaderboard = function(req, res) {
        // only pull records from the last 7 days
        var cutoff = new Date(new Date() - (7 * 24 * 60 * 60 * 1000));
        Game.aggregate(true).match({
            createdAt: {$gte: cutoff},
            wager: {$gt: 0},
            player_id: {$exists: true}
        }).group({
            _id: '$player_alias',
            wagered: {$sum: '$wager'},
            bets: {$sum: 1}
        }).sort({wagered: -1}).limit(300).exec(function(err, docs) {
            if (err) return new HTTPError(500, err.message, res);
            res.json(docs);
        });
    };

    return new GameController();
};
