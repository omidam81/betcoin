'use strict';

var https = require('https');
/**
 * Exchange rate getter
 * 
 * Cache this every 10 minutes
 */

module.exports = function(mongo, logger) {
    var db = mongo.getDb('bitcoin').collection('exchangeRate');
    var exchangeRateData = {ask: 0};
    logger.info("getting exchange rate");
    var updateExchangeRate = function() {
        https.get("https://api.bitcoinaverage.com/ticker/USD/", function(exRes) {
            if (exRes.statusCode === 200) {
                var data = '';
                exRes.on('data', function(chunk) { data += chunk; });
                exRes.on('end', function() {
                    var rates;
                    try {
                        rates = JSON.parse(data.toString());
                    } catch (ex) {
                        return logger.error("error parsing JSON response from bitcoinaverage");
                    }
                    logger.info("got exchange rate %d USD/BTC", rates.ask);
                    exchangeRateData = rates;
                    rates.timestamp = new Date(rates.timestamp);
                    db.insert(rates, function(err) {
                        if (err) return logger.error('Error saving exhange rate data %s', err.message);
                    });
                });
            } else {
                return logger.error("Non 200 status from bitcoinaverage: %d", exRes.statusCode);
            }
        }).on('error', function(err) {
            logger.error("error getting exchange rate: %s", err.message || err);
        });
    };
    updateExchangeRate();
    setInterval(updateExchangeRate, (10 * 60 * 1000));

    return function() {
        return exchangeRateData;
    };
};
