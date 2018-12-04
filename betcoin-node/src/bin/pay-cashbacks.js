'use strict';

var container = require('../container');
var logger = container.get('logger');
var HTTPError = container.get('HTTPError');
var mongo = container.get('mongo');
var async = require('async');
var CashbackController = container.get('CashbackController');
var cbController = new CashbackController();
var ChildProcess = require('child_process');

var CashbackPayer = function() {
    this.userdbWritable = mongo.getDb({dbname: 'userdb'});
    this.cashbackCollection = this.userdbWritable.collection('cashbacks');
};

CashbackPayer.prototype.loadCashbackData = function(cashbackId, cb) {
    cashbackId = mongo.ensureObjectId(cashbackId);
    this.cashbackCollection.findOne({_id: cashbackId}, function(err, cashback) {
        if (err) return cb(new HTTPError(err));
        if (!cashback) return cb(new HTTPError(404, "Cashback %s not found", cashbackId));
        if (cashback.paidAt) return cb(new HTTPError(422, "Cashback %s already paid", cashbackId));
        return cb(undefined, cashback);
    });
};

CashbackPayer.prototype.pay = function(record, cb) {
    if (record.amount <= 0) return cb();
    cbController.giveCashback(record, function(err) {
        if (err) logger.error("error giving cashback to %s: %s", record.userId, err.message);
        cb();
    });
};

CashbackPayer.prototype.markPaid = function(cashback, cb) {
    cashback.paidAt = new Date();
    this.cashbackCollection.update({_id: cashback._id}, {
        $set: {paidAt: cashback.paidAt}
    }, function(err) {
        if (err) return cb(new HTTPError(err));
        cb(undefined, cashback);
    });
};

if (require.main === module) {
    var argv = require('yargs')
        .argv;

    var cp = new CashbackPayer();

    var MAX_FORKS = 4;
    var processed = 0;
    var toProcess;
    if (argv.id) {
        logger.info("paying cashbacks");
        // this is coming from the main server
        cp.loadCashbackData(argv.id, function(err, cashback) {
            if (err) throw err;
            logger.info("cashbacks: %d user records", cashback.users.length);
            var records = cashback.users.filter(function(record) {
                return record.amount > 0;
            });
            toProcess = records.length;
            logger.info("cashbacks: %d records will receive a credit", records.length);
            var chunks = [];
            // break up the records into 100 piece chunks
            while (records.length) {
                chunks.push(records.splice(0, 20));
            }
            logger.info("cashbacks: running %s processes in %s bursts", chunks.length, Math.ceil(chunks.length / MAX_FORKS));
            async.eachLimit(chunks, MAX_FORKS, function(theseRecords, done) {
                // make a recursive fork with no --id argument
                var fork = ChildProcess.fork(__dirname + '/pay-cashbacks', [
                    // 'v'
                ]);
                // send the records to it
                fork.send(theseRecords);
                // when that fork is done, move on the next 100 records
                fork.on('message', function(data) {
                    processed += data;
                    logger.info("cashbacks: %d of %d records processed", processed, toProcess);
                    done();
                });
            }, function(err) {
                if (err) {
                    logger.error("Error processing cashbacks: %s", err.message);
                    process.exit();
                }
                logger.info("finished cashbacks credits");
                // when all forks are done, mark the cashback as paid
                // if everything went OK
                cp.markPaid(cashback, function(err) {
                    if (err) {
                        logger.error("Error marking cashback as paid!!!: %s", err.message);
                    }
                    process.exit();
                });
            });
        });
    } else {
        // this is a sub fork
        process.on('message', function(data) {
            async.eachLimit(data, 5, function(record, done) {
                cp.pay(record, done);
            }, function(err) {
                if (err) logger.error(err.message);
                process.send(data.length);
                process.exit();
            });
        });
    }
}

module.exports = CashbackPayer;
