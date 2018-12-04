'use strict';

var PRIZE_DB = 'prizedb';
var BETS_COLLECTION = 'bets';

var util = require('util');

module.exports = function(app, mongo) {


    var db = mongo.getDb(PRIZE_DB);
    var Bets = db.collection(BETS_COLLECTION);


    /**
     * Check for common query parmeters
     */
    app.all('/prize/*', function(req, res, next) {
        req.type = req.query.type || 'all';
        req.unit = req.query.unit || 'btc';
        var until = new Date(req.query.until);
        var since = new Date(req.query.since);
        var ondate = new Date(req.query.date);
        if (req.query.until !== undefined && isNaN(until)) {
            return res.send(400, 'invalid date for until');
        } else {
            req.until = until;
        }
        if (req.query.since !== undefined && isNaN(since)) {
            return res.send(400, 'invalid date for since');
        } else {
            req.since = since;
        }
        if (req.query.date !== undefined && isNaN(ondate)) {
            return res.send(400, 'invalid date for date');
        } else {
            req.ondate = ondate;
        }
        req.game = req.query.game || 'all';
        next();
    });

    var constructDateQuery = function(since, until, ondate) {
        var query = {};
        if (since.getTime()) {
            if (query === undefined) {
                query = {};
            }
            query.$gte = since;
        }
        if (until.getTime()) {
            if (query === undefined) {
                query = {};
            }
            query.$lte = until;
        }
        if (ondate.getTime()) {
            var endDate = new Date(ondate.getTime() + (1000 * 60 * 60 * 24));
            query = {$gte: ondate, $lt: endDate};
        }

        if (Object.keys(query).length) {
            return query;
        } else {
            return undefined;
        }
    };

    app.get('/prize/totals', function(req, res) {
        var until = req.until;
        var since = req.since;
        var ondate = req.ondate;

        var pipeline = [];
        pipeline.push({
            $match: {
                date: constructDateQuery(since, until, ondate),
                seed: { $ne : true }
            }
        });
        pipeline.push({
            $group: {
                _id: "$game",
                bets: { $sum: 1},
                tickets: { $sum: '$tickets' },
                wagered: { $sum: '$bet' },
                profit: { $sum: '$houseRake' }
            }
        });

        Bets.aggregate(pipeline, function(err, results) {
            if (err) return res.send(500, err.message);
            var totals = {
                games: results,
            };
            totals.games.forEach(function(gameData, index, array) {
                array[index].gameName = gameData._id;
                if (totals.total === undefined) {
                    totals.total = util._extend({}, gameData);
                    delete totals.total._id;
                    delete totals.total.gameName;
                } else {
                    totals.total.wagered += gameData.wagered;
                    totals.total.bets += gameData.bets;
                    totals.total.tickets += gameData.tickets;
                    totals.total.profit += gameData.profit;
                }
            });
            totals.since = since;
            totals.until = until;
            totals.date = ondate;
            res.json(totals);
        });
    });
};
