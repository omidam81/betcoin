'use strict';

var async = require('async');
var util = require('util');
var ChildProcess = require('child_process');
var format = util.format;
var extend = util._extend;

module.exports = function(mongo, logger, mailer,
                          AdminUser, User, HTTPError,
                          ListQuery, AggregationQuery,
                          GameTotalQuery, gameNames,
                          CURRENCIES, cryptod, Bonus,
                          container, CURRENCY_REGEXP, auth,
                          TransactionController, io, WalletController, Wallet,
                          AdminTransaction, CashbackController, CashoutRequest,
                          NotificationController, SavedSearch, Config) {

    var BackofficeController = function() {
        // Get mostly secondary read version of the db connections.
        // For making writes, we get a few writable dbs, or use the
        // models via the DI container
        this.userdb = mongo.getSecondaryDb({dbname: 'userdb'});
        this.userdbWritable = mongo.getDb({dbname: 'userdb'});
        this.cashbackCollection = this.userdbWritable.collection('cashbacks');
        this.gamedb = mongo.getSecondaryDb({dbname: 'gamedb'});
        this.logCollection = mongo.getSecondaryDb({dbname: 'logs'}).collection('betcoin');
        this.getIgnoredUsers();
        this.ignoredUsers = [];
        setInterval(this.getIgnoredUsers.bind(this), (1 * 60 * 60 * 1000));
        var self = this;
        self.userdb.collection('email_alerts').find({}).toArray(function(err, alerts) {
            if (err) return logger.error("Error bootstrapping email alerts for backoffice", err.message);
            alerts.forEach(function(alert) {
                self.addEmailAlertSchedule(alert);
            });
        });
    };

    BackofficeController.prototype.getIgnoredUsers = function() {
        this.ignoredUsers = [];
        logger.verbose("getting list of ignored users");
        var self = this;
        this.userdb.collection('user').find({
            ignore: {$ne: false}
        }, {_id: true}).toArray(function(err, iuList) {
            if(err) return logger.error("error getting ignored users for backoffice: %s", err.message);
            logger.verbose("found %d ignored users for the backoffice", iuList.length);
            iuList.forEach(function(iu) {
                self.ignoredUsers.push(iu._id);
            });
        });
    };

    BackofficeController.prototype.readSingle = function(req, res, next) {
        var id = mongo.ensureObjectId(req.params.id);
        // allow users to be searched by username as well
        if (id === null && req.collectionName !== 'user') return next(new HTTPError(400, "Invalid ObjectID"));
        var query = {_id: id};
        // allow users to be searched by username as well
        if (req.collectionName === 'user') query = {$or: [{_id: id}, {username: req.params.id}]};
        var self = this;
        req.collection.findOne(query, function(err, doc) {
            if (err) return next(new HTTPError(err.code, err.message));
            if (!doc) return next(new HTTPError(404, id + " not found in " + req.collectionName + " collection"));
            // most queries can return here
            if (req.collectionName !== 'user') return res.json(doc);
            // if we are getting a user, fetch their associated wallet records
            var user = doc;
            self.userdb.collection('wallet').find({
                userId: user._id
            }).toArray(function(err, wallets) {
                if (err) return next(new HTTPError(err.code, err.message));
                user.wallets = {};
                wallets.forEach(function(wallet) {
                    user.wallets[wallet.currency] = wallet;
                });
                return res.json(user);
            });
        });
    };

    BackofficeController.prototype.readList = function(req, res, next) {
        var listQuery = new ListQuery({
            collection: req.collection,
            pageSize: req.query.pageSize,
            page: req.query.page,
            url: req.originalUrl
        });
        var self = this;
        if (req.collectionName === 'user') {
            if (!listQuery.query._id && !req.query.showIgnored) {
                listQuery.query._id = {$nin: this.ignoredUsers};
            }
        } else if (gameNames.indexOf(req.collectionName) >= 0) {
            if (!listQuery.query.player_id && !req.query.showIgnored) {
                listQuery.query.player_id = {$nin: this.ignoredUsers};
            }
        } else {
            if (!listQuery.query.userId && !req.query.showIgnored) {
                listQuery.query.userId = {$nin: this.ignoredUsers};
            }
        }
        listQuery.getList(function(err) {
            if (err) return next(err);
            logger.verbose("backoffice %s query returned %d records (%d total)",
                           req.params.type,
                           listQuery.result.length,
                           listQuery.total);
            if (listQuery.total === 0) return res.json(listQuery);
            if (req.query.mapUsers) {
                var userIdKey;
                if (listQuery.result[0].userId === undefined) {
                    if (listQuery.result[0].player_id === undefined) {
                        return res.json(listQuery);
                    } else {
                        userIdKey = 'player_id';
                    }
                } else {
                    userIdKey = 'userId';
                }
                var userCol = self.userdb.collection('user');
                async.map(listQuery.result, function(record, done) {
                    userCol.findOne({_id: record[userIdKey]}, function(err, user) {
                        if (err) return done(new HTTPError(err));
                        record.user = user;
                        return done(undefined, record);
                    });
                }, function(err, results){
                    if (err) return next(err);
                    listQuery.result = results;
                    return res.json(listQuery);
                });
            } else {
                return res.json(listQuery);
            }
        });
    };

    BackofficeController.prototype.getSchema = function(req, res, next) {
        var nameParts = req.collectionName.split("_");
        nameParts.forEach(function(word, index) {
            nameParts[index] = word.slice(0,1).toUpperCase() + word.slice(1);
        });
        var modelName = nameParts.join("");
        try {
            var Model;
            try {
                Model = container.get(modelName);
            } catch (ex) {
                Model = container.get(modelName + 'Game').model;
            }
            var schema = {};
            Object.keys(Model.attrs).forEach(function(attrName) {
                var attrConf = extend({}, Model.attrs[attrName]);
                if (!attrConf.type) attrConf.type = 'string';
                if (attrConf.type === Date) {
                    attrConf.type = 'date';
                } else if ('function' === typeof attrConf.type){
                    attrConf.type = 'string';
                }
                if (attrConf.format instanceof RegExp) {
                    attrConf.format = attrConf.format.source;
                }
                schema[attrName] = attrConf;
            });
            return res.json(schema);
        } catch (ex) {
            req.collection.findOne({}, {sort: {_id: -1}}, function(err, record) {
                if (err) return next(new HTTPError(err));
                if (!record) return res.json({});
                var keys = Object.keys(record);
                var schema = {};
                var processKeys = function(object, keys, prefix) {
                    if (!prefix) prefix = '';
                    keys.forEach(function(key) {
                        var val = object[key];
                        var type = 'text';
                        if (val && val.constructor === Object) {
                            processKeys(val, Object.keys(val), key + '.');
                        } else if (val === null) {
                            if (/At$/.test(key)) type = 'date';
                            else if (/[iI]d$/.test(key)) type = 'ObjectId';
                            schema[prefix + key] = type;
                        } else {
                            if (util.isDate(val)) type = 'date';
                            else if (val.constructor === mongo.ObjectId) type = 'ObjectId';
                            else if (typeof val === 'number') type = 'number';
                            schema[prefix + key] = type;
                        }
                    });
                };
                processKeys(record, keys);
                return res.json(schema);
            });
        }
    };

    BackofficeController.prototype.getCollection = function(req, res, next) {
        var collectionName = req.collectionName = req.params.collection;
        logger.verbose("getting %s list for backoffice", collectionName);
        // set collection based on type
        if (collectionName === 'logs') req.collection = this.logCollection;
        else if (gameNames.indexOf(collectionName) >= 0) req.collection = this.gamedb.collection(collectionName);
        else req.collection = this.userdb.collection(collectionName);
        next();
    };

    BackofficeController.prototype.read = function(req, res, next) {
        // if we are gettinga specific id, just read one, otherwise use a list query object
        if (req.params.id) {
            return this.readSingle(req, res, next);
        } else {
            return this.readList(req, res, next);
        }
    };

    BackofficeController.prototype.count = function(req, res, next) {
        var listQuery = new ListQuery({
            collection: req.collection,
            pageSize: req.query.pageSize,
            page: req.query.page,
            url: req.originalUrl
        });
        if (req.collectionName === 'user') {
            if (!listQuery.query._id && !req.query.showIgnored) {
                listQuery.query._id = {$nin: this.ignoredUsers};
            }
        } else if (gameNames.indexOf(req.collectionName) >= 0) {
            if (!listQuery.query.player_id && !req.query.showIgnored) {
                listQuery.query.player_id = {$nin: this.ignoredUsers};
            }
        } else {
            if (!listQuery.query.userId && !req.query.showIgnored) {
                listQuery.query.userId = {$nin: this.ignoredUsers};
            }
        }
        req.collection.count(listQuery.query, function(err, count) {
            if (err) return next(new HTTPError(err));
            return res.json({total: count});
        });
    };

    BackofficeController.prototype.aggregate = function(req, res, next) {
        var aggQuery = new AggregationQuery({
            collection: req.collection,
            url: req.originalUrl
        });
        // we do special stuff for user list searches
        var self = this;
        aggQuery.getAggregation(function(err) {
            if (err) return next(err);
            if (aggQuery.result.length === 0) return res.json(aggQuery);
            if (req.query.mapUsers) {
                var userIdKey;
                if (aggQuery.result[0].userId === undefined) {
                    if (aggQuery.result[0].player_id === undefined) {
                        return res.json(aggQuery);
                    } else {
                        userIdKey = 'player_id';
                    }
                } else {
                    userIdKey = 'userId';
                }
                var userCol = self.userdb.collection('user');
                async.map(aggQuery.result, function(record, done) {
                    userCol.findOne({_id: record[userIdKey]}, function(err, user) {
                        if (err) return done(new HTTPError(err));
                        record.user = user;
                        return done(undefined, record);
                    });
                }, function(err, results){
                    if (err) return next(err);
                    aggQuery.result = results;
                    return res.json(aggQuery);
                });
            } else {
                return res.json(aggQuery);
            }
        });
    };

    BackofficeController.prototype.gameTotals = function(req, res, next) {
        var game = req.params.game;
        var since = Date.parse(req.query.since);
        var until = Date.parse(req.query.until);
        if (isNaN(since)) return next(new HTTPError(400, "Invalid Date since"));
        if (isNaN(until)) return next(new HTTPError(400, "Invalid Date until"));
        since = new Date(since);
        until = new Date(until);
        if (gameNames.indexOf(game) < 0) return next(new HTTPError(400, "Invalid game " + game));
        if(game === 'lottery'){
            game = 'lottery_bet';
        }
        var collection = this.gamedb.collection(game);
        var gameTotalQuery = new GameTotalQuery(game, {
            since: since,
            until: until,
            url: req.originalUrl,
            collection: collection,
            includeZeroWager: (req.query.includeZeroWager === 'true'),
            includeBonusWager: (req.query.includeBonusWager === 'true')
        });
        if (!gameTotalQuery.query.player_id && !req.query.showIgnored) {
            gameTotalQuery.query.player_id = {$nin: this.ignoredUsers};
        }
        gameTotalQuery.getTotals(function(err) {
            if (err) return next(err);
            res.json(gameTotalQuery);
        });
    };

    BackofficeController.prototype.getBankroll = function(req, res, next) {
        var bankrolls = {};
        var self = this;
        async.each(CURRENCIES, function(currency, done) {
            var coind = cryptod(currency);
            var walletBalance, userBalance;
            async.parallel([
                function(fin) {
                    coind.getBankroll(function(err, balance) {
                        if (err) return fin(new HTTPError(err.code, err.message));
                        walletBalance = balance;
                        fin();
                    });
                },
                function(fin) {
                    var match = {
                        $match: {
                            currency: currency,
                            'meta.status': {$ne: "aborted"},
                        }
                    };
                    if (!req.showIgnored) {
                        match.$match.userId = {$nin: self.ignoredUsers};
                    }
                    self.userdb.collection('wallet').aggregate([
                        match,
                        {$group: {_id: currency, totalBalance: {$sum: '$availableBalance'}}},
                    ], function(err, aggResult) {
                        if (err) return fin(new HTTPError(err.code, err.message));
                        userBalance = aggResult[0].totalBalance;
                        fin();
                    });
                }
            ], function(err) {
                if (err) return done(err);
                bankrolls[currency] = {
                    balance: walletBalance,
                    userBalance: userBalance
                };
                return done();
            });
        }, function(err) {
            if (err) return next(err);
            return res.json(bankrolls);
        });
    };

    var REPORT_CACHE = {};

    BackofficeController.prototype.getHistory = function(req, res, next) {
        var start = Date.parse(req.query.start);
        var end = Date.parse(req.query.end);
        var type = req.params.type;
        if (!REPORT_CACHE[type]) REPORT_CACHE[type] = {};
        var thisReport = REPORT_CACHE[type][start+end];
        if (thisReport) {
            if (thisReport.error !== null) return next(thisReport.error);
            if (thisReport.status === 'pending') {
                return res.status(206).json(thisReport);
            }
            return res.json(thisReport.report);
        } else {
            REPORT_CACHE[type][start+end] = thisReport = {
                status: 'pending',
                error: null,
                report: null
            };
        }
        var fork = ChildProcess.fork(__dirname + '/../bin/get-history', [
            // '-v',
            '--type', type,
            '--start', start,
            '--end', end
        ]);
        if (req.showIgnored) {
            fork.send({ignoredUsers: []});
        } else {
            fork.send({ignoredUsers: this.ignoredUsers});
        }
        fork.on('message', function(data) {
            if (data.statusUpdate === true) {
                thisReport.toProcess = data.toProcess;
                thisReport.processed = data.processed;
                return;
            }
            if (data.error) {
                thisReport.status = 'error';
                thisReport.error = data.error;
            }
            thisReport.status = 'finished';
            thisReport.report = data.result;
        });
        res.status(206).send({status: "pending"});
    };

    BackofficeController.prototype.lockUser = function(req, res, next) {
        if (req.user.accessLevel() > 1) return next(new HTTPError(401, "You do not have permission to do this"));
        var lock = (req.body.lock !== undefined) ? req.body.lock : true;
        req.targetUser.lock(lock);
        req.targetUser.save(function(err) {
            if (err) return next(err);
            res.status(202).send();
        });
    };

    BackofficeController.prototype.ignoreUser = function(req, res, next) {
        if (req.user.accessLevel() > 1) return next(new HTTPError(401, "You do not have permission to do this"));
        var ignore = (req.body.ignore !== undefined) ? req.body.ignore : true;
        req.targetUser.ignore(ignore);
        var self = this;
        req.targetUser.save(function(err) {
            if (err) return next(err);
            res.status(202).send();
            return self.getIgnoredUsers();
        });
    };

    BackofficeController.prototype.disableUser = function(req, res, next) {
        if (req.user.accessLevel() > 1) return next(new HTTPError(401, "You do not have permission to do this"));
        var disable = (req.body.disable !== undefined) ? req.body.disable : true;
        req.targetUser.disable(disable);
        req.targetUser.save(function(err) {
            if (err) return next(err);
            return res.status(202).send();
        });
    };

    BackofficeController.prototype.changeWithdraw = function(req, res, next) {
        if (req.user.accessLevel() > 1) return next(new HTTPError(401, "You do not have permission to do this"));
        var currency = req.body.currency;
        var address = req.body.address;
        req.targetUser.wallet(currency, function(err, wallet) {
            if (err) return next(err);
            if (!wallet) return next(new HTTPError(400, "User has no %s wallet", currency));
            var wc = new WalletController(currency);
            wc.checkAddress(address, function(err) {
                if (err) return next(err);
                wallet.withdrawAddress(address);
                wallet.save(function(err) {
                    if (err) return next(err);
                    return res.status(202).send();
                });
            });
        });
    };

    BackofficeController.prototype.changePassword = function(req, res, next) {
        if (req.user.accessLevel() > 1) return next(new HTTPError(401, "You do not have permission to do this"));
        var password = req.body.password;
        auth.hashPassword(password, function(err, hash) {
            req.targetUser.password(hash);
            req.targetUser.save(function(err) {
                if (err) return next(err);
                return res.status(202).send();
            });
        });
    };

    BackofficeController.prototype.creditDebitUser = function(req, res, next) {
        var adminUser = req.user;
        var action = req.params.action;
        if (['credit', 'debit'].indexOf(action) < 0) return next(new HTTPError(400, "Invalid transaction action"));
        if (adminUser.accessLevel() > 0) return next(new HTTPError(401, "You do not have permission to do this"));
        var reason = req.body.reason || 'adjustment';
        if ((/ /g).test(reason)) return next (new HTTPError(400, "reason must not contain spaces"));
        var now = new Date();
        var currency = req.body.currency;
        if (!CURRENCY_REGEXP.test(currency)) return next (new HTTPError(400, "invalid currency"));
        var amount = parseInt(req.body.amount, 10);
        if (isNaN(amount)) return next(new HTTPError(400, "invalid amount"));
        var memo = req.body.memo;
        if (!memo || 'string' !== typeof memo) return next(new HTTPError(400, "invalid memo"));
        if (memo.length < 10) return next(new HTTPError(400, "insufficient memo"));
        User.find(req.body.userId, function(err, user) {
            if (err) return next(new HTTPError(err));
            user.wallet(currency, function(err, wallet) {
                if (err) return next(err);
                var refId = format("%s:%s:%s:%s:%s",
                                   adminUser.username(),
                                   user.username().replace(' ', '_'),
                                   reason,
                                   currency,
                                   now.getTime());
                wallet[action]({
                    amount: amount,
                    refId: refId,
                    type: 'admin:' + reason,
                    meta: {
                        admin: adminUser.username(),
                        user: user.username(),
                        memo: memo
                    }
                }, function(err, transaction) {
                    if (err) return next(err);
                    return res.json(transaction);
                });
            });
        });
    };

    BackofficeController.prototype.sendCashout = function(req, res, next) {
        var adminUser = req.user;
        if (adminUser.accessLevel() > 0) return next(new HTTPError(401, "You do not have permission to do this"));
        var action = req.params.action || 'send';
        var txid = mongo.ensureObjectId(req.params.txid);
        if (txid === null) return next(new HTTPError(400, "Invalid transaction id"));
        async.waterfall([
            function getTheCashoutRequest(done) {
                CashoutRequest.get(txid, function(err, cr) {
                    if (err) return done(new HTTPError(err));
                    if (!cr) return done(new HTTPError(404, "Transaction %s not found", req.params.txid));
                    return done(undefined, cr);
                });
            },
            function getUser(cr, done) {
                User.get(cr.userId(), function(err, user) {
                    return done(err, cr, user);
                });
            },
            function getWallet(cr, user, done) {
                user.wallet(cr.currency(), function(err, wallet) {
                    return done(err, cr, user, wallet);
                });
            },
            function sendOrCancel(cr, user, wallet, done) {
                if (action === 'cancel') return cr.cancel(done);
                if (action === 'seize') return cr.seize(done);
                if (action !== 'send') return done(undefined, cr);
                wallet.processCashoutRequest(cr, user, adminUser, done);
            }
        ], function(err, cr, transaction) {
            if (err) return next(err);
            if (transaction) User.get(cr.userId(), function(err, user) {
                if (err) return logger.error("error getting user for CR processing");
                io.playerEmit(user.primary(), 'user update', user.filter());
                io.playerEmit(user.primary(), 'balance update', {
                    currency: transaction.currency(),
                    balance: transaction.balance(),
                    availableBalance: transaction.availableBalance()
                });
            });
            return res.send();
        });
    };

    BackofficeController.prototype.payCashback = function(req, res, next) {
        var adminUser = req.user;
        if (adminUser.accessLevel() > 0) return next(new HTTPError(401, "You do not have permission to do this"));
        var cashbackId = mongo.ensureObjectId(req.params.cashbackId);
        if (cashbackId === null) return next(new HTTPError(400, "Invalid cashnack id"));
        var fork = ChildProcess.fork(__dirname + '/../bin/pay-cashbacks', [
            // '-v',
            '--id', cashbackId.toHexString()
        ]);
        fork.on('exit', function() {
            return res.send();
        });
    };

    BackofficeController.prototype.sendCrypto = function(req, res, next) {
        var adminUser = req.user;
        if (adminUser.accessLevel() > 0) return next(new HTTPError(401, "You do not have permission to do this"));
        var type = req.body.reason || 'coldstorage';
        var currency = req.body.currency;
        if (!CURRENCY_REGEXP.test(currency)) return next(new HTTPError(400, "Invalid currency"));
        var amount = parseInt(req.body.amount, 10);
        if (isNaN(amount)) return next(new HTTPError(400, "(Backoffice) Invalid send crypto amount"));
        var message = req.body.memo;
        var toAddress = req.body.address;
        var adminTx = new AdminTransaction({
            admin: req.user.username(),
            adminId: req.user.primary(),
            type: type,
            currency: currency,
            amount: amount,
            message: message || amount.toBitcoin() + " " + currency + " to " + toAddress + " (" + type + ")",
            to: toAddress
        });
        var coind = cryptod(currency);
        async.waterfall([
            function(done) {
                coind.validateAddress(toAddress, function(err, data) {
                    if (err) return done(err);
                    if (!data.isvalid) return done(new Error("invalid " + currency + " address"));
                    return done();
                });
            },
            function(done) {
                var outputs = {};
                outputs[toAddress] = amount;
                coind.prepare({
                    inputs: [],
                    outputs: outputs,
                    txfee: (0.0001).toSatoshi(),
                    forceEmptyInputs: true,
                    selectFrom: 'all',
                    minConf: 30
                }, done);
            },
            function promptAndSend(txid, rawTx, done) {
                logger.info("Sending %s to %s (txid %s)", amount.toBitcoinString(), toAddress, txid);
                coind.send(rawTx.signedTx, function(err) {
                    if (err) return done(err);
                    logger.info("Sent %s", txid);
                    adminTx.refId(txid);
                    adminTx.save(done);
                });
            }
        ], function(err){
            if (err) return next(new HTTPError(err));
            res.send();
        });
    };

    BackofficeController.prototype.cashoutUser = function(req, res, next) {
        if (!req.body.currency) return next(new HTTPError(400, "Missing currency"));
        if (!CURRENCY_REGEXP.test(req.body.currency)) return next(new HTTPError(400, "Invalid currency"));
        var currency = req.body.currency;
        req.targetUser.wallet(currency, function(err, wallet) {
            if (err) return next(new HTTPError(err));
            if (!wallet) return next(new HTTPError(404, "No %s wallet found for %s", currency, req.targetUser.primary()));
            var amount = req.body.amount || wallet.availableBalance();
            if (isNaN(amount)) return next(new HTTPError(400, "(Backoffice) Invalid cashout user amount"));
            logger.info("admin initiating %d %s withdraw for %s", amount.toBitcoin(), currency, req.targetUser.primary());
            if (req.targetUser.locked) {
                return next(new HTTPError(423, "Account locked"));
            }
            // lock the user and save
            req.targetUser.setLock('withdraw', function(err) {
                if(err) return next(err);
                wallet.withdraw(amount, req.targetUser, function(withdrawErr, transaction) {
                    req.targetUser.unlock(function(unlockErr) {
                        if (unlockErr) {
                            logger.error('error unlocking %s after withdraw', req.user.primary());
                        }
                        if (withdrawErr) return next(withdrawErr);
                        io.playerEmit(req.targetUser.primary(), 'withdraw', req.targetUser.filter(), transaction.filter());
                        return res.json(transaction.filter());
                    });
                });
            });
        });
    };

    BackofficeController.prototype.giveBonus = function(req, res, next) {
        var bonusType = req.body.type || 'match';
        var self = this;
        req.targetUser.wallet(req.body.currency || 'bitcoin', function(err, wallet) {
            if (err) return next(err);
            if (!wallet) return next(new HTTPError(400, "%s has no %s wallet", req.targetUser.primary(), req.body.currency));
            req.wallet = wallet;
            if      (bonusType === Bonus.TYPE_MATCH)    return self.giveMatchBonus(req, res, next);
            else if (bonusType === Bonus.TYPE_STRAIGHT) return self.giveStraightBonus(req, res, next);
            else return next(new HTTPError(400, "Invalid bonus type"));
        });
    };

    BackofficeController.prototype.giveMatchBonus = function(req, res, next) {
        var targetUser = req.targetUser;
        var bonus = new Bonus({
            userId: targetUser.primary(),
            offeredAt: new Date(),
            currency: 'bitcoin',
            rollover: parseInt(req.body.rollover, 10)
        });
        bonus.save(function(err) {
            if (err) return next(err);
            bonus.accept(function(err) {
                if (err) return next(err);
                return res.json(bonus);
            });
        });
    };

    BackofficeController.prototype.giveStraightBonus = function(req, res, next) {
        var targetUser = req.targetUser;
        var amount = parseInt(req.body.amount);
        var currency = req.body.currency;
        if (!currency || !CURRENCY_REGEXP.test(currency)) return next(new HTTPError(400, "Invalid currency"));
        if (isNaN(amount)) return next(new HTTPError(400, "(Backoffice) Invalid straight bonus amount"));
        var bonus = new Bonus({
            userId: targetUser.primary(),
            type: Bonus.TYPE_STRAIGHT,
            offeredAt: new Date(),
            activatedAt: new Date(),
            rollover: parseInt(req.body.rollover, 10) || 38,
            initialValue: amount,
            value: amount,
            maxValue: amount,
            currency: currency,
        });
        bonus.save(function(err) {
            if (err) return next(err);
            bonus.accept(req.wallet, function(err) {
                if (err) return next(err);
                return res.json(bonus);
            });
        });
    };

    var ALERT_INTERVALS = {};
    BackofficeController.prototype.addEmailAlertSchedule = function(alert) {
        var self = this;
        var collection;
        if      (alert.collection === 'logs')              collection = this.logCollection;
        else if (gameNames.indexOf(alert.collection) >= 0) collection = this.gamedb.collection(alert.collection);
        else                                               collection = this.userdb.collection(alert.collection);
        var runFunc = function(done) {
            var listQuery = new ListQuery({
                collection: collection,
                pageSize: 1000,
                url: alert.query
            });
            // do not grab ignored users for any email alerts
            if (alert.collection === 'user') {
                if (!listQuery.query._id) {
                    listQuery.query._id = {$nin: self.ignoredUsers};
                }
            } else {
                if (!listQuery.query.userId) {
                    listQuery.query.userId = {$nin: self.ignoredUsers};
                }
            }
            listQuery.getList(function(err) {
                if (err) return logger.error("Error getting list for email alert", err.message);
                var message = null;
                var subject = null;
                if (alert.condition === 'has results' && listQuery.total > 0) {
                    subject = alert.subject || 'Email alert triggered for ' + alert.name;
                    message = format(alert.message, JSON.stringify(listQuery.toJSON()));
                } else if (alert.condition === 'is empty' && listQuery === 0) {
                    subject = alert.subject || 'Email alert triggered for ' + alert.name;
                    message = format(alert.message, JSON.stringify(listQuery.toJSON()));
                }
                if (subject && message) {
                    mailer.sendBasic(alert.emails, subject, message, done);
                } else {
                    return done();
                }
            });
        };
        var interval = parseInt(alert.interval);
        if (/second/.test(alert.interval)) interval *= (1000);
        if (/minute/.test(alert.interval)) interval *= (60 * 1000);
        if (/hour/.test(alert.interval)) interval *= (60 * 60 * 1000);
        if (/day/.test(alert.interval)) interval *= (24 * 60 * 60 * 1000);
        ALERT_INTERVALS[alert._id] = setInterval(runFunc, interval, function(err) {
            if (err) return logger.error(err.message);
            logger.verbose("finished email alert check %s", alert.name);
        });
    };

    var ALERT_CONDITIONS = ['has results', 'is empty'];
    BackofficeController.prototype.saveEmailAlert = function(req, res, next) {
        var params = req.body;
        params.adminId = req.user.primary();
        if (!params.query) return next(new HTTPError(400, "Missing query"));
        if (!params.collection) return next(new HTTPError(400, "Missing collection"));
        if (!params.name) return next(new HTTPError(400, "Missing name"));
        params.interval = params.interval || '1 day';
        params.emails = params.emails || [req.user.email()];
        if (!Array.isArray(params.emails)) {
            params.emails = [params.emails];
        }
        if (ALERT_CONDITIONS.indexOf(params.condition) < 0) return next(new HTTPError(400, "Invalid condition"));
        var self = this;
        this.userdb.collection('email_alerts').insert(params, function(err, docs) {
            if (err) return next(new HTTPError(err));
            var alert = docs[0];
            self.addEmailAlertSchedule(alert);
            return res.json(alert);
        });
    };

    BackofficeController.prototype.updateEmailAlert = function(req, res, next) {
        var alertId = mongo.ensureObjectId(req.params.alertId);
        if (alertId === null) return next(new HTTPError(400, "Invalid alert id"));
        var params = req.body;
        params.adminId = req.user.primary();
        params.interval = params.interval || '1 day';
        params.emails = params.emails || [req.user.email()];
        if (!Array.isArray(params.emails)) {
            params.emails = [params.emails];
        }
        if (params.condition && ALERT_CONDITIONS.indexOf(params.condition) < 0)
            return next(new HTTPError(400, "Invalid condition"));
        var self = this;
        delete params._id;
        this.userdb.collection('email_alerts').update({
            _id: alertId
        }, {
            $set: params
        }, function(err) {
            if (err) return next(new HTTPError(err));
            params._id = alertId;
            clearInterval(ALERT_INTERVALS[params._id]);
            self.addEmailAlertSchedule(params);
            return res.send();
        });
    };

    BackofficeController.prototype.readEmailAlert = function(req, res, next) {
        var alertId = mongo.ensureObjectId(req.params.alertId);
        var collection = this.userdb.collection('email_alerts');
        if (alertId === null) {
            collection.find({adminId: req.user.primary()}).toArray(function(err, alerts) {
                if (err) return next(new HTTPError(err));
                res.json(alerts);
            });
        } else {
            collection.findOne({_id: alertId}, function(err, alert) {
                if (err) return next(new HTTPError(err));
                res.json(alert);
            });
        }
    };

    BackofficeController.prototype.removeEmailAlert = function(req, res, next) {
        var alertId = mongo.ensureObjectId(req.params.alertId);
        this.userdb.collection('email_alerts').remove({_id: alertId}, function(err) {
            if (err) return next(new HTTPError(err));
            clearInterval(ALERT_INTERVALS[alertId]);
            return res.send();
        });
    };

    // send email to admin users, by default only send to level 0 admins (the highest)
    BackofficeController.prototype.emailAdmins = function(subject, message, level, cb) {
        if (cb === undefined && 'function' === typeof level) {
            cb = level;
            level = 0;
        }
        AdminUser.all({accessLevel: level, email: {$exists: true}}, function(err, admins) {
            if (err) return cb(new HTTPError(err));
            var emails = admins.map(function(admin) { return admin.email(); });
            return mailer.sendBasic(emails, subject, message, cb);
        });
    };

    BackofficeController.prototype.searchConfig = function(req, res, next) {
        Config.search(req.query.search, function(err, configs) {
            if(err) return next(new HTTPError(err));
            if(!configs || configs.length === 0) return next(new HTTPError(404, 'config not found'));
            res.json(configs);
        });
    };

    BackofficeController.prototype.getConfig = function(req, res, next) {
        Config.get(req.params.confId, function(err, config) {
            if(err) return next(new HTTPError(err));
            if(!config) return next(new HTTPError(404, 'config not found'));
            res.json(config);
        });
    };

    BackofficeController.prototype.updateConfig = function(req, res, next) {
        Config.set(req.params.confId, req.body.value, function(err) {
            if (err) return next(new HTTPError(err));
            res.json();
        });
    };

    BackofficeController.prototype.saveSearch = function(req, res, next) {
        var params = req.body;
        params.query = params.query.replace(/^\//, '');
        params.adminId = req.user.primary();
        params.admin = req.user.username();
        var search = new SavedSearch(params);
        search.save(function(err) {
            if (err) return next(new HTTPError(err));
            return res.send();
        });
    };

    BackofficeController.prototype.updateSearch = function(req, res, next) {
        var params = req.body;
        SavedSearch.get(req.params.searchId, function(err, search) {
            if (err) return next(err);
            if (!search) return next(new HTTPError("Cannot find search %s", req.params.searchId));
            search.set(params);
            search.save(function(err) {
                if (err) return next(new HTTPError(err));
                return res.send();
            });
        });
    };

    BackofficeController.prototype.deleteSearch = function(req, res, next) {
        SavedSearch.get(req.params.searchId, function(err, search) {
            if (err) return next(err);
            if (!search) return next(new HTTPError("Cannot find search %s", req.params.searchId));
            search.remove(function(err) {
                if (err) return next(new HTTPError(err));
                return res.send();
            });
        });
    };

    BackofficeController.prototype.sendNotification = function(req, res, next) {
        var userIds = req.body.userIds;
        var subject = req.body.subject;
        var message = req.body.message;
        var sendEmail = req.body.sendEmail ? 'backoffice_email' : false;
        var notificationController = new NotificationController();
        async.each(userIds, function(userId, done){
            notificationController.create(mongo.ObjectId(userId), {
                subject: subject,
                message: message,
                sendEmail: sendEmail,
                emailOptions: {subject: subject, message: message}
            }, function(err){
                if(err) return done(new HTTPError(500, 'error creating notification for user ' + userId));
                done();
            });
        }, function(err){
            if(err) return next(err);
            res.status(201).end();
        });
    };

    BackofficeController.prototype.processVipChange = function(req, res, next) {
        var action = req.params.action;
        if (action === 'upgrade' && req.targetUser.pendingVipLevel()) {
            logger.info('processing VIP upgrade for %s', req.targetUser.primary());
            req.targetUser.vipLevel(req.targetUser.pendingVipLevel());
            req.targetUser.unset('pendingVipLevel');
        } else if (action === 'cancel') {
            logger.info('canceling VIP upgrade for %s', req.targetUser.primary());
            // -1 for pending value indicates the user
            // will be considered when they reach vipLevel + 2
            req.targetUser.pendingVipLevel(-1);
        } else if (action === 'unblock'){
            // unblock simply unsets the pending level
            logger.info('unblocking VIP upgrades for %s', req.targetUser.primary());
            req.targetUser.unset('pendingVipLevel');
        } else if (action === 'block'){
            logger.info('blocking VIP upgrades for %s', req.targetUser.primary());
            // -2 for pending value indicates the suer
            // is blocked from all future VIP upgrades
            req.targetUser.pendingVipLevel(-2);
        } else return next(new HTTPError(400, 'invalid action'));
        req.targetUser.save(function(err) {
            if (err) return next(err);
            return res.status(202).send();
        });
    };

    BackofficeController.prototype.allowVipAdvancement = function(req, res, next) {
        req.targetUser.unset('pendingVipLevel');
        req.targetUser.save(function(err) {
            if (err) return next(err);
            return res.status(202).send();
        });
    };

    BackofficeController.prototype.changeVipLevel = function(req, res, next) {
        var newLevel = parseInt(req.body.level, 10);
        if (isNaN(newLevel)) return next(new HTTPError(400, "Invalid level"));
        req.targetUser.vipLevel(newLevel);
        req.targetUser.save(function(err) {
            if (err) return next(err);
            return res.status(202).send();
        });
    };

    BackofficeController.prototype.changeCashoutLimits = function(req, res, next) {
        var old = req.targetUser.cashoutLimits() || {};
        var newTotal = parseInt(req.body.total, 10);
        var newCount = parseInt(req.body.count, 10);
        if (isNaN(newTotal)) return next(new HTTPError(400, "Invalid total"));
        if (isNaN(newCount)) return next(new HTTPError(400, "Invalid count"));
        old.total = newTotal;
        old.count = newCount;
        req.targetUser.cashoutLimits(old);
        req.targetUser.save(function(err) {
            if (err) return next(new HTTPError(err));
            return res.send();
        });
    };

    return BackofficeController;
};
