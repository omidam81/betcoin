'use strict';

var bcrypt = require('bcrypt');
var crypto = require('crypto');
var async = require('async');
var speakeasy = require('speakeasy');

var TOKEN_HEADER = 'Api-Token';
var AUTH_REGEXP = /^Basic /;
var TOKEN_REGEXP = /^Bearer /;


module.exports = function(User, Wallet, logger, HTTPError) {

    var generateToken = function() {
        return crypto.randomBytes(16).toString('hex');
    };

    var hashPassword = function(password, cb) {
        return bcrypt.hash(password, 10, cb);
    };

    var checkPassword = function(password, hash, cb) {
        return bcrypt.compare(password, hash, cb);
    };

    var getToken = function(req, res, next) {
        var authHeader = req.get('authorization');
        if (!authHeader) return next(new HTTPError(400, "co credentials found"));
        if (!AUTH_REGEXP.test(authHeader)) return next(new HTTPError(400, "invalid auth header"));
        var authParts = new Buffer(authHeader.split(" ")[1], 'base64').toString().split(/([^:]*):(.*)/);
        if (!authParts[0]) {
            authParts.shift();
        }
        var username = authParts[0];
        var password = authParts[1];
        async.waterfall([
            function getTheUser(done) {
                User.get({username: username}, function(err, user) {
                    if (err) return done(new HTTPError(500, err.message));
                    if (user) return done(undefined, user);
                    Wallet.get({withdrawAddress: username}, function(err, wallet) {
                        if (err) return done(new HTTPError(500, err.message));
                        if (!wallet) return done(new HTTPError(403, "invalid user name or password"));
                        User.get(wallet.userId(), function(err, _user) {
                            if (err) return done(new HTTPError(500, err.message));
                            if (!_user) return done(new HTTPError(403, "invalid user name or password"));
                            return done(undefined, _user);
                        });
                    });
                });
            },
            function checkPassword(user, done) {
                if (user.disable()) {
                    return done(new HTTPError(423, "This account has been disabled"));
                }
                bcrypt.compare(password, user.password(), function(err, valid) {
                    if (err) return done(new HTTPError(500, err.message));
                    if (!valid) return done(new HTTPError(403, "invalid user name or password"));
                    return done(undefined, user);
                });
            },
            function checkTotp(user, done){
                if(user.totp()) {
                    var oneTimePass = req.query.one_time_pass;
                    if(validateTotp(user.totpSecret(), oneTimePass) || process.env.DEV_BYPASS_TOTP) {
                        done(undefined, user);
                    } else {
                        done(new HTTPError(400, 'invalid one time password for 2 factor auth'));
                    }
                } else {
                    done(undefined, user);
                }
            },
            function(user, done){
                var token = generateToken();
                user.token(token);
                user.save(function(err) {
                    if (err) return done(new HTTPError(500, err.message));
                    done(undefined, user, token);
                });
            }
        ], function(err, user, token){
            if(err) return next(err);
            logger.mapUser(user.primary().toString(), user.username());
            res.set('Access-Control-Expose-Headers', TOKEN_HEADER);
            res.set(TOKEN_HEADER, token);
            req.user = user;
            return next();
        });
    };

    var extractToken = function(req, res, next) {
        var tokenHeader = req.get('authorization');
        if (!tokenHeader) return next(new HTTPError(400, "no credentials found"));
        if (!TOKEN_REGEXP.test(tokenHeader)) return next(new HTTPError(400, "invalid token header"));
        req.token = tokenHeader.split(" ")[1];
        next();
    };

    var checkToken = function(req, res, next) {
        extractToken(req, res, function(err) {
            if (err) return next(err);
            User.get({token: req.token}, function(err, user) {
                if (err) return next(new HTTPError(500, err.message));
                if (!user) return next(new HTTPError(403, 'invalid token'));
                if (user.disable()) {
                    return next(new HTTPError(423, "This account has been disabled"));
                }
                logger.mapUser(user.primary(), user.username());
                req.user = user;
                res.set('Access-Control-Expose-Headers', TOKEN_HEADER);
                res.set(TOKEN_HEADER, user.token());
                next();
            });
        });
    };

    var generateTotpSecret = function(req, res, next) {
        var totpSecret = speakeasy.generate_key({length: 20}).base32;
        req.user.set({totpSecret: totpSecret});
        req.user.save(function(err){
            if(err) return next(err);
            res.json({totpSecret: totpSecret});
        });
    };

    var validateTotp = function(totpSecret, oneTimePass) {
        var validOneTimePass = speakeasy.time({key: totpSecret, encoding: 'base32'});
        if(validOneTimePass !== oneTimePass){
            return false;
        }
        return true;
    };

    var activateTotp = function(req, res, next) {
        var oneTimePass = req.body.oneTimePass;
        if(!oneTimePass){
            return next(new HTTPError(400, "one time password is required"));
        }
        if(!req.user.totpSecret()){
            return next(new HTTPError(400, "Totp secret is undefined"));
        }
        if(validateTotp(req.user.totpSecret(), oneTimePass)){
            req.user.set({totp: true});
            req.user.save(function(err){
                if(err) return next(err);
                res.status(204).end();
            });
        }else{
            next(new HTTPError(400, "Incorrect one time password"));
        }
    };

    var deactivateTotp = function(req, res, next) {
        req.user.set({totp: false, totpSecret: false});
        req.user.save(function(err){
            if(err) return next(err);
            res.status(204).end();
        });
    };

    return {
        getToken: getToken,
        checkToken: checkToken,
        hashPassword: hashPassword,
        checkPassword: checkPassword,
        generateToken: generateToken,
        generateTotpSecret: generateTotpSecret,
        validateTotp: validateTotp,
        activateTotp: activateTotp,
        deactivateTotp: deactivateTotp
    };
};
