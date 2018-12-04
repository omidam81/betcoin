'use strict';

/**
 * Exchange rate getter
 *
 * Cache this every 10 minutes
 */

var events = require('events');

module.exports = function(mongo, logger, userDbName, HTTPError, FIAT_CURRENCIES, CURRENCY_REGEXP) {
    var db = mongo.getDb({dbname: userDbName}).collection('exchange_rate');
    var exchangeRateData = {};
    var returnFunc = function() {
        return exchangeRateData;
    };
    returnFunc.emitter = new events.EventEmitter();
    var updateCachedValue = function() {
        db.findOne({}, {sort: {timestamp: -1}}, function(err, latestExchange) {
            if (err) return logger.error(err.message);
            exchangeRateData = latestExchange || {};
            returnFunc.emitter.emit('update', latestExchange);
        });
    };
    updateCachedValue();
    setInterval(updateCachedValue, (10*60*1000));

    // take amount of currency and return the value in BTC
    //  (satoshi for altcoins, normal amount for fiat)
    returnFunc.bitcoinValue = function(amount, currency) {
        if (currency === 'bitcoin') return amount;
        if (!exchangeRateData[currency] || !amount) return 0;
        var value = 0;
        if (FIAT_CURRENCIES.indexOf(currency) >= 0) {
            value = (amount / exchangeRateData[currency]).toSatoshi();
            // logger.debug('%d %s = %d bitcoin', amount, currency, value.toBitcoin());
        } else if (CURRENCY_REGEXP.test(currency)) {
            value = (exchangeRateData[currency].toBitcoin() * amount.toBitcoin()).toSatoshi();
            // logger.debug('%d %s = %d bitcoin', amount.toBitcoin(), currency, value.toBitcoin());
        } else throw new HTTPError(400, "Invalid currency supplied to exchangeRate.bitcoinValue");
        return value;
    };
    // take amount of BTC and return value in currency
    //  (satoshi for altcoins, normal amount for fiat)
    returnFunc.convert = function(amount, currency) {
        if (currency === 'bitcoin') return amount;
        if (!exchangeRateData[currency] || !amount) return 0;
        var value = 0;
        if (FIAT_CURRENCIES.indexOf(currency) >= 0) {
            value = exchangeRateData[currency] * amount.toBitcoin();
            // logger.debug('%d bitcoin = %d %s fiat', amount, value, currency);
        } else if (CURRENCY_REGEXP.test(currency)) {
            value = (amount.toBitcoin() / exchangeRateData[currency].toBitcoin()).toSatoshi();
            // logger.debug('%d bitcoin = %d %s', amount.toBitcoin(), value.toBitcoin(), currency);
        } else throw new HTTPError(400, "Invalid currency supplied to exchangeRate.bitcoinValue");
        return value;
    };
    return returnFunc;
};
