'use strict';


var async = require('async');
var crypto = require('crypto');

var TOKEN_HEADER = 'Api-Token';

module.exports = function(User, Bonus, auth, logger, io,
                          WalletController, HTTPError,
                          CURRENCIES, mailer, Wallet,
                          AffiliateRecord, getExchangeRate,
                          Config, HubspotApi) {

    var hubspotApi = new HubspotApi();

    var UserController = function() {
    };

    /*
     * Helper functions
     */

    var USERNAME_REGEXP = /^[^\s]{1,64}$/;
    var validUsername = function(username) {
        return username && USERNAME_REGEXP.test(username);
    };

    var validPassword = function(password) {
        if (!password) return false;
        if (password.length < 10) return false;
        return true;
    };

    UserController.prototype.scrubUpdateData = function(data, cb) {
        // make an array of functions to give to async
        var functions = [];
        // if the username is being changed, check it
        var self = this;
        if (data.username) {
            functions.push(function(done) {
                self.checkUsername(data.username, function(err) {
                    if (err) return done(err);
                    return done(undefined);
                });
            });
        }
        // check the password if it is being updated
        if (data.password) {
            if (data.password !== data.passwordConfirm) {
                return cb(new HTTPError(400, 'Passwords do not match'));
            } else {
                delete data.passwordConfirm;
            }
            if (!validPassword(data.password)) return cb(new HTTPError(400, "Invalid password"));
            functions.push(function(done) {
                auth.hashPassword(data.password, function(err, passhash) {
                    if (err) return done(new HTTPError(err.code || 500, err.message));
                    data.password = passhash;
                    return done(undefined);
                });
            });
        }
        // execute the functions then return the scrubbed data or error
        async.parallel(functions, function(err) {
            if (err) return cb(err);
            return cb(undefined, data);
        });
    };

    UserController.prototype.checkUsername = function(username, cb) {
        if (!username) return new cb(new HTTPError(400, "Missing username"));
        if (!validUsername(username)) return new cb(new HTTPError(400, "Invalid username"));
        User.get({username: username}, function(err, user) {
            if (err) return cb(new HTTPError(err.code || 500, err.message));
            if (user) return cb(new HTTPError(409, "Username exists"));
            Wallet.get({withdrawAddress: username}, function(err, wallet) {
                if (err) return cb(new HTTPError(err.code || 500, err.message));
                if (wallet) {
                    return User.get(wallet.userId(), function(err, user) {
                        if (err) return cb(err);
                        if (!user) return cb(new HTTPError(500));
                        return cb(undefined, user, wallet);
                    });
                }
                if (validUsername(username)) return cb();
                else return cb(new HTTPError(400, "Invalid username"));
            });
        });
    };

    /*
     * CRUD
     */

    UserController.prototype.create = function(req, res, next) {
        var userData = req.body;
        if (userData.anonymous) return this.createAnonymous(req, res, next);
        // check that the password confirmation matches the password
        if (userData.password !== userData.passwordConfirm) {
            return next(new HTTPError(400, 'Passwords do not match'));
        }
        // check the password
        if (!validPassword(userData.password)) {
            return next(new HTTPError(400, 'Invalid password'));
        }
        // if there is an email, assign it to pending and give
        // them an email token
        if (userData.email) {
            userData.pendingEmail = userData.email;
            delete userData.email;
            userData.emailToken = auth.generateToken();
        }
        userData = {
            anonymous: userData.anonymous || false,
            password: userData.password,
            username: userData.username,
            pendingEmail: userData.pendingEmail,
            emailToken: userData.emailToken,
            locale: req.locale,
            ip: req.ip
        };
        var self = this;
        async.waterfall([
            // check the username
            function(done) {
                self.checkUsername(userData.username, function(err) {
                    return done(err);
                });
            },
            function doAnIpCheck(done) {
                User.db.count({ip: userData.ip}, function(err, ipCount) {
                    if (err) {
                        logger.error("Error getting ip count: %s", err.message);
                        return done();
                    }
                    if (ipCount > 2) {
                        userData.lock = 'ip';
                        logger.warn("IP address %s is on auto lock, attempt %d", userData.ip, ipCount);
                    } else if (ipCount > 1) {
                        logger.warn("IP address %s is making a third account, auto lock at 4th attempt", userData.ip);
                    }
                    done();
                });
            },
            // hash the apossword and create the user object
            function(done) {
                auth.hashPassword(userData.password, function(err, passHash) {
                    if (err) return done(new HTTPError(err.code || 500, err.message));
                    userData.password = passHash;
                    // give a token so they are considered logged in
                    // at creation and can them make other calls for
                    // creating a wallet
                    userData.token = auth.generateToken();
                    return done();
                });
            },
            // check for an affiliate id
            function(done) {
                var affiliateToken = req.body.affiliateToken;
                if (!affiliateToken) return done(undefined, new User(userData));
                User.get({affiliateToken: affiliateToken}, function(err, user) {
                    if (err) return done(err);
                    if (!user) return done(undefined, new User(userData));
                    userData.affiliate = user.primary();
                    Config.get('associateBonus', function(err, associateBonus) {
                        if (err) {
                            logger.error("error getting new associate vip level config: %s", err.message);
                            return done(undefined, new User(userData));
                        }
                        userData.vipLevel = associateBonus.startingVipLevel;
                        return done(undefined, new User(userData));
                    });
                });
            },
            // save the user so we get an _id
            function(user, done) {
                user.save(done);
            },
            // make some wallets
            function(user, done) {
                user.wallets = {};
                async.each(CURRENCIES, function(currency, walletDone) {
                    var wc = new WalletController(currency);
                    wc.makeWallet({
                        user: user
                    }, function(err, wallet) {
                        if (err) return walletDone(err);
                        user.wallets[currency] = wallet;
                        return wallet.save(walletDone);
                    });
                }, function(err) {
                    return done(err, user);
                });
            },
            function(user, done) {
                if (user.affiliate()) {
                    async.each(CURRENCIES, function(currency, fin) {
                        var affRecord = new AffiliateRecord({
                            affiliateId: user.affiliate(),
                            associateId: user.primary(),
                            currency: currency
                        });
                        affRecord.save(fin);
                    }, function(err) {
                        if (err) logger.error("Error saving affiliate records for %s", user.primary());
                    });
                }
                done(undefined, user);
            },
            // send them an email
            function(user, done) {
                mailer.send(user.pendingEmail(), 'confirm', {user: user}, function(err) {
                    if (err) logger.error("Error sending confirmation email to %s: %s", user.pendingEmail(), err.message);
                    return done(undefined, user);
                });
            }
        ], function(err, user) {
            if (err) return next(err);
            // offer the user a bonus
            var now = new Date();
            Config.get('welcomeBonus', function(err, welcomeBonus) {
                if (err) {
                    logger.error("error getting welcome bonus config: %s", err.message);
                    return res.status(201).json(user.filter());
                }
                Config.get('associateBonus', function(err, associateBonus) {
                    if (err) {
                        logger.error("error getting associate bonus config: %s", err.message);
                        return res.status(201).json(user.filter());
                    }
                    var fiatAmount = welcomeBonus.amount[req.fiat];
                    var bonusAmount = (fiatAmount / getExchangeRate()[req.fiat]).toSatoshi();
                    if (user.affiliate()) {
                        fiatAmount = associateBonus.welcomeBonus[req.fiat];
                        bonusAmount = (fiatAmount / getExchangeRate()[req.fiat]).toSatoshi();
                    }
                    logger.info('Offering %d bitcoin bonus to new user %s', bonusAmount.toBitcoin(), user.primary());
                    var bonus = new Bonus({
                        userId: user.primary(),
                        type: Bonus.TYPE_STRAIGHT,
                        offeredAt: now,
                        activatedAt: now,
                        rollover: welcomeBonus.rollover,
                        initialValue: bonusAmount,
                        value: bonusAmount,
                        maxValue: bonusAmount,
                        currency: 'bitcoin',
                        meta: {
                            welcome: true,
                            promotion: 'welcome'
                        }
                    });
                    bonus.save(function(err) {
                        if (err) logger.error("error saving bonus", err.message);
                        bonus.accept(user.wallets.bitcoin, function(err) {
                            if (err) logger.error("Error accepting bonus: %s", err.message);
                            var multipliers = welcomeBonus.matchMultipliers;
                            var max = welcomeBonus.matchMax;
                            var rollover = welcomeBonus.matchRollover;
                            if (user.affiliate()) {
                                multipliers = associateBonus.matchMultipliers;
                                max = associateBonus.matchMax;
                                rollover = associateBonus.matchRollover;
                            }
                            async.each(multipliers, function(multiplier, done) {
                                var now = new Date();
                                var matchBonus = new Bonus({
                                    userId: user.primary(),
                                    type: Bonus.TYPE_MATCH,
                                    offeredAt: now,
                                    rollover: rollover,
                                    matchMultiplier: multiplier,
                                    currency: 'bitcoin',
                                    maxValue: max
                                });
                                if (multiplier === multipliers[0]) {
                                    matchBonus.meta({
                                        ftd: true,
                                        promotion: 'ftd'
                                    });
                                }
                                matchBonus.save(done);
                            }, function(err) {
                                if (err) logger.error("Error accepting bonus: %s", err.message);
                                return res.status(201).json(user.filter());
                            });
                        });
                    });
                });
            });
        });
    };

    UserController.prototype.createAnonymous = function(req, res, next) {
        var userData = req.body;
        userData.ip = req.ip;
        userData.anonymous = true;
        var sha256 = crypto.createHash('sha256');
        sha256.update(req.body.address);
        userData.username = sha256.digest('base64').replace(/=+$/, '').replace(/[^a-zA-Z0-9]/g, '');
        userData.token = auth.generateToken();
        userData.locale = req.locale;
        var user = new User(userData);
        var wc = new WalletController(req.currency);
        Wallet.get({withdrawAddress: req.body.address}, function(err, existingWallet) {
            if (err) return next(err);
            if (existingWallet) {
                logger.verbose("found existing wallet for %s", existingWallet.userId());
                return User.get(existingWallet.userId(), function(err, existingUser) {
                    if (err) return next(err);
                    if (!existingUser) {
                        return next(new HTTPError(500, "This should never occur, please let an admin know that impossible has occured"));
                    }
                    if (!existingUser.anonymous()) {
                        return next(new HTTPError(405, "This address has an associated user, please log in with your username and password"));
                    }
                    // they are a returning anonymous user, so give them a
                    // token and return
                    return existingUser.incrementLogin(function(err) {
                        if (err) return next(err);
                        existingUser.token(auth.generateToken());
                        return existingUser.save(function(err) {
                            if (err) return next(err);
                            res.set('Access-Control-Expose-Headers', TOKEN_HEADER);
                            res.set(TOKEN_HEADER, existingUser.token());
                            return res.status(201).json(existingUser.filter());
                        });
                    });
                });
            } else {
                logger.verbose("creating new anonymous user with %s address %s", userData.currency, userData.address);
                async.waterfall([
                    function checkTheAnonymousAddress(done) {
                        wc.checkAddress(req.body.address, done);
                    },
                    function checkIp(done) {
                        User.db.count({ip: userData.ip}, function(err, ipCount) {
                            if (err) {
                                logger.error("Error getting ip count: %s", err.message);
                                return done();
                            }
                            if (ipCount > 2) {
                                user.lock('ip');
                                logger.warn("IP address %s is on auto lock, attempt %d", userData.ip, ipCount);
                            } else if (ipCount > 1) {
                                logger.warn("IP address %s is making a third account, auto lock at 4th attempt", userData.ip);
                            }
                            done();
                        });
                    },
                    function saveAnonymousUser(done) {
                        user.save(function(err) {
                            if (err) return done(err);
                            done();
                        });
                    },
                    function makeAnonymousWallet(done) {
                        wc.makeWallet({
                            user: user,
                            address: req.body.address,
                            anonymous: true
                        }, done);
                    }
                ], function(err, wallet) {
                    if (err) return next(err);
                    wallet.save(function(err) {
                        if (err) return next(err);
                        res.set('Access-Control-Expose-Headers', TOKEN_HEADER);
                        res.set(TOKEN_HEADER, user.token());
                        return res.status(201).json(user.filter());
                    });
                });
            }
        });
    };

    UserController.prototype.read = function(req, res) {
        // the user object is set on the request by the middleware, so
        // just return the object filtered
        res.json(req.user.filter());
    };

    // handles both updateing and upgrading a user
    UserController.prototype.update = function(req, res, next) {
        if (req.wallet.currency() !== 'bitcoin')
            return next(new HTTPError(500, "This should never happen"));
        if (!req.user.challenge()) {
            return next(new HTTPError(412, "You must get a message to sign first"));
        }
        // get a wallet controller to process wallet updates as
        // well, all wallet updates are done with a bitcoin
        // controller
        var wc = new WalletController('bitcoin');
        var waterfall = [];
        var self = this;
        // first sheck to see that the signature passed up for the
        // current bitcoin address is valid
        if (req.wallet.withdrawAddress() && !req.user.anonymous()) {
            waterfall.push(function(done) {
                wc.checkSignature(req.wallet.withdrawAddress(), req.body.oldSignature, req.user.challenge(), done);
            });
        }
        // if that is valid, run the updates to the user object
        waterfall.push(function(done) {
            self.scrubUpdateData(req.body, function(err, newData) {
                if (err) return done(err);
                if (newData.email) {
                    newData.pendingEmail = newData.email;
                    delete newData.email;
                    newData.emailToken = auth.generateToken();
                }
                req.user.set(newData);
                return done();
            });
        });
        // if upgrading
        if (req.user.anonymous()) {
            // make the missing wallets
            waterfall.push(function makeMoreWallets(done) {
                if (!req.user.pendingEmail()) return done(new HTTPError(400, "Missing email"));
                if (!req.user.password()) return done(new HTTPError(400, "Missing password"));
                req.user.upgraded = true;
                var newWallets = {};
                async.each(CURRENCIES, function(currency, fin) {
                    var wc = new WalletController(currency);
                    wc.makeWallet({
                        user: req.user
                    }, function(err, wallet) {
                        if (err) {
                            // only return it if it is not a conflict error, because they already have one wallet
                            if (err.code !== 409) return fin(err);
                            else {
                                logger.verbose('accepting 409 error for %s wallet', currency);
                                // when makeWaller 409's, it also
                                // returns the wallet it found, for
                                // our convenience
                                newWallets[currency] = wallet;
                                return fin();
                            }
                        }
                        newWallets[currency] = wallet;
                        fin();
                    });
                }, function(err) {
                    if (err) return done(err);
                    return done(undefined, newWallets);
                });
            });
            waterfall.push(function(newWallets, done) {
                var btcAddress = newWallets.bitcoin.withdrawAddress();
                logger.verbose('checking anonymous user\'s btc signature %s with %s, message: %s',
                               req.body.signature,
                               btcAddress,
                               req.user.challenge());
                wc.checkSignature(btcAddress, req.body.signature, req.user.challenge(), function(err) {
                    if (err) return done(err);
                    return done(undefined, newWallets);
                });
            });
            // next, check to see if they are passing up new addresses
        }
        if (req.body.addresses) {
            waterfall.push(function() {
                var done, updatedWallets;
                if (arguments.length === 1) {
                    done = arguments[0];
                    updatedWallets = {};
                } else {
                    done = arguments[1];
                    updatedWallets = arguments[0];
                }
                wc.processWithdrawUpdates({
                    addresses: req.body.addresses,
                    user: req.user,
                    signature: req.body.signature
                }, function(err, wallets) {
                    if (err) return done(err);
                    return done(undefined, wallets);
                });
            });
        }
        if (req.body.withdrawBackup) {
            if (req.body.addresses && req.body.withdrawBackup === req.body.addresses.bitcoin)
                return next(new HTTPError(400, "The bitcoin address and the backup address cannot be the same"));
            waterfall.push(function() {
                var done, updatedWallets;
                if (arguments.length === 1) {
                    done = arguments[0];
                    updatedWallets = {};
                } else {
                    done = arguments[1];
                    updatedWallets = arguments[0];
                }
                wc.updateWithdrawBackup({
                    user: req.user,
                    signature: req.body.signature,
                    wallet: updatedWallets.bitcoin || req.wallet,
                    withdrawBackup: req.body.withdrawBackup
                }, function(err, wallet) {
                    if (err) return done(err);
                    updatedWallets.bitcoin = wallet;
                    return done(undefined, updatedWallets);
                });
            });
        }
        async.waterfall(waterfall, function(err, updatedWallets) {
            if (err) return next(err);
            req.user.unset('challenge');
            req.user.save(function(err) {
                if (err) return next(err);
                res.status(202);
                if (updatedWallets === undefined) return res.json({user: req.user.filter(), wallets: {}});
                async.each(Object.keys(updatedWallets), function(currency, done) {
                    updatedWallets[currency].save(function(err) {
                        if (err) return done(err);
                        updatedWallets[currency] = updatedWallets[currency].filter();
                        return done();
                    });
                }, function(err) {
                    if (err) return next(err);
                    return res.json({user: req.user.filter(), wallets: updatedWallets});
                });
            });

        });
    };

    UserController.prototype.delete = function(req, res, next) {
        // in this context, delete just means delete the token,
        // effectivly logging the user out
        req.user.unset('token');
        req.user.save(function(err) {
            if (err) return next(err);
            io.logout(req.user.primary());
            return res.status(200).send();
        });
    };

    /*
     * Other stuff
     */

    UserController.prototype.verifyEmail = function(req, res, next) {
        var emailToken = req.params.emailToken;
        if (!emailToken) return next(new HTTPError(400, "Missing email token"));
        User.get({emailToken: emailToken}, function(err, user) {
            if (err) return next(new HTTPError(err.code, err.message));
            if (!user) return next(new HTTPError(401, "Email token not found"));
            if (!user.pendingEmail()) return next(new HTTPError(412, "No pending email change"));
            if (!user.emailToken()) return next(new HTTPError(412, "No email token for user"));
            if (emailToken !== user.emailToken()) return next(new HTTPError(401, "Invalid email token"));
            user.set({
                email: user.pendingEmail(),
                pendingEmail: undefined,
                emailToken: undefined,
                verifiedAt: new Date(),
            });
            user.save(function(err, user) {
                if (err) return next(err);
                io.playerEmit(user.primary(), 'user update', user.filter());
                // do hubspot stuff now
                // see if they have a bitcoin deposit yet
                user.wallet('bitcoin', function(err, wallet) {
                    if (err) return logger.error("Error getting wallet for hubspot check");
                    if (wallet.lastDepositAt()) {
                        hubspotApi.addContact(user.primary(), function(err) {
                            if (err) return logger.error("Error adding user to hubspot");
                        });
                    } else {
                        hubspotApi.addContact(user.primary(), 12/*verified email list*/, function(err) {
                            if (err) return logger.error("Error adding user to hubspot");
                        });
                    }
                });
                return res.status(202).json(user.filter());
            });
        });
    };

    UserController.prototype.resendVerificationEmail = function(req, res, next) {
        var user = req.user;
        var pendingEmail = user.pendingEmail();
        if (!pendingEmail) return next(new HTTPError(417, "No pending email address change"));
        var newEmail = req.query.email || pendingEmail;
        var waterfall = [];
        if (newEmail !== pendingEmail) {
            waterfall.push(function(done) {
                user.pendingEmail(newEmail);
                user.save(function(err) {
                    return done(err);
                });
            });
        }
        waterfall.push(function(done) {
            mailer.send(newEmail, 'confirm', {user: user}, done);
        });
        async.waterfall(waterfall, function(err) {
            if (err) return next(new HTTPError(err));
            return res.send();
        });
    };

    UserController.prototype.resetPassword = function(req, res, next) {
        var address = req.body.address;
        var message = req.body.challenge;
        var signature = req.body.signature;
        var newPass = req.body.password;
        if (newPass !== req.body.passwordConfirm)
            return next(new HTTPError(400, "Passwords do not match"));
        if (!validPassword(newPass))
            return next(new HTTPError(400, "Invalid password"));
        var wc = new WalletController('bitcoin');
        async.waterfall([
            function getTheWallet(done) {
                Wallet.get({
                    currency: 'bitcoin',
                    $or: [
                        {withdrawAddress: address},
                        {withdrawBackup: address}
                    ]
                }, function(err, wallet) {
                    if (err) return done(new HTTPError(err.code, err.message));
                    if (!wallet) return done(new HTTPError(404, "Bitcoin address not found"));
                    return done(undefined, wallet);
                });
            },
            function checkTheSig(wallet, done) {
                wc.checkSignature(address, signature, message, function(err) {
                    return done(err, wallet);
                });
            },
            function getTheUser(wallet, done) {
                User.get(wallet.userId(), function(err, user) {
                    if (err) return done(new HTTPError(err.code, err.message));
                    return done(undefined, user);
                });
            },
            function hashAndSet(user, done) {
                auth.hashPassword(newPass, function(err, newPassHash) {
                    if (err) return next(new HTTPError(err.code, err.message));
                    user.password(newPassHash);
                    user.save(done);
                });
            }
        ], function(err, user) {
            if (err) return next(err);
            return res.status(202).json(user.filter());
        });

    };

    return UserController;

};
