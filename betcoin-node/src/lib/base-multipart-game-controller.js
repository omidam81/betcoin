'use strict';

var async = require('async');
var inherits = require('util').inherits;

module.exports = function(BaseGameController, HTTPError, CounterController, logger) {

    var counterController = new CounterController();

    var BaseMultipartGameController = function(Game, gameInterval) {
        BaseGameController.call(this, Game, gameInterval);
    };

    inherits(BaseMultipartGameController, BaseGameController);

    BaseMultipartGameController.DEFAULT_HOUSE_EDGE = BaseGameController.DEFAULT_HOUSE_EDGE;

    BaseMultipartGameController.prototype.read = function(req, res, next) {
        var id = req.params.id;
        // get a single record
        if (id) {
            this.Game.find(id, function(err, record) {
                if (err) return next(err);
                if (!record) return next(new HTTPError(404, null));
                // this applies to games, if there is no player id on
                // the record, that means it has not been played yet
                // and need to have some of it data obfiscated
                if (record.played && record.status() === 'finished') {
                    // if the model has a filter method for filtering
                    // out private properties, then use it, therwise
                    // return the model as is
                    if (record.filter && 'function' === typeof record.filter) {
                        return res.json(record.filter());
                    } else {
                        return res.json(record);
                    }
                } else {
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
            var query = { player_id: { $exists: true }, status: 'finished' };
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


    BaseMultipartGameController.prototype.readNextActionParams = function() {
        // This must be overriden to get the params required by the
        // model's play() method

        // player_id, gameId, and ip are taken care of by the
        // base class, so you do not need to get those unless you are
        // overriding the entire BaseMultipartGameController#nextAction function

        throw "#readNextActionParams method must be supplied by sub classes";
    };

    BaseMultipartGameController.prototype.nextActionFinished = function(result, cb) {
        // noop by default
        return cb();
    };

    // actions for debiting and crediting on next action, by default,
    // these methods do nothing, they should be overridden in the sub
    // class if there is a need to debit and credit the user
    // before/following a nextAction() call
    BaseMultipartGameController.prototype.nextActionDebit = function(wallet, gameParams, gameModel, cb) {
        return cb();
    };

    BaseMultipartGameController.prototype.nextActionCredit = function(wallet, gameParams, gameModel, cb) {
        var amount = gameModel.winnings();
        if (amount < 0) {
            return cb(new HTTPError(400, "Invalid winnings, must be >= 0"));
        }
        if (amount > 0 || (gameModel.status && gameModel.status() === 'finished')) {
            var refId = "winnings:" + gameModel.primary() + ":" + gameModel.actionsTaken();
            wallet.credit({
                amount: amount,
                refId: refId,
                type: this.Game.modelName + ":winnings",
                meta: {
                    locale: gameModel.locale()
                }
            }, function(err, transaction) {
                if (err) return cb(err);
                return cb(undefined, transaction);
            });
        } else {
            return cb();
        }
    };

    BaseMultipartGameController.prototype.getNextActionWaterfall = function(user, wallet, gameParams) {
        var self = this;
        var waterfall = [
            function(done) {
                // this consumes the game id, checks if the game is
                // locked, and if not, it returns the full game model to
                // the next function in the waterfall
                self.Game.checkLock(gameParams.gameId, done);
            },
            function(game, done) {
                // call the play() function of the game model and
                // supply the finished game to the waterfall callback
                if (game.status() === 'finished')
                    return done(new HTTPError(418, "Stop that"));
                if (!gameParams.user.primary().equals(game.player_id()))
                    return done(new HTTPError(418, "This is not your game, begone with you toad."));
                game.nextAction(gameParams, function(err, gameResult) {
                    if (err) return done(err);
                    return done(undefined, gameResult);
                });
            },
            function(game, done) {
                if (game.currency() !== wallet.currency()) {
                    return done(new HTTPError(418, "Nice try fucker"));
                }
                // debit the user now that all checks have been passed
                self.nextActionDebit(wallet, gameParams, game, function(err, transaction) {
                    if (err) return done(err);
                    // check if this is being wagered as a bonus, and
                    // if so, do some shit differently
                    if (transaction) {
                        if (transaction.meta().bonus === true) {
                            game.bonus(true);
                        } else {
                            // let this do it's thing outside the timeline
                            // of the rest of this game, so that if there
                            // is an issue it will not ecceft the user
                            var houseEdge = self.getHouseEdge(gameParams, game);
                            var gameOdds = self.getOdds(gameParams, game);
                            gameParams.currency = game.currency();
                            self.processAffiliate(gameParams, houseEdge, gameOdds, function(err) {
                                if (err) return logger.error("Error processing affiliate for %s: %s", wallet.userId(), err.message);
                            });
                        }
                    }
                    game.actionsTaken(game.actionsTaken() + 1);
                    game.locale(user.locale());
                    game.save(function(err) {
                        return done(err, game, transaction);
                    });
                });
            },
            function(result, transaction, done) {
                // credit the user now that all checks have been passed
                self.nextActionCredit(wallet, gameParams, result, function(err, transaction) {
                    if (err) return done(err);
                    result.save(function(err) {
                        return done(err, result, transaction);
                    });
                });
            }
        ];
        return waterfall;

    };

    // hold these locks in memory. A) so they clear when the server is
    // restarted with no intervention and B) because using a lock on
    // the db record is not fast enough when multiple requests are
    // launched simultanoeusly
    var userlocks = {};
    BaseMultipartGameController.prototype.nextAction = function(req, res, next) {
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
            gameParams = this.readNextActionParams(req);
        } catch (ex) {
            return next(ex);
        }
        // get the things that all of the models need
        gameParams.gameId = req.body.gameId;
        gameParams.user = user;
        gameParams.wallet = wallet;
        gameParams.locale = user.locale();
        gameParams.ip = req.ip;
        // if the next action includes a wager, make sure it is an int
        if (gameParams.wager !== undefined) {
            gameParams.wager = parseInt(gameParams.wager, 10);
            if (isNaN(gameParams.wager)) return next(new HTTPError(400, "invalid wager in play request"));
        }
        // check params from user
        if (!gameParams.gameId) {
            return next(new HTTPError(400, "missing game id from play request"));
        }
        var self = this;
        async.waterfall(this.getNextActionWaterfall(user, wallet, gameParams), function(err, result) {
            if (err) {
                // unlock the game if there is an error, preventd DOS
                // by guessing nextGameId
                return self.Game.unlock(gameParams.gameId, function() {
                    return next(err);
                });
            }
            // give the sub class a chance to do stuff with the final
            // result, default behavior is a noop
            self.nextActionFinished(result, function(err, finalResult) {
                if (err) return next(err);
                if (!finalResult) finalResult = result;
                var profit = result.winnings() - result.wager();
                var response;
                if (!result.status || result.status() === 'finished')
                    self.log("%s won %d %s (profit: %s)",
                             result.player_id(),
                             result.winnings().toBitcoin(),
                             wallet.currency(),
                             profit.toBitcoin().toString()[(profit >=0 ) ? "green" : "red"]);
                if (finalResult.filter && 'function' === typeof finalResult.filter) {
                    response = finalResult.filter();
                } else if (finalResult.toJSON && 'function' === typeof finalResult.toJSON) {
                    response = finalResult.toJSON();
                } else {
                    response = finalResult;
                }
                if (result.has('wager') && result.has('winnings')) {
                    counterController.increment(wallet.currency(), result.wager());
                }
                response.balance = wallet.balance();
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

    return BaseMultipartGameController;
};
