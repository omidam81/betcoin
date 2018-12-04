'use strict';

var queryFilter = require('./queryfilter');
var url = require('url');

module.exports = function(mongo, logger, HTTPError) {

    var GameTotalQuery = function(game, params) {
        this.game = game;
        this.collection = params.collection;
        this.queryString = params.queryString || url.parse(params.url).query || "";
        this.qf = queryFilter(params.queryPrefix, params.sortPrefix);
        this.query = this.qf.filter(this.queryString);
        var baseConditions = [
            {winnings: {$exists: true, $ne: NaN}},
            {player_id: {$exists: true}},
            {client_seed: {$exists: true}},
            {createdAt: {$gte: params.since}},
            {createdAt: {$lt: params.until}}
        ];
        // by default, filter out games with no bets
        if (!params.includeZeroWager) baseConditions.push({wager: {$gt: 0}});
        if (!params.includeBonusWager) baseConditions.push({bonus: {$ne: true}});
        Object.keys(this.query).forEach(function(queryKey) {
            if (/[Ii]d$/.test(queryKey)) {
                // parse id fields
                this.query[queryKey] = mongo.ensureObjectId(this.query[queryKey]);
            } else if (/At$/.test(queryKey)) {
                // parse dates
                this.query[queryKey] = new Date(this.query[queryKey]);
            }
        }, this);
        this.query.$and = baseConditions;
        if (!this.query.$or) this.query.$or = [];
        this.query.$or = this.query.$or.concat([
            {winnings: {$type: 1}},
            {winnings: {$type: 16}},
        ]);

        this.result = {
            _id: this.game,
            wagered: 0,
            won: 0,
            count: 0,
            players: 0,
            averageWager: 0,
            houseProfit: 0,
            houseEdge: 0
        };
    };

    GameTotalQuery.prototype.getTotals = function(cb) {
        var self = this;
        // logger.debug("executing game total  query: %s", JSON.stringify(this.query, null, 2));
        this.collection.aggregate({$match: this.query}, {
            $project: {wager: 1, winnings: 1, player_id: 1, currency: 1},
        }, {
            $group: {
                _id: "$currency",
                wagered: {$sum: '$wager'},
                won: {$sum: '$winnings'},
                count: {$sum: 1},
                players: {$addToSet: '$player_id'}
            }
        }, function(err, aggResult) {
            if (err) return new HTTPError(err.code, err.message);
            self.result = {};
            aggResult.forEach(function(result) {
                if (!result) return cb(); // the default result object is already empty and set up
                result.players = result.players.length;
                result.averageWager = result.wagered / result.count;
                result.houseProfit = result.wagered - result.won;
                result.houseEdge = (result.houseProfit) / result.wagered;
                self.result[result._id] = result;
            });
            return cb();
        });
    };

    GameTotalQuery.prototype.toJSON = function() {
        return this.result;
    };

    return GameTotalQuery;

};
