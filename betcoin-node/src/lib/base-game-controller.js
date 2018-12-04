'use strict';

var async = require('async');

var HOUSE_EDGE = 0.0165;

module.exports = function(HTTPError, logger, Config, AffiliateController, CounterController, JackpotController, mailer) {

    var affController = new AffiliateController();
    var counterController = new CounterController();
    var jackpotController = new JackpotController();

    /*
     * new BaseGameController(Model);
     *
     * this will give you a controller with the default game time of 7
     * seconds
     *
     * new BaseGameController(model, 9000);
     *
     * this will give you a controller with a 9 second game time
     *
     * new BaseGameController(model, {gameInterval: 9000, loggerName: 'altgamename'});
     *
     * this will give you a controller with a game time of 9 seconds
     * and will log using a different name than the nodel name
     *
     */
    var BaseGameController = function(Game, config) {
        if (typeof config === 'number') {
            config = {gameInterval: config};
        }
        if (!config) config = {};
        this.Game = Game;
        this.gameName = Game.modelName;
        this.log = (logger[config.loggerName || Game.modelName]).bind(logger);
        this.LAST_GAME_MIN_TIME = config.gameInterval || 7000;
    };

    BaseGameController.DEFAULT_HOUSE_EDGE = HOUSE_EDGE;

    BaseGameController.prototype.read = function(req, res, next) {
        var id = req.params.id;
        // get a single record
        if (id) {
            this.Game.find(id, function(err, record) {
                if (err) return next(err);
                if (!record) return next(new HTTPError(404, null));
                // this applies to games, if there is no player id on
                // the record, that means it has not been played yet
                // and need to have some of it data obfiscated
                if (record.played) {
                    logger.verbose("game played, returning filtered game");
                    // if the model has a filter method for filtering
                    // out private properties, then use it, therwise
                    // return the model as is
                    if (record.filter && 'function' === typeof record.filter) {
                        return res.json(record.filter());
                    } else {
                        return res.json(record);
                    }
                } else {
                    logger.verbose("game unplayed, obfuscating");
                    return res.json({
                        nextGameId: record.primary(),
                        sha256: record.seed_hash()
                    });
                }
            });
        } else {
            // get additional optional parameters
            var limit = req.query.limit || 30;
            var player_id = req.query.player_id || false;
            var query = { player_id: { $exists: true } };
            var sort = {createdAt: -1};
            if (player_id) {
                logger.verbose('getting %s list for %s', this.gameName, player_id);
                query.player_id = new this.Game.db.id(player_id);
            }
            this.Game.all(query, {sort: sort, limit: limit}, function(err, records) {
                if (err) return next(err);
                if (!records || !records.length) return res.status(204).send();
                // if the model has a filter method for filtering
                // out private properties, then use it, therwise
                // return the model as is
                if (records[0].filter && 'function' === typeof records[0].filter) {
                    var filteredRecords = [];
                    records.forEach(function(record) {
                        filteredRecords.push(record.filter());
                    });
                    return res.json(filteredRecords);
                } else {
                    return res.json(records);
                }
            });
        }
    };

    BaseGameController.prototype.next = function(req, res, next) {
        this.Game.init(req.user, function(err, initData) {
            if (err) return next(err);
            res.json(initData);
        });
    };

    BaseGameController.prototype.getGameInterval = function(playerId, cb) {
        var self = this;
        this.Game.get({
            player_id: playerId
        }, {
            sort: {
                createdAt: -1
            }
        }, function(err, lastGame) {
            if (err) return cb(new HTTPError(err.code || 500, "error getting last game time: " + err.message));
            if (lastGame) {
                var refDate = new Date();
                return cb(undefined, refDate - lastGame.createdAt());
            } else {
                logger.verbose("no games found for %s, allowing play", playerId);
                return cb(undefined, self.LAST_GAME_MIN_TIME + 1);
            }
        });
    };

    BaseGameController.prototype.readGameParams = function(/*req*/) {
        // This must be overriden to get the params required by the
        // model's play() method

        // player_id, gameId, client_seed, and ip are taken care of by the
        // base class, so you do not need to get those unless you are
        // overriding the entire BaseGameController#play function

        throw "#readGameParams method must be supplied by sub classes";
    };

    BaseGameController.prototype.checkLimits = function(currency, gameParams, cb) {
        // allow zero wager games always
        if (gameParams.wager === 0) return cb();
        Config.get(this.gameName + 'BetLimits', function(err, limits) {
            if (err) return cb(err);
            var wager = gameParams.wager;
            var limit = limits[currency];
            if (!limit)
                // here we assume the limit to be infinity
                return cb();
            if (wager > limits[currency].max) {
                return cb(new HTTPError(400, "Wager too high"));
            } else if (wager < (limits[currency].min || 100)) {
                return cb(new HTTPError(400, "Wager too low"));
            } else {
                return cb();
            }
        });
    };

    BaseGameController.prototype.playFinished = function(result, cb) {
        // noop bt default
        return cb();
    };

    BaseGameController.prototype.getOdds = function(/*gameParams*/) {
        // by default returns 0 odds, so the player gets full credit
        // for bonuses and such
        return 0;
    };

    BaseGameController.prototype.getHouseEdge = function(/*gameParams*/) {
        return HOUSE_EDGE;
    };

    BaseGameController.prototype.processAffiliate = function(gameParams, houseEdge, gameOdds, cb) {
        affController.processWager(gameParams.user, {
            game: this.Game.modelName,
            gameId: new this.Game.db.id(gameParams.gameId),
            wager: gameParams.wager,
            houseEdge: houseEdge,
            gameOdds: gameOdds,
            currency: gameParams.currency
        }, function(err) {
            if (err) return cb(err);
        });

    };

    // by default, it sets up some info about the game. Override this
    // method or the getOdds method if you need to do something
    // different
    BaseGameController.prototype.debitUser = function(wallet, gameParams, cb) {
        var houseEdge = this.getHouseEdge(gameParams);
        var gameOdds = this.getOdds(gameParams);
        wallet.debit({
            amount: parseInt(gameParams.wager, 10),
            refId: "wager:" + gameParams.gameId,
            type: this.Game.modelName + ":wager",
            meta: {
                houseEdge: houseEdge,
                gameOdds: gameOdds,
                locale: gameParams.locale
            }
        } , function(err, transaction) {
            if (err) return cb(err);
            return cb(undefined, transaction);
        });
    };

    BaseGameController.prototype.creditUser = function(wallet, game, cb) {
        var amount = game.winnings();
        var gameName = this.Game.modelName;
        if (amount < 0) {
            return cb(new HTTPError(400, "Invalid winnings, must be >= 0"));
        }
        if (isNaN(amount)) {
            var subject =  'NaN winnings detected in ' + gameName;
            var message = subject + '\n';
            message += JSON.stringify(game) + '\n';
            message += new Error().stack + '\n';
            logger.error(subject);
            mailer.sendBasic(mailer.ADMIN_EMAILS, subject, message);
            amount = 0;
        }
        wallet.credit({
            amount: amount,
            refId: "winnings:" + game.primary() + ":" + game.actionsTaken(),
            type: gameName+ ":winnings",
            meta: {
                locale: game.locale()
            }
        }, function(err, transaction) {
            if (err) return cb(err);
            return cb(undefined, transaction);
        });
    };

    BaseGameController.prototype.getPlayWaterfall = function(user, wallet, gameParams) {
        var self = this;
        var waterfall = [
            function(done) {
                // implemented by sub classes, this method makes sure
                // the wager is within the bounds of the bet limits
                // the default implementation is hard coded to 0.1 BTC
                // max bet and 100 satoshi min bet
                logger.verbose('checking game limits');
                self.checkLimits(wallet.currency(), gameParams, done);
            },
            function(done) {
                // if the admin override is enabled, justskip this check
                if (gameParams.adminOverride === true) return done();
                // get the game interval and check it against the
                // value proved at instantiation
                logger.verbose('getting last game interval');
                self.getGameInterval(gameParams.user.primary(), function(err, millisecs) {
                    if (err) {
                        return done(new HTTPError(500, err.message));
                    }
                    logger.verbose('last game was %ds ago', (millisecs / 1000));
                    if (millisecs < self.LAST_GAME_MIN_TIME) {
                        var errString = "You must wait " + ((self.LAST_GAME_MIN_TIME - millisecs) / 1000) + "s to play again";
                        return done(new HTTPError(429, errString));
                    }
                    return done();
                });
            },
            function(done) {
                // this consumes the game id, checks if the game is
                // locked, and if not, it returns the full game model to
                // the next function in the waterfall
                logger.verbose('checking game lock');
                self.Game.checkLock(gameParams.gameId, done);
            },
            function(game, done) {
                // first check to make sure someone is not trying to play the game twice
                if (game.has('client_seed'))
                    return done(new HTTPError(422, "This game has already been played"));
                if (!gameParams.user.primary().equals(game.player_id()))
                    return done(new HTTPError(418, "This is not your game, begone with you toad."));

                // debit the user now that all checks have been passed
                self.debitUser(wallet, gameParams, function(err, transaction) {
                    if(err) return done(err);
                    // check if this is being wagered as a bonus, and
                    // if so, do some shit differently
                    if (transaction && transaction.meta().bonus === true) {
                        game.bonus(true);
                    } else {
                        // let this do it's thing outside the timeline
                        // of the rest of this game, so that if there
                        // is an issue it will not ecceft the user
                        var houseEdge = self.getHouseEdge(gameParams);
                        var gameOdds = self.getOdds(gameParams);
                        self.processAffiliate(gameParams, houseEdge, gameOdds, function(err) {
                            if (err) return logger.error("Error processing affiliate for %s: %s", wallet.userId(), err.message);
                        });
                    }
                    return done(undefined, game, transaction);
                });
            },
            function(game, transaction, done) {
                // call the play() function of the game model and
                // supply the finished game to the waterfall callback
                logger.verbose('playing game');
                game.currency(wallet.currency());
                game.locale(user.locale());
                game.play(gameParams, function(err, gameResult) {
                    if (err) return done(err);
                    return done(undefined, gameResult, transaction);
                });
            },
            function(result, debitTransaction, done) {
                // credit the user now that all checks have been passed
                if (!result.has('status') || (result.status() === undefined || result.status() === 'finished')) {
                    self.creditUser(wallet, result, function(err) {
                        return done(err, result, debitTransaction);
                    });
                } else {
                    return done(undefined, result, debitTransaction);
                }
            }
        ];
        return waterfall;
    };

    // hold these locks in memory. A) so they clear when the server is
    // restarted with no intervention and B) because using a lock on
    // the db record is not fast enough when multiple requests are
    // launched simultanoeusly
    var userlocks = {};
    BaseGameController.prototype.play = function(req, res, next) {
        var user = req.user;
        if (userlocks[user.username()]) return next(new HTTPError(418, "You cannot play two games at once"));
        userlocks[user.username()] = true;
        var oldNext = next;
        next = function() {
            delete userlocks[user.username()];
            oldNext.apply(oldNext, arguments);
        };
        var wallet = req.wallet;
        var gameParams;
        try {
            gameParams = this.readGameParams(req);
        } catch (ex) {
            return next(ex);
        }
        // get the things that all of the models need
        gameParams.gameId = req.body.gameId;
        gameParams.client_seed = req.body.client_seed;
        gameParams.currency = req.currency;
        gameParams.user = user;
        gameParams.locale = user.locale();
        gameParams.ip = req.ip;
        gameParams.adminOverride = req.get('x-admin-override') === process.env.ADMIN_OVERRIDE_PASSWORD;
        if (!gameParams.hasOwnProperty('wager')) {
            gameParams.wager = parseInt(req.body.wager, 10);
        }
        gameParams.wallet = wallet;
        // check params from user
        if (!gameParams.gameId) {
            return next(new HTTPError(400, "missing game id from play request"));
        }
        if (!gameParams.client_seed) {
            return next(new HTTPError(400, "missing client seed from play request"));
        }
        if (isNaN(gameParams.wager)) {
            return next(new HTTPError(400, "invalid wager in play request"));
        }
        this.log("%s wagered %d %s", req.user.primary(), gameParams.wager.toBitcoin(), wallet.currency());
        var self = this;
        async.waterfall(this.getPlayWaterfall(user, wallet, gameParams), function(err, result, transaction) {
            if (err) {
                // unlock the game if there is an error, preventd DOS
                // by guessing nextGameId
                return self.Game.unlock(gameParams.gameId, function() {
                    return next(err);
                });
            }
            // give the sub class a chance to do stuff with the final
            // result, default behavior is a noop
            self.playFinished(result, function(err, finalResult) {
                if (err) return next(err);
                if (!finalResult) finalResult = result;
                var profit = result.winnings() - result.wager();
                var response;
                if (!result.nextAction || (result.status && result.status() === 'finished'))
                    logger.info("%s won %d %s on %s (profit: %s)",
                                result.player_id(),
                                result.winnings().toBitcoin(),
                                wallet.currency(),
                                self.gameName,
                                profit.toBitcoin().toString()[(profit >=0 ) ? "green" : "red"]);
                if (finalResult.filter && 'function' === typeof finalResult.filter) {
                    response = finalResult.filter();
                } else if (finalResult.toJSON && 'function' === typeof finalResult.toJSON) {
                    response = finalResult.toJSON();
                } else {
                    response = finalResult;
                }
                response.balance = wallet.balance();
                if (transaction && result.has('wager') && result.has('winnings')) {
                    counterController.increment(wallet.currency(), result.wager());
                    if (wallet.currency() === 'bitcoin' && !transaction.meta().bonus)
                        jackpotController.increment(user, result.wager());
                }
                if(response.status && response.status !== 'finished'){
                    delete response.server_seed;
                }
                req.user.updatedAt(new Date());
                req.user.save(function(err) {
                    if (err) logger.error("Error setting updatedAt on user after play");
                    response.wagerCount = user.wagerCount();
                    delete userlocks[user.username()];
                    res.json(response);
                });
            });
        });
    };

    BaseGameController.prototype.leaderboard = function(req, res, next) {
        var cutoff = new Date(new Date() - (7 * 24 * 60 * 60 * 1000));
        this.Game.aggregate(true).match({
            createdAt: {$gte: cutoff},
            wager: {$gt: 0},
            player_id: {$exists: true}
        }).group({
            _id: '$player_alias',
            wagered: {$sum: '$wager'},
            bets: {$sum: 1}
        }).sort({wagered: -1}).limit(300).exec(function(err, docs) {
            if (err) return next(new HTTPError(err.code || 500, err.message));
            res.json(docs);
        });
    };

    return BaseGameController;
};
