'use strict';

var DICE_DB = 'casinodb';
var DICE_COLLECTION = 'dice';
var BOT_DB = 'bots';
var BOT_ADDR_COLLECTION = 'addresses';


module.exports = function(app, mongo, logger) {

    var Dice = mongo.getDb(DICE_DB).collection(DICE_COLLECTION);
    var BotAddresses = mongo.getDb(BOT_DB).collection(BOT_ADDR_COLLECTION);

    function aggregate(db, collection, pipeline, cb) {
        Dice.aggregate(pipeline, function(err, diceTotals) {
            if (err) return cb(err);
            return cb(undefined, diceTotals);
        });
    }

    function totalAggregateOutput(diceData, unit) {
        diceData.sort(function(a, b) {
            return (a._id > b._id) ? -1 : 1;
        });
        if (unit === undefined) {
            unit = 'btc';
        }
        var resObj = {
            games: diceData,
            total: {
                bets: 0,
                wins: 0,
                wagered: 0,
                won: 0
            }
        };
        diceData.forEach(function(gameData, index) {
            var difference = gameData.wagered - gameData.won;
            resObj.games[index].gameName = "> " + gameData._id;
            resObj.games[index].difference = difference;
            resObj.games[index].profit = difference;
            resObj.games[index].gameProfit = difference;
            resObj.games[index].houseEdge = difference / (gameData.bets.toSatoshi());
            resObj.total.bets += gameData.bets;
            resObj.total.wagered += gameData.wagered;
            resObj.total.won += gameData.won;
            resObj.total.wins += gameData.wins;
            if (unit !== 'satoshi') {
                resObj.games[index].wagered = gameData.wagered.toBitcoin();
                resObj.games[index].won = gameData.won.toBitcoin();
                resObj.games[index].profit = gameData.difference.toBitcoin();
                resObj.games[index].gameProfit = gameData.difference.toBitcoin();
                resObj.games[index].difference = gameData.difference.toBitcoin();
                resObj.games[index].averageWager = gameData.averageWager.toBitcoin();
            }
        });
        resObj.date = diceData.ondate;
        resObj.until = diceData.until;
        resObj.since = diceData.since;
        resObj.total.difference = resObj.total.wagered - resObj.total.won;
        resObj.total.profit = resObj.total.wagered - resObj.total.won;
        resObj.total.houseEdge = resObj.total.difference / (resObj.total.bets.toSatoshi());
        resObj.total.averageWager = resObj.total.wagered / resObj.total.bets;
        if (unit !== 'satoshi') {
            resObj.total.wagered = resObj.total.wagered.toBitcoin();
            resObj.total.won = resObj.total.won.toBitcoin();
            resObj.total.profit = resObj.total.difference.toBitcoin();
            resObj.total.difference = resObj.total.difference.toBitcoin();
            resObj.total.averageWager = resObj.total.averageWager.toBitcoin();
        }
        return resObj;
    }

    app.get('/dice/player/:id?', function(req, res) {
        var playerId = req.params.id;
        var type = req.param('type') || 'all';
        var unit = req.param('unit') || 'btc';
        var page = req.param('page') || 0;
        var pageSize = req.param('pagesize') || 500;
        var sort = req.param('sort') || 'lastbet';
        var sortOrder = req.param('sortorder') || 'desc';
        var pipeline = [{
            $match: {tx_out: {$exists: true}}
        }, {
            $sort: {createdAt: -1}
        }, {
            $project: {
                player_id: 1,
                wager: 1,
                winnings: 1,
                gamedata: {
                    txin: "$tx_in",
                    txout: "$tx_out",
                    game: "$game",
                    win: {$lt: ["$result", "$game"]},
                    date: "$createdAt",
                    wager: {$divide: ["$wager", (unit === 'btc') ? 100000000 : 1]}
                },
                profit: {$subtract: ["$winnings", "$wager"]},
                createdAt: 1
            }
        },{
            $group: {
                _id:"$player_id",
                bets: {$sum: 1},
                wagered: {$sum: "$wager"},
                won: {$sum: "$winnings"},
                profit: {$sum: "$profit"},
                lastbet: {$first: "$createdAt"}
            }
        }, {
            $project: {
                _id:1,
                bets:1,
                wagered:1,
                won:1,
                profit:1,
                edgevshouse: {$divide: ["$profit", {$multiply: ["$bets", 100000000]}]},
                lastbet:1,
            }
        }];
        var sortObj = {$sort: {}};
        sortObj.$sort[sort] = (sortOrder === 'desc') ? -1 : 1;
        pipeline.push(sortObj);
        if (playerId) {
            pipeline[0].$match.player_id = playerId;
            pipeline[3].$group.games = {$push: "$gamedata"};
            pipeline[4].$project.games = 1;
            type = 'all';
        } else {
            pipeline.push({$skip: pageSize * page});
            pipeline.push({$limit: pageSize});
        }
        if (type === 'all') {
            aggregate(DICE_DB, DICE_COLLECTION, pipeline, function(err, diceData) {
                if (unit === 'btc') {
                    diceData.forEach(function(record, index) {
                        diceData[index].wagered = record.wagered.toBitcoin();
                        diceData[index].won = record.won.toBitcoin();
                        diceData[index].profit = record.profit.toBitcoin();
                    });
                }
                res.json(diceData);
            });
        } else {
            BotAddresses.distinct('_id', function(err, botAddresses) {
                if (err) return res.json(err, 500);
                var qOp = '$nin';
                if (type === 'bot') {
                    qOp = '$in';
                }
                var qUpdate = {};
                qUpdate[qOp] = botAddresses;
                pipeline[0].$match.player_id = qUpdate;
                aggregate(DICE_DB, DICE_COLLECTION, pipeline, function(err, diceData) {
                    if (err) return res.json(err, 500);
                    if (unit === 'btc') {
                        diceData.forEach(function(record, index) {
                            diceData[index].wagered = record.wagered.toBitcoin();
                            diceData[index].won = record.won.toBitcoin();
                            diceData[index].profit = record.profit.toBitcoin();
                        });
                    }
                    res.json(diceData);
                });
            });
        }
    });

    app.get('/dice/winningstoobig', function(req, res) {
        var unit = req.param('unit') || 'btc';
        var type = req.param('type') || 'all';
        if (type === 'all') {
            Dice.find({
                error: 'exceeds win limit',
                tx_out: {$exists: false},
                tx_out_err: {$exists: true}
            }).sort({createdAt: -1}).toArray(function(err, results) {
                if (err) return res.send(err.message, 500);
                if (unit === 'btc') {
                    results.forEach(function(record, index) {
                        results[index].winnings = record.winnings.toBitcoin();
                        results[index].wager = record.wager.toBitcoin();
                    });
                    res.json(results);
                }
            });
        } else {
            BotAddresses.distinct('_id', function(err, botAddresses) {
                if (err) return res.json(err, 500);
                var qOp = '$nin';
                if (type === 'bot') {
                    qOp = '$in';
                } else {
                    botAddresses.push('1EjuErYD5xW9WMZVVvG96WtMb4a2wEumYf');
                    botAddresses.push('1C9k5vTBwbUua325GcrKhhDGNvBBpHwuDn');
                }
                logger.info("found %d addresses", botAddresses.length);
                var qUpdate = {};
                qUpdate[qOp] = botAddresses;
                Dice.find({
                    error: 'exceeds win limit',
                    tx_out_err: {$exists: true},
                    tx_out: {$exists: false},
                    player_id: qUpdate
                }).sort({createdAt: -1}).toArray(function(err, results) {
                    if (err) return res.send(err.message, 500);
                    if (unit === 'btc') {
                        results.forEach(function(record, index) {
                            results[index].winnings = record.winnings.toBitcoin();
                            results[index].wager = record.wager.toBitcoin();
                        });
                        res.json(results);
                    }
                });
            });
        }
    });

    app.get('/dice/game/:id', function(req, res) {
        logger.info("getting dice totals");
        var type = req.param('type') || 'all';
        var gameId = parseInt(req.params.id, 10);
        var unit = req.param('unit') || 'btc';
        var until = new Date(req.param('until'));
        var since = new Date(req.param('since'));
        var ondate = new Date(req.param('date'));
        var pipeline = [{
            $match: {
                tx_out: { $exists: true },
                game: gameId
            }
        }, {
            $project: {
                _id: 1,
                game: 1,
                wager: 1,
                winnings: 1,
                gamedata: {
                    _id: "$_id",
                    txin: "$tx_in",
                    txout: "$tx_out",
                    game: "$game",
                    win: {$lt: ["$result", "$game"]},
                    date: "$createdAt",
                    player: "$player_id",
                    wager: {$divide: ["$wager", (unit === 'btc') ? 100000000 : 1]}
                },
                win: {
                    $cond: [ {$lt: ["$result", "$game"]}, 1, 0 ]
                }
            }
        }, {
            $group: {
                _id: '$game',
                bets: { $sum: 1},
                wins: {$sum: "$win"},
                wagered: { $sum: '$wager' },
                won: { $sum: '$winnings' },
                averageWager: {$avg: '$wager'},
                games: {$push: "$gamedata"}
            }
        }, {
            $project: {
                _id: 1,
                bets: 1,
                wins: 1,
                wagered: 1,
                won: 1,
                averageWager: 1,
                games: 1,
                difference: {$subtract: ['$wagered', '$won']},
                houseEdge: {$divide: [{$subtract: ["$wagered", "$won"]}, {$multiply: ["$bets", 100000000]}]}

            }
        }];
        if (since.getTime()) {
            if (pipeline[0].$match.createdAt === undefined) {
                pipeline[0].$match.createdAt = {};
            }
            pipeline[0].$match.createdAt.$gte = since;
        }
        if (until.getTime()) {
            if (pipeline[0].$match.createdAt === undefined) {
                pipeline[0].$match.createdAt = {};
            }
            pipeline[0].$match.createdAt.$lte = until;
        }
        if (ondate.getTime()) {
            var endDate = new Date(ondate.getTime() + (1000 * 60 * 60 * 24));
            pipeline[0].$match.createdAt = {$gte: ondate, $lt: endDate};
        }
        logger.info("getting %s totals", type);
        if (type === 'all') {
            aggregate(DICE_DB, DICE_COLLECTION, pipeline, function(err, diceData) {
                if (err) return res.json(err, 500);
                if (unit === 'btc') {
                    diceData = diceData.map(function(game) {
                        game.wagered = game.wagered.toBitcoin();
                        game.won = game.won.toBitcoin();
                        game.averageWager = game.averageWager.toBitcoin();
                        game.difference = game.difference.toBitcoin();
                        return game;
                    });
                }
                res.json(diceData);
            });
        } else {
            BotAddresses.distinct('_id', function(err, botAddresses) {
                if (err) return res.json(err, 500);
                var qOp = '$nin';
                if (type === 'bot') {
                    qOp = '$in';
                } else {
                    botAddresses.push('1EjuErYD5xW9WMZVVvG96WtMb4a2wEumYf');
                    botAddresses.push('1C9k5vTBwbUua325GcrKhhDGNvBBpHwuDn');
                }
                logger.info("found %d addresses", botAddresses.length);
                var qUpdate = {};
                qUpdate[qOp] = botAddresses;
                pipeline[0].$match.player_id = qUpdate;
                aggregate(DICE_DB, DICE_COLLECTION, pipeline, function(err, diceData) {
                    if (err) return res.json(err, 501);
                    if (unit === 'btc') {
                        diceData = diceData.map(function(game) {
                            game.wagered = game.wagered.toBitcoin();
                            game.won = game.won.toBitcoin();
                            game.averageWager = game.averageWager.toBitcoin();
                            game.difference = game.difference.toBitcoin();
                            return game;
                        });
                    }
                    res.json(diceData);
                });
            });
        }
    });

    app.get('/dice/totals', function(req, res) {
        logger.info("getting dice totals");
        var type = req.param('type') || 'all';
        var unit = req.param('unit') || 'btc';
        var until = new Date(req.param('until'));
        var since = new Date(req.param('since'));
        var ondate = new Date(req.param('date'));
        var pipeline = [{
            $match: {
                tx_out: { $exists: true },
            }
        }, {
            $project: {
                _id: 1,
                game: 1,
                wager: 1,
                winnings: 1,
                win: {
                    $cond: [ {$lt: ["$result", "$game"]}, 1, 0 ]
                }
            }
        }, {
            $group: {
                _id: '$game',
                bets: { $sum: 1},
                wins: {$sum: "$win"},
                wagered: { $sum: '$wager' },
                won: { $sum: '$winnings' },
                averageWager: {$avg: '$wager'}
            }
        }];
        if (since.getTime()) {
            if (pipeline[0].$match.createdAt === undefined) {
                pipeline[0].$match.createdAt = {};
            }
            pipeline[0].$match.createdAt.$gte = since;
        }
        if (until.getTime()) {
            if (pipeline[0].$match.createdAt === undefined) {
                pipeline[0].$match.createdAt = {};
            }
            pipeline[0].$match.createdAt.$lte = until;
        }
        if (ondate.getTime()) {
            var endDate = new Date(ondate.getTime() + (1000 * 60 * 60 * 24));
            pipeline[0].$match.createdAt = {$gte: ondate, $lt: endDate};
        }
        logger.info("getting %s totals", type);
        if (type === 'all') {
            aggregate(DICE_DB, DICE_COLLECTION, pipeline, function(err, diceData) {
                if (err) return res.json(500, err);
                diceData.ondate = ondate;
                diceData.since = since;
                diceData.until = until;
                res.json(totalAggregateOutput(diceData, unit));
            });
        } else {
            BotAddresses.distinct('_id', function(err, botAddresses) {
                if (err) return res.json(500, err);
                var qOp = '$nin';
                if (type === 'bot') {
                    qOp = '$in';
                } else {
                    botAddresses.push('1EjuErYD5xW9WMZVVvG96WtMb4a2wEumYf');
                    botAddresses.push('1C9k5vTBwbUua325GcrKhhDGNvBBpHwuDn');
                }
                logger.info("found %d addresses", botAddresses.length);
                var qUpdate = {};
                qUpdate[qOp] = botAddresses;
                pipeline[0].$match.player_id = qUpdate;
                aggregate(DICE_DB, DICE_COLLECTION, pipeline, function(err, diceData) {
                    if (err) return res.json(500, err);
                    diceData.ondate = ondate;
                    diceData.since = since;
                    diceData.until = until;
                    res.json(totalAggregateOutput(diceData, unit));
                });
            });
        }
    });

};
