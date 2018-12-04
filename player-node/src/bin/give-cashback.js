'use strict';

var mongo = require('mongowrap').getConnection();
var moment = require('moment');
var async = require('async');
var consoleprompt = require('prompt');
require('bitcoin-math');
var Container = require('../lib/dependable-container');
var containerService = new Container();
var container = containerService.initContainer();

mongo.getDb('playerdb', function(err, db) {
    if (err) throw err;
    var Transactions = db.collection('transactions');
    var Users = db.collection('users');
    var TransactionController = require('../controllers/transaction')(Transactions);
    var UserController = require('../controllers/user')(Users,
                                                        db.collection('affiliate_tags'),
                                                        TransactionController,
                                                        db);
    UserController.setContainer(container);
    var now = moment().startOf('day').subtract('days', (moment().day()-1)).toDate();
    var aWeekAgo = moment(now).subtract('days', 7).toDate();

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

    Users.find({
        updated: {$gte: aWeekAgo},
        anonymous: false
    }).toArray(function(err, users) {
        if (err) throw err;
        var userWithCashbacks = [];
        var totalCashback = 0;
        async.eachSeries(users, function(user, cb) {
            async.waterfall([
                function(done) {
                    TransactionController.getTotalWagered('btc', user._id, done);
                },
                function(wagered, done) {
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
                    TransactionController.getCashflow('btc', user._id, aWeekAgo, now, function(err, cashflow) {
                        var profit = cashflow + user.balance.btc;
                        var cashbackAmount = (Math.floor((profit * -1) * cashback));
                        if (profit >= 0) {
                            cashbackAmount = 0;
                        }
                        user.profit = profit;
                        user.cashbackAmount = cashbackAmount;
                        totalCashback += cashbackAmount;
                        userWithCashbacks.push(user);
                        done();
                    });
                }
            ], function(err) {
                if (err) console.error(err.message);
                cb();
            });
        }, function(err) {
            if (err) throw err;
            userWithCashbacks.sort(function(a, b) {
                if (a.cashbackAmount > b.cashbackAmount) return -1;
                if (a.cashbackAmount < b.cashbackAmount) return 1;
                if (a.cashbackAmount === b.cashbackAmount) return 0;
            });
            console.log((new Array(120)).join('-'));
            console.log("%s | %s | %s | %s | %s | %s",
                        pad("Alias", 36),
                        pad("ID", 24),
                        pad(14, "Profit"),
                        pad(14, "Wagered"),
                        pad(6, "%"),
                        "Amount");
            console.log((new Array(120)).join('-'));
            var usersNotEligable = 0;
            userWithCashbacks.forEach(function(user) {
                if (user.cashbackAmount > 0) {
                    console.log("%s | %s | %s | %s | %s | %s",
                                pad(user.alias, 36),
                                user._id.toHexString(),
                                pad(14, user.profit.toBitcoinString()),
                                pad(14, user.wagered.toBitcoinString()),
                                pad(6, user.cashback.toString()),
                                user.cashbackAmount.toBitcoinString());
                } else {
                    usersNotEligable += 1;
                }
            });
            console.log((new Array(120)).join('-'));
            console.log("%d users active from %s to %s", users.length, aWeekAgo.toISOString(), now.toISOString());
            console.log("%d users not eligable", usersNotEligable);
            console.log("Total cashback: %s", totalCashback.toBitcoinString());
            promptInput(function(err, response) {
                if (err) {
                    console.error(err.message);
                    process.exit(1);
                }
                if (response === 'g') {
                    async.eachSeries(userWithCashbacks, function(user, cb) {
                        UserController.giveCashback(user, user.cashbackAmount, user.profit, aWeekAgo, now, 'btc', cb);
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
