'use strict';

var async = require('async');
var util = require('util');

module.exports = function(User, logger, locales, Transaction,
                          getExchangeRate, Config, JackpotController,
                          io, CounterController) {

    var counterController = new CounterController();
    var StatsController = function() {

    };

    StatsController.prototype.read = function(req, res, next) {
        var jackpotController = new JackpotController();
        var stats = {
            online: io.activeSockets(),
            recent_winners: {
                en: [],
                cn: []
            },
            paid_out: {
                USD: null,
                CNY: null
            }
        };

        async.waterfall([
            function(done) {
                Transaction.all({
                    type: Transaction.TYPE_REGEXP_WINNINGS,
                    credit: {$gt: 0}
                }, {
                    sort: {createdAt: -1},
                    limit: 5
                }, function(err, txs) {
                    if (err) {
                        logger.error("Error %d getting recent winners: %s", err.code, err.message);
                        return done(err);
                    }
                    stats.recent_winners.en = [];
                    stats.recent_winners.cn = [];
                    async.each(txs, function(tx, fin) {
                        User.get({_id: tx.userId()}, function(err, user) {
                            if (err) return fin(err);
                            var message = '%s won %s%s';
                            logger.info("won %s", tx.credit().toBitcoin());
                            var btcValue = getExchangeRate.bitcoinValue(tx.credit(), tx.currency());
                            var usdValue = getExchangeRate.convert(btcValue, 'USD');
                            var cnyValue = getExchangeRate.convert(btcValue, 'CNY');
                            var recentWinnerEn = util.format(message, user.username(), '$', usdValue);
                            stats.recent_winners.en.push(recentWinnerEn);
                            if (locales.zh_CN.messages[message]) {
                                var recentWinnerCn = util.format(locales.zh_CN.messages[message],
                                                                 user.username(), '¥', cnyValue);
                                stats.recent_winners.cn.push(recentWinnerCn);
                            }
                            fin();
                        });
                    }, done);
                });
            },
            function(done) {
                var counters = counterController.counters();
                stats.paid_out.USD += getExchangeRate.convert(counters.wagered, 'USD');
                stats.paid_out.CNY += getExchangeRate.convert(counters.wagered, 'CNY');
                done();
            },
            function(done) {
                stats.jackpots = jackpotController.getJackpots();
                done();
            }

        ], function(err) {
            if (err) {
                logger.error("error getting stats data", err.messsage);
                if (err) return next(err);
            }
            return res.json(stats);
        });
    };

    return StatsController;
};
