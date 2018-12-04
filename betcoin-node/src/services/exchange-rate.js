'use strict';

var https = require('https');
var async = require('async');
/**
 * Exchange rate getter
 *
 * Cache this every 10 minutes
 */


module.exports = function(mongo, logger, userDbName, FIAT_CURRENCIES, HTTPError) {
    var db = mongo.getDb({dbname: userDbName}).collection('exchange_rate');
    var updateExchangeRate = function(cb) {
        var newData = {};
        async.each(FIAT_CURRENCIES, function(fiatCurr, done) {
            https.get("https://api.bitcoinaverage.com/ticker/" + fiatCurr + "/ask", function(exRes) {
                if (exRes.statusCode === 200) {
                    var data = '';
                    exRes.on('data', function(chunk) { data += chunk; });
                    exRes.on('end', function() {
                        var rates;
                        try {
                            rates = JSON.parse(data.toString());
                        } catch (ex) {
                            return done(new Error("error parsing JSON response from bitcoinaverage"));
                        }
                        logger.info("got exchange rate %d %s/BTC", rates, fiatCurr);
                        newData[fiatCurr] = rates;
                        done();
                    });
                } else {
                    return done(new HTTPError(exRes.statusCode, "Non 200 status from bitcoinaverage: %d", exRes.statusCode));
                }
            }).on('error', function(err) {
                return done(new HTTPError(err));
            });
        }, function(err) {
            if (err) return cb(err);
            // these prices are saved as the cost in BTC for 1 *coin
            async.each([
                {coin: 'litecoin', url: 'ltc_btc'},
                {coin: 'dogecoin', url: 'doge_btc'},
                {coin: 'ppcoin', url: 'ppc_btc'},
                {coin: 'namecoin', url: 'nmc_btc'},
            ], function(altcoin, done) {
                https.get("https://api.cryptocoincharts.info/tradingPair/" + altcoin.url, function(exRes) {
                    if (exRes.statusCode === 200) {
                        var data = '';
                        exRes.on('data', function(chunk) { data += chunk; });
                        exRes.on('end', function() {
                            var rates;
                            try {
                                rates = JSON.parse(data.toString());
                            } catch (ex) {
                                return done(new Error("error parsing JSON response from bitcoinaverage"));
                            }
                            rates = (parseFloat(rates.price)).toSatoshi();
                            logger.info("got exchange rate 1 %s = %d BTC", altcoin.coin, rates.toBitcoin());
                            newData[altcoin.coin] = rates;
                            done();
                        });
                    } else {
                        return done(new HTTPError(exRes.statusCode, "Non 200 status from cryptocoincharts: %d", exRes.statusCode));
                    }
                }).on('error', function(err) {
                    return done(new HTTPError(err));
                });
            }, function(err) {
                if (err) return cb(err);
                newData.timestamp = new Date();
                db.update({_id: 'exchangeRate'}, {$set: newData}, {upsert: true}, function(err) {
                    return cb(err);
                });
            });
        });
    };
    return {
        name: 'exchange rate getter',
        interval: '5 minutes',
        task: function(job, done) {
            return updateExchangeRate(done);
        }
    };
};
