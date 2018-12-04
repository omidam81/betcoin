'use strict';
var HTTPError = require('../lib/httperror');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var mongodb = require('mongodb');
var extend = require('util')._extend;
var logger = require('../lib/logger')('main');
var ObjectId = require('mongodb').ObjectID;
var BonusOffers = require('../lib/bonuses');
var EventEmitter = require('events').EventEmitter;
var ensureObjectId = require('mongowrap').ensureObjectId;
var async = require('async');
var speakeasy = require('speakeasy');

var TYPE_AFFILIATE_REVENUE_SHARE = "revenue";
var TYPE_AFFILIATE_CPA = "cpa";
var DEFAULT_HOUSE_EDGE = 0.0165;

var MAX_BONUS_AGE = (10 * 24 * 60 * 60 * 1000);

var AUTO_CASHOUT_MAX_COUNT = 10;
var AUTO_CASHOUT_MAX_TOTAL = (2).toSatoshi();

var AFFILIATE_TAKES = {
    low: 0.08,
    medium: 0.18,
    high: 0.28,
    max: 0.38
};

var AFFILIATE_INCOME_LEVELS = {
    low: (0.01).toSatoshi(),
    medium: (0.1).toSatoshi(),
    high: (1).toSatoshi(),
};

var DEFAULT_AFFILIATE = {
    type: TYPE_AFFILIATE_REVENUE_SHARE // affiliate type
};

module.exports = function(Users, AffiliateTags, TransactionController, db) {

    var Config = db.collection('config');

    /**
     * UserController
     *
     * For all of the method signatures, the following idioms apply with
     * regards to specifying a user
     *
     * user    -> a full user object as represented in the database
     * userId  -> a mongo ObjectId for the user
     * userish -> either one of the above, or a sting representation
     *            of a mongo ObjectId, use the function ensureUser to
     *            resolve to a full user object
     */

    var UserController = {};

    /**
     * Constants
     */

    var WAGER_REGEXP = /wager/;
    var WINNINGS_REGEXP = /winnings/;
    var DEPOSIT_REGEXP = /deposit/;
    var WITHDRAW_REGEXP = /withdraw/;
    var CASHBACK_REGEXP = /cashback/;
    var AFFILIATE_REGEXP = /affiliate/;


    /**
     * Utility Functions
     */

    var validPass = function(pass) {
        if (pass === undefined) return false;
        if (pass.length < 10) return false;
        return true;
    };

    var validAlias = function(alias) {
        if (alias === undefined || alias.length < 1 || alias.length >32) return false;
        if ((/^A-Za-z0-9_-/).test(alias)) return false;
        return true;
    };

    var aliasGen = function() {
        var md5 = crypto.createHash('md5');
        md5.update(crypto.randomBytes(60).toString('hex'));
        md5.update(new Date().getTime().toString());
        return md5.digest('hex');
    };

    var passHash = function(password, cb) {
        return bcrypt.hash(password, 10, cb);
    };

    var checkPass = function(password, hash, cb) {
        return bcrypt.compare(password, hash, cb);
    };

    var getToken = function() {
        return crypto.randomBytes(16).toString('hex');
    };

    var updateToken = function(user, cb) {
        user.token = getToken();
        Users.update({_id: user._id}, {$set: {token: user.token, ip: user.ip}}, function(err) {
            if (err) return cb(new HTTPError(500, err.message));
            return cb(undefined, user);
        });
    };
    UserController.updateToken = updateToken;

    var ensureUser = function(userish, cb) {
        if (!userish) return cb(new HTTPError(400, 'missing user id', '003'));
        if (userish._id && ensureObjectId(userish._id) !== null) {
            return cb(undefined, userish);
        }
        var userId = ensureObjectId(userish);
        if (userId !== null) {
            UserController.read(userId, function(err, user) {
                if (err) return cb(err);
                cb(undefined, user);
            });
        } else {
            cb(new HTTPError(400, 'invalid user or user id', '004'));
        }
    };

    UserController.setContainer = function(container){
        this.container = container;
    };

    UserController.getContainer = function() {
        return this.container;
    };

    /**
     * Auth Function
     */

    UserController.checkAlias = function(alias, cb) {
        if (!validAlias(alias)) return cb(new HTTPError(400, 'invalid username', '001'));
        UserController.getByAlias(alias, function(err, user) {
            if (err && err.code === 500) return cb(err);
            if (user) return cb(new HTTPError(409, 'username ' + alias + ' already exists', '002'));
            return cb(undefined);
        });
    };

    UserController.refreshToken = function(token, ip, cb) {
        UserController.checkToken(token, function(err, user) {
            if (err) return cb(err);
            user.ip = ip;
            updateToken(user, function(err, user) {
                if (err) return cb(err);
                UserController.clearSocket(user._id, function(err) {
                    if (err) return cb(err);
                    cb(undefined, user);
                });
            });
        });
    };

    UserController.checkToken = function(token, cb) {
        Users.findOne({token: token}, function(err, user) {
            if (err) return cb(new HTTPError(500, err.message));
            if (!user) return cb(new HTTPError(401, 'Invalid token', '009'));
            cb(undefined, user);
        });
    };

    UserController.clearToken = function(token, cb) {
        Users.update({token: token}, {$unset: {token: ""}}, function(err) {
            if (err) return cb(new HTTPError(500, err.message));
            cb(undefined);
        });
    };

    UserController.generateTotpSecret = function(userId, cb) {
        userId = ensureObjectId(userId);
        var totpSecret = speakeasy.generate_key({length: 20}).base32;
        Users.update({_id: userId}, {$set:{totpSecret: totpSecret}}, function(err){
            if(err) return cb(err);
            cb(undefined, totpSecret);
        });
    };

    UserController.activateTotp = function(userId, oneTimePass, cb) {
        ensureUser(userId, function(err, user){
            if(err) return cb(err);
            if(!user.totpSecret){
                return cb(new HTTPError(400, "Totp secret is undefined", "078"));
            }
            if(UserController.validateTotp(user, oneTimePass)){
                Users.update({_id: user._id}, {$set: {totp: true}}, function(err){
                    cb(err);
                });
            }else{
                cb(new HTTPError(400, "Incorrect one time password", "077"));
            }
        });
    };

    UserController.deactivateTotp = function(userId, cb) {
        ensureUser(userId, function(err, user){
            if(err) return cb(err);
            Users.update({_id: user._id}, {$unset: {totp: '', totpSecret: ''}}, function(err){
                cb(err);
            });
        });
    };

    UserController.validateTotp = function(user, oneTimePass) {
        var validOneTimePass = speakeasy.time({key: user.totpSecret, encoding: 'base32'});
        if(validOneTimePass !== oneTimePass){
            return false;
        }
        return true;
    };

    UserController.authenticateAnonymous = function(withdrawAddress, currency, ip, cb) {
        UserController.getByWithdrawAddress(withdrawAddress, "btc", function(err, user) {
            if (err) return cb(err);
            if (user.password) return cb(new HTTPError(401, "There is a password set for this withdraw address", '011'));
            if (user.socket) return cb(new HTTPError(409, "already logged in", '012'));
            user.ip = ip;
            updateToken(user, function(err, user) {
                if (err) return cb(err);
                var updateDoc = {
                    $inc: { signinNum: 1 }
                };
                if (user.availableBalance === undefined) {
                    user.availableBalance = {};
                    updateDoc.$set = {'availableBalance.btc': user.balance.btc};
                }
                if (user.availableBalance.btc === undefined) {
                    user.availableBalance.btc = user.balance.btc;
                    updateDoc.$set = {'availableBalance.btc': user.balance.btc};
                }
                Users.update({_id: user._id}, updateDoc, function(err) {
                    if (err) logger.error("error incrementing signin count: %s", err.message);
                    cb(undefined, user);
                });
            });
        });
    };

    UserController.authenticate = function(alias, password, ip, oneTimePass, cb) {
        UserController.getByAlias(alias, function(err, user) {
            if (err) return cb(err);
            if (user.socket) return cb(new HTTPError(409, "already logged in", '012'));
            checkPass(password, user.password, function(err, passGood) {
                if (err) return cb(new HTTPError(500, "password check error", '013'));
                if (!passGood) return cb(new HTTPError(403, "incorrect password", '014'));
                if (user.totp === true){
                    if(!oneTimePass){
                        return cb(new HTTPError(401, "one time password is required", '079'));
                    }
                    if(!UserController.validateTotp(user, oneTimePass)){
                        return cb(new HTTPError(403, "incorrect one time password", '077'));
                    }
                }
                user.ip = ip;
                updateToken(user, function(err, user) {
                    if (err) return cb(err);
                    var updateDoc = {
                        $inc: { signinNum: 1 }
                    };
                    if (user.availableBalance === undefined) {
                        user.availableBalance = {};
                        updateDoc.$set = {'availableBalance.btc': user.balance.btc};
                    }
                    if (user.availableBalance.btc === undefined) {
                        user.availableBalance.btc = user.balance.btc;
                        updateDoc.$set = {'availableBalance.btc': user.balance.btc};
                    }
                    Users.update({_id: user._id}, updateDoc, function(err) {
                        if (err) logger.error("error incrementing signin count: %s", err.message);
                        cb(undefined, user);
                    });
                });
            });
        });
    };

    UserController.clearSocket = function(userId, cb) {
        var token = userId;
        userId = ensureObjectId(userId);
        if (userId === null) {
            // if not a valid user id, try to get the user by token instead
            UserController.getByToken(token, function(err, user) {
                if (err) return cb(new HTTPError(500, err.message));
                if (user) {
                    UserController.clearSocket(user._id, cb);
                } else {
                    return cb(new HTTPError(400, 'invalid user id', '004'));
                }
            });
        }
        UserController.read(userId, function(err, user){
            if(err) return cb(err);
            var io = UserController.getContainer().get('socket');
            if (user.socket) {
                io.destroy(user.socket, function(err) {
                    if (err) return cb(new HTTPError(err.code, err.message));
                    Users.update({_id: userId, socket: {$ne: false}}, {$set: {socket: false}}, function(err) {
                        if (err) return cb(new HTTPError(500, err.message));
                        cb(undefined);
                    });
                });
            } else {
                cb(undefined);
            }
        });
    };

    UserController.setSocket = function(userId, socketId, cb) {
        var token = userId;
        userId = ensureObjectId(userId);
        if (userId === null)  {
            // if not a valid user id, try to get the user by token instead
            UserController.getByToken(token, function(err, user) {
                if (err) return cb(new HTTPError(500, err.message));
                if (user) {
                    UserController.setSocket(user._id, socketId, cb);
                } else {
                    return cb(new HTTPError(400, 'invalid user id', '004'));
                }
            });
        } else {
            Users.update({_id: userId, socket: false}, {$set: {socket: socketId}}, function(err, success) {
                if (err) return cb(new HTTPError(500, err.message));
                if (!success) return cb(new HTTPError(400, "user id not found or already has a socket", '015'));
                cb(undefined);
            });
        }
    };

    /**
     * Getters
     */

    UserController.getByAlias = function(alias, currency, cb) {
        if (cb === undefined && typeof currency === 'function') {
            cb = currency;
            currency = 'btc';
        }
        var withdrawQuery = {};
        withdrawQuery['withdraw.' + currency + '.address'] = alias;
        Users.findOne({$or: [{alias: alias.toLowerCase()}, withdrawQuery]}, function(err, user) {
            if (err) return cb(new HTTPError(500, err.message));
            if (!user) return cb(new HTTPError(404, 'username ' + alias + ' not found', '005'));
            cb(undefined, user);
        });
    };

    UserController.getBySocket = function(socketId, cb) {
        Users.findOne({socket: socketId}, function(err, user) {
            if (err) return cb(new HTTPError(500, err.message));
            if (!user) return cb(new HTTPError(404, 'socket ' + socketId + ' not found', '006'));
            cb(undefined, user);
        });
    };

    UserController.getByDepositAddress = function(address, currency, cb) {
        var query = {};
        query['deposit.' + currency + '.address'] = address;
        Users.findOne(query, function(err, user) {
            if (err) return cb(new HTTPError(500, err.message));
            if (!user) return cb(new HTTPError(404, 'address ' + address + ' not found', '007'));
            cb(undefined, user);
        });
    };

    UserController.getByWithdrawAddress = function(address, currency, cb) {
        var query = {};
        var mainAddressQuery = {}, backupAddressQuery = {};
        mainAddressQuery['withdraw.' + currency + '.address'] = address;
        backupAddressQuery['withdraw.' + currency + '.backup.address'] = address;
        query.$or = [mainAddressQuery, backupAddressQuery];
        Users.findOne(query, function(err, user) {
            if (err) return cb(new HTTPError(500, err.message));
            if (!user) return cb(new HTTPError(404, 'address ' + address + ' not found', '007'));
            cb(undefined, user);
        });
    };

    UserController.getByToken = function(token, cb) {
        Users.findOne({token: token}, function(err, user) {
            if (err) return cb(new HTTPError(500, err.message));
            if (!user) return cb(new HTTPError(404, 'token ' + token + ' not found', '008'));
            cb(undefined, user);
        });
    };

    /**
     * CRU
     */

    UserController.createAnonymous = function(userData, cb) {
        var withdrawAddress = userData.withdrawAddress;
        var currency = userData.currency || "btc";
        var bitcoind = UserController.container.get('bitcoind');
        var alias = aliasGen();
        UserController.getByWithdrawAddress(withdrawAddress, currency, function(err, user) {
            if (err) {
                // if we cannot find this anonymous user, create one
                if (err.code === 404) {
                    async.waterfall([
                        function(done) {
                            UserController.getByDepositAddress(withdrawAddress, currency, function(err, user) {
                                if (err && err.code !== 404) return done(err);
                                if (user) return done(new HTTPError(409, "That is a deposit address, don't do that", '016'));
                                done();
                            });
                        },
                        function(done) {
                            bitcoind.getNewAddress('users', function(err, depositAddress) {
                                if (err) return done(new HTTPError(500, 'bitcoind error: ' + err.message, '017'));
                                done(undefined, depositAddress);
                            });
                        },
                        function(depositAddress, done) {
                            var user = {
                                alias: alias.toLowerCase(),
                                ip: userData.ip,
                                deposit: {
                                    "btc": {address: depositAddress, deposited: 0}
                                },
                                withdraw: {
                                    btc: {address: withdrawAddress, withdrawn: 0}
                                },
                                balance: {"btc": 0},
                                anonymous: true,
                                created: new Date(),
                                socket: false
                            };
                            if (userData.affiliateToken) {
                                UserController.getAffiliateByToken(userData.affiliateToken, function(err, affiliate) {
                                    if (err) {
                                        logger.warn("error getting affiliate during signup, affiliate token %s", userData.affiliateToken);
                                        return done(undefined, user);
                                    }
                                    user.affiliate = affiliate._id;
                                    done(undefined, user);
                                });
                            } else {
                                done(undefined, user);
                            }
                        },
                        function(user, done) {
                            Users.insert(user, function(err, docs) {
                                if (err) return done(new HTTPError(500, 'error creating user: ' + err.message, '018'));
                                user = docs[0];
                                done(undefined, user);
                            });
                        },
                        function(user, done) {
                            updateToken(user, function(err, user) {
                                if (err) return done(err);
                                done(undefined, user);
                            });
                        }
                    ], function(err, user) {
                        if (err) return cb(err);
                        return cb(undefined, user);
                    });
                } else {
                    return cb(err);
                }
            } else if (user.password) {
                return cb(new HTTPError(401, "There is a password set for this withdraw address", '011'));
            } else {
                if (user.socket) return cb(new HTTPError(409, "already logged in", '012'));
                updateToken(user, function(err, user) {
                    if (err) return cb(err);
                    return cb(undefined, user);
                });
            }
        });
    };

    UserController.create = function(userData, cb) {
        var password = userData.password;
        var alias = userData.alias.toLowerCase();
        var email = userData.email;
        var withdrawAddress = userData.withdrawAddress;
        if (alias === undefined) {
            alias = aliasGen();
        }
        if (!validPass(password)) return cb(new HTTPError(400, 'invalid password', '019'));
        var bitcoind = UserController.container.get('bitcoind');
        async.waterfall([
            function(done) {
                UserController.checkAlias(alias, function(err) {
                    if (err) return done(err);
                    done();
                });
            },
            function(done) {
                passHash(password, function(err, hash) {
                    if (err) return done(new HTTPError(500, 'password hashing error', '020'));
                    done(undefined, hash);
                });
            },
            function(hash, done) {
                bitcoind.getNewAddress('users', function(err, depositAddress) {
                    if (err) return done(new HTTPError(500, 'bitcoind error: ' + err.message, '017'));
                    done(undefined, hash, depositAddress);
                });
            },
            function(hash, depositAddress, done) {
                var user = {
                    alias: alias,
                    ip: userData.ip,
                    password: hash,
                    email: email,
                    deposit: {
                        btc: { address: depositAddress, deposited: 0}
                    },
                    withdraw: {},
                    balance: {btc:0},
                    availableBalance: {btc:0},
                    anonymous: false,
                    socket: false,
                    created: new Date(),
                    signupSite: userData.signupSite
                };
                if (userData.affiliateToken) {
                    UserController.getAffiliateByToken(userData.affiliateToken, function(err, affiliate) {
                        if (err) {
                            logger.warn("error getting affiliate during signup, affiliate token %s", userData.affiliateToken);
                            return done(undefined, user);
                        }
                        user.affiliate = affiliate._id;
                        done(undefined, user);
                    });
                } else {
                    done(undefined, user);
                }
            },
            function(user, done) {
                if (withdrawAddress) {
                    user.withdraw.btc = {address: withdrawAddress, withdrawn: 0};
                }
                if (user.email) {
                    user.emailToken = getToken();
                }
                Users.insert(user, function(err, docs) {
                    if (err) return done(new HTTPError(500, 'error creating user: ' + err.message, '018'));
                    user = docs[0];
                    if (user.email) {
                        UserController.getContainer().get('mailer').send(user.email, 'confirm', {user: user});
                    }
                    return done(undefined, user);
                });
            },
            function(user, done) {
                UserController.offerBonus(user, BonusOffers.welcome, function(err, _user) {
                    if (err) {
                        logger.error("error offering bonus: " + err.message);
                        return done(undefined, user);
                    } else {
                        return done(undefined, _user);
                    }
                });
            },
            function(user, done) {
                UserController.makeAffiliate(user, DEFAULT_AFFILIATE, function(err, _user) {
                    if (err) {
                        logger.error("error make user an affiliate: " + err.message);
                        return done(undefined, user);
                    } else {
                        return done(undefined, _user);
                    }
                });
            }
        ], function(err, user) {
            if (err) return cb(err);
            cb(undefined, user);
        });
    };

    UserController.read = function(userId, cb) {
        userId = ensureObjectId(userId);
        if (userId === null) return cb(new HTTPError(400, 'invalid user id', '004'));
        Users.findOne({_id: userId}, function(err, user) {
            if (err) return cb(new HTTPError(500, err.message));
            if (!user) return cb(new HTTPError(404, 'user id ' + userId + ' not found', '021'));
            cb(undefined, user);
        });
    };

    UserController.update = function(userish, newData, cb) {
        var newAlias = newData.alias.toLowerCase();
        var newEmail = newData.email;
        var newPassword = newData.password;
        var newBtcWithdrawAddress = newData.btcWithdrawAddress;
        var newBtcBackupWithdrawAddress = newData.btcBackupWithdrawAddress;
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            async.series([
                function checkMainAddressExist(cb){
                    if(!newBtcWithdrawAddress || newBtcWithdrawAddress === '')
                        return cb(new HTTPError(400, 'Main address must be provided', '022'));
                    UserController.checkWithdrawAddressExist(user._id, newBtcWithdrawAddress, function(err){
                        cb(err);
                    });
                },
                function checkBackupAddressExist(cb){
                    if(!newBtcBackupWithdrawAddress || newBtcBackupWithdrawAddress === '')
                        return cb();
                    UserController.checkWithdrawAddressExist(user._id, newBtcBackupWithdrawAddress, function(err){
                        cb(err);
                    });
                }
            ], function(err){
                if(err) return cb(err);
                var updateNotifier = new EventEmitter();
                // once the update has been validated and ready, do it
                updateNotifier.once('ready', function() {
                    if(newAlias) newAlias = newAlias;
                    user.alias = newAlias || user.alias;
                    user.email = newEmail || user.email;
                    if(user.anonymous){
                        user.anonymous = false;
                        user.anonymousUpgradedDate = new Date();
                        UserController.makeAffiliate(user, DEFAULT_AFFILIATE, function(err, affiliate) {
                            if (err) return logger.error("Error making user %s (%s) an affiliate: %s", user.alias, user._id, err.message);
                            logger.info("user %s (%s) is now an affiliate", affiliate.alias, affiliate._id, {});

                        });
                    }
                    var btcWithdrawAddress = newBtcWithdrawAddress || user['withdraw.btc.address'];
                    if (newPassword) {
                        passHash(newPassword, function(err, hash) {
                            if (err) return cb(new HTTPError(500, 'password hashing error'));
                            Users.update({_id: user._id}, {
                                $set : {
                                    alias: user.alias,
                                    email: user.email,
                                    password: hash,
                                    anonymous: user.anonymous,
                                    anonymousUpgradedDate: user.anonymousUpgradedDate,
                                    'withdraw.btc.address' : btcWithdrawAddress,
                                    'withdraw.btc.backup.address' : newBtcBackupWithdrawAddress,
                                    updated: new Date()
                                }
                            }, function(err) {
                                if (err) return cb(new HTTPError(500, err.message));
                                return cb(undefined, user);
                            });
                        });
                    } else {
                        Users.update({_id: user._id}, {
                            $set : {
                                alias: user.alias,
                                email: user.email,
                                'withdraw.btc.address' : btcWithdrawAddress,
                                'withdraw.btc.backup.address' : newBtcBackupWithdrawAddress,
                                updated: new Date()
                            }
                        }, function(err) {
                            if (err) return cb(new HTTPError(500, err.message));
                            return cb(undefined, user);
                        });
                    }
                });
                // validate the new values, emit 'ready' when done
                if (newPassword && !validPass(newPassword)) return cb(new HTTPError(400, 'invalid password', '019'));
                if (newAlias && newAlias !== user.alias) {
                    UserController.checkAlias(newAlias, function(err) {
                        if (err) return cb(err);
                        updateNotifier.emit('ready');
                    });
                } else {
                    updateNotifier.emit('ready');
                }
            });
        });
    };

    /**
     * Messaging
     */

    UserController.confirmEmail = function(token, cb) {
        if (typeof token !== 'string') return cb(new HTTPError(400, 'invalid email token', '023'));
        Users.findOne({emailToken: token}, function(err, user) {
            if (err) return cb(new HTTPError(500, ''));
            if (!user) return cb(new HTTPError(404, 'email token not found', '024'));
            Users.update({_id: user._id}, {$unset: {emailToken: ""}}, function(err) {
                if (err) return cb(new HTTPError(500, 'error clearing token'));
                logger.info('email confirmed %s', user.email);
                delete user.password;
                UserController.saveNotification(user._id, {subject: 'Email Confirmed', message: 'Thank you for confirming your email address'}, function(err){
                    if(err) return cb(err);
                    UserController.getContainer().get('mailer').send(user.email, 'confirmed', {
                        user: user
                    });
                    cb(undefined, {
                        user: user
                    });
                });
            });
        });
    };

    UserController.countNotificationUnread = function(userId, cb){
        ensureUser(userId, function(err, user){
            if(err) return cb(err);
            var unreadCount = 0;
            if(user.notifications){
                user.notifications.forEach(function(notification){
                    if(notification.hasRead === false && notification.stick === true){
                        unreadCount += 1;
                    }
                });
            }
            cb(undefined, unreadCount);
        });
    };

    UserController.getNotifications = function(userId, cb) {
        ensureUser(userId, function(err, user){
            if(err) return cb(err);
            var stickNotifications = [];
            if(user.notifications === undefined)
                return cb(undefined, stickNotifications);
            user.notifications.forEach(function(notification){
                if(notification.stick === true)
                    stickNotifications.push(notification);
            });
            cb(undefined, stickNotifications);
        });
    };

    UserController.saveNotification = function(userId, params, cb){
        ensureUser(userId, function(err, user){
            if(err) return cb && cb(err);
            var notification = {
                id : mongodb.ObjectID(),
                datetime : new Date(),
                stick : true,
                hasRead: false
            };
            for(var name in params){
                if (params.hasOwnProperty(name)) {
                    notification[name] = params[name];
                }
            }
            async.series([
                function addNewNotification(done){
                    Users.update({
                        _id: user._id
                    }, {
                        $push: {
                            notifications: notification
                        }
                    }, function(err){
                        done(err);
                    });
                },
                function sendEmail(done){
                    if(notification.sendEmail && user.email){
                        UserController.getContainer().get('mailer').send(user.email, notification.sendEmail, {
                            subject : notification.subject,
                            message : notification.message,
                            user: user,
                            params: params
                        }, function(err){
                            done(err);
                        });
                    }else{
                        done();
                    }
                },
                function updateUnreadSocket(done){
                    if(user.socket === false) return done();
                    UserController.countNotificationUnread(user._id, function(err, unreadCount){
                        if(err) return done(err);
                        UserController.getContainer().get('notification').notify('notification unread', user.socket, unreadCount);
                        UserController.getContainer().get('notification').notify('notification', user.socket, notification);
                        done();
                    });
                }
            ], function(err){
                if(err) logger.error('Error at sending notification email for user %s %s', userId, err.message);
                return cb && cb(err, notification);
            });
        });
    };

    UserController.updateTicketNotification = function(userId, ticketId, cb){
        ensureUser(userId, function(err, user){
            if(err) return cb(err);
            ticketId = UserController.getContainer().get('mongo').ensureObjectId(ticketId);
            var query = {
                '_id': user._id,
                'notifications.ticketId': ticketId
            };
            var updateTime = new Date();
            Users.update(query, {
                $set: {
                    'notifications.$.hasRead': false,
                    'notifications.$.datetime': updateTime,
                    'notifications.$.stick': true
                }
            }, function(err){
                if(err) return cb(new HTTPError(500, err.message));
                Users.findOne(query, {
                    _id: 0,
                    'notifications.$': 1
                }, function(err, result){
                    if(result === null){
                        return cb(new HTTPError(404, 'notification for the ticket ' + ticketId + ' not found', '037'));
                    }
                    if(err) return cb(new HTTPError(500, err.message));
                    UserController.countNotificationUnread(user._id, function(err, unreadCount){
                        if(unreadCount > 0 && user.socket !== false){
                            UserController.getContainer().get('notification').notify('notification unread', user.socket, unreadCount);
                        }
                    });
                    cb(undefined, result.notifications[0]);
                });
            });
        });
    };

    UserController.dismissNotification = function(userId, notificationId, cb){
        ensureUser(userId, function(err, user){
            if(err) return cb(err);
            Users.update({
                '_id': user._id,
                'notifications.id': UserController.getContainer().get('mongo').ensureObjectId(notificationId)
            }, {
                $set: {
                    'notifications.$.stick': false
                }
            }, function(err){
                if(err) return cb(new HTTPError(500, err.message));
                cb();
            });
        });
    };

    UserController.readNotification = function(userId, notificationId, cb){
        ensureUser(userId, function(err, user){
            if(err) return cb(err);
            for(var i in user.notifications){
                if(user.notifications[i].id.toString() === notificationId){
                    return cb(undefined, user.notifications[i]);
                }
            }
            return cb(new HTTPError(404, 'notification'));
        });
    };

    UserController.markNotificationRead = function(userId, notificationId, cb){
        ensureUser(userId, function(err, user){
            if(err) return cb(err);
            notificationId = UserController.getContainer().get('mongo').ensureObjectId(notificationId);
            UserController.countNotificationUnread(user._id, function(err, unreadCount){
                var query = {
                    '_id': user._id,
                    'notifications.id': notificationId
                };
                Users.update(query, {
                    $set: {
                        'notifications.$.hasRead': true
                    }
                }, function(err){
                    if(err) return cb(new HTTPError(500, err.message));
                    Users.findOne(query, {
                        _id: 0,
                        'notifications.$': 1
                    }, function(err, result){
                        if(result === null){
                            return cb(new HTTPError(404, 'notification ' + notificationId + ' not found', '038'));
                        }
                        if(err) return cb(new HTTPError(500, err.message));
                        if(unreadCount > 0 && user.socket !== false){
                            UserController.getContainer().get('notification').notify('notification unread', user.socket, unreadCount - 1);
                        }
                        cb(undefined, result.notifications[0]);
                    });
                });
            });
        });
    };

    UserController.sendSupportMessage = function(user, options, cb){
        UserController.getContainer().get('mailer').send('support@betcoin.tm', 'contact_us', {
            subject: options.subject,
            message: options.message,
            user: user
        }, function(err){
            if(err) return cb(new HTTPError(500, 'Failed to send the message email', '039'));
            cb();
        });
    };

    /**
     * Affiliates
     */

    UserController.getAffiliateByToken = function(affiliateToken, cb) {
        Users.findOne({'affiliateData.token': affiliateToken}, function(err, affiliate) {
            if (err) return cb(new HTTPError(500, err.message));
            if (affiliate) {
                return cb(undefined, affiliate);
            } else {
                return cb(new HTTPError(404, "affiliate not found"));
            }
        });
    };

    UserController.getAffiliateTag = function(ip, userAgent, affiliateToken, cb) {
        if (cb === undefined && 'function' === typeof affiliateToken) {
            cb = affiliateToken;
            affiliateToken = undefined;
        }
        AffiliateTags.findOne({
            ip: ip,
            userAgent: userAgent,
        }, function(err, tag) {
            if (err) return cb(new HTTPError(500, err.message));
            if (tag) {
                return cb(undefined, tag);
            } else if(affiliateToken) {
                logger.info("affiliate tag not found, creating one");
                UserController.markAffiliateToken(ip, userAgent, affiliateToken, cb);
            } else {
                cb(new HTTPError(404, "no tag for ip/user agent combination"));
            }
        });
    };

    UserController.markAffiliateToken = function(ip, userAgent, affiliateToken, cb) {
        async.waterfall([
            function(done) {
                Users.findOne({'affiliateData.token': affiliateToken}, function(err, affiliate) {
                    if (err) return done(new HTTPError(500, err.message));
                    if (!affiliate) return done(new HTTPError(404, "affiliate not found"));
                    done(undefined, affiliate);
                });
            },
            function(affiliate, done) {
                AffiliateTags.findOne({ip: ip, userAgent: userAgent}, function(err, affTag) {
                    if (err) return done(new HTTPError(500, err.message));
                    if (affTag) return done(new HTTPError(409, "This identity is already tagged for an affiliate"));
                    done(undefined, affiliate);
                });
            }, function(affiliate, done) {
                var tag = {
                    ip: ip,
                    userAgent: userAgent,
                    affiliateToken: affiliate.affiliateData.token,
                    affiliateId: affiliate._id
                };
                AffiliateTags.insert(tag, function(err) {
                    if (err) return done(new HTTPError(500, err.message));
                    done(undefined, tag);
                });
            }
        ], function(err, tag) {
            if (err) return cb(err);
            cb(undefined, tag);
        });

    };

    UserController.makeAffiliate = function(userish, affiliateConf, cb) {
        if (cb === undefined && 'function' === typeof affiliateConf) {
            cb = affiliateConf;
            affiliateConf = extend({}, DEFAULT_AFFILIATE);
        } else {
            affiliateConf = extend(DEFAULT_AFFILIATE, affiliateConf);
        }
        var affiliateData = {
            token: aliasGen()
        };
        if (affiliateConf.type === TYPE_AFFILIATE_REVENUE_SHARE) {
            affiliateData.type = TYPE_AFFILIATE_REVENUE_SHARE;
        } else if (affiliateConf.type === TYPE_AFFILIATE_CPA) {
            if (!affiliateConf.reward) return cb(new HTTPError(400, "invalid affiliate configuration"));
            if ((/\./).test(affiliateConf.reward.toString())) return cb(new HTTPError(400, "reward must be in satoshi"));
            affiliateConf.reward = parseInt(affiliateConf.reward, 10);
            if (isNaN(affiliateConf.reward)) return cb(new HTTPError(400, "reward is NaN"));
            if (affiliateConf.reward > (0.001).toSatoshi()) return cb(new HTTPError(405, "reward too high, contact the dev team to up this limit"));
            affiliateData.type = TYPE_AFFILIATE_CPA;
            affiliateData.reward = affiliateConf.reward;
        } else {
            return cb(new HTTPError(400, "invalid affiliate type " + affiliateConf.type));
        }
        async.waterfall([
            function(done) {
                ensureUser(userish, done);
            },
            function(user, done) {
                if (user.affiliateData) return done(new HTTPError(409, "User is already an affiliate"));
                user.affiliateData = affiliateData;
                var updateDoc = {$set: {affiliateData: affiliateData}};
                done(undefined, user, updateDoc);
            }, function(user, updateDoc, done) {
                Users.update({_id: user._id}, updateDoc, function(err, success) {
                    if (err) return done(new HTTPError(500, err.message));
                    if (!success) return done(new HTTPError(500, "Error updating user to an affiliate"));
                    done(undefined, user);
                });
            },
        ], function(err, user) {
            if (err) return cb(err);
            cb(undefined, user);
        });
    };

    UserController.getAffiliateAssociates = function(userish, cb) {
        ensureUser(userish, function(err, affiliate) {
            if (err) return cb(err);
            if (!affiliate.affiliateData) return cb(new HTTPError(424, "User is not an affiliate"));
            Users.find({affiliate: affiliate._id}, {
                // only get a few keys
                alias: true,
                created: true
            }).toArray(function(err, associates) {
                if (err) return cb(new HTTPError(500, err.message));
                return cb(undefined, associates);
            });
        });
    };

    UserController.getAffiliateAssociatesTotals = function(userish, cb) {
        ensureUser(userish, function(err, affiliate) {
            if (err) return cb(err);
            if (!affiliate.affiliateData) return cb(new HTTPError(424, "User is not an affiliate"));
            UserController.getAffiliateAssociates(userish, function(err, associates){
                var associateIds = [];
                associates.forEach(function(associate){
                    associate.created = associate._id.getTimestamp();
                    associateIds.push(associate._id);
                });
                TransactionController.getAssociatesEarningTotals(associateIds, function(err, totals){
                    if(err) return cb(err);
                    associates.forEach(function(associate){
                        totals.forEach(function(total){
                            if(associate._id.equals(total._id)){
                                associate.totalEarning = total.totalEarning;
                            }
                        });
                    });
                    cb(undefined, associates);
                });
            });
        });
    };

    UserController.getAffiliateAssociateCount = function(userish, cb) {
        ensureUser(userish, function(err, affiliate) {
            if (err) return cb(err);
            if (!affiliate.affiliateData) return cb(new HTTPError(424, "User is not an affiliate"));
            Users.count({affiliate: affiliate._id}, function(err, associateCount) {
                if (err) return cb(new HTTPError(500, err.message));
                return cb(undefined, associateCount);
            });
        });
    };

    UserController.getAffiliateTransactions = function(userish, start, end, cb) {
        async.waterfall([
            function(done) {
                ensureUser(userish, function(err, affiliate) {
                    if (err) return done(err);
                    if (!affiliate.affiliateData) return done(new HTTPError(424, "User is not an affiliate"));
                    done(undefined, affiliate);
                });
            },
            function(affiliate, done) {
                TransactionController.getAffiliateTransactions(affiliate._id, start, end, function(err, txs) {
                    if (err) return done(err);
                    done(undefined, txs);
                });
            }
        ], function(err, txs) {
            if (err) return cb(err);
            return cb(undefined, txs);
        });
    };

    UserController.getAssociateTransactions = function(associate, options, cb) {
        async.waterfall([
            function(done) {
                ensureUser(associate, function(err, associate) {
                    if (err) return done(err);
                    done(undefined, associate);
                });
            },
            function(associate, done) {
                TransactionController.getAssociateTransactions(associate._id, options, function(err, returnData) {
                    if (err) return done(err);
                    done(undefined, returnData);
                });
            }
        ], function(err, returnData) {
            if (err) return cb(err);
            return cb(undefined, returnData);
        });
    };

    UserController.processAffiliate = function(user, transaction, currency) {
        if (!user.affiliate) return;
        async.waterfall([
            function(done) {
                UserController.read(user.affiliate, function(err, affiliate) {
                    if (err) {
                        return done(err);
                    }
                    if (affiliate.affiliateData.type !== TYPE_AFFILIATE_REVENUE_SHARE) {
                        return done(new HTTPError(412, "affiliate is not a revenue share affiliate"));
                    }
                    done(undefined, affiliate);
                });
            },
            function(affiliate, done) {
                var take = 0;
                if (!affiliate.affiliateData.income) affiliate.affiliateData.income = {};
                if (!affiliate.affiliateData.income[currency]) affiliate.affiliateData.income[currency] = 0;
                var income = affiliate.affiliateData.income[currency];
                if (income < AFFILIATE_INCOME_LEVELS.low) {
                    take = AFFILIATE_TAKES.low;
                } else if (income < AFFILIATE_INCOME_LEVELS.medium) {
                    take = AFFILIATE_TAKES.medium;
                } else if (income < AFFILIATE_INCOME_LEVELS.high) {
                    take = AFFILIATE_TAKES.high;
                } else {
                    take = AFFILIATE_TAKES.max;
                }
                logger.debug("affiliate %s has %d in income, take %d%", affiliate.alias, income.toBitcoin(), parseInt(take * 100, 10));
                done(undefined, affiliate, take);
            },
            function(affiliate, affiliateTake, done) {
                var affiliateBase = transaction.amtOut;
                if (transaction.meta && transaction.meta.gameOdds) {
                    if (transaction.meta.gameOdds > 0.5) {
                        var rolloverPercent = (1 - ((transaction.meta.gameOdds - 0.5) / 0.5));
                        affiliateBase = Math.floor(rolloverPercent * affiliateBase);
                        logger.info("game odds %d%, adjusting affiliate base from %d to %d (%d%)",
                                    transaction.meta.gameOdds * 100,
                                    transaction.amtOut.toBitcoin(),
                                    affiliateBase.toBitcoin(),
                                    rolloverPercent * 100);
                    }
                }
                var houseEdge = DEFAULT_HOUSE_EDGE;
                if (transaction.meta && transaction.meta.houseEdge) {
                    houseEdge = transaction.meta.houseEdge;
                }
                var affiliateCredit = Math.floor(affiliateBase * houseEdge * affiliateTake);
                if (affiliateCredit > 0) {
                    UserController.credit(affiliate, affiliateCredit, {
                        currency: currency,
                        type: "affiliate:credit",
                        refId: "affiliate:" + user._id + ":" + new Date().getTime(),
                        meta: {
                            associate: user._id,
                            gameId: transaction.refId,
                            gameType: transaction.type,
                            wager: transaction.amtOut,
                            houseEdge: houseEdge
                        }
                    }, function(err, _affiliate, affTx) {
                        if (err) return done(err);
                        done(undefined, affiliate, affTx);
                    });
                } else {
                    done(new HTTPError(422, "Affiliate credit is < 1 satoshi"));
                }
            },
            function(affiliate, affTx, done) {
                var affUpdate = {$inc:{}};
                if (!affiliate.affiliateData.income) affiliate.affiliateData.income = {};
                if (!affiliate.affiliateData.income[currency]) affiliate.affiliateData.income[currency] = 0;
                affiliate.affiliateData.income[currency] += affTx.amtIn;
                affUpdate.$inc['affiliateData.income.' + currency] = affTx.amtIn;
                Users.update({_id: affiliate._id}, affUpdate, function(err) {
                    if (err) {
                        return done(new HTTPError(500, "error updating affiliate income (not critical): " + err.message));
                    }
                    done(undefined, affiliate, affTx);
                });
            }
        ], function(err, affiliate, affTx) {
            if (err) {
                logger.error(err.message);
            } else {
                logger.info("affiliate %s (%s) credited %d", affiliate.alias, affiliate._id, affTx.amtIn.toBitcoin());
            }
        });
    };

    /**
     * Bonus
     */

    UserController.giveCashback = function(userish, amount, profit, start, end, currency, cb) {
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            if (user.anonymous) return cb(new HTTPError(405, "an anonymous user cannot get cashback"));
            UserController.credit(user, amount, {
                refId: 'cashback:' + new Date().getTime() + ":" + user._id,
                type: 'cashback',
                meta: {
                    profit: profit,
                    start: start,
                    end: end
                }
            }, function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                if (amount > 0) {
                    UserController.saveNotification(user._id, {
                        subject: 'Cashback reward',
                        message: "Congrats, you have gotten a cashback bonus of " + amount.toBitcoin() + "BTC",
                        type: 'cashback',
                        amount: amount.toBitcoinString(),
                        sendEmail: 'cashback_granted'
                    }, function(err) {
                        if (err) logger.error(err.message);
                        cb(undefined, user);
                    });
                } else {
                    cb(undefined, user);
                }
            });
        });
    };

    UserController.getCashbacks = function(userish, page, limit, currency, cb) {
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            TransactionController.getCashbacks(user._id, page, limit, currency, cb);
        });
    };

    UserController.giveBonus = function(userish, conf, notify, cb) {
        if (cb === undefined && typeof notify === 'function') {
            cb = notify;
            notify = false;
        }
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            if (user.anonymous) return cb(new HTTPError(405, "an anonymous user cannot get bonuses"));
            // get tx history to see if they are eligable
            var setDoc = {};
            conf.offered = new Date();
            // don't use the real ObjectId object, since it will be used as a key
            conf._id = new ObjectId().toHexString();
            var setString = 'bonusOffers.' + conf.currency + '.' + conf._id;
            setDoc[setString] = conf;
            if (user.bonusOffers === undefined) user.bonusOffers = {};
            if (user.bonusOffers[conf.currency] === undefined) user.bonusOffers[conf.currency] = {};
            user.bonusOffers[conf.currency][conf._id] = conf;
            Users.update({_id:user._id}, {$set: setDoc, $inc: {'bonusStats.offered': 1}}, function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                if (conf.unlockMultiplier === 0) {
                    conf.autostart = true;
                    return UserController.acceptBonus(user, conf._id, conf.currency, cb);
                } else {
                    if (notify) {
                        UserController.saveNotification(user._id, {
                            subject: 'Claim your ' + conf.type + ' BTC Bonus!',
                            message: "Congratulations! You have been offered a " + conf.type + " bonus of up to " + conf.max.toBitcoin() + "BTC!\nPlease sign into your account at https://www.betcoin.tm/ to accept your bonus\nPlease contact us if you have any questions or concerns. Thank you!\nBetCoin Customer Service",
                            type: conf.type + '-bonus',
                            data: conf,
                            sendEmail: 'bonus_offer'
                        });
                    }
                    return cb(undefined, user);
                }
            });
        });
    };

    UserController.offerBonus = function(userish, conf, cb) {
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            // get tx history to see if they are eligable
            TransactionController.getHistory(conf.currency, user._id, function(err, data) {
                if (err) return cb(new HTTPError(500, err.message));
                var txs = data.txs;
                var eligable = true;
                txs.forEach(function(tx) {
                    // if the user has wagered, they are not eligable
                    if (WAGER_REGEXP.match(tx.type)) {
                        eligable = false;
                    }
                });
                if (!eligable) return cb(new HTTPError(412, "User is not eligable for a bonus"));
                // add the conf object to the bonusOffers[currency] array
                UserController.giveBonus(user, conf, cb);
            });
        });
    };

    UserController.acceptBonus = function(userish, bonusId, currency, cb) {
        if (ensureObjectId(bonusId) === null) return cb(new HTTPError(400, "invalid bonus id"));
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            if (!user.bonusOffers) return cb(new HTTPError(412, "No bonus offers available"));
            if (!user.bonusOffers[currency]) return cb(new HTTPError(400, "Invalid currency"));
            if (!user.bonusOffers[currency][bonusId]) return cb(new HTTPError(400, "Invalid bonus id"));
            // add attributes to active bonus
            var activeBonus = extend(user.bonusOffers[currency][bonusId], {
                accepted: new Date(),
                exhausted: false,
                wagered: 0,
                started: false,
                unlocked: false
            });
            var updateDoc = {
                $set:{},
                $unset:{},
                $inc: {'bonusStats.accepted': 1}
            };
            updateDoc.$unset['bonusOffers.' + currency + '.' + bonusId] = "";
            updateDoc.$set['activeBonuses.' + currency + '.' + bonusId] = activeBonus;
            if (user.activeBonuses === undefined) user.activeBonuses = {};
            if (user.activeBonuses[currency] === undefined) user.activeBonuses[currency] = {};
            user.activeBonuses[currency][bonusId] = activeBonus;
            Users.update({_id:user._id}, updateDoc, function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                delete user.bonusOffers[currency][bonusId];
                if (activeBonus.autostart) {
                    if (!activeBonus.initial) throw "Misconfigured bonus";
                    return UserController.startBonus(user, bonusId, null, currency, cb);
                } else {
                    UserController.saveNotification(user._id, {
                        subject: activeBonus.type + ' bonus accepted',
                        message: "Congratulations! Your " + activeBonus.type + " bonus has been accepted! When your next deposit is applied to your balance, the bonus will be activated.\n\nPlease contact us if you have any questions or concerns. Thank you!\nBetCoin Customer Service",
                        type: activeBonus.type + '-bonus',
                        data: activeBonus,
                        sendEmail: 'bonus_accepted'
                    });
                    return cb(undefined, user);
                }
            });
        });
    };

    UserController.rejectBonus = function(userish, bonusId, currency, cb) {
        if (ensureObjectId(bonusId) === null) return cb(new HTTPError(400, "invalid bonus id"));
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            if (!user.bonusOffers) return cb(new HTTPError(412, "No bonus offers available"));
            if (!user.bonusOffers[currency]) return cb(new HTTPError(400, "Invalid currency"));
            if (!user.bonusOffers[currency][bonusId]) return cb(new HTTPError(400, "Invalid bonus index"));
            // extract bonus from offers
            var updateDoc = {
                $unset:{},
                $inc: {'bonusStats.rejected': 1}
            };
            updateDoc.$unset['bonusOffers.' + currency + '.' + bonusId] = "";
            delete user.bonusOffers[currency][bonusId];
            Users.update({_id:user._id}, updateDoc, function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                return cb(undefined, user);
            });
        });
    };

    UserController.startBonus = function(userish, bonusId, initial, currency, cb) {
        if (ensureObjectId(bonusId) === null) return cb(new HTTPError(400, "invalid bonus id"));
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            if (!user.activeBonuses) return cb(new HTTPError(412, "user has no bonuses active"));
            if (!user.activeBonuses[currency]) return cb(new HTTPError(412, "user has no bonuses for currency " + currency));
            if (!user.activeBonuses[currency][bonusId]) return cb(new HTTPError(400, "invalid bonus id"));
            var bonus = extend({}, user.activeBonuses[currency][bonusId]);
            // if it's already been started, just return
            var key = 'activeBonuses.' + currency + '.' + bonusId;
            var updateDoc = {
                $set: {},
                $inc: {}
            };
            var started = new Date();
            // if the bonus is already "started"
            if (bonus.started) {
                // only match bonuses get updated
                if (bonus.type !== 'match') {
                    return cb(undefined, user);
                }
                updateDoc.$inc['bonusStats.updated'] = 1;
            } else {
                updateDoc.$set[key + ".started"] = started;
                updateDoc.$inc['bonusStats.started'] = 1;
            }
            user.activeBonuses[currency][bonusId].started = started;
            if (initial === null) {
                if (!bonus.initial) {
                    return cb(new HTTPError(400, "initial value given is `null' but the bonus conf has no fixed initial value"));
                } else {
                    initial = bonus.initial;
                    updateDoc.$set[key + ".finalValue"] = initial;
                    updateDoc.$set[key + ".rolloverValue"] = initial;
                    user.activeBonuses[currency][bonusId].finalValue = initial;
                    user.activeBonuses[currency][bonusId].rolloverValue = initial;
                }
            } else {
                var original = initial;
                // tests for when a bonus conf has a max value set
                if (bonus.max) {
                    // if none of the bonus has been used, init it to 0
                    if (!bonus.used) {
                        bonus.used = 0;
                    }
                    // get the amount left to be given
                    var headroom = bonus.max - bonus.used;
                    if (headroom > 0) {
                        // is there is still bonus left to be used,
                        // get the initial amount
                        initial = Math.min(initial, headroom);
                    } else {
                        initial = 0;
                    }
                }
                updateDoc.$inc[key + ".rolloverValue"] = initial + original;
                updateDoc.$inc[key + ".initial"] = initial;
                updateDoc.$inc[key + ".finalValue"] = initial;
                updateDoc.$inc[key + ".used"] = initial;
                if (!user.activeBonuses[currency][bonusId].initial) user.activeBonuses[currency][bonusId].initial = 0;
                if (!user.activeBonuses[currency][bonusId].finalValue) user.activeBonuses[currency][bonusId].finalValue = 0;
                if (!user.activeBonuses[currency][bonusId].rolloverValue) user.activeBonuses[currency][bonusId].rolloverValue = 0;
                user.activeBonuses[currency][bonusId].initial += initial;
                user.activeBonuses[currency][bonusId].finalValue += initial;
                user.activeBonuses[currency][bonusId].rolloverValue += initial + original;
            }
            updateDoc.$inc['balance.' + currency] = initial;
            user.balance[currency] += initial;
            TransactionController.create(user._id, {
                amtIn: initial,
                meta: {},
                type: bonus.type + '-bonus',
                refId: 'bonus:' + bonus._id + ':' + new Date().getTime(),
                currency: currency
            }, function(err) {
                if (err) return cb(new HTTPError(500, "error creating bonus transaction: " + err.message));
                Users.update({_id:user._id}, updateDoc, function(err) {
                    if (err) return cb(new HTTPError(500, err.message));
                    UserController.saveNotification(user._id, {
                        subject: bonus.type + ' bonus has been activated',
                        message: "Congratulations! Your " + bonus.type + " bonus of " + initial.toBitcoin() + " BTC has been applied to your account.  Once you have met the unlock requirement, your bonus will be available for withdrawal.\n\nThe unlock requirement for your bonus is " + bonus.unlockMultiplier + "x. That means you'll need to wager " + bonus.unlockMultiplier + "x the amount of your bonus plus deposit, or " + ((initial + original)* bonus.unlockMultiplier).toBitcoin() + "BTC to unlock the balance for withdrawal.\n\nPlease contact us if you have any questions or concerns. Thank you!\nBetCoin Customer Service",
                        type: bonus.type + '-bonus',
                        data: bonus,
                        initial: initial.toBitcoin(),
                        unlockMultiplier: bonus.unlockMultiplier,
                        unlockAmount: ((initial + original)* bonus.unlockMultiplier).toBitcoin(),
                        sendEmail: 'bonus_activated'
                    });
                    cb(undefined, user);
                });
            });
        });
    };

    UserController.updateBonusFinal = function(userish, amount, currency, cb) {
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            if (!user.activeBonuses) return cb(new HTTPError(412, "user has no bonuses active"));
            if (!user.activeBonuses[currency]) return cb(new HTTPError(412, "user has no bonuses for currency " + currency));
            // if there are no bonuses to check, return
            if (!Object.keys(user.activeBonuses[currency]).length) return cb(undefined, user);
            var bonus = UserController.getOldestBonus(user, currency);
            var updateDoc = {};
            var keySuffix = currency + '.' + bonus._id;
            var key = 'activeBonuses.' + keySuffix;
            var exhaustedBonusesKey = 'exhaustedBonuses.' + keySuffix;
            var availableBalanceKey = 'availableBalance.' + currency;
            if (!bonus.started) {
                // they have a bonus, but have not started, just
                // increment available balance and move on with your
                // life
                updateDoc.$inc = {};
                updateDoc.$inc[availableBalanceKey] = amount;
                user.availableBalance[currency] += amount;
            } else if (bonus.finalValue + amount <= 0) {
                updateDoc.$unset = {};
                updateDoc.$unset[key] = "";
                updateDoc.$inc = {'bonusStats.exhausted': 1};
                updateDoc.$inc[availableBalanceKey] = amount;
                user.availableBalance[currency] += amount;
                if (!user.exhaustedBonuses) user.exhaustedBonuses = {};
                if (!user.exhaustedBonuses[currency]) user.exhaustedBonuses[currency] = {};
                user.exhaustedBonuses[currency][bonus._id] = extend({}, bonus);
                updateDoc.$set = {};
                updateDoc.$set[exhaustedBonusesKey] = bonus;
                delete user.activeBonuses[currency][bonus._id];
                logger.debug("clearing dead bonus");
            } else {
                updateDoc.$inc = {};
                updateDoc.$inc[key + '.finalValue'] = amount;
                updateDoc.$set= {};
                updateDoc.$set[key + '.exhausted'] = false;
                if (bonus.finalValue < 0) {
                    updateDoc.$inc[availableBalanceKey] = (-1 * bonus.finalValue);
                    user.availableBalance[currency] -= bonus.finalValue;
                }
                user.activeBonuses[currency][bonus._id].finalValue += amount;
                user.activeBonuses[currency][bonus._id].exhausted = false;
                logger.debug("finalValue        : %d", user.activeBonuses[currency][bonus._id].finalValue.toBitcoin());
            }
            // logger.debug(JSON.stringify(updateDoc, null, 2), JSON.stringify(bonus, null, 2), amount);
            Users.update({_id: user._id}, updateDoc, function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                if (updateDoc.$inc !== undefined) {
                    return cb(undefined, user);
                } else {
                    // If we did not increment a bonus, then we
                    // removed one. Run this again for the next bonus
                    return UserController.updateBonusFinal(user, amount, currency, cb);
                }
            });
        });
    };

    UserController.removeExhaustedBonuses = function(userish, currency, cb) {
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            var bonuses = UserController.getBonusArray(user, currency);
            var updateDoc = {$unset:{}};
            var key = 'activeBonuses.' + currency;
            bonuses.forEach(function(bonus) {
                if (bonus.exhausted !== false) {
                    updateDoc.$unset[key + '.' + bonus._id] = "";
                    delete user.activeBonuses[currency][bonus._id];
                }
            });
            Users.update({_id: user._id}, updateDoc, function(err) {
                if (err) return cb(new HTTPError(500, "error removeinfg exhausted bonuses: " + err.message));
                return cb(undefined, user);
            });
        });
    };

    UserController.updateBonuses = function(userish, currency, wager, appliedWager, cb) {
        if (cb === undefined && 'function' === typeof appliedWager) {
            cb = appliedWager;
            appliedWager = wager;
        }
        if (wager === 0) {
            return UserController.removeExhaustedBonuses(userish, currency, cb);
        }
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            if (!user.activeBonuses) return cb(new HTTPError(412, "user has no bonuses active"));
            if (!user.activeBonuses[currency]) return cb(new HTTPError(412, "user has no bonuses for currency " + currency));
            // if there are no bonuses to check, return
            if (!Object.keys(user.activeBonuses[currency]).length) return cb(undefined, user);
            var updateDoc = {};
            var bonuses = UserController.getBonusArray(user, currency);
            var runUpdate = function() {
                // logger.debug("updateBonuses update doc %s", JSON.stringify(updateDoc, null, 2));
                if (Object.keys(updateDoc).length) {
                    Users.update({_id: user._id}, updateDoc, function(err) {
                        if (err) {
                            logger.error(err);
                            return cb(new HTTPError(500, err.message));
                        }
                        looper();
                    });
                } else {
                    looper();
                }
            };
            var looper = function() {
                updateDoc = {};
                var bonusConf = bonuses.shift();
                // if none are left or the wager has been used up, return
                if (bonusConf === undefined || appliedWager <= 0) return cb(undefined, user);
                // if this bonus has not been started, move to the next
                var bonusId = bonusConf._id;
                if (!bonusConf.started) {
                    return looper();
                }
                var newWagered = bonusConf.wagered + appliedWager;
                var key = 'activeBonuses.' + currency;
                var activeBonusKey = key + '.' + bonusId;
                var exhaustedBonusesKey = 'exhaustedBonuses.' + currency + '.' + bonusId;
                var availableBalanceKey = 'availableBalance.' + currency;
                var newBonusValue = bonusConf.finalValue - wager;
                if (newBonusValue <= 0) {
                    if (bonusConf.exhausted) {
                        logger.debug("bonus exhausted, removing it");
                        updateDoc.$unset = {};
                        updateDoc.$inc = {'bonusStats.exhausted': 1};
                        updateDoc.$unset[activeBonusKey] = "";
                        if (!user.exhaustedBonuses) user.exhaustedBonuses = {};
                        if (!user.exhaustedBonuses[currency]) user.exhaustedBonuses[currency] = {};
                        user.exhaustedBonuses[currency][bonusId] = extend({}, bonusConf);
                        updateDoc.$set = {};
                        updateDoc.$set[exhaustedBonusesKey] = bonusConf;
                        delete user.activeBonuses[currency][bonusId];
                        runUpdate();
                    } else {
                        logger.debug("bonus flagged as exhausted");
                        updateDoc.$inc = {};
                        updateDoc.$set = {};
                        user.activeBonuses[currency][bonusId].exhausted = new Date();
                        updateDoc.$set[activeBonusKey + '.exhausted'] = user.activeBonuses[currency][bonusId].exhausted;
                        updateDoc.$inc[activeBonusKey + '.wagered'] = appliedWager;
                        updateDoc.$inc[activeBonusKey + '.finalValue'] = -1 * wager;
                        user.activeBonuses[currency][bonusId].wagered += appliedWager;
                        user.activeBonuses[currency][bonusId].finalValue -= wager;
                        logger.debug("wagered           : %d", newWagered.toBitcoin());
                        logger.debug("finalValue        : %d", user.activeBonuses[currency][bonusId].finalValue.toBitcoin());
                        logger.debug("wagered %dx rollover so far (%dx%d required)", (newWagered / bonusConf.rolloverValue), bonusConf.unlockMultiplier, bonusConf.rolloverValue.toBitcoin());
                        // final balance is negative here
                        updateDoc.$inc[availableBalanceKey] = user.activeBonuses[currency][bonusId].finalValue;
                        user.availableBalance[currency] += user.activeBonuses[currency][bonusId].finalValue;
                        appliedWager += bonusConf.finalValue;
                        runUpdate();
                    }
                } else if (newWagered >= (bonusConf.rolloverValue * bonusConf.unlockMultiplier)) {
                    logger.debug("bonus threshold met, unlocking");
                    var unlockedKey = 'unlockedBonuses.' + currency + '.' + bonusConf._id;
                    var unlockedBonus = extend({}, bonusConf);
                    unlockedBonus.unlocked = new Date();
                    unlockedBonus.wagered = newWagered;
                    unlockedBonus.finalValue -= wager;
                    updateDoc.$unset = {};
                    updateDoc.$set = {};
                    updateDoc.$inc = {'bonusStats.completed': 1};
                    updateDoc.$set[unlockedKey] = unlockedBonus;
                    if (user.unlockedBonuses === undefined) user.unlockedBonuses = {};
                    if (user.unlockedBonuses[currency] === undefined) user.unlockedBonuses[currency] = [];
                    user.unlockedBonuses[currency][bonusConf._id] = unlockedBonus;
                    updateDoc.$unset[activeBonusKey] = "";
                    updateDoc.$inc[availableBalanceKey] = bonusConf.finalValue - wager;
                    user.availableBalance[currency] += bonusConf.finalValue - wager;
                    logger.debug("wagered           : %d", newWagered.toBitcoin());
                    logger.debug("finalValue        : %d", (user.activeBonuses[currency][bonusId].finalValue - wager).toBitcoin());
                    logger.debug("wagered %dx rollover so far (%dx%d required)", (newWagered / bonusConf.rolloverValue), bonusConf.unlockMultiplier, bonusConf.rolloverValue.toBitcoin());
                    delete user.activeBonuses[currency][bonusConf._id];
                    UserController.saveNotification(user._id, {
                        subject: unlockedBonus.type + ' bonus unlocked',
                        message: "Congratulations! Your " + unlockedBonus.type + " bonus has been unlocked and is available for withdrawal!\n\nPlease contact us if you have any questions or concerns. Thank you!\nBetCoin Customer Service",
                        type: unlockedBonus.type + '-bonus',
                        data: unlockedBonus,
                        finalValue: bonusConf.finalValue.toBitcoin(),
                        sendEmail: 'bonus_unlocked'
                    });
                    runUpdate();
                } else {
                    updateDoc.$inc = {};
                    updateDoc.$inc[activeBonusKey + '.wagered'] = appliedWager;
                    updateDoc.$inc[activeBonusKey + '.finalValue'] = -1 * wager;
                    user.activeBonuses[currency][bonusId].wagered += appliedWager;
                    user.activeBonuses[currency][bonusId].finalValue -= wager;
                    logger.debug("wagered           : %d", newWagered.toBitcoin());
                    logger.debug("finalValue        : %d", user.activeBonuses[currency][bonusId].finalValue.toBitcoin());
                    logger.debug("wagered %dx rollover so far (%dx%d required)", (newWagered / bonusConf.rolloverValue), bonusConf.unlockMultiplier, bonusConf.rolloverValue.toBitcoin());
                    appliedWager = 0;
                    runUpdate();
                }
            };
            looper();
        });
    };

    UserController.getBonusHistory = function(userish, currency, cb) {
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            var allBonuses = [];
            [
                'bonusOffers',
                'activeBonuses',
                'unlockedBonuses',
                'exhaustedBonuses'
            ].forEach(function(err, bonusStatus) {
                if (user[bonusStatus] && user[bonusStatus][currency]) {
                    var bonuses = user[bonusStatus][currency];
                    for (var bonusId in bonuses) {
                        if (bonuses.hasOwnProperty(bonusId)) allBonuses.push(bonuses[bonusId]);
                    }
                }
            });
            allBonuses.sort(function(a, b) {
                if (a.offered < b.offered) return 1;
                if (a.offered > b.offered) return -1;
                return 0;
            });
            cb(undefined, allBonuses);
        });
    };

    UserController.getOpenMatchBonuses = function(user, currency) {
        var indecies = [];
        if (user.activeBonuses && 'object' === typeof user.activeBonuses[currency]) {
            var bonuses = UserController.getBonusArray(user, currency);
            bonuses.forEach(function(bonus) {
                if (bonus.type === "match" && bonus.exhausted === false) {
                    indecies.push(bonus._id);
                }
            });
        }
        return indecies;
    };

    UserController.activeBonusCount = function(user, currency) {
        var indecies = [];
        if (user.activeBonuses && 'object' === typeof user.activeBonuses[currency]) {
            var bonuses = UserController.getBonusArray(user, currency);
            bonuses.forEach(function(bonus) {
                if (bonus.exhausted === false && bonus.started) {
                    indecies.push(bonus._id);
                }
            });
        }
        return indecies.length;
    };

    UserController.getOldestBonus = function(user, currency) {
        var oldest = null;
        for (var bonusId in user.activeBonuses[currency]) {
            if (user.activeBonuses[currency].hasOwnProperty(bonusId)) {
                if (oldest === null) {
                    oldest = user.activeBonuses[currency][bonusId];
                } else if (user.activeBonuses[currency][bonusId].accepted < oldest.accepted) {
                    oldest = user.activeBonuses[currency][bonusId];
                }
            }
        }
        return extend({}, oldest);
    };

    UserController.getBonusArray = function(user, currency) {
        var bonuses = [];
        for (var bonusId in user.activeBonuses[currency]) {
            if (user.activeBonuses[currency].hasOwnProperty(bonusId)) {
                bonuses.push(extend({}, user.activeBonuses[currency][bonusId]));
            }
        }
        bonuses.sort(function(a, b) {
            if (a.accepted < b.accepted) return -1;
            if (a.accepted > b.accepted) return 1;
            return 0;
        });
        return bonuses;
    };

    UserController.bonusCount = function(user, currency) {
        if (user.activeBonuses && 'object' === typeof user.activeBonuses[currency]) {
            return Object.keys(user.activeBonuses[currency]).length;
        } else {
            return 0;
        }
    };

    UserController.expireBonusOffers = function(currency, cb) {
        var now = new Date();
        var expireDate = new Date(now - MAX_BONUS_AGE);
        var query = {
            updated: {$gt: new Date(expireDate - (24 * 60 * 60 * 1000))}
        };
        var usersUpdated = 0;
        Users.find(query).toArray(function(err, users) {
            if (err) return cb(new HTTPError(500, err.message));
            logger.info("checking %d users for expired bonuses", users.length);
            async.eachLimit(users, 10, function(user, done) {
                var updateDoc = {
                    $unset:{}
                };
                var totalExpiredValue = 0;
                if (user.activeBonuses && user.activeBonuses[currency]) {
                    for (var bonusId in user.activeBonuses[currency]) {
                        if (user.activeBonuses[currency].hasOwnProperty(bonusId)) {
                            var bonus = user.activeBonuses[currency][bonusId];
                            if (bonus.accepted < expireDate) {
                                updateDoc.$unset['activeBonuses.' + currency + '.' + bonusId] = "";
                                totalExpiredValue += bonus.finalValue;
                            }
                        }
                    }
                }
                if (user.bonusOffers && user.bonusOffers[currency]) {
                    for (var bonusOfferId in user.bonusOffers[currency]) {
                        if (user.bonusOffers[currency].hasOwnProperty(bonusOfferId)) {
                            var bonusOffer = user.bonusOffers[currency][bonusOfferId];
                            if (bonusOffer.offered < expireDate) {
                                updateDoc.$unset['bonusOffers.' + currency + '.' + bonusOfferId] = "";
                            }
                        }
                    }
                }
                if (Object.keys(updateDoc.$unset).length) {
                    // if there is an expired ACTIVE bonus, debit the
                    // player by the amout expiring, otherwise, just
                    // run the update doc
                    if (totalExpiredValue) {
                        UserController.debit(user, totalExpiredValue, {
                            currency: currency,
                            meta: {},
                            refId: 'bonus-expire:' + user._id.toHexString() + ":" + new Date().getTime(),
                            type: 'bonus-expire'
                        }, function(err) {
                            if (err) return done(err);
                            Users.update({_id: user._id}, updateDoc, function(err) {
                                if (err) return done(err);
                                usersUpdated += 1;
                                return done();
                            });
                        });
                    } else {
                        Users.update({_id: user._id}, updateDoc, function(err) {
                            if (err) return done(err);
                            usersUpdated += 1;
                            return done();
                        });
                    }
                } else {
                    return done();
                }
            }, function(err) {
                if (err) return cb(new HTTPError(500, "error process bonus expirations: " + err.message));
                return cb(undefined, usersUpdated);
            });
        });
    };

    /**
     * Bitcoin
     */

    var lockUser = function(userish, cb) {
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            Users.update(user, {$set: {lock: true}}, function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                cb();
            });
        });
    };

    var unlockUser = function(userish, cb) {
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            logger.debug('unlocking user %s', user.alias);
            Users.update({_id: user._id}, {$set: {lock: false}}, function(err, success) {
                if (err) return cb(new HTTPError(500, err.message));
                if (!success) return cb(new HTTPError(500, 'error updating user'));
                logger.debug('user %s unlocked', user.alias);
                cb();
            });
        });
    };

    UserController.lockUser = lockUser;
    UserController.unlockUser = unlockUser;

    UserController.checkWithdrawAddressExist = function(userId, address, cb){
        if(!address || address === '')
            return cb();
        var query = {$or:[]};
        var mainAddressQuery = {}, backupAddressQuery = {};
        mainAddressQuery['withdraw.btc.address'] = address;
        backupAddressQuery['withdraw.btc.backup.address'] = address;
        query.$or.push(mainAddressQuery);
        query.$or.push(backupAddressQuery);
        Users.findOne(query, function(err, doc){
            if(err) return cb(new HTTPError(500, 'Internal Error'));
            if(doc && doc._id.toString() !== ensureObjectId(userId).toString()){
                return cb(new HTTPError(400, 'The address is already used by the other users', '010'));
            }
            cb();
        });
    };

    UserController.getChallengeString = function (userId, cb) {
        userId = ensureObjectId(userId);
        if (userId === null) return cb(new HTTPError(400, 'invalid user id', '004'));
        var challenge = getToken();
        Users.update({_id: userId}, {$set: {challenge: challenge}}, function(err) {
            if (err) return cb(new HTTPError(500, err.message));
            cb(undefined, challenge);
        });
    };

    UserController.getChallengeStringForPasswordReset = function (){
        return getToken();
    };

    UserController.credit = function(userish, amount, options, cb) {
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            var currency = options.currency || 'btc';
            var newBalance = user.balance[currency] + amount;
            var meta = extend(options.meta || {}, {balance: newBalance});
            TransactionController.create(user._id, {
                amtIn: amount,
                meta: meta,
                type: options.type || 'credit',
                refId: options.refId,
                currency: currency
            }, function(err, transaction) {
                if (err) return cb(err);
                logger.info('%d credit (%s) for user %s (%s)', amount.toBitcoinString(), transaction.type, user.alias, user._id, {});
                var updateDoc = {
                    $inc: {},
                    $set: {updated: new Date()}
                };
                user.balance[currency] += transaction.amtIn;
                updateDoc.$inc['balance.' + currency] = transaction.amtIn;
                var bonusCount = UserController.bonusCount(user, currency);
                if (user.availableBalance && user.availableBalance[currency] !== undefined) {
                    if (user.availableBalance[currency] > (user.balance[currency] - transaction.amtIn)) {
                        logger.warn("user %s's (%s) available balance is higher than their full balance by %d", user.alias, user._id, (user.availableBalance[currency] - (user.balance[currency] - transaction.amtIn)).toBitcoin());
                    } else if (DEPOSIT_REGEXP.test(transaction.type)) {
                        updateDoc.$inc['availableBalance.' + currency] = transaction.amtIn;
                        user.availableBalance[currency] += transaction.amtIn;
                    } else if (CASHBACK_REGEXP.test(transaction.type)) {
                        updateDoc.$inc['availableBalance.' + currency] = transaction.amtIn;
                        user.availableBalance[currency] += transaction.amtIn;
                    } else if (AFFILIATE_REGEXP.test(transaction.type)) {
                        updateDoc.$inc['availableBalance.' + currency] = transaction.amtIn;
                        user.availableBalance[currency] += transaction.amtIn;
                    } else if (bonusCount === 0) {
                        updateDoc.$inc['availableBalance.' + currency] = transaction.amtIn;
                        user.availableBalance[currency] += transaction.amtIn;
                    }
                } else {
                    if (!user.availableBalance) user.availableBalance = {};
                    updateDoc.$set['availableBalance.' + currency] = user.balance[currency];
                    user.availableBalance[currency] = user.balance[currency];
                }
                Users.update({_id: user._id}, updateDoc, function(err) {
                    if (err) return new HTTPError(500, "error updating user!", '034');
                    if(transaction.type === 'deposit') {
                        UserController.saveNotification(user._id, {
                            subject: 'Deposit success',
                            type: 'deposit',
                            data: transaction
                        });
                    }
                    if (newBalance !== user.balance[currency]) {
                        logger.warn("Balance discrepancy after credit! %s (%s)", user.alias, user._id, {});
                    }
                    var openMatchBonuses = UserController.getOpenMatchBonuses(user, currency);
                    // if type contains 'winnings', update the user's bonus values
                    if (WINNINGS_REGEXP.test(transaction.type) && bonusCount !== 0) {
                        logger.debug("winnings detected, updating bonuses");
                        UserController.updateBonusFinal(user, transaction.amtIn, currency, function(err, _user) {
                            if (err) {
                                if (err.code !== 412) {
                                    return cb(err);
                                } else {
                                    logger.warn(err.message);
                                    return cb(undefined, user, transaction);
                                }
                            }
                            logger.debug("balance           : %d", _user.balance[currency].toBitcoin());
                            logger.debug("available balance : %d", _user.availableBalance[currency].toBitcoin());
                            cb(undefined, _user, transaction);
                        });
                    } else if (DEPOSIT_REGEXP.test(transaction.type) && openMatchBonuses.length) {
                        logger.debug("User has an open match bonus offer, applying");
                        UserController.startBonus(user, openMatchBonuses[0], transaction.amtIn, currency, function(err, _user) {
                            if (err) {
                                if (err.code !== 412 && err.code !== 400) {
                                    return cb(err);
                                } else {
                                    logger.warn(err.message);
                                    return cb(undefined, user, transaction);
                                }
                            }
                            logger.debug("balance           : %d", _user.balance[currency].toBitcoin());
                            logger.debug("available balance : %d", _user.availableBalance[currency].toBitcoin());
                            cb(undefined, _user, transaction);
                        });
                    } else {
                        logger.debug("balance           : %d", user.balance[currency].toBitcoin());
                        logger.debug("available balance : %d", user.availableBalance[currency].toBitcoin());
                        cb(undefined, user, transaction);
                    }
                });
            });
        });
    };

    UserController.debit = function(userish, amount, options, cb) {
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            var currency = options.currency || 'btc';
            if (!user.withdraw[currency]) {
                logger.warn('user %s (%s) spinning with no withdraw address', user.alias, user._id.toHexString());
                return cb(new HTTPError(417, 'no withdraw address for ' + currency, '035'));
            }
            if (!user.balance[currency]) {
                user.balance[currency] = 0;
            }
            if (amount > user.balance[currency]) {
                logger.warn('user %s (%s) trying to debit %d when balance is %d', user.alias, user._id, amount.toBitcoin(), user.balance[currency].toBitcoin());
                return cb(new HTTPError(417, "debit amount exceeds balance", '036'));
            }
            var newBalance = user.balance[currency] - amount;
            var meta = extend(options.meta || {}, {balance: newBalance});
            TransactionController.create(user._id, {
                amtOut: amount,
                meta: meta,
                type: options.type || 'credit',
                refId: options.refId,
                currency: currency
            }, function(err, transaction) {
                if (err) return cb(err);
                logger.info('%d debit (%s) for user %s (%s)', amount.toBitcoinString(), transaction.type, user.alias, user._id, {});
                var updateDoc = {
                    $inc: {},
                    $set: {updated: new Date()}
                };
                user.balance[currency] -= transaction.amtOut;
                updateDoc.$inc['balance.' + currency] = (transaction.amtOut * -1);
                var bonusCount = UserController.bonusCount(user, currency);
                var activeBonusCount = UserController.activeBonusCount(user, currency);
                logger.debug("user has %d bonus%s (%d active)", bonusCount, bonusCount === 1 ? '' : 'es', activeBonusCount);
                if (user.availableBalance && user.availableBalance[currency] !== undefined) {
                    if (user.availableBalance[currency] > (user.balance[currency] + transaction.amtOut)) {
                        logger.warn("user %s's (%s) available balance is higher than their full balance by %d", user.alias, user._id, (user.availableBalance[currency] - (user.balance[currency] + transaction.amtOut)).toBitcoin());
                    } else if (WITHDRAW_REGEXP.test(transaction.type)) {
                        logger.debug("withdraw, updating available balance");
                        user.availableBalance[currency] -= transaction.amtOut;
                        updateDoc.$inc['availableBalance.' + currency] = (transaction.amtOut * -1);
                    } else if (activeBonusCount === 0) {
                        logger.debug("no bonuses to run, updating available balance");
                        user.availableBalance[currency] -= transaction.amtOut;
                        updateDoc.$inc['availableBalance.' + currency] = (transaction.amtOut * -1);
                    }
                } else {
                    if (!user.availableBalance) user.availableBalance = {};
                    updateDoc.$set['availableBalance.' + currency] = user.balance[currency];
                    user.availableBalance[currency] = user.balance[currency];
                }
                // logger.debug("update doc %s", JSON.stringify(updateDoc, null, 2));
                Users.update({_id: user._id}, updateDoc, function(err) {
                    if (err) return new HTTPError(500, "error updating user!", '034');
                    if (newBalance !== user.balance[currency]) {
                        logger.warn("Balance discrepency after debit! %s (%s)", user.alias, user._id, {});
                    }
                    if (WAGER_REGEXP.test(transaction.type) && activeBonusCount === 0) {
                        UserController.processAffiliate(user, transaction, currency);
                    }
                    if (WAGER_REGEXP.test(transaction.type) && bonusCount !== 0) {
                        logger.debug("wager detected, updating bonus values");
                        var bonusWager = transaction.amtOut;
                        if (transaction.meta && transaction.meta.gameOdds) {
                            if (transaction.meta.gameOdds > 0.5) {
                                var rolloverPercent = (1 - ((transaction.meta.gameOdds - 0.5) / 0.5));
                                bonusWager = Math.floor(rolloverPercent * bonusWager);
                                logger.info("game odds %d%, adjusting wager for bonus %d to %d (%d%)",
                                            transaction.meta.gameOdds * 100,
                                            transaction.amtOut.toBitcoin(),
                                            bonusWager.toBitcoin(),
                                            rolloverPercent * 100);
                            }
                        }
                        UserController.updateBonuses(user, currency, transaction.amtOut, bonusWager, function(err, _user) {
                            if (err) {
                                if (err.code !== 412) {
                                    return cb(err);
                                } else {
                                    logger.warn(err.message);
                                    return cb(undefined, user, transaction);
                                }
                            }
                            logger.debug("balance           : %d", _user.balance[currency].toBitcoin());
                            logger.debug("available balance : %d", _user.availableBalance[currency].toBitcoin());
                            cb(undefined, _user, transaction);
                        });
                    } else {
                        logger.debug("balance           : %d", user.balance[currency].toBitcoin());
                        if(user.availableBalance && user.availableBalance[currency] && !isNaN(user.availableBalance[currency])) {
                            logger.debug("available balance : %d", user.availableBalance[currency].toBitcoin());
                        }
                        cb(undefined, user, transaction);
                    }
                });
            });
        });
    };

    var processWithdraw = function(user, currency, amount, isManual, cb) {
        var bitcoind = UserController.getContainer().get('bitcoind');
        var txfee = UserController.getContainer().get('constants').txfee;
        amount = parseInt(amount, 10);
        if (isNaN(amount) || amount <= 0) return cb(new HTTPError(400, "invalid amount", '026'));
        if ((/\./).test(amount.toString())) {
            return cb(new HTTPError(400, 'amount must be in satoshi', '028'));
        }
        if (user.availableBalance[currency] === undefined) {
            user.availableBalance[currency] = 0;
        }
        // if they are withdrawing all of the money, deduct the tx fee automatically
        if (amount === user.availableBalance[currency]) {
            amount -= txfee;
            logger.info("withdrawing full available balance, adjusting amount by -%d", txfee.toBitcoin());
        }
        if (user.availableBalance[currency] < (amount + txfee)) {
            var adjust = (txfee - (user.availableBalance[currency] - amount));
            amount -= adjust;
            logger.info("not enough available for a tx fee, adjusting amount by -%d", adjust.toBitcoin());
        }
        if (user.availableBalance[currency] < (bitcoind.MIN_SATOSHI + txfee)) {
            return cb(new HTTPError(412, "your available balance is under " + bitcoind.MIN_SATOSHI + " satoshi", '029'));
        }
        if (user.availableBalance[currency] < (amount + txfee)) {
            return cb(new HTTPError(412, "debit amount greater than available balance", '029'));
        }
        if (amount < bitcoind.MIN_SATOSHI) {
            return cb(new HTTPError(400, "cannot withdraw less than " + bitcoind.MIN_SATOSHI.toBitcoin(), '027'));
        }
        var TransactionController = UserController.getContainer().get('TransactionController');
        async.waterfall([
            function(done) {
                TransactionController.getAuditTrail(currency, user._id, function(err, txs) {
                    if (err) return done(new HTTPError(500, 'withdraw error: ' + err.message, '030'));
                    return done(undefined, txs);
                });
            },
            function(txs, done) {
                var totalIn = 0;
                var totalOut = 0;
                var totalDeposited = 0;
                var totalWithdrawn = 0;
                var deposits = [];
                var withdraws = [];
                var lastBalance = 0;
                if (txs[0].type !== "withdraw") {
                    logger.info('never withdrawn, using all transaction history (%d items)', txs.length);
                } else {
                    var lastWithdraw = txs.shift();
                    if (lastWithdraw.meta.balance) {
                        lastBalance = lastWithdraw.meta.balance;
                    }
                    if (user.lastWithdraw) {
                        logger.info('using %d transactions since %s', txs.length, user.lastWithdraw.toISOString());
                    }
                    if (!isNaN(lastBalance)) {
                        logger.info('balance after last withdraw: %d', lastBalance.toBitcoin());
                    }
                }
                txs.forEach(function(tx) {
                    var amtIn = parseInt(tx.amtIn, 10);
                    var amtOut = parseInt(tx.amtOut, 10);
                    if (isNaN(amtIn) || isNaN(amtOut)) {
                        return logger.warn('found a tx with NaN for amount! %s', tx._id.toHexString());
                    }
                    totalIn += amtIn;
                    totalOut += amtOut;
                    if (tx.type === 'deposit') {
                        totalDeposited += amtIn;
                        deposits.push(tx);
                    } else if (tx.type === 'withdraw') {
                        totalWithdrawn += amtIn;
                        withdraws.push(tx);
                    }
                });
                var totalProfit = (totalIn - totalOut) - (totalDeposited - totalWithdrawn);
                var expectedBalance = (lastBalance + totalIn) - totalOut;
                logger.info('%d deposited (%d deposits)', totalDeposited.toBitcoin(), deposits.length);
                logger.info('%d withdrawn (%d withdraws) <- this should be 0', totalWithdrawn.toBitcoin(), withdraws.length);
                logger.info('totalIn: %d totalOut: %d', totalIn.toBitcoin(), totalOut.toBitcoin());
                logger.info('totalProfit: %d', totalProfit.toBitcoin());
                logger.info('expected balance: %d, db balance: %d', expectedBalance.toBitcoin(), user.balance[currency].toBitcoin());
                var confTest = true;
                // sync looper for getting confirmations
                var looper = function() {
                    var deposit = deposits.shift();
                    if (deposit !== undefined) {
                        bitcoind.findTransaction(deposit.meta.txid, function(err, btcTx) {
                            if (err) return done(new HTTPError(500, 'withdraw error: ' + err.message, '030'));
                            if (btcTx.confirmations < 1) confTest = false;
                            looper();
                        });
                    } else {
                        if (!confTest) return done(new HTTPError(423, "Not all deposits have at least 1 confirmation", '031'));
                        if (expectedBalance === user.balance[currency]) {
                            var outputs = {};
                            outputs[user.withdraw[currency].address] = amount;
                            var txParams = {
                                inputs: [],
                                outputs: outputs,
                                txfee: txfee,
                                forceEmptyInputs: true,
                                selectFrom: 'all',
                                minConf: 101
                            };
                            if (isManual) {
                                logger.info("preparing cashout transaction");
                                bitcoind.prepare(txParams, function(err, txid, rawTx) {
                                    if (err) return done(new HTTPError(500, 'withdraw error: ' + err.message, '030'));
                                    if (rawTx) {
                                        return done(undefined, {
                                            txid: txid,
                                            status: 'prepared',
                                            fee: rawTx.txfee,
                                            hex: rawTx.signedTx,
                                            amount: amount
                                        });
                                    } else {
                                        logger.warn('no rawTx returned from bitcoind.prepare');
                                        return done(new HTTPError(500, "internal server error"));
                                    }
                                });
                            } else {
                                logger.info("sending cashout transaction");
                                bitcoind.send(txParams, function(err, txid, fee) {
                                    if (err) return done(new HTTPError(500, 'withdraw error: ' + err.message, '030'));
                                    return done(undefined, {
                                        txid: txid,
                                        status: 'sent',
                                        fee: fee,
                                        amount: amount
                                    });
                                });
                            }
                        } else {
                            var errStr = 'balance discrepency for %s: ';
                            var offBy = 0;
                            if (expectedBalance > user.balance[currency]) {
                                errStr += 'transaction records indicate %d missing from account balance';
                                offBy = expectedBalance - user.balance[currency];
                            } else {
                                errStr += 'user record claims to have %d more than transaction trail';
                                offBy = user.balance[currency] - expectedBalance;
                            }
                            logger.error(errStr, user._id.toHexString(), offBy.toBitcoin());
                            done(new HTTPError(500, "balance discrepency", '033'));
                        }
                    }
                };
                looper();
            }
        ], function(err, txData) {
            return cb(err, txData);
        });
    };

    UserController.withdraw = function(userish, currency, amount, cb) {
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            async.waterfall([
                function(done) {
                    logger.info('##### cashing out %s (%s) #####', user.alias, user._id, {});
                    // if the user is already locked, return the realCb so the user is not unlocked yet
                    if (user.lock) {
                        logger.warn('##### end cashout %s (%s) - locked #####', user.alias, user._id, {});
                        return done(new HTTPError(423, "account locked", '072')); //realCb
                    }
                    lockUser(user, function(err) {
                        if (err) return done(err);
                        return done(undefined);
                    });

                },
                function(done) {
                    Config.findOne({_id: "cashoutLimits"}, function(err, cashoutLimits) {
                        if (err) return done(new HTTPError(500, "error getting cashout limits: " + err.message));
                        if (!cashoutLimits) {
                            cashoutLimits = {
                                _id: "cashoutLimits",
                                count: AUTO_CASHOUT_MAX_COUNT,
                                total: AUTO_CASHOUT_MAX_TOTAL
                            };
                            Config.insert(cashoutLimits, function(err) {
                                if (err) return done(new HTTPError(500, "error saving default cashout limits: " + err.message));
                                return done(undefined, cashoutLimits);
                            });
                        } else {
                            return done(undefined, cashoutLimits);
                        }
                    });
                },
                function(cashoutLimits, done) {
                    TransactionController.getManualTriggerCounts(function(err, cashoutTotals) {
                        var isManual = false;
                        if (err) {
                            logger.error("error getting todays cashouts, setting to manual");
                            isManual = true;
                        }
                        if (cashoutTotals.count + 1 > cashoutLimits.count) {
                            isManual = "count";
                            logger.info("Auto cashout count exceeded");
                        } else {
                            logger.info("%d of %d auto cashouts processed", cashoutTotals.count + 1, cashoutLimits.count);
                        }
                        if (cashoutTotals.total + amount > cashoutLimits.total) {
                            isManual = "total";
                            logger.info("Auto cashout total exceeded");
                        } else {
                            logger.info("%d of %d BTC total auto cashouts processed", (cashoutTotals.total + amount).toBitcoinString(), cashoutLimits.total.toBitcoinString());
                        }
                        return done(undefined, isManual);
                    });
                },
                function(isManual, done) {
                    if (!user.withdraw || !user.withdraw[currency]) return done(new HTTPError(412, "no withdraw address for " + currency, '035'));
                    if (!user.availableBalance) user.availableBalance = {};
                    if (!user.availableBalance[currency]) user.availableBalance[currency] = 0;
                    // ugh, no way to fix this in the bonus system, just check for it here
                    if (user.availableBalance[currency] > user.balance[currency]) {
                        user.availableBalance[currency] = user.balance[currency];
                    }
                    logger.info("withdrawing : %d", amount.toBitcoin());
                    logger.info("available   : %d", user.availableBalance[currency].toBitcoin());
                    if (amount > user.availableBalance[currency]) {
                        return done(new HTTPError(417, "Debit amount exceeds available balance of " + user.availableBalance[currency].toBitcoin(), '036'));
                    }
                    // anonymous users can only do full cashouts
                    if (user.anonymous) {
                        amount = user.availableBalance[currency];
                    }
                    processWithdraw(user, currency, amount, isManual, function(err, withdrawData) {
                        if (err) {
                            logger.error(err.message);
                            return done(err);
                        }
                        withdrawData.triggeredManual = isManual;
                        return done(undefined, withdrawData);
                    });
                },
                function(withdrawData, done) {
                    // debit the amount withdrawn plus the tx fee, the
                    // amount and fee are auto adjusted by the process
                    // withdraw function when the user withdraws their
                    // whole balance
                    var totalDebit = withdrawData.amount + withdrawData.fee;
                    UserController.debit(user._id, totalDebit, {
                        meta: withdrawData,
                        type: 'withdraw',
                        refId: withdrawData.txid,
                        currency: currency
                    }, function(err, user, transaction) {
                        if (err) {
                            logger.error(err.message);
                            return done(err);
                        }
                        return done(undefined, withdrawData, transaction);
                    });
                },
                function(withdrawData, transaction, done) {
                    withdrawData.internalTxid = transaction._id;
                    logger.info('withdraw success: ', withdrawData, {});
                    UserController.saveNotification(user._id, {
                        subject: 'Withdraw success',
                        type:'withdraw',
                        data: transaction,
                        message: 'transaction id: ' + transaction._id + ' BTC, fee: ' + withdrawData.fee + ' BTC'
                    });
                    Users.update({_id: user._id}, {
                        $set: { lastWithdraw: new Date(), updated: new Date() }
                    }, function(err, success) {
                        if (err || !success) logger.error('error setting lastWithdraw on user (probably not a big deal)');
                        return done(undefined, transaction);
                    });
                },
                function(transaction, done) {
                    Users.findOne({_id: user._id}, function(err, _user){
                        user = _user;
                        return done(err, transaction);
                    });
                }
            ], function(err, transaction) {
                // wrap the callback in the unlock function
                var realCb = cb;
                cb = function(error, data) {
                    unlockUser(user, function(err) {
                        if (err) {
                            logger.error('##### end cashout %s (%s) - unlock error #####', user.alias, user._id, {});
                            return realCb(err);
                        }
                        if (error) {
                            logger.error('##### end cashout %s (%s) - failed #####', user.alias, user._id, {});
                            return realCb(error);
                        }
                        logger.info('##### end cashout %s (%s) #####', user.alias, user._id, {});
                        return realCb(undefined, data);
                    });
                };
                if (err) {
                    // if the error was that the user was locked, then do
                    // not unlock before returning, use the realCb
                    if (err.code === 423 && err.message === "account locked") {
                        return realCb(err);
                    } else {
                        return cb(err);
                    }
                }
                return cb(undefined, {
                    user: user,
                    transaction: transaction
                });
            });
        });
    };

    UserController.addWithdrawAddress = function(userId, address, currency, cb) {
        userId = ensureObjectId(userId);
        if (userId === null) return cb(new HTTPError(400, 'invalid user id', '004'));
        var updateDoc = {$set: {challenge: null, updated: new Date()}};
        var currKey = 'withdraw.' + currency;
        updateDoc.$set[currKey] = {address: address, withdrawn: 0};
        UserController.checkWithdrawAddressExist(userId, address, function(err){
            if(err) return cb(err);
            Users.update({_id: userId}, updateDoc, function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                return cb(undefined, address);
            });
        });
    };

    /**
     * Backoffice
     */

    UserController.trustUser = function(userish, cb) {
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            Users.update({_id: user._id}, {$set: {trusted: true}}, function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                user.trusted = true;
                return cb(undefined, user);
            });
        });
    };

    UserController.untrustUser = function(userish, cb) {
        ensureUser(userish, function(err, user) {
            if (err) return cb(err);
            Users.update({_id: user._id}, {$set: {trusted: false}}, function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                user.trusted = false;
                return cb(undefined, user);
            });
        });
    };

    UserController.omitUser = function(userish, cb){
        ensureUser(userish, function(err, user){
            if(err) return cb(err);
            Users.update({_id: user._id}, {$set: {omitted: true}}, function(err){
                if(err) return cb(new HTTPError(500, err.message));
                cb();
            });
        });
    };

    UserController.unomitUser = function(userish, cb){
        ensureUser(userish, function(err, user){
            if(err) return cb(err);
            Users.update({_id: user._id}, {$set: {omitted: false}}, function(err){
                if(err) return cb(new HTTPError(500, err.message));
                cb();
            });
        });
    };

    return UserController;
};
