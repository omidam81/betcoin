'use strict';

var timestamps = require('modella-timestamps');

var async = require('async');
var util = require('util');
var format = util.format;

module.exports = function(BaseModel, userModelStore,
                          cryptod, Transaction,
                          Bonus, logger, Config,
                          HTTPError, CURRENCY_REGEXP,
                          HubspotApi, CashoutRequest,
                          getExchangeRate) {
    var Wallet = BaseModel('wallet')
        .attr('userId', {type: userModelStore.ObjectId, required: true, filtered: true})
        .attr('currency', {required: true, format: CURRENCY_REGEXP})
        .attr('balance', {defaultValue: 0, type: 'number'})
        .attr('availableBalance', {defaultValue: 0, type: 'number'})
        .attr('depositAddress', {type: 'string', unique: true})
        .attr('withdrawAddress', {type: 'string', unique: true})
        .attr('withdrawBackup', {type: 'string', unique: true})
        .attr('lastWithdrawAt', {type: Date})
        .attr('lastDepositAt', {type: Date})
        .attr('verifiedAt', {type: Date});

    Wallet.use(userModelStore);
    Wallet.use(timestamps);


    //define hubspot API
    var hubspotApi  = new HubspotApi();

    Object.defineProperty(Wallet.prototype, 'verified', {
        get: function() {
            return this.has('verifiedAt');
        },
        set: function(set) {
            if (set)
                this.verifiedAt(util.isDate(set) ? set : new Date());
        }
    });

    // when saving the wallet, assign a deposit address if there is
    // none already
    Wallet.on('saving', function(wallet, cb) {
        if (!wallet.has('depositAddress')) {
            cryptod(wallet.currency()).getNewAddress('users', function(err, address) {
                if (err) return cb(new HTTPError(err.code || 500, err.message));
                wallet.depositAddress(address);
                cb();
            });
        } else {
            cb();
        }
    });

    Wallet.prototype._updateBalance = function(amount, availableAmount, cb) {
        if (cb === undefined && 'function' === typeof availableAmount) {
            cb = availableAmount;
            availableAmount = amount;
        }
        var now = new Date();
        this.updatedAt(now);
        this.balance(this.balance() + amount);
        this.availableBalance(this.availableBalance() + availableAmount);
        var self = this;
        Wallet.db.update({_id: this.primary()}, {
            $inc: {
                'balance': amount,
                'availableBalance': availableAmount
            },
            $set: {
                updatedAt: now
            }
        }, function(err) {
            if (err) return cb(new HTTPError(err.code, err.message));
            logger.info("%s new %s balance: %d available: %d",
                        self.userId(),
                        self.currency(),
                        self.balance().toBitcoin(),
                        self.availableBalance().toBitcoin());
            return cb();
        });
    };

    // bound to a new transaction object
    var saveTheTransaction = function(done) {
        return done(undefined, this);
    };

    // bound to the wallet
    var getTheBonuses = function(transaction, done) {
        logger.verbose("getting %s bonuses for %s", transaction.currency(), transaction.userId());
        Bonus.getActive(this.userId(), this.currency(), function(err, bonuses) {
            if (err) return done(err);
            logger.verbose("got %d %s bonuses for %s", bonuses.length, transaction.currency(), transaction.userId());
            return done(err, transaction, bonuses);
        });
    };

    // bound to the wallet
    var adjustDebitForBonuses = function(transaction, bonuses, done) {
        var amountLeft = transaction.debit();
        transaction.availableAmount = 0;
        transaction.amount = 0;
        async.eachSeries(bonuses, function iterateBonus(bonus, fin) {
            if (amountLeft <= 0) return fin();
            bonus.debit(amountLeft, transaction.meta(), function bonusDebited(err) {
                var amountUsed = 0;
                if (err) {
                    // 422 error means the bonus can't be
                    // debited or credited. This should not
                    // happen, but it is not a fatal error if
                    // it does, just g on to the next bonus
                    if (err.code === 422) {
                        logger.error(err.message);
                        return fin();
                    } else return fin(err);
                } else if (bonus.exhausted) {
                    logger.info("user %s exhausted a %s bonus", transaction.userId(), transaction.currency());
                    // if the debit action exhausted the
                    // bonus, use the final value to change
                    // the amountLeft for the next bonus in
                    // line, if any. The final value will be 0
                    // or negative if the bonus is exhausted
                    amountUsed = amountLeft + bonus.value();
                    amountLeft -= amountUsed;
                } else if (bonus.unlocked) {
                    // if they unlocked their bonus, increment their
                    // available balance by the value of the bonus and
                    // then stop processing bonuses. If this was a
                    // welcome bonus, cap the bonus amount by the
                    // original amout given
                    if (bonus.meta().welcome) {
                        transaction.availableAmount += Math.min(bonus.value(), bonus.initialValue());
                        transaction.amount = -1 * (bonus.value() - transaction.availableAmount);
                        // create a transaction for the database here so
                        // we will have a reconciled balance when they go
                        // to cash out. gotta balance the books
                        var offsetTx = new Transaction({
                            refId: 'offset:' + bonus.primary(),
                            userId: bonus.userId(),
                            currency: bonus.currency(),
                            debit: transaction.amount * -1, // *-1 again because these must be all positive ints
                            type: 'BONUS_UNLOCKED:bonus-adjust',
                            meta: {}
                        });
                        offsetTx.save(function(err) {
                            if (err)
                                return logger.error("Error saving offset transaction. " +
                                                    "This will result in a balance discrepency for %s",
                                                    bonus.userId());
                        });
                    } else {
                        // otherwise, just give them the value of the
                        // bonus. No need for a special transaction here
                        transaction.availableAmount += bonus.value();
                    }
                    amountLeft = 0;
                } else {
                    // if the bonus was not exhausted, then
                    // the full value of the wager has been
                    // placed into the bonus, so we do not
                    // process any more
                    amountLeft = 0;
                }
                fin();
            });
        }, function(err) {
            if (err) return done(err);
            logger.verbose("done processing %s bonuses for %s", transaction.currency(), transaction.userId());
            transaction.amount = transaction.amount + (-1 * transaction.debit());
            if (amountLeft > 0) {
                transaction.availableAmount -= amountLeft;
            }
            return done(undefined, transaction);
        });
    };

    // bound to wallet. By this point in the chain, the transaction
    // will have the amounts attached to it. These values will not be
    // shown when the transaction is serialized to JSON for the http
    // response
    var updateTheWalletBalance = function(transaction, done) {
        if (transaction.availableAmount === undefined) {
            if (transaction.credit()) transaction.availableAmount = transaction.credit();
            else if (transaction.debit()) transaction.availableAmount = (-1 * transaction.debit());
            else return done(undefined, transaction); // allow a 0 debit without hitting the db
        }
        if (transaction.amount === undefined) transaction.amount = transaction.availableAmount;
        logger.verbose("updating %s wallet, amount: %d availableAmount: %d",
                       transaction.currency(),
                       transaction.amount.toBitcoin(),
                       transaction.availableAmount.toBitcoin());
        logger.verbose("saving %s %s transaction %s", transaction.currency(), transaction.type(), transaction.refId());
        var self = this;
        transaction.balance(this.balance() + transaction.amount);
        transaction.availableBalance(this.availableBalance() + transaction.availableAmount);
        if (transaction.amount !== transaction.availableAmount) {
            logger.verbose("flagging transaction as a bonus wager");
            var meta = transaction.meta();
            meta.bonus = true;
            transaction.meta(meta);
        }
        if (transaction.balance() < 0) {
            return done(new HTTPError(500, "Balance is below zero!"));
        }
        if (transaction.availableBalance() < 0) {
            return done(new HTTPError(500, "Available balance is below zero!"));
        }
        transaction.save(function(err) {
            if (err) return done(err);
            logger.verbose("%s transaction %s saved", transaction.currency(), transaction.refId());
            self._updateBalance(transaction.amount, transaction.availableAmount, function(err) {
                if (err) return done(err);
                return done(undefined, transaction);
            });
        });
    };

    var updateCashoutRequests = function(transaction, done) {
        CashoutRequest.all({
            userId: this.userId(),
            status: CashoutRequest.STATUS_OPEN
        }, {
            sort: {createdAt: 1} //FIFO
        }, function(err, cashoutRequests) {
            if (err) return done(err);
            var balanceLeft = transaction.availableBalance();
            // while there is a balance left to withdraw against,
            // anthere are cashouts requested
            var safeguard = 0;
            while (balanceLeft > 0 && cashoutRequests.length && safeguard < 1000) {
                // see if the balance we have left will cover the
                // cashout request that is the oldest
                var cr = cashoutRequests[0];
                balanceLeft -= cr.amount();
                if (balanceLeft > 0) {
                    // pop this guy off
                    // then we go around again
                    cashoutRequests.shift();
                }
                safeguard += 1;
            }
            // now, whatever is left in the array has been
            // canceled, since there is no more balance to
            // withdraw against
            async.each(cashoutRequests, function(cr, done) {
                cr.cancel(done);
            }, function(err) {
                return done(err, transaction);
            });
        });
    };

    Wallet.prototype.debit = function(params, cb) {
        var amount = parseInt(params.amount, 10);
        if (isNaN(amount)) return cb(new HTTPError(400, "Invalid debit amount"));
        var refId = params.refId;
        var type = params.type;
        var meta = params.meta || {};
        amount = Math.abs(amount); // the amount should be positive, it is negative at the end
        if (amount > this.balance()) return cb(new HTTPError(417, "Low balance"));
        var transaction = new Transaction({
            refId: refId,
            userId: this.userId(),
            currency: this.currency(),
            debit: amount,
            type: type,
            meta: meta
        });
        var waterfall = [
            saveTheTransaction.bind(transaction)
        ];
        // if this is a wager, adjust for bonuses (or a bonus adjusting transaction)
        if (Transaction.TYPE_REGEXP_WAGER.test(type) || Transaction.TYPE_REGEXP_BONUS_ADJUST.test(type)) {
            waterfall.push(getTheBonuses.bind(this));
            waterfall.push(adjustDebitForBonuses.bind(this));
        }
        waterfall.push(updateTheWalletBalance.bind(this));
        waterfall.push(updateCashoutRequests.bind(this));
        async.waterfall(waterfall, function(err, transaction) {
            return cb(err, transaction);
        });
    };

    var handleFirstTimeDeposit = function(transaction, done) {
        var self = this;
        Bonus.all({
            userId: this.userId(),
            currency: this.currency()
        }, {
            sort: {offeredAt: 1}
        }, function(err, bonuses) {
            if (err) return done(new HTTPError(err));
            if (!bonuses.length) return done(undefined, transaction);
            var nextMatchFound = false;
            async.eachSeries(bonuses, function(bonus, next) {
                if (bonus.active) {
                    bonus.cancel(self, next);
                } else if (!nextMatchFound &&
                           bonus.type() === Bonus.TYPE_MATCH &&
                           !bonus.accepted) {
                    nextMatchFound = true;
                    bonus.accept(next);
                } else {
                    return next();
                }
            }, function(err) {
                return done(err, transaction);
            });
        });
    };

    // bound to the wallet for a deposit
    var checkBonusActivation = function(transaction, done) {
        // get the most recent bonus for the player that has
        // been accepted
        logger.verbose("looking for bonuses for %s", transaction.userId());
        Bonus.get({
            userId: this.userId(),
            acceptedAt: {$exists: true},
            rejectedAt: {$exists: false},
            canceledAt: {$exists: false},
            exhaustedAt: {$exists: false},
            unlockedAt: {$exists: false},
            currency: this.currency(),
            type: Bonus.TYPE_MATCH
        }, {
            sort: {offeredAt: 1}
        }, function gotBonuses(err, bonus) {
            if (err) return done(new HTTPError(err.code, err.message));
            if (!bonus) return done(undefined, transaction);
            Config.get(transaction.currency() + 'MaxMatchBonus', function(err, maxBonus) {
                if (err) maxBonus = (3.8).toSatoshi();
                if (!bonus.maxValue()) bonus.maxValue(maxBonus);
                var initialValue = bonus.value();
                bonus.activate(transaction.credit(), transaction.currency(), function bonusActivated(err) {
                    if (err && err !== 'pass') return done(err);
                    var actionString = "activated";
                    if (bonus.initialValue() !== transaction.credit()) {
                        actionString = "updated";
                    }
                    if (err !== 'pass') logger.info("%s %s a %s bonus for %d",
                                                    transaction.userId(),
                                                    actionString,
                                                    transaction.currency(),
                                                    transaction.credit().toBitcoin());
                    var bonusCredit = bonus.value() - initialValue;
                    var bonusTransaction = new Transaction({
                        refId: bonus.primary() + ":" + new Date().getTime() + ":bonus",
                        userId: transaction.userId(),
                        currency: transaction.currency(),
                        credit: bonusCredit,
                        type: Transaction.TYPE_BONUS
                    });
                    bonusTransaction.save(function(err) {
                        if (err) {
                            logger.error(bonusTransaction.errors.join(", "));
                            return done(new HTTPError(err.code, err.message));
                        }
                        transaction.amount = transaction.credit() + bonusCredit;
                        return done(undefined, transaction);
                    });
                });
            });
        });
    };

    // bound to the wallet for a wager credit
    var adjustCreditForBonuses = function(transaction, bonuses, done) {
        transaction.amount = transaction.credit();
        if (bonuses.length) {
            transaction.availableAmount = 0;
            bonuses[0].credit(transaction.credit(), function(err, bonus) {
                if (err) return done(err);
                if (bonus.exhausted) {
                    // if the credit did not revive an endangered
                    // bonus, adjust the available amount down some
                    transaction.availableAmount = bonus.value();
                }
                return done(undefined, transaction);
            });
        } else {
            return done(undefined, transaction);
        }
    };

    Wallet.prototype.credit = function(params, cb) {
        var amount = parseInt(params.amount, 10);
        if (isNaN(amount)) return cb(new HTTPError(400, "Invalid credit amount"));
        var refId = params.refId;
        var type = params.type;
        var meta = params.meta || {};
        var transaction = new Transaction({
            refId: refId,
            userId: this.userId(),
            currency: this.currency(),
            credit: amount,
            type: type,
            meta: meta
        });
        var waterfall = [
            saveTheTransaction.bind(transaction)
        ];
        // if these are winnings, adjust for bonuses
        if (Transaction.TYPE_REGEXP_WINNINGS.test(type)) {
            logger.verbose("crediting %s %d %s", this.userId(), amount.toBitcoin(), this.currency());
            waterfall.push(getTheBonuses.bind(this));
            waterfall.push(adjustCreditForBonuses.bind(this));
        }
        // if this is a deposit, check for pending bonuses
        if (type === Transaction.TYPE_DEPOSIT) {
            logger.verbose("deposit detected, checking for active bonuses");
            if (!this.has('lastDepositAt')) {
                logger.info("!!FIRST TIME %s DEPOSIT INCOMING!!", this.currency().toUpperCase());
                waterfall.push(handleFirstTimeDeposit.bind(this));
            }
            waterfall.push(checkBonusActivation.bind(this));
        }
        // if this is a bonus credit, meaning the acceptance of a
        // straight bonus, then we do not credit the available
        // amount at all, just the total balance
        if (type === Transaction.TYPE_BONUS) {
            transaction.amount = amount;
            transaction.availableAmount = 0;
        }
        waterfall.push(updateTheWalletBalance.bind(this));
        var self = this;
        async.waterfall(waterfall, function(err, transaction) {
            if (err) return cb(err);
            logger.verbose("finished %s credit for %s", transaction.currency(), transaction.userId());
            if (type === Transaction.TYPE_DEPOSIT) {
                self.lastDepositAt(new Date());
                self.save(function(err) {
                    if (err) logger.error("Error saving last deposit timestamp: %s", err.message);
                    hubspotApi.addContact(self.userId(), function(user) {
                        if (user.email()) {
                            return 10;
                        } else {
                            return false; // do not process user addition
                        }
                    }, function(err) {
                        if (err) return logger.error(err, {});
                    });
                    return cb(undefined, transaction);
                });
            } else {
                return cb(undefined, transaction);
            }
        });
    };

    /**
     * Withdraw helper functions
     *
     * use Function.bind() in the main withdraw function to have
     * `this` point to the wallet being withdrawn from
     *
     * if/when these are exposed for outside use (they probably don't
     * need to be) they can be added to the prototype, and the bind
     * will become unecessary
     */

    /**
     * getLastWithdraw()
     *
     * Get the last withdraw for this wallet. This will be used as the
     * reference for validating the user's available balance
     *
     * @param {} cb
     */
    var getLastWithdraw = function(cb) {
        logger.verbose("getting last %s withdraw for %s", this.currency(), this.userId());
        Transaction.get({
            userId: this.userId(),
            currency: this.currency(),
            type: Transaction.TYPE_WITHDRAW
        }, {
            sort: {'createdAt': -1},
            fields: {'createdAt': 1}
        }, function(err, transaction) {
            if (err) return cb(new HTTPError(err.code, err.message));
            if (!transaction) return cb(undefined, false);
            return cb(undefined, transaction.createdAt());
        });
    };

    /**
     * getAuditTrail()
     *
     * Get all the user's transactions since their last withdraw to validate all balances
     *
     * @param {} since
     * @param {} cb
     */
    var getAuditTrail = function(since, cb) {
        var query = {
            userId: this.userId(),
            currency: this.currency()
        };
        if (since && util.isDate(since)) {
            query.createdAt = {$gte: since};
        }
        logger.verbose("getting %s audit trail for %s", this.currency(), this.userId());
        Transaction.all(query, {
            sort: {createdAt: 1}
        }, cb);
    };

    /**
     * Wallet#balanceIsValid()
     *
     * use the audit trail to validate that the wallet balance matched all
     * the transactions
     *
     * @param {Array} auditTrail All of the user's transactions since
     * their last withdraw (or all time if they have never
     * withdrawn)
     *
     * @returns {Boolean} True or false if the balance is valid with
     * respect to the transactions in the database
     */
    Wallet.prototype.balanceIsValid = function balanceIsValid(auditTrail) {
        var totalIn = 0;
        var totalOut = 0;
        var totalDeposited = 0;
        var totalWithdrawn = 0;
        var deposits = [];
        var withdraws = [];
        var lastBalance = 0;
        if (auditTrail[0].type() !== Transaction.TYPE_WITHDRAW) {
            logger.info('never withdrawn, using all transaction history (%d items)', auditTrail.length);
        } else {
            var lastWithdraw = auditTrail.shift();
            if (lastWithdraw.meta().balance) {
                lastBalance = lastWithdraw.meta().balance;
            }
            if (this.lastWithdrawAt()) {
                logger.info('using %d transactions since %s', auditTrail.length, this.lastWithdrawAt().toISOString());
            }
            if (!isNaN(lastBalance)) {
                logger.info('balance after last withdraw: %d', lastBalance.toBitcoin());
            }
        }
        auditTrail.forEach(function(tx) {
            var credit = tx.credit();
            var debit = tx.debit();
            if (isNaN(credit) || isNaN(debit)) {
                return logger.warn('found a tx with NaN for amount! %s', tx._id.toHexString());
            }
            totalIn += credit;
            totalOut += debit;
            if (tx.type() === Transaction.TYPE_DEPOSIT) {
                totalDeposited += credit;
                deposits.push(tx);
            } else if (tx.type === Transaction.TYPE_WITHDRAW) {
                totalWithdrawn += credit;
                withdraws.push(tx);
            }
        });
        var totalProfit = (totalIn - totalOut) - (totalDeposited - totalWithdrawn);
        var expectedBalance = (lastBalance + totalIn) - totalOut;
        logger.info('%d deposited (%d deposits)', totalDeposited.toBitcoin(), deposits.length);
        logger.info('%d withdrawn (%d withdraws) <- this should be 0', totalWithdrawn.toBitcoin(), withdraws.length);
        logger.info('totalIn          : %d', totalIn.toBitcoin());
        logger.info('totalOut         : %d', totalOut.toBitcoin());
        logger.info('totalProfit      : %d', totalProfit.toBitcoin());
        logger.info('expected balance : %d', expectedBalance.toBitcoin());
        logger.info('db balance       : %d', this.balance().toBitcoin());
        if (this.balance() !== expectedBalance) {
            return false;
        } else {
            return true;
        }
    };

    /**
     * checkThatTheBalanceIsValid()
     *
     * @param {} auditTrail
     * @param {} cb
     */
    var checkThatTheBalanceIsValid = function(auditTrail, cb) {
        if (!this.balanceIsValid(auditTrail)) {
            return cb(new HTTPError(500, "Balance discrepency"));
        }
        return cb(undefined, auditTrail);
    };

    /**
     * checkDepositOutputs()
     *
     * Make sure all the user's deposit outputs have at least one
     * confirmation.
     *
     * @param {} deposits
     * @param {} cb
     */
    var checkDepositOutputs = function(auditTrail, cb) {
        var self = this;
        // extract deposit transactions from the audit trail
        var deposits = auditTrail.filter(function(tx) {
            return tx.type() === Transaction.TYPE_DEPOSIT;
        });
        // get the number of confirmations needed for all deposits
        // before a withdraw can happen
        Config.get(this.currency() + 'Confirmations', function(err, confirmationConf) {
            if (err) return cb(err);
            logger.verbose("checking %d %s deposits for %s", deposits.length, self.currency(), self.userId());
            // loop throgh each deposit tx they have in the audit trail
            async.eachLimit(deposits, 2, function(deposit, done) {
                // get info about the transaction
                self.coind.getTransaction(deposit.meta().txid, function(err, tx) {
                    if (err) return done(new HTTPError(500, 'withdraw error: ' + err.message));
                    // see if the transaction has enough
                    // confirmations, if not, error out of the async
                    // loop
                    if (tx.confirmations < confirmationConf.minconf) {
                        return done(new HTTPError(423,
                                                  "Not all deposits have been confirmed at least %d times",
                                                  confirmationConf.minconf));
                    }
                    return done();
                });
            }, cb); // end of async.eachLimit,
            // pass error back to whoever called this function
        });
    };



    /**
     * getdaysCashouts
     *
     * Get the total cashouts for the day, to see if we can auto
     * withdraw
     *
     * @param {} cb
     */
    var getCashoutsForDay = function(cb) {
        var now = new Date();
        var since = new Date(now.getTime() - (now.getTime() % (24 * 60 * 60 * 1000)));
        var query = {
            currency: this.currency(),
            createdAt: {$gte: since},
            'meta.anonymous': {$exists: false},
            type: Transaction.TYPE_WITHDRAW
        };
        if (this.user.anonymous()) {
            query['meta.anonymous']  = {$exists: true};
        }
        logger.verbose("getting %s%s cashouts from today", this.user.anonymous() ? 'anonymous ' : '', this.currency());
        Transaction.all(query, {
            sort: {createdAt: 1}
        }, function(err, txs) {
            if (err) return cb(new HTTPError(err.code, err.message));
            var totals = {
                count: txs.length,
                total: 0
            };
            txs.forEach(function(tx) {
                totals.total += tx.debit();
            });
            return cb(undefined, totals);
        });
    };

    var getUserCashoutsForDay = function(cb) {
        var now = new Date();
        var since = new Date(now.getTime() - (now.getTime() % (24 * 60 * 60 * 1000)));
        var query = {
            currency: this.currency(),
            createdAt: {$gte: since},
            userId: this.userId(),
            'meta.triggeredManual': {$ne: true},
            type: Transaction.TYPE_WITHDRAW
        };
        logger.verbose("getting %s cashouts from today for %s", this.currency(), this.userId());
        Transaction.all(query, {
            sort: {createdAt: 1}
        }, function(err, txs) {
            if (err) return cb(new HTTPError(err.code, err.message));
            var totals = {
                count: txs.length,
                total: 0
            };
            txs.forEach(function(tx) {
                totals.total += tx.debit();
            });
            return cb(undefined, totals);
        });
    };

    /**
     * seeIfWeShouldSendTheTransaction()
     *
     * @param {} txid
     * @param {} rawTx
     * @param {} cb
     */
    var seeIfWeShouldSendTheTransaction = function(cb) {
        // here we test to see if they should have ther money sent
        // right away, or reviewed before sending
        var self = this;
        // config key contains the currency
        logger.verbose("transaction prepared, checking if it should be sent");
        var userCashouts, systemCashouts;
        var systemLimits, userLimits;
        async.parallel([
            function getSystemLimits(done) {
                var keyStr = self.currency();
                if (self.user && self.user.anonymous()) keyStr += 'Anon';
                keyStr += 'CashoutLimits';
                Config.get(keyStr, function(err, cashoutLimits) {
                    if (err) return done(err);
                    logger.verbose("got cashout limits for %s", self.currency());
                    systemLimits = cashoutLimits;
                    return done();
                });
            },
            function getUserLimits(done) {
                Config.get(self.currency() + 'UserCashoutLimits', function(err, cashoutLimits) {
                    if (err) return done(err);
                    logger.verbose("got cashout limits for %s", self.currency());
                    userLimits = cashoutLimits;
                    var userRecordLimits = self.user.cashoutLimits();
                    if (userRecordLimits) {
                        userLimits = userRecordLimits;
                        userLimits.total = getExchangeRate.convert(userLimits.total, self.currency());
                    }
                    return done();
                });
            },
            function getSystemCashouts(done) {
                getCashoutsForDay.bind(self)(function(err, cashoutTotals) {
                    if (err) return done(err);
                    systemCashouts = cashoutTotals;
                    return done();
                });
            },
            function getUserCashouts(done) {
                getUserCashoutsForDay.bind(self)(function(err, cashoutTotals) {
                    if (err) return done(err);
                    userCashouts = cashoutTotals;
                    return done();
                });
            }
        ], function(err) {
            var shouldSend = true;
            if (err) {
                logger.error("error getting todays cashouts, setting to manual");
                shouldSend = false;
            }
            if (systemCashouts.count + 1 > systemLimits.count) {
                shouldSend = false;
                logger.warn("Auto cashout count exceeded");
            }
            logger.info("%d of %d %s system auto cashouts processed",
                        systemCashouts.count + 1,
                        systemLimits.count,
                        self.currency());

            if (systemCashouts.total + self.amount > systemLimits.total) {
                shouldSend = false;
                logger.warn("Auto cashout total exceeded");
            }
            logger.info("%d of %d %s system total auto cashouts processed",
                        (systemCashouts.total + self.amount).toBitcoin(),
                        systemLimits.total.toBitcoin(),
                        self.currency());

            if (userCashouts.count + 1 > userLimits.count) {
                shouldSend = false;
                logger.warn("User auto cashout count exceeded for %s", self.userId());
            }
            logger.info("%d of %d %s user auto cashouts processed for %s",
                        userCashouts.count + 1,
                        userLimits.count,
                        self.currency(),
                        self.userId());

            if (userCashouts.total + self.amount > userLimits.total) {
                shouldSend = false;
                logger.warn("User auto cashout total exceeded for %s", self.userId());
            }
            logger.info("%d of %d %s user total auto cashouts processed for %s",
                        (userCashouts.total + self.amount).toBitcoin(),
                        userLimits.total.toBitcoin(),
                        self.currency(),
                        self.userId());
            return cb(undefined, shouldSend);
        });
    };

    /**
     * sendTransaction()
     *
     * bound to a wallet instance
     *
     * @param {} cb
     */
    var sendTransaction = function(cb) {
        var self = this;
        logger.verbose("all outputs confirmed, preparing transaction");
        this.coind.prepare({
            inputs: [],
            selectFrom: 'all',
            outputs: this.outputs,
            forceEmptyInputs: true,
            minconf: 30
        }, function(err, txid, rawTx) {
            if (err) return cb(new HTTPError(err.code, err.message));
            var transaction = new Transaction({
                refId: txid + ":withdraw",
                userId: self.userId(),
                currency: self.currency(),
                debit: self.amount,
                type: Transaction.TYPE_WITHDRAW,
                balance: self.balance() - self.amount,
                availableBalance: self.availableBalance() - self.amount
            });
            var meta = {
                txid: txid,
                balance: self.balance() - self.amount,
                status: 'prepared',
                hex: rawTx.hex,
                locale: self.user.locale()
            };
            if (self.user.anonymous()) {
                meta.anonymous = true;
            }
            if (self.automatic) {
                meta.auto = true;
            }
            if (self.admin) {
                    meta.adminId = self.admin.primary();
                    meta.admin = self.admin.username();
                }
            transaction.meta(meta);
            transaction.save(function(err) {
                if (err) return cb(err);
                self._updateBalance((-1 * self.amount), function(err) {
                    if (err) return cb(err);
                    logger.verbose("sending %s tx %s", self.currency(), txid);
                    self.coind.send(rawTx.hex, function(err) {
                        if (err) return cb(err);
                        var meta = transaction.meta();
                        delete meta.hex;
                        meta.status = 'sent';
                        transaction.meta(meta);
                        return transaction.save(cb);
                    });
                });
            });
        });
    };

    /**
     * createCashoutRequest
     *
     * make a cashout request that will be processed by an admin or by
     * a scheduled script
     *
     * @param {} cb
     */
    var createCashoutRequest = function(cb) {
        var cr = new CashoutRequest({
            userId: this.userId(),
            currency: this.currency(),
            amount: this.amount,
            status: CashoutRequest.STATUS_OPEN,
            locale: this.user.locale()
        });
        cr.save(cb);
    };

    /**
     * Wallet#withdraw()
     *
     * @param {} amount
     * @param {} cb
     */
    Wallet.prototype.withdraw = function(amount, user, cb) {
        amount = parseInt(amount);
        if (!amount) return cb(new HTTPError(400, "Invalid withdraw amount"));
        if (!this.withdrawAddress) return cb(new HTTPError(412, "You must add a withdraw address to withdraw from this wallet"));
        var availableBalance = this.availableBalance();
        if (amount > availableBalance) {
            var errString = format("%s available for withdraw, %s requested",
                                   availableBalance.toBitcoinString(),
                                   amount.toBitcoinString());
            return cb(new HTTPError(412, errString));
        }
        logger.verbose("checking if greater than %d \"Satoshi\"", cryptod(this.currency()).MIN_OUTPUT_SIZE);
        if (amount < cryptod(this.currency()).MIN_OUTPUT_SIZE) {
            return cb(new HTTPError(400, "You cannot withdraw less than 5,460 Satoshi"));
        }
        var outputs = {};
        outputs[this.withdrawAddress()] = amount;
        // assign some stuff to `this` for access in the helper
        // functions

        //these functions are declared outside this function so we do
        // not have any memory issues by declaring the bulk of the
        // functions over and over

        // if there is a better way around this, I would encourage
        // changing it
        this.coind = cryptod(this.currency());
        this.amount = amount;
        this.outputs = outputs;
        this.user = user;
        logger.verbose("passed basic sanity checks");
        var self = this;
        async.waterfall([
            getLastWithdraw.bind(this),
            getAuditTrail.bind(this),
            checkThatTheBalanceIsValid.bind(this),
            checkDepositOutputs.bind(this),
            seeIfWeShouldSendTheTransaction.bind(this)
        ], function(err, shouldSend) {
            if (err) return cb(err);
            if (shouldSend) {
                self.automatic = true;
                return sendTransaction.bind(self)(cb);
            } else {
                return createCashoutRequest.bind(self)(cb);
            }
        });
    };

    Wallet.prototype.processCashoutRequest = function(cr, user, admin, cb) {
        if (cr.status() !== CashoutRequest.STATUS_OPEN) {
            return cb(new HTTPError(410, "This cashout request is no longer open"));
        }
        var amount = parseInt(cr.amount());
        if (!amount) return cb(new HTTPError(400, "Invalid withdraw amount"));
        if (!this.withdrawAddress)
            return cb(new HTTPError(412, "You must add a withdraw address to withdraw from this wallet"));
        var availableBalance = this.availableBalance();
        if (amount > availableBalance) {
            var errString = format("%s available for withdraw, %s requested",
                                   availableBalance.toBitcoinString(),
                                   amount.toBitcoinString());
            return cb(new HTTPError(412, errString));
        }
        logger.verbose("checking if greater than %d \"Satoshi\"", cryptod(this.currency()).MIN_OUTPUT_SIZE);
        if (amount < cryptod(this.currency()).MIN_OUTPUT_SIZE) {
            return cb(new HTTPError(400, "You cannot withdraw less than 5,460 Satoshi"));
        }
        var outputs = {};
        outputs[this.withdrawAddress()] = amount;
        // assign some stuff to `this` for access in the helper
        // functions

        //these functions are declared outside this function so we do
        // not have any memory issues by declaring the bulk of the
        // functions over and over

        // if there is a better way around this, I would encourage
        // changing it
        this.coind = cryptod(this.currency());
        this.amount = amount;
        this.outputs = outputs;
        this.user = user;
        this.admin = admin;
        logger.verbose("passed basic sanity checks");
        async.waterfall([
            getLastWithdraw.bind(this),
            getAuditTrail.bind(this),
            checkThatTheBalanceIsValid.bind(this),
            checkDepositOutputs.bind(this),
            sendTransaction.bind(this),
            updateCashoutRequests.bind(this)
        ], function(err, transaction) {
            if (err) return cb(err);
            cr.status(CashoutRequest.STATUS_SENT);
            cr.save(function(err) {
                return cb(err, cr, transaction);
            });
        });
    };

    return Wallet;
};
