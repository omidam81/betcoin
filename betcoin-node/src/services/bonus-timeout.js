'use strict';

var moment = require('moment');
var async = require('async');

module.exports = function(logger, Bonus, User) {

    var expireBonus = function(bonus, cb) {
        bonus.exhausted = true;
        bonus.save(cb);
    };

    var processBonuses = function(cb) {
        var refDate = moment().subtract(7, 'days').toDate();
        async.waterfall([
            function getBonuses(done) {
                Bonus.all({
                    activatedAt: {$lte: refDate},
                    exhaustedAt: {$exists: false},
                    unlockedAt: {$exists: false}
                }, done);
            },
            function clearBonuses(bonuses, done) {
                async.each(bonuses, function(bonus, fin) {
                    async.waterfall([
                        function(end) {
                            User.get(bonus.userId(), end);
                        },
                        function(user, end) {
                            if (user === false) return expireBonus(bonus, fin);
                            logger.mapUser(user.primary(), user.username());
                            user.wallet(bonus.currency(), function(err, wallet) {
                                if (err) {
                                    logger.error("error getting %s wallet for %s: %s",
                                                 bonus.currency(),
                                                 bonus.userId(),
                                                 err.message);
                                    return expireBonus(bonus, fin);
                                }
                                return end(undefined, wallet);
                            });
                        },
                        function(wallet, end) {
                            wallet.debit({
                                amount: bonus.value(),
                                refId: "wager:BONUS_EXPIRED:" + wallet.userId() + ":" + refDate.getTime(),
                                type: "BONUS_EXPIRED:bonus-adjust",
                                meta: {
                                    refDate: refDate
                                }
                            }, function(err) {
                                if (err) {
                                    logger.error("error clearing bonus from %s: %s", bonus.userId(), err.message);
                                    return expireBonus(bonus, fin);
                                }
                                return expireBonus(bonus, end);
                            });
                        },
                    ], fin);
                }, done);
            }
        ], cb);
    };

    return {
        name: 'bonus timeout checker',
        interval: '5 minutes',
        task: function(job, cb) {
            return processBonuses(cb);
        }
    };
};
