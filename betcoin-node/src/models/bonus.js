'use strict';

var util = require('util');


module.exports = function(BaseModel, userModelStore, logger, HTTPError, CURRENCY_REGEXP) {

    var Bonus = BaseModel('bonus')
        .attr('userId', {type: userModelStore.ObjectId, required: true})
        .attr('currency', {format: CURRENCY_REGEXP})
        .attr('exhaustedAt', {type: Date})
        .attr('inDanger', {type: 'boolean', defaultValue: false})
        .attr('offeredAt', {type: Date, required: true})
        .attr('acceptedAt', {type: Date})
        .attr('unlockedAt', {type: Date})
        .attr('activatedAt', {type: Date})
        .attr('updatedAt', {type: Date})
        .attr('rejectedAt', {type: Date})
        .attr('canceledAt', {type: Date})
        .attr('value', {type: 'number', defaultValue: 0})
        .attr('wagered', {type: 'number', defaultValue: 0})
        .attr('maxValue', {type: 'number', defaultValue: (3.8).toSatoshi()})
        .attr('rollover', {type: 'number', defaultValue: 58})
        .attr('matchMultiplier', {type: 'number', defaultValue: 1})
        .attr('initialValue', {type: 'number', defaultValue: 0})
        .attr('meta', {type: 'object', defaultValue: {}});

    Bonus.use(userModelStore);

    Bonus.TYPE_MATCH = 'match';
    Bonus.TYPE_STRAIGHT = 'straight';

    Bonus.attr('type', {type: 'string', defaultValue: Bonus.TYPE_MATCH});

    // helper status methods
    ['accepted', 'unlocked', 'activated', 'rejected', 'canceled', 'exhausted'].forEach(function(status) {
        Object.defineProperty(Bonus.prototype, status, {
            get: function() {
                return this.has(status + 'At');
            },
            set: function(set) {
                if (set)
                    this[status + 'At'](util.isDate(set) ? set : new Date());
            }
        });
    });

    Object.defineProperty(Bonus.prototype, 'active', {
        get: function() {
            return this.accepted &&
                this.activated &&
                this.currency() &&
                (!this.unlocked) &&
                (!this.exhausted) &&
                (!this.rejected) &&
                (!this.canceled);
        }
    });

    Bonus.prototype.canDebitCredit = function() {
        if (!this.has('acceptedAt')) {
            throw new HTTPError(422, "Bonus has not been accepted yet");
        }
        if (!this.has('activatedAt')) {
            throw new HTTPError(422, "Bonus has not been activated yet");
        }
        if (this.has('exhaustedAt')) {
            throw new HTTPError(422, "Bonus is exhausted");
        }
        if (this.has('rejectedAt')) {
            throw new HTTPError(422, "Bonus was rejected");
        }
        if (this.has('canceledAt')) {
            throw new HTTPError(422, "Bonus was canceled");
        }
        if (this.has('unlockedAt')) {
            throw new HTTPError(422, "Bonus is already unlocked");
        }
    };

    Bonus.prototype.accept = function(wallet, cb) {
        if (cb === undefined && 'function' === typeof wallet) {
            cb = wallet;
            wallet = undefined;
        }
        if (!wallet && this.type() !== Bonus.TYPE_MATCH) {
            return cb(new HTTPError(500, "a %s bonus requires a wallet to accept", this.type()));
        }
        if (this.has('canceledAt')) return cb(new HTTPError(405, "This bonus was already canceled"));
        if (this.has('rejectedAt')) return cb(new HTTPError(405, "This bonus was already rejected"));
        if (this.has('acceptedAt')) return cb(new HTTPError(405, "This bonus was already accepted"));
        var self = this;
        Bonus.getActive(this.userId(), this.currency(), function(err, active) {
            if (active && active.length) return cb(new HTTPError(405, "You already have an active bonus"));
            if (wallet) {
                if (!self.userId().equals(wallet.userId())) {
                    return cb(new HTTPError(400, "The bonus user id and wallet user id do not match!"));
                }
                if (self.currency() !== wallet.currency()) {
                    return cb(new HTTPError(400, "The bonus currency and wallet currency do not match!"));
                }
            }
            self.accepted = true;
            // also "activate" a straight bonus when it is accepted
            if (self.type() === Bonus.TYPE_STRAIGHT) {
                self.activated = true;
                if (!self.currency()) return cb(new HTTPError(500, "Invalid bonus configuration"));
            }
            self.save(function(err) {
                if (err) return cb(new HTTPError(err.code, err.message));
                logger.verbose("%s bonus %s accepted by %s", self.currency(), self.primary(), self.userId());
                // if this is a match bonus, just return
                if (self.type() === Bonus.TYPE_MATCH) return cb(undefined, self);
                // otherwise credit the user for the amount of the bonus
                wallet.credit({
                    amount: self.initialValue(),
                    refId: 'bonus-accepted:' + self.userId() + ":" + new Date().getTime(),
                    type: 'bonus',
                    meta: self.toJSON()
                }, function(err) {
                    if (err) return cb(err);
                    return cb(undefined, self);
                });
            });
        });
    };

    Bonus.prototype.cancel = function(wallet, cb) {
        if (this.has('rejectedAt')) return cb(new HTTPError(405, "This bonus was already rejected"));
        if (this.has('canceledAt')) return cb(new HTTPError(405, "This bonus was already canceled"));
        if (!this.currency()) return cb(new HTTPError(500, "Invalid bonus configuration"));
        if (!this.userId().equals(wallet.userId())) {
            return cb(new HTTPError(400, "The bonus user id and wallet user id do not match!"));
        }
        if (this.currency() !== wallet.currency()) {
            return cb(new HTTPError(400, "The bonus currency and wallet currency do not match!"));
        }
        this.canceled = true;
        var self = this;
        // debit first, because otherwise this bonus will not be
        // included when doing the debit
        wallet.debit({
            amount: self.value(),
            refId: 'bonus-canceled:' + self.userId() + ":" + new Date().getTime(),
            type: 'BONUS_CANCELED:bonus-adjust',
            meta: self.toJSON()
        }, function(err) {
            if (err) return cb(err);
            self.save(function(err) {
                if (err) return cb(new HTTPError(err.code, err.message));
                logger.verbose("%s bonus %s canceled by %s", self.currency(), self.primary(), self.userId());
                return cb(undefined, self);
            });
        });
    };

    Bonus.prototype.activate = function(amount, currency, cb) {
        // if this bonus has been assigned a currency, do not let
        // another currency update this
        if (this.currency() && this.currency() !== currency || !currency)
            return cb('pass');
        if (!this.accepted)
            return cb(new HTTPError(422, "Bonus has not been accepted"));
        if (this.rejected)
            return cb(new HTTPError(422, "Bonus has been rejected"));
        if (this.canceled)
            return cb(new HTTPError(422, "Bonus has been canceled"));
        // use the match multiplier to get the amount we are going to apply
        amount = Math.round(amount * this.matchMultiplier());
        // see how much room is left in the bonus
        var roomLeft = this.maxValue() - this.initialValue();
        logger.verbose("%d remaining on %s bonus for %s to claim",
                       roomLeft.toBitcoin(),
                       this.currency(),
                       this.userId());
        if (roomLeft <=0) return cb(undefined, this);
        amount = Math.min(roomLeft, amount);
        if (!this.initialValue())
            logger.verbose("activating for %d %s", amount.toBitcoin(), currency);
        else
            logger.verbose("adding to bonus for %d %s", amount.toBitcoin(), currency);
        this.initialValue(this.initialValue() + amount);
        this.value(this.value() + amount);
        var updateDoc = {
            $inc: {
                initialValue: amount,
                value: amount
            },
            $set: {
                currency: currency,
                maxValue: this.maxValue()
            }
        };
        var now = new Date();
        if (!this.activated) {
            this.activated = now;
            logger.verbose("activating the bonus");
            updateDoc.$set.activatedAt = now;
        } else {
            logger.verbose("bonus already activated, updating");
            this.updated = now;
            updateDoc.$set.updatedAt = now;
        }
        Bonus.db.update({_id: this.primary()}, updateDoc, function(err) {
            if (err) return cb(new HTTPError(err.code, err.message));
            return cb();
        });
    };

    Bonus.prototype.debit = function(amount, meta, cb) {
        var now = new Date();
        try {
            this.canDebitCredit();
        } catch (ex) {
            return cb(ex);
        }
        var adjustedWager = amount;
        if (meta && meta.gameOdds) {
            if (meta.gameOdds > 0.5) {
                var rolloverPercent = (1 - ((meta.gameOdds - 0.5) / 0.5));
                adjustedWager = Math.floor(rolloverPercent * adjustedWager);
                logger.info("game odds %d%, adjusting wager for bonus %d to %d (%d%)",
                            meta.gameOdds * 100,
                            amount.toBitcoin(),
                            adjustedWager.toBitcoin(),
                            rolloverPercent * 100);
            }
        }
        logger.verbose("debiting %d %s from %s bonus for %s, current value: %d",
                       amount.toBitcoin(),
                       this.currency(),
                       this.type(),
                       this.userId(),
                       this.value().toBitcoin());
        if (this.value() - amount <= 0) {
            // value is below 0, see if the bonus is in danger
            if (this.inDanger() === false) {
                logger.verbose("bonus is in danger");
                this.inDanger(true);
            } else {
                logger.info("%s exhausted a %s %s bonus", this.userId(), this.currency(), this.type());
                this.exhaustedAt(now);
            }
        }
        var updateDoc = {
            $set: {
                inDanger: this.inDanger()
            },
            $inc: {
                value: (-1 * amount),
                wagered: adjustedWager
            }
        };
        this.value(this.value() - amount);
        this.wagered(this.wagered() + adjustedWager);
        if (this.exhausted) {
            updateDoc.$set.exhaustedAt = now;
        } else {
            // check now to see if the bonus has been unlocked
            if (this.wagered() >= this.initialValue() * this.rollover()) {
                this.unlockedAt(now);
                updateDoc.$set.unlockedAt = now;
                logger.info("%s unlocked a %s %s bonus", this.userId(), this.currency(), this.type());
            }
        }
        logger.verbose("new bonus value: %d", this.value().toBitcoin());
        logger.info("%s %s %s bonus: %d of %d wagered, %d% unlocked, %d value",
                    this.userId(),
                    this.currency(),
                    this.type(),
                    this.wagered().toBitcoin(),
                    (this.initialValue() * this.rollover()).toBitcoin(),
                    ((this.wagered() / (this.initialValue() * this.rollover())) * 100).toPrecision(4),
                    this.value().toBitcoin());
        Bonus.db.update({_id: this.primary()}, updateDoc, function(err) {
            if (err) return cb(new HTTPError(err.code || 500, err.message));
            return cb(undefined);
        });
    };

    Bonus.prototype.credit = function(amount, cb) {
        try {
            this.canDebitCredit();
        } catch (ex) {
            return cb(ex);
        }
        logger.verbose("crediting %d %s to %s bonus for %s, current value: %d",
                       amount.toBitcoin(),
                       this.currency(),
                       this.type(),
                       this.userId(),
                       this.value().toBitcoin());
        this.value(this.value() + amount);
        if (this.inDanger()) {
            if (this.value() > 0) {
                this.inDanger(false);
                logger.verbose("reviving endangered bonus");
            } else {
                logger.info("%s exhausted a %s %s bonus", this.userId(), this.currency(), this.type());
                this.exhaustedAt(new Date());
            }
        }
        var self = this;
        var updateDoc = {
            $set: {
                inDanger: this.inDanger()
            },
            $inc: {
                value: amount
            }
        };
        if (this.has('exhaustedAt')) {
            updateDoc.$set.exhaustedAt = this.exhaustedAt();
        }
        logger.verbose("new bonus value: %d", this.value().toBitcoin());
        Bonus.db.update({_id: this.primary()}, updateDoc, function(err) {
            if (err) return cb(new HTTPError(err.code || 500, err.message));
            return cb(undefined, self);
        });
    };

    Bonus.getActive = function(userId, currency, cb) {
        if (cb === undefined && 'function' === typeof currency) {
            cb = currency;
            currency = undefined;
        }
        var query = {
            userId: userId,
            acceptedAt: {$exists: true},
            activatedAt: {$exists: true},
            exhaustedAt: {$exists: false},
            rejectedAt: {$exists: false},
            canceledAt: {$exists: false},
            unlockedAt: {$exists: false}
        };
        if (currency) query.currency = currency;
        Bonus.all(query, {sort: {offeredAt: 1}}, function(err, bonuses) {
            if (err) return cb(new HTTPError(err.code || 500, err.message));
            return cb(undefined, bonuses);
        });
    };

    return Bonus;

};
