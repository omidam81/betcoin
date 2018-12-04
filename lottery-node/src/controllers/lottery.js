'use strict';

var HTTPError = require('httperror-npm');
var util = require('util');
var async = require('async');

module.exports = function(Lottery, Scheduler, logger) {

    var LotteryController = function() {

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
        (new LotteryController()).active(config.interval, function(err, lotteries){
            if(err) return cb(new HTTPError(err.code, err.message));
            if(lotteries && lotteries.length > 0) return cb(new HTTPError(500, 'already has active lottery ' + config.interval));
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
    LotteryController.prototype.active = function(interval, cb) {
        if (cb === undefined && 'function' === typeof interval) {
            cb = interval;
            interval = null;
        }
        var now = new Date();
        var query = {
            start: {$lte: now},
            end: {$gt: now}
        };
        if (interval) {
            query.interval = interval;
        }
        Lottery.all(query, function(err, lotteries) {
            if (err) return cb(new HTTPError(500, err.message));
            return cb(undefined, lotteries);
        });
    };

    // express ready 
    LotteryController.prototype.read = function(req, res) {
        var id = req.params.id;
        logger.debug('LotteryController#read');
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
            logger.debug('read list');
            var limit = req.query.limit || 30;
            var sort = {end: -1};
            Lottery.all({result:{$exists:true}}, {sort: sort, limit: limit}, function(err, games) {
                if (err) return new HTTPError(500, err.message, res);
                if (!games.length) return res.send(204);
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

    // express ready
    LotteryController.prototype.readActive = function(req, res) {
        this.active(req.query.interval || null, function(err, lotteries) {
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
        this.active(req.query.interval || null, function(err, lotteries) {
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

    return new LotteryController();
};
