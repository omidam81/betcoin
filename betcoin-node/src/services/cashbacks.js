'use strict';

var moment = require('moment');
var async = require('async');

module.exports = function(TransactionController, CashbackController, User, CURRENCIES, HTTPError, mongo, logger, Config) {
    var userdbWritable = mongo.getDb({dbname: 'userdb'});
    var cashbackCollection = userdbWritable.collection('cashbacks');
    return {
        name: 'cashback processor',
        schedule: 'Monday at 01:00',
        repeat: '1 week',
        task: function(job, cb) {
            logger.verbose('cashbacks processing');
            var triggeredAt = new Date();
            var now = moment().startOf('day').subtract((moment().day()-1), 'days').toDate();
            var aWeekAgo = moment(now).subtract(7, 'days').toDate();
            var txController = new TransactionController();
            logger.info("getting cashback data from %s to %s", aWeekAgo.toISOString(), now.toISOString());
            logger.verbose("getting all users updated since %s", aWeekAgo);
            User.all({
                updatedAt: {$gte: aWeekAgo},
                anonymous: false
            }, function activeUsersFound(err, users) {
                if (err) return cb(new HTTPError(err));
                cashbackCollection.insert({
                    start: aWeekAgo,
                    end: now,
                    activeUsers: users.length,
                    triggeredAt: triggeredAt
                }, function savedBasicCashbackDoc(err, docs) {
                    if (err) return cb(new HTTPError(err));
                    var thisDoc = docs[0];
                    var userWithCashbacks = [];
                    var totalCashback = 0;
                    logger.verbose("found %d users", users.length);
                    Config.get('vipLevels', function(err, vipLevels) {
                        if (err) return cb(err);
                        async.eachLimit(users, 5, function(_user, done) {
                            async.each(CURRENCIES, function(currency, fin) {
                                var user = new User(_user.toJSON());
                                logger.mapUser(user.primary(), user.username());
                                user.currency = currency;
                                var vipLevel = user.vipLevel() || 0;
                                var cashback = vipLevels[vipLevel].cashback || 0;
                                user.cashback = cashback;
                                async.waterfall([
                                    function(done) {
                                        logger.verbose("getting wallet");
                                        user.wallet(currency, function(err, wallet) {
                                            if (err) return done(err);
                                            return done(undefined, cashback, wallet);
                                        });
                                    },
                                    function(cashback, wallet, done) {
                                        logger.verbose("getting %s cashflow for %s", currency, user.primary());
                                        txController.getCashflow(user.primary(), currency, aWeekAgo, now, function(err, cashflow) {
                                            if (err) return done(err);
                                            logger.verbose("%s has a %d %s cashflow", user.primary(), cashflow.toBitcoin(), currency);
                                            var profit = cashflow + wallet.availableBalance();
                                            var cashbackAmount = (Math.floor((profit * -1) * cashback));
                                            if (profit >= 0) {
                                                cashbackAmount = 0;
                                            }
                                            totalCashback += cashbackAmount;
                                            userWithCashbacks.push({
                                                username: user.username(),
                                                userId: user.primary(),
                                                profit: profit,
                                                amount: cashbackAmount,
                                                cashbackPercent: cashback,
                                                currency: currency,
                                                vipLevel: vipLevel,
                                                start: aWeekAgo,
                                                end: now
                                            });
                                            done();
                                        });
                                    }
                                ], function(err) {
                                    if (err) {
                                        if (err.code !== 404) logger.error("error getting cashback data", err.messsage);
                                    }
                                    fin();
                                });
                            }, done);
                        }, function(err) {
                            if (err) return logger.error("error getting cashback data", err.messsage);
                            userWithCashbacks.sort(function(a, b) {
                                if (a.amount > b.amount) return -1;
                                if (a.amount < b.amount) return 1;
                                if (a.amount === b.amount) return 0;
                            });
                            cashbackCollection.update({
                                _id: thisDoc._id
                            }, {
                                $set: {
                                    totalCashback: totalCashback,
                                    users: userWithCashbacks,
                                    finishedAt: new Date()
                                }
                            }, function(err) {
                                if (err) logger.error("error saving cashback data: %s", err.message);
                                logger.info("cashback data from %s to %s processed", aWeekAgo.toISOString(), now.toISOString());
                                cb();
                            });
                        });
                    });
                });
            });
        }
    };
};
