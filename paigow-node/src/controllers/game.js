'use strict';

var HTTPError = require('httperror-npm');
var async = require('async');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 1000;

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
                if (game.has('player_id') && game.status() === 'finished') {
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
            var query = { player_id: { $exists: true }, 'status': 'finished' };
            var sort = {createdAt: -1};
            if (player_id) {
                query.player_id = player_id;
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
                    return cb(new HTTPError(400, "Wager too high"));
                }
                if (self.wager < limits.min) {
                    return cb(new HTTPError(400, "Wager too low"));
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
            io.send(gameResult.player_id(), 'player Game added', gameResult);
            io.excludeRoom(gameResult.player_id(), 'Game added', gameResult);
            cb(undefined, gameResult);
        });
    };

    GameController.prototype.play = function(req, res) {
        var gameParams = {
            gameId: req.body.game_id || req.query.id,
            game: req.body.game,
            wager: req.body.wager,
            client_seed: req.body.client_seed,
            player_id: req.body.player_id,
            token: req.token,
            ip: req.ip
        };
        
        // check params from user
        if (!gameParams.gameId) {
            return new HTTPError(400, "missing game id from play request", res);
        }
        if (!gameParams.client_seed) {
            return new HTTPError(400, "missing client seed from play request", res);
        }
        if (!gameParams.player_id) {
            return new HTTPError(400, "missing player id from play request", res);
        }
        if (isNaN(gameParams.wager)) {
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
        ], function(err, game) {
            if (err) return err.send(res);
            game = game.filter();
            delete game.final_array;
            delete game.banker_hand;
            res.json(game);
        });
    };


    var doNextAction = function(gameData, cb) {
        gameData.nextAction(this, function(err, gameResult) {
            if (err) return cb(err);
            io.send(gameResult.player_id(), 'player paigow added', gameResult);
            io.excludeRoom(gameResult.player_id(), 'paigow added', gameResult);
            cb(undefined, gameResult);
        });
    };
    GameController.prototype.nextAction = function(req, res) {
        var gameParams = {
            gameId: req.body._id||req.body.game_id,
            house_way: req.body.house_way,
            player_id: req.body.player_id,
            token: req.token,
            ip: req.ip
        };
        try{
            gameParams.split = JSON.parse(req.body.split);
        }catch(e){
            logger.debug('parse split json error', e);
            return new HTTPError(400, "invalid split json string", res);
        }
        // check params from user
        if (!gameParams.gameId) {
            return new HTTPError(400, "missing game id from play request", res);
        }
        if (!gameParams.player_id) {
            return new HTTPError(400, "missing player id from play request", res);
        }
        // waterfall the play functions declared above, binding
        // gameParams to 'this' inside the functions
        async.waterfall([
            // checks player token with supplied player_id, returns
            // gameId to the next function
            checkPlayerToken.bind(gameParams),
            Game.checkLock,
            // actually play the game, supplies the finished game data
            // to the callback function
            doNextAction.bind(gameParams)
        ], function(err, result) {
            if (err) return res.send(err);
            result = result.filter();
            delete result.final_array;
            delete result.banker_hand.dealerFiveRankObj;
            delete result.banker_hand.dealerTwoRankObj;
            delete result.banker_hand.dealerFiveCards;
            delete result.banker_hand.dealerTwoCards;
            delete result.player_hand.playerFiveRankObj;
            delete result.player_hand.playerTwoRankObj;
            delete result.player_hand.playerFiveCards;
            delete result.player_hand.playerTwoCards;
            res.json(result);
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
