'use strict';

var async = require('async');
var extend = require('util')._extend;

module.exports = function(logger, mongo, userDbName, HTTPError, Config, io) {
    var jackpotCol = mongo.getDb({dbname: userDbName}).collection('jackpot');

    var jackpots = [];
    setInterval(function() {
        jackpotCol.find({active: true}, {users: false})
            .sort({value: 1})
            .toArray(function(err, _jackpots) {
                jackpots = _jackpots;
                io.emit('jackpot', jackpots);
            });
    }, 1000);

    var JackpotController = function() {
    };

    JackpotController.prototype.increment = function(user, theWager) {
        if ((user.vipLevel() || 0) < 3) return;
        theWager = Math.floor(theWager / 100);
        jackpotCol.find({active: true}).toArray(function(err, jackpots) {
            if (err) return logger.error('error getting active jackpots %s', err.message);
            async.each(jackpots, function(jackpot, done) {
                var wager = theWager;
                var leftover = Math.max((jackpot.wagered + wager) - jackpot.value, 0);
                wager -= leftover;
                jackpot.wagered += wager;
                if ((user.vipLevel() || 0) < jackpot.minLevel) return done();
                if (!jackpot.users[user.username()]) {
                    jackpot.users[user.username()] = wager;
                } else {
                    jackpot.users[user.username()] += wager;
                }
                if (jackpot.wagered >= jackpot.value) {
                    jackpot.winner = user.primary();
                    jackpot.wonAt = new Date();
                    jackpot.active = false;
                    user.wallet('bitcoin', function(err, wallet) {
                        if (err) {
                            logger.log(err.message);
                            return done();
                        }
                        var creditAmount = jackpot.value;
                        var userPercent = (jackpot.users[user.username()] / jackpot.value);
                        if (userPercent > 1) userPercent = 1;
                        creditAmount -=  userPercent * jackpot.value;
                        logger.info('%s jackpot won by %s: %d% (%d -> %d)',
                                    jackpot.name,
                                    user.primary(),
                                    userPercent * 100,
                                    jackpot.value.toBitcoin(),
                                    creditAmount.toBitcoin());
                        wallet.credit({
                            amount: creditAmount,
                            refId: 'jackpot:' + jackpot._id.toHexString(),
                            type: 'jackpot',
                            meta: {
                                userPercent: userPercent,
                            }
                        }, function(err) {
                            if (err) logger.log(err.message);
                            var newJackpot = extend({}, jackpot);
                            delete newJackpot._id;
                            jackpotCol.update({_id: jackpot._id}, {$set: newJackpot}, function(err, updated) {
                                if (err) logger.error(err.message);
                                if (!updated) logger.warn('no jackpot was updated!!');
                                Config.get('jackpots', function(err, jackpots) {
                                    if (err) {
                                        logger.error(err.message);
                                    } else {
                                        newJackpot = extend({}, jackpots[newJackpot.name]);
                                    }
                                    newJackpot.wagered = 0;
                                    newJackpot.count = 0;
                                    newJackpot.active = true;
                                    newJackpot.name = jackpot.name;
                                    newJackpot.users = {};
                                    jackpotCol.insert(newJackpot, function(err, docs) {
                                        if (err) return logger.error("error saving new jackpot %s", err.message);
                                        if (leftover > 0) {
                                            var updateDoc = {$inc: {wagered: leftover, count: 1}};
                                            updateDoc.$inc['users.' + user.username()] = leftover;
                                            jackpotCol.update({_id: docs[0]._id}, updateDoc, function(err, updated) {
                                                if (err) logger.error(err.message);
                                                if (!updated) logger.warn('no jackpot was updated!!');
                                                return done();
                                            });
                                        } else {
                                            return done();
                                        }
                                    });
                                });
                            });
                        });
                    });
                } else {
                    var updateDoc = {$inc: {wagered: wager, count: 1}};
                    updateDoc.$inc['users.' + user.username()] = wager;
                    jackpotCol.update({_id: jackpot._id}, updateDoc, function(err, updated) {
                        if (err) logger.error(err.message);
                        if (!updated) logger.warn('no jackpot was updated!!');
                        done();
                    });
                }
            }, function(err) {
                if (err) logger.error("error incrementing jackpots");
                logger.verbose('jackpots updated');
            });
        });
    };

    JackpotController.prototype.read = function(req, res) {
        return res.json(jackpots);
    };

    JackpotController.prototype.getJackpots = function() {
        return jackpots;
    };

    Config.get('jackpots', function(err, jackpots) {
        if (err) throw err;
        async.each(Object.keys(jackpots), function(name, done) {
            var jackpot = extend({}, jackpots[name]);
            jackpot.name = name;
            jackpotCol.count({
                name: jackpot.name,
                active: true
            }, function(err, count) {
                if (err) return done(err);
                if (!count) {
                    jackpot.count = 0;
                    jackpot.wagered = 0;
                    jackpot.active = true;
                    jackpot.users = {};
                    return jackpotCol.insert(jackpot, function(err) {
                        if (err) return logger.error(err.message);
                        logger.verbose("added %s jackpot", jackpot.name);
                        return done();
                    });
                } else {
                    return done();
                }
            });
        }, function(err) {
            if (err) return logger.error(err.message);
            logger.info("missing jackpots set up");
        });
    });

    return JackpotController;
};
