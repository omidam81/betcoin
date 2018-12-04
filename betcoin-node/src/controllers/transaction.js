'use strict';

var util = require('util');
var async = require('async');

module.exports = function(Transaction, logger, HTTPError, ListQuery, CURRENCY_REGEXP, CURRENCIES) {

    var TransactionController = function() {
    };

    TransactionController.prototype.read = function(req, res, next) {
        var currency = req.query.currency || 'all';
        var listQuery = new ListQuery({
            collection: Transaction.db,
            model: Transaction,
            pageSize: req.query.pageSize,
            page: req.query.page,
            query: {
                type: /(deposit|withdraw)/,
                userId: req.user.primary(),
            },
            sort: [["createdAt", -1]]
        });
        if (currency !== 'all' && CURRENCY_REGEXP.test(currency)) {
            listQuery.query.currency = currency;
        }
        listQuery.getList(function(err) {
            if (err) return next(err);
            return res.json(listQuery);
        });
    };

    TransactionController.prototype.readTotalWagered = function(req, res, next) {
        var self = this;
        var totalWagers = {};
        async.eachSeries(CURRENCIES, function(currency, done){
            self.getTotalWagered(req.user.primary(), currency, function(err, total){
                totalWagers[currency] = total;
                done(err, totalWagers);
            });
        }, function(err){
            if(err) return next(err);
            res.json(totalWagers);
        });
    };

    TransactionController.prototype.getTotalWagered = function(userId, currency, query, cb) {
        if (!userId) return cb(new HTTPError(400, "Invalid userId"));
        if (cb === undefined && 'function' === typeof query) {
            cb = query;
            query = {};
        }
        query = util._extend({
            userId: userId,
            type: Transaction.TYPE_REGEXP_WAGER,
            currency: currency
        }, query);
        Transaction.all(query, function(err, txs) {
            if (err) return cb(new HTTPError(err.code, err.message));
            var total = 0;
            txs.forEach(function(tx) {
                total += tx.debit();
            });
            return cb(undefined, total);
        });
    };

    TransactionController.prototype.getWagerCount = function(userId, cb) {
        if (!userId) return cb(new HTTPError(400, "Invalid userId"));
        Transaction.db.count({
            userId: userId,
            type: Transaction.TYPE_REGEXP_WAGER,
        }, function(err, count) {
            return cb(err, count);
        });
    };

    TransactionController.prototype.getCashflow = function(userId, currency, start, end, cb) {
        if (!util.isDate(start)) return cb(new HTTPError(400, "invalid start date"));
        if (!util.isDate(end)) return cb(new HTTPError(400, "invalid end date"));
        if (isNaN(start.getTime())) return cb(new HTTPError(400, "invalid start date"));
        if (isNaN(end.getTime())) return cb(new HTTPError(400, "invalid end date"));
        logger.verbose("getting %s cashflow for %s, from %s to %s",
                       currency,
                       userId,
                       start.toISOString(),
                       end.toISOString());
        var query = {
            currency: currency,
            createdAt: {
                $gte: start,
                $lt: end
            },
            type: /^(deposit|withdraw)$/,
            userId: userId
        };
        Transaction.all(query, function(err, txs) {
            if (err) return cb(new HTTPError(500, err.message));
            var cashflow = 0;
            logger.verbose("found %d %s transactions for %s in time range",
                           txs.length,
                           currency,
                           userId);
            txs.forEach(function(tx) {
                cashflow -= tx.credit();
                cashflow += tx.debit();
            });
            return cb(undefined, cashflow);
        });
    };

    return TransactionController;
};
