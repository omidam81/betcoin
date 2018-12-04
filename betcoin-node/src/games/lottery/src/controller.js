'use strict';

var util = require('util');
var async = require('async');
var ObjectId = require('mongoskin').ObjectID;

var LAST_GAME_MIN_TIME = 1000;
module.exports = function(BaseGameController, Bet, Lottery, Scheduler, io, logger, HTTPError) {
    var LotteryController = function() {
        BaseGameController.call(this, Bet, {gameInterval: LAST_GAME_MIN_TIME, loggerName: 'lottery'});
        this.Lottery = Lottery;
    };
    util.inherits(LotteryController, BaseGameController);

    // overwrite the required readGameParams function to get the
    // necessary params from the request object, returns a has of the
    // game options ready for the model's play() function. If there is
    // an error getting the things you need, throw an HTTPError

    // player_id, gameId, client_seed, and ip are taken care of by the
    // base class, so you do not need to get those unless you are
    // overriding the entire BaseGameController#play function
    LotteryController.prototype.readGameParams = function(req) {
        var gameParams = {
            lottery: req.lottery
        };
        return gameParams;
    };

    LotteryController.prototype.getHouseEdge = function() {
        return 0.12;
    };

    LotteryController.prototype.debitUser = function(wallet, gameParams, cb) {
        var wager = parseInt(gameParams.wager, 10);
        var leftovers = (wager % gameParams.lottery.ticket_price());
        if (leftovers) {
            this.log("wager not divisible by ticket price, adjusting from %d to %d", wager.toBitcoinString(), (wager - leftovers).toBitcoinString());
            wager = wager - leftovers;
        }
        if (isNaN(wager) || wager === 0) return cb(new HTTPError(400, "Invalid wager"));
        gameParams.wager = wager;

        BaseGameController.prototype.debitUser.call(this, wallet, gameParams, cb);
    };

    LotteryController.prototype.play = function(req, res, next) {
        var now = new Date();
        if (req.lottery.start() > now) return next(new HTTPError(423, "I don't even think this is possible"));
        if (req.lottery.end() < now) return next(new HTTPError(423, "This lottery is already over"));
        if (req.wallet.balance() !== req.wallet.availableBalance()) {
            return next(new HTTPError(422, "You may only use your available balance to purchase tickets. " +
                                      "Your total %s balance is %d and your available balance is %d",
                                      req.wallet.currency(),
                                      req.wallet.balance().toBitcoin(),
                                      req.wallet.availableBalance().toBitcoin()));
        }
        BaseGameController.prototype.play.call(this, req, res, next);
    };

    // override to send a socket.io broadcast when a game is finished
    LotteryController.prototype.playFinished = function(game, cb) {
        io.playerEmit(game.player_id().toHexString(), 'player lotterybet added', game.filter());
        io.playerBroadcast(game.player_id().toHexString(), 'lotterybet added', game.filter());
        Lottery.find({_id: game.lottery_id()}, function(err, lottery){
            lottery.selectWinner(function(){
                lottery.server_seed("hidden");
                io.playerEmit(game.player_id(), 'player winner selected', lottery);
                io.playerBroadcast(game.player_id(), 'winner selected', lottery);
                return cb();
            }, true);
        });
    };

    LotteryController.prototype.creditUser = function(wallet, bet, cb) {
        Lottery.find({_id: bet.primary()}, function(err, game){
            if(!game || game.finished() !== true){
                return cb(undefined, bet);
            }
            var amount = game.jackpot();
            if (amount <= 0 || !amount) {
                return cb(undefined, bet);
            }
            wallet.credit({
                amount: amount,
                refId: "winnings:" + game.primary(),
                type: this.Game.modelName + ":winnings"
            }, function(err, transaction) {
                if (err) return cb(err);
                return cb(undefined, bet, transaction);
            });
        });
    };

    // internal call only, does not take express params
    LotteryController.prototype.create = function(config, cb) {
        if (!config.ticketPrice) config.ticketPrice = Lottery.DEFAULT_TICKET_PRICE;
        config.ticketPrice = parseInt(config.ticketPrice);
        if (isNaN(config.ticketPrice)) return cb(new HTTPError(400, "invalid ticket price"));
        config.start = new Date(config.start);
        config.end = new Date(config.end);
        if (!util.isDate(config.start) || isNaN(config.start.getTime())) return cb(new HTTPError(400, "invalid start date"));
        if (!util.isDate(config.end) || isNaN(config.end.getTime())) return cb(new HTTPError(400, "invalid end date"));
        (new LotteryController()).active(config, function(err, lotteries){
            if(err) return cb(new HTTPError(err.code, err.message));
            if(lotteries && lotteries.length > 0) return cb(new HTTPError(500, 'already has active lottery ' + config.interval + ' ' + config.currency));
            Lottery.init(config, function(err, lotteryHash) {
                if (err) return cb(err);
                Lottery.find(lotteryHash.nextGameId, function(err, lottery) {
                    if (err) return cb(err);
                    Scheduler.scheduleLottery(lottery, (new LotteryController()).create);
                    return cb(undefined, lottery);
                });
            });
        });
    };

    // internal/external, no params needed, so no express params
    LotteryController.prototype.active = function(params, cb) {
        if (cb === undefined && 'function' === typeof params) {
            cb = params;
            params = null;
        }
        var now = new Date();
        var query = {
            start: {$lte: now},
            end: {$gt: now}
        };
        if (params && params.interval && params.currency) {
            query.interval = params.interval;
            query.currency = params.currency;
        }
        Lottery.all(query, function(err, lotteries) {
            if (err) return cb(new HTTPError(500, err.message));
            return cb(undefined, lotteries);
        });
    };

    // express ready
    LotteryController.prototype.read = function(req, res) {
        var id = req.params.id;
        if (id) {
            Lottery.find(id, function(err, game) {
                if (err) return new HTTPError(500, err.message, res);
                if (!game) {
                    return new HTTPError(404, null, res);
                }
                // if the game has not been played yet, only return
                // the seed hash and id, otherwise return the full
                // game
                if (game.has('result')) {
                    return res.json(game.filter());
                } else {
                    game.server_seed("hidden");
                    //predict the winner when it is timeout for this lottery
                    game.selectWinner(function(){
                        // if (err) return new HTTPError(500, err.message, res);
                        return res.json(game);
                    }, true);
                }
            });
        } else {
            this.log('read list');
            var limit = req.query.limit || 30;
            var sort = {end: -1};
            Lottery.all({result:{$exists:true}}, {sort: sort, limit: limit}, function(err, games) {
                if (err) return new HTTPError(500, err.message, res);
                if (!games.length) return res.status(204).send();
                var filteredGames = [];
                async.eachSeries(games, function(game, done){
                    var totalWagered = 0;
                    game.getBets(function(err, bets){
                        bets.forEach(function(bet){
                            totalWagered += bet.wager();
                        });
                        if (!game.has('result')) {
                            game.server_seed("hidden");
                        }
                        var gameJson = game.filter();
                        gameJson.total_wagered = totalWagered;
                        filteredGames.push(gameJson);
                        done();
                    });
                }, function(){
                    res.json(filteredGames);
                });
            });
        }
    };

    LotteryController.prototype.readBets = function(req, res) {
        var id = req.params.id;
        if (id) {
            Bet.find(id, function(err, game) {
                if (err) return err.send(res);
                if (!game) {
                    return new HTTPError(404, null, res);
                }
                // if the game has not been played yet, only return
                // the seed hash and id, otherwise return the full
                // game
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
            var limit = req.query.limit || 30;
            var player_id = req.query.player_id || false;
            var lottery_id = req.query.lottery_id || false;
            var query = { player_id: { $exists: true } };
            var sort = {createdAt: -1};
            if (player_id) {
                query.player_id = new ObjectId(player_id);
            }
            if (lottery_id) {
                query.lottery_id = new ObjectId(lottery_id);
            }
            Bet.all(query, {sort: sort, limit: limit}, function(err, games) {
                if (err) return new HTTPError(500, err.message, res);
                if (!games.length) return res.status(204).send();
                var filteredGames = [];
                games.forEach(function(game) {
                    filteredGames.push(game.filter());
                });
                return res.json(filteredGames);
            });
        }
    };

    // express ready
    LotteryController.prototype.readActive = function(req, res) {
        this.active({interval:req.query.interval, currency: req.currency} || null, function(err, lotteries) {
            if (err) return err.send(res);
            if (!lotteries.length) {
                if (req.query.interval) return res.send(404);
                return res.send(204);
            }
            async.map(lotteries, function(lottery, done) {
                lottery.getCurrentJackpot(function(err, jackpot) {
                    if (err) return done(err);
                    lottery.set({
                        server_seed: "hidden",
                        jackpot: jackpot
                    });
                    return done(undefined, lottery);
                });
            }, function(err, lotteryData) {
                if (err) return new HTTPError(500, undefined, res);
                return res.send(lotteryData.length === 1 ? lotteryData[0] : lotteryData);
            });
        });
    };

    LotteryController.prototype.readPlayerActive = function(req, res) {
        this.active({interval:req.query.interval, currency: req.currency}, function(err, lotteries) {
            if (err) return err.send(res);
            if (!lotteries.length) {
                if (req.query.interval) return res.send(404);
                return res.send(204);
            }
            async.map(lotteries, function(lottery, done) {
                lottery.getPlayerTotal(req.query.player_id, function(err, totalPlayerWagered, totalWagered){
                    if(err) return done(err);
                    var json = lottery.filter();
                    json.total_player_wagered = totalPlayerWagered;
                    json.total_wagered = totalWagered;
                    return done(undefined, json);
                });
            }, function(err, lotteryData) {
                if (err) return new HTTPError(500, undefined, res);
                return res.send(lotteryData.length === 1 ? lotteryData[0] : lotteryData);
            });
        });
    };

    return LotteryController;
};
