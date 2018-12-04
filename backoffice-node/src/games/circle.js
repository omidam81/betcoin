'use strict';

var CIRCLE_DB = 'circledb';
var CIRCLE_COLLECTION = 'circle';
var BOT_DB = 'bots';
var BOT_ADDR_COLLECTION = 'player_addresses';

var gameNames = {
    1: '3x',
    2: '5x',
    3: '10x',
    4: '50-50',
    5: '15x',
    6: '25x'
};

function totalGameData(data) {
    var resObj = {
        games: data,
        total: {
            bets: 0,
            wins: 0,
            wagered: 0,
            won: 0
        }
    };
    data.forEach(function(gameData, index) {
        resObj.total.bets += gameData.bets;
        resObj.total.wins += gameData.wins;
        resObj.total.wagered += gameData.wagered;
        resObj.total.won += gameData.won;
        resObj.games[index].gameName = gameNames[gameData.game];
    });
    resObj.total.averageWager = resObj.total.wagered / resObj.total.bets;
    resObj.total.profit = resObj.total.wagered - resObj.total.won;
    resObj.total.houseEdge = resObj.total.profit / (resObj.total.bets);
    return resObj;
}

module.exports = function(app, mongo, logger, UserController) {

    var Circle = mongo.getDb(CIRCLE_DB).collection(CIRCLE_COLLECTION);
    var BotAddresses = mongo.getDb(BOT_DB).collection(BOT_ADDR_COLLECTION);

    app.get('/circle/totals', function(req, res) {
        var type = req.param('type') || 'all';
        var unit = req.param('unit') || 'btc';
        var until = new Date(req.param('until'));
        var since = new Date(req.param('since'));
        var ondate = new Date(req.param('date'));
        var includeNoWager = req.param('includeNoWager') || false;
        
        UserController.getOmittedUserGameIds('circle', function(err, gameIds){
            var pipeline  = [{
                $match: {_id: {$nin: gameIds},client_seed: {$exists: true}, wager: {$type: 16, $gt: (includeNoWager) ? -1 : 0}}
            }, {
                $project: {
                    // game: {$divide: ["$game", 1]},
                    game: 1,
                    wager: 1,
                    winnings: 1,
                    win: {
                        $cond: [ {$gt: ["$payout_multiplier", 1]}, 1, 0 ]
                    },
                    profit: {
                        $subtract: ["$wager", "$winnings"]
                    }
                }
            }, {
                $group: {
                    _id: "$game",
                    bets: {$sum: 1},
                    wins: {$sum: "$win"},
                    wagered: {$sum: "$wager"},
                    won: {$sum: "$winnings"},
                    averageWager: {$avg: '$wager'},
                    profit: {$sum: "$profit"}
                }
            }, {
                $project: {
                    _id: 1,
                    bets: 1,
                    wins: 1,
                    game: "$_id",
                    wagered: 1,
                    won: 1,
                    averageWager: 1,
                    profit: 1,
                    houseEdge: {$divide: ["$profit", {$multiply: ["$bets", 100000000]}]}
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
            if (unit === 'btc') {
                pipeline.push({
                    $project: {
                        _id: 0,
                        bets: 1,
                        wins: 1,
                        game: 1,
                        wagered: {$divide: ["$wagered", 100000000]},
                        won: {$divide: ["$won", 100000000]},
                        averageWager: {$divide: ["$averageWager", 100000000]},
                        profit: {$divide: ["$profit", 100000000]},
                        houseEdge: 1
                    }
                });
            }
            
            if (type === 'all') {
                Circle.aggregate(pipeline, function(err, results) {
                    if (err) return res.json(err, 501);
                    var responseObj = totalGameData(results);
                    if (unit === 'btc') {
                        responseObj.total.deposited = responseObj.total.deposited.toBitcoin();
                        responseObj.total.returned = responseObj.total.returned.toBitcoin();
                        responseObj.total.refunded = responseObj.total.refunded.toBitcoin();
                        responseObj.total.profit = responseObj.total.profit.toBitcoin();
                    } else {
                        responseObj.total.houseEdge /= 100000000;
                    }
                    res.json(responseObj);
                });
            } else {
                BotAddresses.distinct('_id', function(err, botAddresses) {
                    if (err) return res.json(err, 500);
                    var qOp = '$nin';
                    if (type === 'bot') {
                        qOp = '$in';
                    } else {
                        botAddresses.push('1CUTfTsJnh1e2d1FEvoVueTNQ7icjPHKY');
                        botAddresses.push('1EjuErYD5xW9WMZVVvG96WtMb4a2wEumYf');
                        botAddresses.push('1C9k5vTBwbUua325GcrKhhDGNvBBpHwuDn');
                        botAddresses.push("1MiHn2pSGEBunZRigMc596gzb28nxPB7in");
                        botAddresses.push("13D4TtrjYgXsbokAYfwN2ssPCY5y92LLpY");
                        botAddresses.push("1FsPBb5uFcREoi87Mp9MwQxf4JUVTUhxLj");
                        botAddresses.push("16Lh4BudqQhaqQyttngkDUSkv3wgAovn7f");
                        botAddresses.push("1FAQYXKG46cwYuo7dEDEunwR5gph9WTx4D");
                    }
                    logger.info("found %d addresses", botAddresses.length);
                    var qUpdate = {};
                    qUpdate[qOp] = botAddresses;
                    pipeline[0].$match.player_id = qUpdate;
                    Circle.aggregate(pipeline, function(err, results) {
                        if (err) res.json(501, err);
                        var responseObj = totalGameData(results);
                        responseObj.date = ondate;
                        responseObj.since = since;
                        responseObj.until = until;
                        if (unit === 'btc') {
                            responseObj.total.deposited = responseObj.total.deposited.toBitcoin();
                            responseObj.total.returned = responseObj.total.returned.toBitcoin();
                            responseObj.total.refunded = responseObj.total.refunded.toBitcoin();
                            responseObj.total.profit = responseObj.total.profit.toBitcoin();
                        } else {
                            responseObj.total.houseEdge /= 100000000;
                        }
                        res.json(responseObj);
                    });
                });
            }
        });
    });
};
