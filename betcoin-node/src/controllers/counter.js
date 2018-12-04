'use strict';

var async = require('async');

module.exports = function(logger, mongo, userDbName, HTTPError, getExchangeRate, CURRENCIES, io) {
    var counterCol = mongo.getDb({dbname: userDbName}).collection('counter');

    var CounterUpdater = function() {
        this.total = 0;
        this.wagered = 0;
        this.exchange = {};
        var self = this;
        getExchangeRate.emitter.once('update', function() {
            self.socketUpdate();
        });
    };

    CounterUpdater.prototype.socketUpdate = function() {
        var total = 0;
        var wagered = 0;
        var exchange = getExchangeRate();
        var self = this;
        async.each(CURRENCIES, function(currency, done) {
            counterCol.findOne({_id: currency}, function(err, count) {
                if (err) return done(err);
                if (count) {
                    self[currency] = count;
                    total += count.count;
                    var btcValue =  getExchangeRate.bitcoinValue(count.wagered, currency);
                    // logger.debug('%d %s = %d bitcoin', count.wagered.toBitcoin(), currency, btcValue.toBitcoin());
                    wagered += btcValue;
                    return done();
                } else {
                    self[currency] = {_id: currency, count: 0, wagered: 0};
                    return done();
                }
            });
        }, function(err) {
            if (err) return logger.log("Error updating counters: %s", err.message);
            self.total = total;
            self.wagered = wagered;
            self.exchange = exchange;
        });
    };

    var counterUpdater = new CounterUpdater();
    setInterval(counterUpdater.socketUpdate.bind(counterUpdater), 5000);
    setInterval(function() {
        io.emit('counter', counterUpdater);
    }, 5000);

    var CounterController = function() {
    };

    CounterController.prototype.increment = function(currency, wager) {
        counterCol.update({_id:currency}, {
            $inc: {count: 1, wagered: wager}
        }, function(err) {
            if (err) return logger.error("error updating counters: %s", err.message);
            logger.verbose("incremented counter for %s", currency);
        });
    };

    CounterController.prototype.read = function(req, res) {
        return res.json(counterUpdater);
    };

    CounterController.prototype.counters = function() {
        return counterUpdater;
    };

    CURRENCIES.forEach(function(currency) {
        counterCol.count({_id: currency}, function(err, count) {
            if (err) return logger.error(err.message);
            if (!count) return counterCol.insert({_id: currency, count: 0, wagered: 0}, function(err) {
                if (err) return logger.error(err.message);
                logger.verbose("added counter for %s", currency);
            });
        });
    });

    return CounterController;
};
