'use strict';

var timestamps = require('modella-timestamps');
var util = require('util');
var crypto = require('crypto');

module.exports = function(BaseModel, userModelStore, logger, Wallet, TransactionController, HTTPError) {
    var User = BaseModel('user')
        .attr('username', {required: true, unique: true})
        .attr('email', {format: 'email'})
        .attr('pendingEmail', {format: 'email'})
        .attr('emailToken', {type: 'string', filtered: true})
        .attr('password', {filtered: true})
        .attr('ip', {format: /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, filtered: true})
        .attr('lock', {defaultValue: false, filtered: true})
        .attr('challenge', {type: 'string'})
        .attr('affiliateToken', {type: 'string', unique: true})
        .attr('affiliate', {type: userModelStore.ObjectId})
        .attr('anonymous', {defaultValue: false})
        .attr('upgradedAt', {type: Date})
        .attr('token', {defaultValue: false})
        .attr('totp', {defaultValue: false})
        .attr('totpSecret', {defaultValue: false})
        .attr('loginCount', {type: 'number', defaultValue: 0})
        .attr('locale', {defaultValue: 'en_US', format: /[a-z]{2}_[A-Z]{2}/})
        .attr('ignore', {defaultValue: false, filtered: true}) // if true, this user is ignored in the backoffice
        .attr('disable', {defaultValue: false})
        .attr('vipLevel', {type: 'number', defaultValue: 0})
        .attr('pendingVipLevel')
        .attr('wagerCount', {type: 'number'})
        .attr('authedAt', {type: Date})
        .attr('cashoutLimits', {type: Object, defaultValue: {
            total: (0.01).toSatoshi(),
            count: 10
        }}) // a key/value store for misc user config items
        .attr('verifiedAt', {type: Date});

    User.use(userModelStore);
    User.use(timestamps);

    var txCtrl = new TransactionController();

    // status properties
    Object.defineProperty(User.prototype, 'locked', {
        get: function() {
            return this.lock();
        }
    });

    Object.defineProperty(User.prototype, 'isVIP', {
        get: function() {
            return this.has('upgradedAt') && this.has('email');
        }
    });

    Object.defineProperty(User.prototype, 'upgraded', {
        get: function() {
            return this.has('upgradedAt') && !this.anonymous();
        },
        set: function(set) {
            if (set) {
                if (util.isDate(set)) {
                    this.upgradedAt(set);
                } else {
                    this.upgradedAt(new Date());
                }
                this.anonymous(false);
            }
        }
    });

    Object.defineProperty(User.prototype, 'activeEmail', {
        get: function() {
            return this.email() || this.pendingEmail();
        }
    });

    // when they change their token, mark the time (for getting all
    // activity this session)
    User.on('change token', function(user, newVal, oldVal) {
        if (newVal !== oldVal) {
            user.authedAt(new Date());
        }
    });

    // Functions for locking and unlocking a user. A locked user
    // cannot withdraw. The wallet withdraw endpoind handles locking
    // and unlocking for regular withdraws, but if a user is locked
    // anywhere outside that function and left in a locked state, they
    // cannot withdraw.
    User.prototype.setLock = function(reason, cb) {
        if (cb === undefined && 'function' === typeof reason) {
            cb = reason;
            reason = true;
        }
        if (!reason) return cb(new HTTPError(400, "Cannot setLock to false, use User#unlock() instead"));
        this.lock(reason);
        logger.verbose("locking %s", this.primary());
        var self = this;
        this.save(function(err) {
            if (err) {
                logger.error("user errors: %s", self.errors.join(", "));
                return cb(new HTTPError(err.code, err.message));
            }
            logger.verbose("locked %s", self.primary());
            return cb();
        });
    };

    User.prototype.unlock = function(cb) {
        this.lock(false);
        logger.verbose("unlocking %s", this.primary());
        var self = this;
        this.save(function(err) {
            if (err) {
                logger.error("user errors: %s", self.errors.join(", "));
                return cb(new HTTPError(err.code, err.message));
            }
            logger.verbose("unlocked %s", self.primary());
            return cb();
        });
    };

    User.prototype.incrementLogin = function(cb) {
        var self = this;
        if (!this.loginCount()) {
            this.loginCount(1);
        } else {
            this.loginCount(this.loginCount() + 1);
        }
        if (!cb) cb = function(){ logger.verbose("Updated login count for %s to %d", self.primary(), self.loginCount()); };
        User.db.update({_id: this.primary()}, {$inc: {loginCount: 1}}, function(err) {
            if (err) logger.error("Error incrementing login count for %s: %s", self.primary(), err.message);
            return cb();
        });
    };

    // if the user is not anonymous, they must have an email
    User.validate(function(user) {
        if (!user.anonymous() && (!user.email() && !user.pendingEmail())) {
            user.error("email", "Non anonymous users must have an email address");
        }
    });

    // hook for saving a user
    User.on('saving', function(user, done) {
        // if this is a regular user and they do not have an
        // upgradedAt date, use the creation date since their account
        // has always been "upgraded"
        if (!user.anonymous() && !user.has('upgradedAt')) {
            user.upgradedAt(user.createdAt());
        }
        // create an affiliate id for non anonymous users that do not
        // have one already
        if (!user.anonymous() && !user.affiliateToken()) {
            user.affiliateToken(generateAffiliateToken(user.username()));
        }
        if (user.email() || user.isNew()) return done();
        txCtrl.getWagerCount(user.primary(), function(err, wagerCount) {
            if (err) return done();
            user.wagerCount(wagerCount);
            return done();
        });
    });

    var generateAffiliateToken = function(username) {
        var md4 = crypto.createHash('md4');
        md4.update(username);
        var affId = md4.digest('base64');
        affId = affId.replace(/=+$/, '')
            .replace(/[^a-zA-Z0-9]/g, '');
        return affId;
    };

    // model init hook
    User.on('initializing', function(user, attrs) {
        // parse potential date strings
        if ('string' === typeof attrs.upgradedAt) {
            attrs.upgradedAt = new Date(attrs.upgradedAt);
        }
        if ('string' === typeof attrs.authedAt) {
            attrs.authedAt = new Date(attrs.authedAt);
        }
        if ('string' === typeof attrs.affiliate) {
            attrs.affiliate = new User.db.id(attrs.affiliate);
        }
    });

    User.prototype.wallet = function(currency, cb) {
        Wallet.get({userId: this.primary(), currency: currency}, function(err, wallet) {
            if (err) return cb(new HTTPError(err.code || 500, err.message));
            if (wallet) {
                return cb(undefined, wallet);
            } else {
                return cb(new HTTPError(404, 'Wallet not found for currency %s', currency));
            }
        });
    };

    return User;
};
