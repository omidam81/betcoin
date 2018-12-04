'use strict';

var async = require('async');

var AFFILIATE_TAKES = {
    low: 0.08,
    medium: 0.18,
    high: 0.28,
    max: 0.38
};

var AFFILIATE_INCOME_LEVELS = {
    low: (0.01).toSatoshi(),
    medium: (0.1).toSatoshi(),
    high: (1).toSatoshi(),
};

module.exports = function(logger, HTTPError, Transaction, User, AffiliateRecord, ListQuery, CURRENCY_REGEXP) {

    var AffiliateController = function() {
    };

    AffiliateController.prototype.getAffiliate = function(req, res, next) {
        User.get({affiliateToken: req.params.token}, function(err, affiliate) {
            if (err) return next(err);
            if (!affiliate) return next(new HTTPError(404, "Affiliate not found"));
            return res.json({
                username: affiliate.username()
            });
        });
    };

    AffiliateController.prototype.getAffiliateStats = function(req, res, next) {
        AffiliateRecord.all({
            affiliateId: req.user.primary()
        }, function(err, records) {
            if (err) return next(new HTTPError(err.code, err.message));
            var totals = {};
            records.forEach(function(record) {
                var currency = record.currency();
                if (totals[currency] === undefined) totals[currency] = 0;
                totals[currency] += record.total();
            });
            res.json(totals);
        });
    };

    AffiliateController.prototype.getAssociates = function(req, res, next) {
        var listQuery = new ListQuery({
            collection: User.db,
            model: User,
            pageSize: req.query.pageSize,
            page: req.query.page,
            query: {
                affiliate: req.user.primary(),
            },
            sort: [["createdAt", -1]]
        });
        listQuery.getList(function(err) {
            if (err) return next(err);
            var results = [];
            async.eachSeries(listQuery.result, function(associate, done) {
                AffiliateRecord.all({
                    associateId: associate.primary(),
                    affiliateId: req.user.primary(),
                }, function(err, affRecords) {
                    if (err) return done(new HTTPError(err.code, err.message));
                    var userJSON = associate.filter();
                    userJSON.totals = {};
                    affRecords.forEach(function(record) {
                        userJSON.totals[record.currency()] = record.total();
                    });
                    results.push(userJSON);
                    done();
                });
            }, function(err) {
                if (err) return next(err);
                listQuery.result = results;
                res.json(listQuery);
            });
        });
    };

    AffiliateController.prototype.getAffiliateTransactions = function(req, res, next) {
        var currency = req.query.currency || 'all';
        var listQuery = new ListQuery({
            collection: Transaction.db,
            model: Transaction,
            pageSize: req.query.pageSize,
            page: req.query.page,
            query: {
                type: Transaction.TYPE_AFFILIATE,
                userId: req.user.primary(),
            },
            sort: [["createdAt", -1]]
        });
        if (currency !== 'all' && CURRENCY_REGEXP.test(currency)) {
            listQuery.query.currency = currency;
        }
        var since = Date.parse(req.query.since);
        var until = Date.parse(req.query.until);
        if (!isNaN(since) && !isNaN(until)) {
            listQuery.query.$and = [
                {createdAt: {$gt: new Date(since)}},
                {createdAt: {$lte: new Date(until)}}
            ];
        }
        listQuery.getList(function(err) {
            if (err) return next(err);
            return res.json(listQuery);
        });
    };

    AffiliateController.prototype.processWager = function(user, params, cb) {
        var game = params.game;
        var gameId = params.gameId;
        var wager = params.wager;
        var houseEdge = params.houseEdge;
        var gameOdds = params.gameOdds;
        var currency = params.currency;
        // if the user does not have an affiliate, just return with
        // nothing
        if (!user.has('affiliate')) return cb();
        async.waterfall([
            function getAffiliateUser(done) {
                User.get(user.affiliate(), done);
            },
            function getAffiliateWallet(affiliateUser, done) {
                affiliateUser.wallet(currency, function(err, wallet) {
                    if (err) return done(err);
                    return done(undefined, affiliateUser, wallet);
                });
            },
            function getAffiliateRecord(affiliateUser, wallet, done) {
                AffiliateRecord.get({
                    affiliateId: affiliateUser.primary(),
                    associateId: user.primary(),
                    currency: currency
                }, function(err, affRecord) {
                    if (err) return done(new HTTPError(err.code, err.message));
                    return done(undefined, affiliateUser, wallet, affRecord);
                });
            },
            function getAffiliateTotal(affiliateUser, wallet, affRecord, done) {
                AffiliateRecord.all({
                    affiliateId: affiliateUser.primary(),
                    currency: currency
                }, function(err, records) {
                    if (err) return done(new HTTPError(err.code, err.message));
                    var total = 0;
                    records.forEach(function(record) {
                        total += record.total();
                    });
                    return done(undefined, affiliateUser, wallet, affRecord, total);
                });
            },
            function doCredit(affiliateUser, wallet, affRecord, income, done) {
                var take = 0;
                if (income < AFFILIATE_INCOME_LEVELS.low) {
                    take = AFFILIATE_TAKES.low;
                } else if (income < AFFILIATE_INCOME_LEVELS.medium) {
                    take = AFFILIATE_TAKES.medium;
                } else if (income < AFFILIATE_INCOME_LEVELS.high) {
                    take = AFFILIATE_TAKES.high;
                } else {
                    take = AFFILIATE_TAKES.max;
                }
                var affiliateBase = wager;
                    if (gameOdds > 0.5) {
                        var rolloverPercent = (1 - ((gameOdds - 0.5) / 0.5));
                        affiliateBase = Math.floor(rolloverPercent * affiliateBase);
                        logger.info("game odds %d%, adjusting affiliate base from %d to %d (%d%)",
                                    gameOdds * 100,
                                    wager.toBitcoin(),
                                    affiliateBase.toBitcoin(),
                                    rolloverPercent * 100);
                    }
                var affiliateCredit = Math.floor(affiliateBase * houseEdge * take);
                if (affiliateCredit > 0) {
                    wallet.credit({
                        amount: affiliateCredit,
                        type: "affiliate",
                        refId: "affiliate:" + user.primary() + ":" + new Date().getTime(),
                        meta: {
                            associate: user.primary(),
                            gameId: gameId,
                            game: game,
                            wager: wager,
                            houseEdge: houseEdge
                        }
                    }, function(err, transaction) {
                        if (err) return done(err);
                        return done(undefined, transaction, affRecord);
                    });
                } else {
                    done(new HTTPError(422, "Affiliate credit is < 1 Satoshi"));
                }
            },
            function updateRecord(transaction, affRecord, done) {
                affRecord.credit(transaction.credit(), done);
            }
        ], function(err) {
            if (err && err.code === 422) {
                return cb();
            }
            return cb(err);
        });
    };

    return AffiliateController;

};
