'use strict';

var container = require('../container');
var logger = container.get('logger');
var CURRENCIES = container.get('CURRENCIES');
var HTTPError = container.get('HTTPError');
var mongo = container.get('mongo');
var moment = require('moment');
var async = require('async');

var HistoryProcessor = function() {
    this.userdb = mongo.getSecondaryDb({dbname: 'userdb'});
    this.txsToProcess = 0;
    this.txsProcessed = 0;
};

HistoryProcessor.prototype.getProfitHistory = function(params, next) {
    var end = moment(params.end).startOf('day').add(1, 'day') ||
        moment.utc().hours(0).minutes(0).seconds(0).milliseconds(0).add(1, 'day');
    var start = moment(params.start).startOf('month') ||
        moment(end).subtract(parseInt(params.days, 10) || 31, 'days').startOf('month');
    var resultData = {};
    var collection = this.userdb.collection('transaction');
    logger.verbose("getting proft report from %s to %s", start, end, {});
    var self = this;
    async.each(CURRENCIES, function(currency, fin) {
        var thisMoment = start.clone();
        var data = {
            days: [],
            months: [],
            all: {
                deposited: 0,
                withdrawn: 0,
                deposits: 0,
                withdrawals: 0,
                averageDeposit: 0,
                averageWithdraw: 0
            }
        };
        var thisEnd;
        // fill data object with empty days
        do {
            thisEnd = thisMoment.clone().add(1, 'day');
            data.days.unshift({
                day: thisMoment.toISOString(),
                deposited: 0,
                withdrawn: 0,
                deposits: 0,
                withdrawals: 0,
                averageDeposit: 0,
                averageWithdraw: 0
            });
            thisMoment = thisEnd.clone();
        } while (thisMoment.isBefore(end));
        thisMoment = start.clone();
        // fill data object with empty months
        do {
            thisEnd = thisMoment.clone().startOf('month').add(1, 'month');
            logger.verbose("adding empty %s month", currency, thisMoment.toString(), {});
            data.months.unshift({
                month: thisMoment.toISOString(),
                deposited: 0,
                withdrawn: 0,
                deposits: 0,
                withdrawals: 0,
                averageDeposit: 0,
                averageWithdraw: 0
            });
            thisMoment = thisEnd.clone();
        } while (thisMoment.isBefore(end));
        var beforeQuery = new Date().getTime();
        collection.find({
            type: /(deposit|withdraw)/,
            'meta.status': {$ne: 'aborted'},
            createdAt: {
                $gte: start.toDate(),
                $lt: end.toDate()
            },
            currency: currency,
            userId: {$nin: self.ignoredUsers}
        }).toArray(function(err, txs) {
            if (err) return fin(err);
            var now = new Date().getTime();
            logger.verbose("%s profit query returned, took %d seconds", currency, (now - beforeQuery)/1000);
            self.txsToProcess = txs.length;
            process.send({
                statusUpdate: true,
                toProcess: self.txsToProcess,
                processed: self.txsProcessed
            });
            txs.forEach(function(tx) {
                if (tx.credit) {
                    data.all.deposited += tx.credit;
                    data.all.deposits += 1;
                } else {
                    data.all.withdrawn += tx.debit;
                    data.all.withdrawals += 1;
                }
                data.days.forEach(function(dayData, dayDataIndex) {
                    var thisStart = moment(dayData.day);
                    var txDate = moment(tx.createdAt);
                    if (txDate.isSame(thisStart, 'day')) {
                        if (tx.credit) {
                            data.days[dayDataIndex].deposited += tx.credit;
                            data.days[dayDataIndex].deposits += 1;
                        } else {
                            data.days[dayDataIndex].withdrawn += tx.debit;
                            data.days[dayDataIndex].withdrawals += 1;
                        }
                    }
                });
                data.months.forEach(function(monthData, monthDataIndex) {
                    var thisStart = moment(monthData.month);
                    var txDate = moment(tx.createdAt);
                    if (txDate.isSame(thisStart, 'month')) {
                        if (tx.credit) {
                            data.months[monthDataIndex].deposited += tx.credit;
                            data.months[monthDataIndex].deposits += 1;
                        } else {
                            data.months[monthDataIndex].withdrawn += tx.debit;
                            data.months[monthDataIndex].withdrawals += 1;
                        }
                    }
                });
                self.txsProcessed += 1;
                if (self.txsProcessed % 1000 === 0) {
                    process.send({
                        statusUpdate: true,
                        toProcess: self.txsToProcess,
                        processed: self.txsProcessed
                    });
                }
            });
            if (data.all.deposits !== 0) data.all.averageDeposit = data.all.deposited / data.all.deposits;
            if (data.all.withdrawals !== 0) data.all.averageWithdraw = data.all.withdrawn / data.all.withdrawals;
            data.days.forEach(function(dayData) {
                if (dayData.deposits !== 0) dayData.averageDeposit = dayData.deposited / dayData.deposits;
                if (dayData.withdrawals !== 0) dayData.averageWithdraw = dayData.withdrawn / dayData.withdrawals;
            });
            data.months.forEach(function(monthData) {
                if (monthData.deposits !== 0) monthData.averageDeposit = monthData.deposited / monthData.deposits;
                if (monthData.withdrawals !== 0) monthData.averageWithdraw = monthData.withdrawn / monthData.withdrawals;
            });
            resultData[currency] = data;
            var newNow = new Date().getTime();
            logger.verbose("%s profit data processed, took %d seconds", currency, (newNow - now)/1000);
            fin();
        });
    }, function(err) {
        if (err) return next(err);
        resultData.start = start;
        resultData.end = end;
        return next(undefined, resultData);
    });
};

HistoryProcessor.prototype.getGamesHistory = function(params, next) {
    var end = moment(params.end) ||
        moment.utc().hours(0).minutes(0).seconds(0).milliseconds(0).add(1, 'day');
    var start = moment(params.start) ||
        moment(end).subtract(parseInt(params.days, 10) || 31, 'days').startOf('month');
    var resultData = {};
    var collection = this.userdb.collection('transaction');
    logger.verbose("getting game report from %s to %s", start, end, {});
    var self = this;
    var gameNameRegexp = /(^[a-z0-9_]+):(.*)$/i;
    async.each(CURRENCIES, function(currency, fin) {
        var data = {
            days: [],
            months: [],
            all: {
                wagered: 0,
                won: 0,
                wagers: 0,
                wins: 0,
                averageWager: 0,
                averageWon: 0,
                games: {}
            }
        };
        ['month'].forEach(function(period) {
            var thisEnd;
            var thisMoment = start.clone();
            // fill data object with empty days
            do {
                thisEnd = thisMoment.clone().add(1, period);
                logger.verbose("adding empty %s %s", currency, period, thisMoment.toString(), {});
                data[period+'s'].unshift({
                    day: thisMoment.toISOString(),
                    wagered: 0,
                    won: 0,
                    wagers: 0,
                    wins: 0,
                    averageWager: 0,
                    averageWon: 0,
                    games: {}
                });
                thisMoment = thisEnd.clone();
            } while (thisMoment.isBefore(end));
        });
        var beforeQuery = new Date().getTime();
        collection.find({
            type: /(wager|winnings)/,
            createdAt: {
                $gte: start.toDate(),
                $lt: end.toDate()
            },
            currency: currency,
            userId: {$nin: self.ignoredUsers},
            'meta.bonus': {$ne: true}
        }).toArray(function(err, txs) {
            if (err) return fin(err);
            var now = new Date().getTime();
            logger.verbose("%s game report query returned %d txs, took %d seconds", currency, txs.length, (now - beforeQuery)/1000);
            self.txsToProcess = txs.length;
            process.send({
                statusUpdate: true,
                toProcess: self.txsToProcess,
                processed: self.txsProcessed
            });
            var gamesFound = [];
            async.each(txs, function(tx, done) {
                var typeParts = gameNameRegexp.exec(tx.type);
                if (!typeParts || !typeParts[1]) {
                    logger.warn("tx with invalid type for game: %s", tx.type);
                    return done();
                }
                var gameName = typeParts[1];
                if (gamesFound.indexOf(gameName) < 0) {
                    gamesFound.push(gameName);
                    logger.verbose("found game in game history: %s", gameName);
                }
                if (!data.all.games[gameName]) {
                    data.all.games[gameName] = {
                        wagered: 0,
                        won: 0,
                        wagers: 0,
                        wins: 0,
                        averageWager: 0,
                        averageWon: 0
                    };
                }
                if (typeParts[2].indexOf('winnings') === 0) {
                    data.all.won += tx.credit;
                    data.all.games[gameName].won += tx.credit;
                    if (tx.credit > 0) {
                        data.all.wins += 1;
                        data.all.games[gameName].wins += 1;
                    }
                } else if (typeParts[2].indexOf('wager') === 0){
                    data.all.wagered += tx.debit;
                    data.all.games[gameName].wagered += tx.debit;
                    data.all.wagers += 1;
                    data.all.games[gameName].wagers += 1;
                } else {
                    logger.debug("this is an egde case:", typeParts[2]);
                }
                ['month'].forEach(function(period) {
                    data[period+'s'].forEach(function(dayData, dayDataIndex, days) {
                        var thisStart = moment(dayData.day);
                        var txDate = moment(tx.createdAt);
                        if (!dayData.games[gameName]) {
                            dayData.games[gameName] = {
                                wagered: 0,
                                won: 0,
                                wagers: 0,
                                wins: 0,
                                averageWager: 0,
                                averageWon: 0
                            };
                        }
                        if (txDate.isSame(thisStart, period)) {
                            if (tx.credit) {
                                days[dayDataIndex].won += tx.credit;
                                days[dayDataIndex].games[gameName].won += tx.credit;
                                days[dayDataIndex].wins += 1;
                                days[dayDataIndex].games[gameName].wins += 1;
                            } else {
                                days[dayDataIndex].wagered += tx.debit;
                                days[dayDataIndex].games[gameName].wagered += tx.debit;
                                days[dayDataIndex].wagers += 1;
                                days[dayDataIndex].games[gameName].wagers += 1;
                            }
                        }
                    });
                });
                self.txsProcessed += 1;
                if (self.txsProcessed % 1000 === 0) {
                    process.send({
                        statusUpdate: true,
                        toProcess: self.txsToProcess,
                        processed: self.txsProcessed
                    });
                }
                done();
            }, function() {
                if (data.all.wins !== 0) data.all.averageWon = data.all.won / data.all.wins;
                if (data.all.wagers !== 0) data.all.averageWager = data.all.wagered / data.all.wagers;
                gamesFound.forEach(function(gameName) {
                    if (data.all.games[gameName].wins !== 0)
                        data.all.games[gameName].averageWon = data.all.games[gameName].won / data.all.games[gameName].wins;
                    if (data.all.games[gameName].wagers !== 0)
                        data.all.games[gameName].averageWager = data.all.games[gameName].wagered / data.all.games[gameName].wagers;
                });
                ['month'].forEach(function(period) {
                    data[period+'s'].forEach(function(dayData) {
                        if (dayData.wins !== 0) dayData.averageWon = dayData.won / dayData.wins;
                        if (dayData.wagers !== 0) dayData.averageWager = dayData.wagered / dayData.wagers;
                        gamesFound.forEach(function(gameName) {
                            if (dayData.games[gameName].wins !== 0)
                                dayData.games[gameName].averageWon = dayData.games[gameName].won / dayData.games[gameName].wins;
                            if (dayData.games[gameName].wagers !== 0)
                                dayData.games[gameName].averageWager = dayData.games[gameName].wagered / dayData.games[gameName].wagers;
                        });
                    });
                });
                resultData[currency] = data;
                var newNow = new Date().getTime();
                logger.verbose("%s game report data processed, took %d seconds", currency, (newNow - now)/1000);
                fin();
            });
        });
    }, function(err) {
        if (err) return next(err);
        resultData.start = start;
        resultData.end = end;
        return next(undefined, resultData);
    });
};


if (require.main === module) {
    var argv = require('yargs')
        .demand('type')
        .demand('start')
        .demand('end')
        .argv;
    var hp = new HistoryProcessor();

    var method = 'get' + argv.type[0].toUpperCase() + argv.type.slice(1) + 'History';
    process.on('message', function(data) {
        if (data.reportStatus === true) {
            process.send({
                statusUpdate: true,
                toProcess: hp.txsToProcess,
                processed: hp.txsProcessed
            });
        } else {
            hp.ignoredUsers = data.ignoredUsers || [];
            hp.ignoredUsers.forEach(function(ignoredUserId, index, ignored) {
                ignored[index] = mongo.ensureObjectId(ignoredUserId);
            });
            hp[method]({
                start: argv.start,
                end: argv.end
            }, function(err, results) {
                if (err) {
                    logger.error(err.message);
                    process.send({'error': new HTTPError(err)});
                    process.exit();
                }
                process.send({'result': results});
                process.exit();
            });
        }
    });
}

module.exports = HistoryProcessor;
