'use strict';

var async = require('async');

module.exports = function(Wallet, cryptod, io, logger, CURRENCIES, HTTPError) {

    // the create and update functions are pretty inefficient now that
    // we crammed in the new method of signing only with a bitcoin
    // address. we will see if this becomes an issue; and if it does,
    // we may need to refactor
    var WalletController = function(currency) {
        this.currency = currency;
        this.cryptod = cryptod(currency);
    };

    // constants
    WalletController.ADDRESS_REGEXP = {
        'bitcoin': /^[13][a-km-zA-HJ-NP-Z0-9]{26,33}$/,
        'litecoin': /^[L][a-km-zA-HJ-NP-Z0-9]{26,33}$/,
        'dogecoin': /^[D][a-km-zA-HJ-NP-Z0-9]{26,33}$/,
        'ppcoin': /^[P][a-km-zA-HJ-NP-Z0-9]{26,33}$/,
        'namecoin': /^[MN][a-km-zA-HJ-NP-Z0-9]{26,33}$/,
    };

    if (process.env.BITCOIN_TESTNET) {
        WalletController.ADDRESS_REGEXP.bitcoin = /^[mn][a-km-zA-HJ-NP-Z0-9]{26,33}$/;
    }
    /*
     * Helper functions
     */

    WalletController.prototype.checkAddress = function(address, cb) {
        var self = this;
        if (!address) return cb(new HTTPError(400, "Missing address"));
        logger.verbose("checking %s address %s", this.currency, address);
        var regexp = WalletController.ADDRESS_REGEXP[this.currency];
        if (!regexp.test(address)) {
            logger.verbose("%s failed %s regexp check %s", address, this.currency, regexp.toString());
            return cb(new HTTPError(406, "Invalid %s address", this.currency));
        }
        this.cryptod.validateAddress(address, function(err, response) {
            if (err) return cb(new HTTPError(err.code || 500, err.message));
            if (!response.isvalid) return cb(new HTTPError(406, "Invalid %s address", self.currency));
            if (response.ismine) return cb(new HTTPError(406, "This is a Betcoin deposit address, don't do that"));
            logger.verbose("%s is a valid %s address", address, self.currency);
            Wallet.get({$or: [
                {withdrawAddress: address},
                {withdrawBackup: address}
            ]}, function(err, wallet) {
                if (err) return cb(new HTTPError(err.code || 500, err.message));
                if (wallet) {
                    return cb(new HTTPError(409, "This %s withdraw address is already in use", self.currency));
                }
                logger.verbose("withdraw address %s is available", address);
                return cb();
            });
        });
    };

    WalletController.prototype.checkSignature = function(address, signature, message, currency, cb) {
        if (cb === undefined && 'function' === typeof currency) {
            cb = currency;
            currency = this.currency;
        }
        var self = this;
        if (!address) return cb(new HTTPError(400, "Missing address"));
        if (!signature) return cb(new HTTPError(400, "Missing signature"));
        if (!message) return cb(new HTTPError(400, "Missing message"));
        logger.verbose("checking %s message signature", this.currency);
        cryptod(currency).verifyMessage(address, signature, message, function(err, validMessage) {
            if (err) {
                if (err.code === -5) {
                    return cb(new HTTPError(400, err.message));
                } else if (err.code === -3) {
                    return cb(new HTTPError(406, "Invalid %s address", currency));
                } else {
                    return cb(new HTTPError(err.code || 500, err.message));
                }
            }
            if (!validMessage) return cb(new HTTPError(406, "Invalid message signature"));
            logger.verbose("%s message verified", self.currency);
            return cb();
        });
    };

    /*
     * CRUD
     */

    WalletController.prototype.makeWallet = function(params, cb) {
        var self = this;
        logger.verbose("making %s wallet for %s", this.currency, params.user.primary());
        var waterfall = [
            // check that the user does not already have a wallet for
            // this currency
            function(done) {
                Wallet.get({userId: params.user.primary(), currency: self.currency}, function(err, wallet) {
                    if (err) return done(new HTTPError(err.code || 500, err.message));
                    if (wallet) {
                        // when there is a conflict error for the
                        // currency, send the found wallet back as
                        // well as the error, since it is often useful
                        // to the function making the wallet
                        return done(new HTTPError(409, "You already have a %s wallet", self.currency), wallet);
                    }
                    logger.verbose("user does not have a %s wallet yet", self.currency);
                    return done();
                });
            }
        ];
        if (params.address) {
            // check the address to make sure it is valid and not a
            // betcoin deposit address
            waterfall.push(function(done) {
                self.checkAddress(params.address, done);
            });
        }
        async.waterfall(waterfall, function(err, wallet) {
            if (err) return cb(err, wallet);
            wallet = new Wallet({
                userId: params.user.primary(),
                currency: self.currency
            });
            if (params.address) {
                wallet.withdrawAddress(params.address);
                wallet.verified = true;
            }
            return cb(undefined, wallet);
        });
    };

    WalletController.prototype.create = function(req, res, next) {
        if (this.currency !== 'bitcoin')
            return next(new HTTPError(500, "Wallets can only be created using a bitcoin controller"));
        var addresses = req.body.addresses || {};
        var providedCurrencies = Object.keys(addresses);
        var waterfall = [
            function makeWallets(done) {
                async.eachLimit(CURRENCIES, 2, function(currency, fin) {
                    var wc = (self.currency === currency) ? self : new WalletController(currency);
                    wc.makeWallet({
                        user: req.user,
                        address: addresses[currency]
                    }, function(err, wallet) {
                        if (err) return fin(err);
                        wallets[currency] = wallet;
                        return fin();
                    });
                }, done);
            }
        ];
        if (providedCurrencies.length) {
            if (!addresses.bitcoin)
                return next(new HTTPError(400, "You must provide a bitcoin address if any addresses are provided"));
            var message = req.user.challenge();
            var signature = req.body.signature;
            if (!message) return next(new HTTPError(412, "You must get a message to sign first"));
            if (!signature) return next(new HTTPError(400, "Missing signature"));
            if (!addresses || !addresses.bitcoin) return next(new HTTPError(400, "Missing bitcoin address"));
            waterfall.push(function checkSignature(done) {
                // check the bitcoin signature before anything else
                self.checkSignature(addresses.bitcoin, signature, message, done);
            });
        }
        var self = this;
        var wallets = {};
        async.waterfall(waterfall, function(err) {
            if (err) return next(err);
            async.each(Object.keys(wallets), function(currency, done) {
                wallets[currency].save(function(err) {
                    if (err) return done(err);
                    logger.verbose("saved %s wallet", currency);
                    wallets[currency] = wallets[currency].filter();
                    return done();
                });
            }, function(err) {
                if (err) return next(err);
                return res.status(201).json(wallets);
            });
        });
    };

    WalletController.prototype.readMiddleware = function(req, res, next) {
        // get the user's wallet and attach it to the request for
        // subsequent calls
        var self = this;
        Wallet.get({userId: req.user.primary(), currency: this.currency}, function(err, wallet) {
            if (err) return next(new HTTPError(err.code || 500, err.message));
            if (!wallet) return next(new HTTPError(404, "You do not have a %s wallet", self.currency));
            req.wallet = wallet;
            return next();
        });
    };

    WalletController.prototype.read = function(req, res, next) {
        var self = this;
        Wallet.all({userId: req.user.primary()}, function(err, wallets) {
            if (err) return next(new HTTPError(err.code, err.message));
            if (!wallets.length) return res.status(204).send();
            var returnObj = {};
            wallets.forEach(function(wallet) {
                returnObj[wallet.currency()] = wallet.filter();
            });
            if (wallets.length === CURRENCIES.length || req.user.anonymous()) return res.json(returnObj);
            var missingCurrencies = [];
            CURRENCIES.forEach(function(currency) {
                if (returnObj[currency] === undefined) {
                    missingCurrencies.push(currency);
                }
            });
            logger.info("creating missing wallets for %s: %s", req.user.primary(), missingCurrencies.join(", "));
            var newWallets = {};
            async.eachLimit(missingCurrencies, 2, function(currency, fin) {
                var wc = (self.currency === currency) ? self : new WalletController(currency);
                wc.makeWallet({
                    user: req.user
                }, function(err, wallet) {
                    if (err) return fin(err);
                    newWallets[currency] = wallet;
                    return fin();
                });
            }, function(err) {
                if (err) return next(err);
                async.each(Object.keys(newWallets), function(currency, done) {
                    newWallets[currency].save(function(err) {
                        if (err) return done(err);
                        logger.verbose("saved %s wallet", currency);
                        returnObj[currency] = newWallets[currency].filter();
                        return done();
                    });
                }, function(err) {
                    if (err) return next(err);
                    return res.json(returnObj);
                });
            });
        });
    };

    WalletController.prototype.processWithdrawUpdates = function(params, cb) {
        var wallets = {};
        var self = this;
        async.eachLimit(Object.keys(params.addresses), 2, function(currency, done) {
            // get a wallet controller for the currency being updated
            var wc = (self.currency === currency) ? self : new WalletController(currency);
            // see if they have a wallet for this currency yet
            Wallet.get({userId: params.user.primary(), currency: wc.currency}, function(err, wallet) {
                if (err) return done(new HTTPError(err.code, err.message));
                if (!wallet) {
                    // if not, then create one
                    logger.verbose("no %s wallet for %s, creating one", currency, params.user.primary());
                    wc.makeWallet({
                        user: params.user,
                        address: params.addresses[currency]
                    }, function(err, _wallet) {
                        if (err) return done(err);
                        wallets[currency] = _wallet;
                        return done();
                    });
                } else {
                    // otherwise update the existing wallet
                    logger.verbose("updating %s wallet for %s", currency, params.user.primary());
                    wc.updateWithdraw({
                        wallet: wallet,
                        message: params.user.challenge(),
                        signature: params.signature,
                        address: params.addresses[currency]
                    }, function(err, wallet) {
                        if (err) return done(err);
                        wallets[currency] = wallet;
                        return done();
                    });
                }
            });
        }, function(err) {
            if (err) return cb(err);
            return cb(undefined, wallets);
        });
    };

    WalletController.prototype.updateWithdraw = function(params, cb) {
        var wallet = params.wallet; // the wallet to update
        var message = params.message; // the message that was signed
        var signature = params.signature; // the signature of a new btc address
        var address = params.address; // the address being changed to
        if (!message) return cb(new HTTPError(412, "You must get a message to sign first"));
        if (this.currency === 'bitcoin' && !signature) return cb(new HTTPError(400, "Missing signature"));
        if (!address) return cb(new HTTPError(400, "Missing address"));
        var self = this;
        var waterfall = [
            // check the address to make sure it is valid and not a
            // betcoin deposit address
            function(done) {
                self.checkAddress(address, done);
            }
        ];
        if (this.currency === 'bitcoin') {
            waterfall.push(function(done) {
                self.checkSignature(address, signature, message, done);
            });
        }
        waterfall.push(function(done) {
            // update the wallet
            wallet.withdrawAddress(address);
            wallet.verified = true;
            return done(undefined, wallet);
        });
        async.waterfall(waterfall, cb);
    };

    WalletController.prototype.updateWithdrawBackup = function(params, cb) {
        if (this.currency !== 'bitcoin') {
            return cb(new HTTPError(405, "You can only add a backup bitcoin address"));
        }
        var message = params.user.challenge();
        var signature = params.signature;
        var withdrawBackup = params.withdrawBackup;
        var address = params.wallet.withdrawAddress();
        if (!message) return cb(new HTTPError(412, "You must get a message to sign first"));
        if (!signature) return cb(new HTTPError(400, "Missing signature"));
        if (!address) return cb(new HTTPError(400, "Missing address"));
        var self = this;
        async.waterfall([
            // check the address to make sure it is valid and not a
            // betcoin deposit address
            function(done) {
                self.checkAddress(withdrawBackup, done);
            },
            // check the message signature
            function(done) {
                self.checkSignature(address, signature, message, done);
            },
        ], function(err) {
            if (err) return cb(err);
            params.wallet.withdrawBackup(withdrawBackup);
            return cb(undefined, params.wallet);
        });
    };

    WalletController.prototype.withdraw = function(req, res, next) {
        var amount = parseInt(req.query.amount, 10);
        if (req.user.anonymous()) {
            amount = req.wallet.availableBalance();
        }
        if (isNaN(amount)) return next(new HTTPError(400, "Invalid withdraw amount"));
        logger.info("initiating %d %s withdraw for %s", amount.toBitcoin(), this.currency, req.user.primary());
        if (req.user.locked) {
            return next(new HTTPError(423, "withdraw error: "));
        }
        // lock the user and save
        req.user.setLock('withdraw', function(err) {
            if(err) return next(err);
            req.wallet.withdraw(amount, req.user, function(withdrawErr, transaction) {
                req.user.unlock(function(unlockErr) {
                    if (unlockErr) {
                        logger.error('error unlocking %s after withdraw', req.user.primary());
                    }
                    if (withdrawErr) return next(withdrawErr);
                    io.playerEmit(req.user.primary(), 'withdraw', req.user.filter(), transaction.filter());
                    return res.json(transaction.filter());
                });
            });
        });
    };

    return WalletController;
};
