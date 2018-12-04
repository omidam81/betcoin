'use strict';

var container = require('./container');
var Agenda = require('agenda');
var scheduler = new Agenda();
var async = require('async');
var Api = require('./app');
var api = new Api(container);
api.registerApp();
api.registerServer();

container.register('vipLevels', require('./services/vip-levels'));
container.register('exchangeRate', require('./services/exchange-rate'));
container.register('cashbacks', require('./services/cashbacks'));
container.register('bonusTimeout', require('./services/bonus-timeout'));

container.resolve(function(mongo, logger, LotteryGame, vipLevels, exchangeRate, cashbacks, bonusTimeout) {
    var scheduleDb = mongo.getDb({dbname:'userdb'});
    scheduler.mongo(scheduleDb.collection('service_scheduler'));

    // make an array of the jobs we have registered and schedule them
    var jobs = [vipLevels, exchangeRate, cashbacks, bonusTimeout];
    async.each(jobs, function(job, fin) {
        scheduler.jobs({name: job.name}, function(err, jobs) {
            if (err) return fin(err);
            // remove old job definitions
            async.eachSeries(jobs, function(_job, done) {
                _job.remove(function(err) {
                    if (err) logger.error(err.message);
                    done();
                });
            }, function(err) {
                if (err) return fin(err);
                // now define and schedule the job
                scheduler.define(job.name, function(_job, done) {
                    logger.info('running job "%s"', job.name);
                    var now = new Date();
                    job.task(_job, function(err) {
                        if (err) {
                            logger.error('Error running "%s": %s', job.name, err.message);
                            return done(err);
                        }
                        var time = (new Date().getTime() - now) / 1000;
                        logger.info('job "%s" completed, took %ds', job.name, time);
                        return done();
                    });
                });
                if (job.interval) {
                    scheduler.every(job.interval, job.name);
                } else if (job.schedule) {
                    var repeatJob = scheduler.schedule(job.schedule, job.name);
                    if (job.repeat) repeatJob.repeatEvery(job.repeat).save();
                }
                fin();
            });
        });
    }, function(err) {
        if (err) throw err;
        // once all jobs are scheduled, start the scheduler
        scheduler.start();
    });

    var purgeOldSchedules = function() {
        scheduler.jobs({nextRunAt: null}, function(err, jobs) {
            if (err) return logger.error("error getting old serevice schedule records");
            async.each(jobs, function(job, done) {
                job.remove(done);
            }, function(err) {
                if (err) return logger.error("error purging old service schedules: %s", err.message);
                if (jobs.length) {
                    logger.verbose("%d old service schedule records purged", jobs.length);
                } else {
                    logger.verbose("no old service schedule records to purge");
                }
            });
        });
    };
    purgeOldSchedules();
    setInterval(purgeOldSchedules, (3*60*1000));


    // setup lottery scheduler
    LotteryGame.serviceSetup();

});
