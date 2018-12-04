'use strict';

var HTTPError = require('../lib/httperror');
var util = require('util');
var extend = util._extend;
var ensureObjectId = require('mongowrap').ensureObjectId;
var async = require('async');

module.exports = function(Transactions) {

    /**
     * TransactionController
     */

    var TransactionController = {};

    TransactionController.normalize = function(transactionData) {
        // a reference id is required
        if (transactionData.refId === undefined) throw new HTTPError(400, "No reference id", '040');
        // so is a type
        if (transactionData.type === undefined) throw new HTTPError(400, "No transaction type", '041');
        // amtIn and amtOut have to be either undefined or an int parsable object
        ["amtIn", "amtOut"].forEach(function(key) {
            if (transactionData[key] === undefined) {
                transactionData[key] = 0;
            }
            transactionData[key] = parseInt(transactionData[key], 10);
            if (isNaN(transactionData[key])) throw new HTTPError(400, "Invalid " + key, '042');
        });
        // no negative values allowed, use amtIn and amtOut to credit and debit
        if (transactionData.amtIn < 0 || transactionData.amtOut < 0) {
            throw new HTTPError(400, "Amounts cannot be negative, use amtIn to credit, amtOut to debit", '043');
        }
        // at least one must be > 0
        // if (transactionData.amtIn === 0 && transactionData.amtOut === 0) {
            // throw new HTTPError(400, "Both amtIn and amtOut cannot be 0");
        // }
        // no cediting and debiting in the same transaction
        if (transactionData.amtIn > 0 && transactionData.amtOut > 0) {
            throw new HTTPError(400, "Cannot have amtIn and amtOut in the same transaction", '044');
        }
        // check metadata it has to be undefined, an object, or a JSON parseable string
        if (transactionData.meta === undefined) {
            transactionData.meta = {};
        }
        if (typeof transactionData.meta !== 'object') {
            try {
                transactionData.meta = JSON.parse(transactionData.meta);
            } catch (ex) {
                throw new HTTPError(400, "Invalid meta data JSON string", '045');
            }
        }
        // return the parsed and validated data
        return transactionData;
    };

    TransactionController.create = function(userId, transactionData, cb) {
        // validate the incoming data
        try {
            transactionData = this.normalize(transactionData);
        } catch (ex) {
            return cb(ex);
        }
        // make sure the userId is actually a mongo id-ish thing
        userId = ensureObjectId(userId);
        if (userId === null) return cb(new HTTPError(400, "Invalid user id", '004'));
        // check for en existing refId
        Transactions.findOne({refId: transactionData.refId}, function(err, existingTx) {
            if (err) return cb(new HTTPError(500, err.message));
            if (existingTx) return cb(new HTTPError(409, 'refId already exists!', '046'));
            
            // assign the userId and date to the transaction data
            transactionData.userId = userId;
            transactionData.date = new Date();
            // save it and return the new transaction to the callback
            Transactions.insert(transactionData, function(err, docs){
                if (err) return cb(new HTTPError(500, err.message));
                var transaction = docs[0];
                cb(undefined, transaction);
            });
        });
    };

    TransactionController.getAuditTrail = function(currency, userId, cb) {
        userId = ensureObjectId(userId);
        if (userId === null) return cb (new HTTPError(400, "invalid user id"));
        var query = { userId: userId, currency:currency };
        var lastWithdrawQuery = extend({}, query);
        lastWithdrawQuery.type = "withdraw";
        Transactions.findOne(lastWithdrawQuery, {sort: {date: -1}}, function(err, lastWithdraw) {
            if (err) return cb(new HTTPError(500, err.message));
            if (lastWithdraw) {
                query.date = {$gte: lastWithdraw.date};
            }
            return Transactions.find(query).sort({date: 1}).toArray(function(err, txs) {
                if (err) return cb(new HTTPError(500, err.message));
                cb(undefined, txs);
            });
        });
    };

    TransactionController.getCashbacks = function(userId, page, limit, currency, cb) {
        userId = ensureObjectId(userId);
        if (userId === null) return cb (new HTTPError(400, "invalid user id"));
        var query = {
            userId: userId,
            currency:currency,
            type: 'cashback'
        };
        Transactions.find(query).sort({date: -1}).skip(page * limit).limit(limit).toArray(function(err, cashbacks) {
            if (err) return cb(new HTTPError(500, "error getting cashback transactions: " + err.message));
            return cb(undefined, cashbacks);
        }); 
    };

    TransactionController.getManualTriggerCounts = function(cb) {
        var now = new Date();
        var start = new Date(now.getTime() - (now.getTime() % (24 * 60 * 60 * 1000)));
        var query = {
            type: 'withdraw',
            currency: 'btc',
            'meta.triggeredManual': false,
            date: {$gte: start}
        };
        Transactions.aggregate([
            {$match: query},
            {
                $group: {
                    _id: 1,
                    total: {$sum: '$amtOut'},
                    count: {$sum: 1}
                }
            }
        ], function(err, data) {
            if (err) return cb(new HTTPError(500, err.message));
            var stats = data[0];
            if (!stats) stats = {count: 0, total: 0};
            cb(undefined, stats);
        });
    };

    TransactionController.getAffiliateTransactions = function(affiliateId, start, end, cb) {
        if (!util.isDate(start)) return cb(new HTTPError(400, "invalid start date"));
        if (!util.isDate(end)) return cb(new HTTPError(400, "invalid end date"));
        affiliateId = ensureObjectId(affiliateId);
        if (affiliateId === null) return cb(new HTTPError(400, "Invalid affiliate id", '004'));
        var query = {
            currency: 'btc',
            userId: affiliateId,
            date: {$gte: start, $lt: end},
            amtIn: {$gt: 0},
            type: "affiliate:credit"
        };
        Transactions.find(query).sort({date: -1}).toArray(function(err, txs) {
            if (err) return cb(new HTTPError(500, err.message));
            cb(undefined, txs);
        });
        
    };

    TransactionController.getAssociateTransactions = function(associateId, options, cb) {
        associateId = ensureObjectId(associateId);
        if (associateId === null) return cb(new HTTPError(400, "Invalid associate id", '004'));
        var query = {
            $and: [{$or:[{type:{$regex:'wager'}},{type:{$regex:'winnings'}}]}, {currency: 'btc'}, {userId: associateId}]
        };
        var sort = {};
        sort[options.sort||'date'] = options.order||-1;
        async.waterfall([
            function countTotal(done){
                Transactions.find(query).count(function(err, total){
                    done(err, total);
                });
            },
            function getPaginatedResult(total, done){
                Transactions.find(query).sort(sort).skip((options.page - 1)*options.size).limit(options.size).toArray(function(err, txs) {
                    if (err) return done(new HTTPError(500, err.message));
                    done(undefined, total, txs);
                });
            },
            function mergeAffiliateAwardTransactions(total, txs, done){
                var gameIds = [];
                txs.forEach(function(tx){
                    gameIds.push(tx.refId);
                });
                Transactions.find({'meta.gameId': {$in: gameIds}}).toArray(function(err, affiliateTransactions){
                    affiliateTransactions.forEach(function(affiliateTransaction){
                        txs.forEach(function(tx){
                            if(affiliateTransaction.meta.gameId === tx.refId){
                                tx.affiliateAward = affiliateTransaction.amtIn;
                                tx.houseEdge = affiliateTransaction.meta.houseEdge;
                            }
                        });
                    });
                    done(undefined, total, txs);
                });
            }
        ], function(err, total, txs){
            cb(err, {total: total, transactions: txs});
        });
    };

    TransactionController.getCashflow = function(currency, userId, start, end, cb) {
        userId = ensureObjectId(userId);
        if (userId === null) return cb(new HTTPError(400, "Invalid user id", '004'));
        if (!util.isDate(start)) return cb(new HTTPError(400, "invalid start date"));
        if (!util.isDate(end)) return cb(new HTTPError(400, "invalid end date"));
        if (isNaN(start.getTime())) return cb(new HTTPError(400, "invalid start date"));
        if (isNaN(end.getTime())) return cb(new HTTPError(400, "invalid end date"));
        var query = {
            currency: currency,
            date: {
                $gte: start,
                $lt: end
            },
            type: /^(deposit|withdraw)$/,
            userId: userId
        };
        Transactions.find(query).toArray(function(err, txs) {
            if (err) return cb(new HTTPError(500, err.message));
            var cashflow = 0;
            txs.forEach(function(tx) {
                cashflow -= tx.amtIn;
                cashflow += tx.amtOut;
            });
            return cb(undefined, cashflow);
        });
    };

    TransactionController.getTotalWagered = function(currency, userId, since, cb) {
        if (cb === undefined && typeof since === 'function') {
            cb = since;
            since = undefined;
        }
        if (cb === undefined && typeof userId === 'function') {
            cb = userId;
            userId = undefined;
        }
        var query = {
            currency:currency,
            type: /wager$/,
            amtOut: {$gt: 0}
        };
        userId = ensureObjectId(userId);
        if (userId === null) return cb(new HTTPError(400, "Invalid user id", '004'));
        query.userId = userId;
        if (since){
            if (!util.isDate(since)) since = new Date(since);
            if (!isNaN(since.getTime())) query.date = {$gt: since};
        }
        Transactions.find(query).toArray(function(err, txs){
            if (err) return cb(new HTTPError(500, err.message));
            var wagered = 0;
            txs.forEach(function(tx) {
                wagered += tx.amtOut;
            });
            cb(undefined, wagered);
        });
    };

    TransactionController.getHistory = function(currency, userId, since, page, limit, cb) {
        if (cb === undefined && typeof since === 'function') {
            cb = since;
            since = undefined;
        }
        if (cb === undefined && typeof userId === 'function') {
            cb = userId;
            userId = undefined;
        }
        var query = { currency:currency, $or:[{type:'deposit'}, {type:'withdraw'}] };
        if (userId) {
            userId = ensureObjectId(userId);
            if (userId === null) return cb(new HTTPError(400, "Invalid user id", '004'));
            query.userId = userId;
        }
        if (since){
            if (!util.isDate(since)) since = new Date(since);
            if (!isNaN(since.getTime())) query.date = {$gt: since};
        }
        async.waterfall([
            function(done){
                Transactions.find(query).count(function(err, total){
                    done(err, total);
                });
            },
            function(total, done){
                var cursor = Transactions.find(query).sort({date: -1});
                if (page !== undefined && limit !== undefined) {
                    cursor.skip((page-1) * limit).limit(limit);
                }
                cursor.toArray(function(err, txs){
                    done(err, total, txs);
                });
            }
        ], function(err, total, txs){
            if (err) return cb(new HTTPError(500, err.message));
            cb(undefined, {txs: txs, total: total});
        });
    };

    TransactionController.getTotals = function(options, cb) {
        var pipeline = [{
            $match: {
                userId: ensureObjectId(options.userId),
                currency: options.currency,
                type: {
                    $regex: 'wager'
                }
            }
        }, {
            $group: {
                _id: 'all',
                totalWagered: {
                    $sum: '$amtOut'
                }
            }
        }];
        Transactions.aggregate(pipeline, function(err, totals){
            if(err) return cb(new HTTPError(500, err.message));
            cb(undefined, totals);
        });
    };

    TransactionController.getAssociatesEarningTotals = function(associateIds, cb) {
        var pipeline = [{
            $match: {
                'meta.associate' : {
                    $in: associateIds
                },
                type: 'affiliate:credit'
            }
        }, {
            $group: {
                _id: '$meta.associate',
                totalEarning: {
                    $sum: '$amtIn'
                }
            }
        }];
        Transactions.aggregate(pipeline, function(err, totals){
            if(err) return cb(new HTTPError(500, err.message));
            cb(undefined, totals);
        });
    };

    return TransactionController;

};
