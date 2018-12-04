'use strict';

var moment = require('moment');
var async = require('async');
var consoleprompt = require('prompt');
var container = require('../container');

var now = moment().startOf('day').subtract((moment().day()-1), 'days').toDate();
var aWeekAgo = moment(now).subtract(7, 'days').toDate();

var promptInput = function(cb) {
    consoleprompt.message = "Action";
    consoleprompt.start();
    var schema = {
        properties: {
            response: {
                description: '[G]ive'.green + ', ' + '[C]ancel'.red,
                type: 'string',
                pattern: /[gc]/i,
                required: true,
                before: function(value) { return value.toLowerCase(); }
            }
        }
    };
    consoleprompt.get(schema, function(err, result) {
        if (err) return cb(err);
        cb(undefined, result.response.toLowerCase());
    });
}
;

var pad = function(string, size, char) {
    var i, pad, prefix, _i, _ref;
    if (char === null || char === undefined) {
        char = ' ';
    }
    prefix = typeof string === 'number';
    if (prefix) {
        _ref = [string, size];
        size = _ref[0];
        string = _ref[1];
    }
    string = string.toString();
    pad = '';
    size = size - string.length;
    for (i = _i = 0; 0 <= size ? _i < size : _i > size; i = 0 <= size ? ++_i : --_i) {
        pad += char;
    }
    if (prefix) {
        return pad + string;
    } else {
        return string + pad;
    }
};

container.resolve(function(TransactionController, CashbackController, User, CURRENCIES, logger) {
    var txController = new TransactionController();
    var cbController = new CashbackController();
    logger.verbose("getting all users updated since %s", aWeekAgo);
    User.all({
        updatedAt: {$gte: aWeekAgo},
        anonymous: false
    }, function(err, users) {
        if (err) throw err;
        var userWithCashbacks = [];
        var totalCashback = 0;
        logger.verbose("found %d users", users.length);
        async.eachSeries(users, function(_user, cb) {
            async.eachSeries(CURRENCIES, function(currency, fin) {
                var user = new User(_user.toJSON());
                logger.mapUser(user.primary(), user.username());
                user.currency = currency;
                async.waterfall([
                    function(done) {
                        logger.verbose("getting total wagered for %s", user.username());
                        txController.getTotalWagered(user.primary(), currency, done);
                    },
                    function(wagered, done) {
                        logger.verbose("%s wagered %d %s", user.username(), wagered.toBitcoin(), currency);
                        var cashback;
                        if (wagered >= (1000).toSatoshi()) {
                            cashback = 0.0988;
                        } else if (wagered >= (100).toSatoshi()) {
                            cashback = 0.0788;
                        } else if (wagered >= (10).toSatoshi()) {
                            cashback = 0.0588;
                        } else if (wagered >= (1).toSatoshi()) {
                            cashback = 0.0388;
                        } else {
                            cashback = 0.0188;
                        }
                        user.wagered = wagered;
                        user.cashback = cashback;
                        done(undefined, cashback);
                    },
                    function(cashback, done) {
                        logger.verbose("getting wallet");
                        user.wallet(currency, function(err, wallet) {
                            if (err) return done(err);
                            return done(undefined, cashback, wallet);
                        });
                    },
                    function(cashback, wallet, done) {
                        logger.verbose("getting %s cashflow for %s", currency, user.username());
                        txController.getCashflow(user.primary(), currency, aWeekAgo, now, function(err, cashflow) {
                            if (err) return done(err);
                            logger.verbose("%s has a %d %s cashflow", user.username(), cashflow.toBitcoin(), currency);
                            var profit = cashflow + wallet.availableBalance();
                            var cashbackAmount = (Math.floor((profit * -1) * cashback));
                            if (profit >= 0) {
                                cashbackAmount = 0;
                            }
                            user.profit = profit;
                            user.cashbackAmount = cashbackAmount;
                            totalCashback += cashbackAmount;
                            userWithCashbacks.push({user: user, wallet: wallet});
                            done();
                        });
                    }
                ], function(err) {
                    if (err) {
                        if (err.code !== 404) console.error(err.message);
                    }
                    fin();
                });
            }, cb);
        }, function(err) {
            if (err) throw err;
            userWithCashbacks.sort(function(a, b) {
                if (a.user.cashbackAmount > b.user.cashbackAmount) return -1;
                if (a.user.cashbackAmount < b.user.cashbackAmount) return 1;
                if (a.user.cashbackAmount === b.user.cashbackAmount) return 0;
            });
            console.log((new Array(135)).join('-'));
            console.log("%s | %s | %s | %s | %s | %s | %s",
                        pad("Alias", 36),
                        pad("ID", 24),
                        pad(14, "Profit"),
                        pad(14, "Wagered"),
                        pad(12, "Currency"),
                        pad(6, "%"),
                        "Amount");
            console.log((new Array(135)).join('-'));
            var usersNotEligable = 0;
            userWithCashbacks.forEach(function(cashback) {
                var user = cashback.user;
                if (user.cashbackAmount <= 0) {
                    usersNotEligable += 1;
                } else {
                    console.log("%s | %s | %s | %s | %s | %s | %s",
                                pad(user.username(), 36),
                                user.primary(),
                                pad(14, user.profit.toBitcoinString()),
                                pad(14, user.wagered.toBitcoinString()),
                                pad(12, user.currency),
                                pad(6, user.cashback.toString()),
                                user.cashbackAmount.toBitcoinString());
                }
            });
            console.log((new Array(135)).join('-'));
            console.log("%d users active from %s to %s", users.length, aWeekAgo.toISOString(), now.toISOString());
            console.log("%d users not eligable", usersNotEligable);
            console.log("Total cashback: %s", totalCashback.toBitcoinString());
            promptInput(function(err, response) {
                if (err) {
                    console.error(err.message);
                    process.exit(1);
                }
                if (response === 'g') {
                    async.eachSeries(userWithCashbacks, function(cashback, cb) {
                        var user = cashback.user;
                        var wallet = cashback.wallet;
                        if (user.cashbackAmount > 0) {
                            cbController.giveCashback({
                                user: user,
                                wallet: wallet,
                                amount: user.cashbackAmount,
                                profit: user.profit,
                                start: aWeekAgo,
                                end: now,
                                currency: user.currency
                            }, cb);
                        } else {
                            cb();
                        }
                    }, function(err) {
                        if (err) throw err;
                        process.exit();
                    });
                } else {
                    console.log("cancelled");
                    process.exit();
                }
            });
        });

    });
});
