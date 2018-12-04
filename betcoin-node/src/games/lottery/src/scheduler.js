'use strict';

var Agenda = require('agenda');

var scheduler = new Agenda();
var moment = require('moment');
var async = require('async');

module.exports = function(mongo, logger, HTTPError, io, Wallet) {
    var scheduleDb = mongo.getDb({dbname: 'gamedb'});
    scheduler.mongo(scheduleDb.collection('scheduler'));
    var Scheduler = function() {
    };

    Scheduler.prototype.getStartAndEnd = function(intervalString) {
        var regexp = /([0-9]+)([mhdwMy])/;
        var regMatches = regexp.exec(intervalString);
        var interval = regMatches[2];
        var quantity = parseInt(regMatches[1], 10);
        if (isNaN(quantity)) throw new HTTPError(400, "invalid interval string");
        var start = moment().startOf(interval);
        var end = moment().startOf(interval).add(quantity, interval);
        return {
            start: start,
            end: end
        };
    };

    Scheduler.prototype.scheduleLottery = function(lottery, execFunc) {
        var self = this;
        var end = lottery.end();
        scheduler.jobs({name: lottery.primary().toHexString()}, function(err, jobs) {
            if (err) throw err;
            async.eachSeries(jobs, function(job, done) {
                    job.remove(function(err) {
                        if (err) logger.error(err.message);
                        done();
                    });
            }, function(err) {
                if (err) logger.error(err.message);
                scheduler.define(lottery.primary().toHexString(), function(job, done) {
                    logger.lottery("processing %s lottery (%s)", lottery.interval(), lottery.primary(), {});
                    lottery.selectWinner(function(err, updatedLottery, bet) {
                        if (err) {
                            if (err.code === 411)
                                logger.lottery("no tickets for %s lottery", lottery.interval());
                            else
                                logger.error(err.message);
                        }
                        var config = self.getStartAndEnd(lottery.interval());
                        config.interval = lottery.interval();
                        config.currency = lottery.currency();
                        if(updatedLottery){
                            Wallet.get({userId: bet.player_id(), currency: bet.currency()}, function(err, wallet) {
                                wallet.credit({
                                    amount: updatedLottery.jackpot(),
                                    refId: "winnings:" + updatedLottery.primary(),
                                    type: 'lottery' + ":winnings"
                                }, function(err, transaction) {
                                    io.playerEmit(updatedLottery.result(), 'player winner selected', {lottery:updatedLottery, transaction: transaction});
                                    io.playerBroadcast(updatedLottery.result(), 'winner selected', {lottery:updatedLottery, transaction: transaction});
                                });
                            });
                        }
                        // execFunc is LotteryController#create,
                        // LotteryController cannot be imported here due to
                        // circular dependency errors
                        execFunc(config, function(err, newLottery) {
                            if (err) return done(err);
                            logger.lottery("set up new %s lottery", newLottery.interval());
                            done();
                        });
                    });
                });
                scheduler.schedule(end, lottery.primary().toHexString());
            });
        });
    };

    Scheduler.prototype.init = function() {
        scheduler.start();
        var purgeOldSchedules = function() {
            scheduler.jobs({nextRunAt: null}, function(err, jobs) {
                if (err) return logger.error("error getting old schedule records");
                async.each(jobs, function(job, done) {
                    job.remove(done);
                }, function(err) {
                    if (err) return logger.error("error purging old schedules: %s", err.message);
                    if (jobs.length) {
                        logger.lottery("%d old schedule records purged", jobs.length);
                    } else {
                        logger.lottery("no old schedule records to purge");
                    }
                });
            });
        };
        purgeOldSchedules();
        setInterval(purgeOldSchedules, (3*60*1000));

        var gracefulStop = function() {
            scheduler.stop(function() {
                process.exit(0);
            });
        };

        process.on('SIGTERM', gracefulStop);
        process.on('SIGINT', gracefulStop);
    };

    return new Scheduler();
};
