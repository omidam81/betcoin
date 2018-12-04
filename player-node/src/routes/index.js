'use strict';

var STATUS_CODES = require('http').STATUS_CODES;
var EventEmitter = require('events').EventEmitter;
var ensureObjectId = require('mongowrap').ensureObjectId;
var bcrypt = require('bcrypt');
var swagger = require('swagger-node-express');
var async = require('async');
var HTTPError = require('../lib/httperror');
var qr = require('qr-image');

var CURRENCIES = ['btc'];
var TOKEN_HEADER = 'API-Token';
var TOKEN_AUTH_REGEXP = /^Bearer/;
var AUTH_REGEXP = /^Basic /;

module.exports = function(app) {
    var errorResponse = function(status, message, errCode, res) {
        logger.error(message);
        if (!STATUS_CODES.hasOwnProperty(status)) {
            status = 500;
        }
        var resObj = {
            error: STATUS_CODES[status],
            message: message,
            errCode: errCode
        };
        res.json(status, resObj);
    };

    // var io = app.get('io');
    var notification = app.get('container').get('notification');
    var logger = app.get('logger');
    var UserController = app.get('UserController');

    var container = app.get('container');
    var appkeys = container.get('appkeys');

    //init swagger
    var models = require('../lib/models');
    swagger.setAppHandler(app);
    swagger.addModels(models);


    // socket stuff
    var SOCKET_TIMEOUT = (30 * 1000); // 30 seconds
    var RETRY_INTERVAL = (3 * 60 * 1000); //three minutes
    var MAX_AUTO_WITHDRAW_ATTEMPTS = 10; // try 10 times
    var socketTimeouts = {};
    var timeoutAttempts = {};
    var io = app.get('container').get('socket');
    io.on('subscribe', function(socketId, userId) {
        if (socketTimeouts[userId]) {
            logger.debug('clearing socket timeout for player %s', userId);
            clearTimeout(socketTimeouts[userId]);
            delete socketTimeouts[userId];
        }
        if (!userId) return;
        logger.info('%s subscribing on %s', userId, socketId);
        UserController.setSocket(userId, socketId, function(err) {
            if (err) {
                io.send(socketId, 'subscribe error', err.message);
                return logger.error('error setting socket %s for user %s: %s', socketId, userId, err.message);
            }
            logger.info('user %s assigned to socket %s', userId, socketId);
            io.send(socketId, 'subscribed');
            app.get('container').get('UserController').countNotificationUnread(userId, function(err, unreadCount){
                logger.log('init count', unreadCount);
                io.send(socketId, 'notification unread', unreadCount);
            });
        });
    });

    io.on('disconnect', function(socketId) {
        UserController.getBySocket(socketId, function(err, user) {
            if (err) return;
            logger.info('%s (%s) disconnected from %s', user.alias, user._id, socketId);
            UserController.clearSocket(user._id, function(err) {
                if (err) return logger.error(err.message);
                var socketKey = user._id.toHexString();
                if (!user.password) {
                    if (!user.balance.btc) {
                        return logger.debug("no balance, so no timeout");
                    }
                    logger.debug('setting socket timeout for anonymous player %s', user._id, {});
                    var withdrawCb = function(err, withdrawData) {
                        if (err) {
                            if (err.code === 412) {
                                logger.warn('user balance too low for withdraw, cancelling timeout');
                                delete socketTimeouts[socketKey];
                                delete timeoutAttempts[socketKey];
                            } else if (timeoutAttempts[socketKey] < MAX_AUTO_WITHDRAW_ATTEMPTS) {
                                logger.error('error with auto withdraw for user %s (%s): %s, trying again', user.alias, user._id, err.message);
                                timeoutAttempts[socketKey] += 1;
                                socketTimeouts[socketKey] = setTimeout(UserController.withdraw, RETRY_INTERVAL,
                                                                       user, "btc", user.balance.btc, withdrawCb);
                            } else {
                                logger.error('max auto withdraw errors for user %s (%s): %s', user.alias, user._id, err.message);
                                delete socketTimeouts[socketKey];
                                delete timeoutAttempts[socketKey];
                            }
                            return;
                        }
                        delete socketTimeouts[socketKey];
                        logger.info('auto cash out for player %s (%s)', withdrawData.user.alias, withdrawData.user._id, {});
                    };
                    timeoutAttempts[socketKey] = 0;
                    socketTimeouts[socketKey] = setTimeout(UserController.withdraw, SOCKET_TIMEOUT,
                                                           user, "btc", user.balance.btc, withdrawCb);
                } else {
                    logger.debug('setting socket timeout for player %s (%s)', user.alias, user._id, {});
                    socketTimeouts[socketKey] = setTimeout(function(_user) {
                        logger.debug('firing socket timeout for player %s (%s)', _user.alias, _user._id, {});
                        UserController.clearToken(_user.token, function(err) {
                            if (err) logger.error("error clearing user %s (%s) token: %s", _user.alias, _user._id, err.message);
                            delete socketTimeouts[_user._id.toHexString()];
                        });
                    }, SOCKET_TIMEOUT, user);
                }
            });
        });
    });

    var validPassword = function(pass) {
        if (pass === undefined) return false;
        // if (!pass.match('[0-9]+')) return false;
        if (pass.length < 10) return false;
        if (pass.length > 64) return false;
        return true;
    };

    swagger.addGet({
        spec: {
            description: "Ping url",
            path: "/ping",
            method: 'GET',
            nickname: 'ping'
        },
        action: function(req, res) {
            res.send("pong");
        }
    });

    swagger.addGet({
        'spec': {
            description : 'Verify if the alias has been used already.',
            path : '/verify/alias/{alias}',
            notes : 'Verify if the alias has been used already.',
            summary : 'Verify if the alias has been used already.',
            method: 'GET',
            parameters : [swagger.pathParam('alias', models.User.properties.alias.description, 'string')],
            errorResponses : [
                swagger.errors.invalid('alias string'),
                {code: 500, message: 'Internal Error'}
            ],
            nickname : 'verifyAlias'
        },
        'action': function (req, res) {
            var alias = req.params.alias;
            var currency = req.query.currency || "btc";
            var userController = app.get('container').get('UserController');
            userController.getByAlias(alias, currency, function(err, user){
                if(err){
                    if(err.code === 404) {
                        return res.json({exist: false});
                    }
                    return errorResponse(err.code, err.message, err.errCode, res);
                }
                res.json({exist: true, isAnonymous: user.anonymous});
            });
        }
    });

    swagger.addGet({
        'spec': {
            description : 'Verify if the withdraw Address has been used already.',
            path : '/verify/withdrawAddress/{withdrawAddress}',
            notes : 'Verify if the withdraw address has been used already.',
            summary : 'Verify if the withdraw address has been used already.',
            method: 'GET',
            parameters : [swagger.pathParam('withdrawAddress', models.User.properties.withdrawAddress.description, 'string')],
            errorResponses : [
                swagger.errors.invalid('withdraw address string'),
                {code: 500, message: 'Internal Error'}
            ],
            nickname : 'verifyWithdrawAddress'
        },
        'action': function (req, res) {
            var withdrawAddress = req.params.withdrawAddress;
            var userController = app.get('container').get('UserController');
            userController.getByWithdrawAddress(withdrawAddress, 'btc', function(err, user){
                if(err){
                    if(err.code === 404)
                        return res.json({exist: false});
                    return errorResponse(err.code, err.message, err.errCode, res);
                }
                res.json({exist: true, alias: user.alias, userId: user._id.toHexString(), isAnonymous: user.anonymous});
            });
        }
    });

    var createUser = function(userData, res) {
        if (userData.anonymous) {
            if (!userData.withdrawAddress) return errorResponse(400, "Missing withdraw addrsss", '053', res);
            if (!userData.currency) userData.currency = "btc";
        } else {
            if (!userData.password) return errorResponse(400, "Missing password", '054', res);
            if (!validPassword(userData.password)) return errorResponse(400, "Invalid password", '019', res);
        }
        if (userData.anonymous) {
            app.get('container').get('utils').checkAddress(userData.withdrawAddress, function(err) {
                if (err) return errorResponse(400, err.message, err.errCode, res);
                UserController.createAnonymous(userData, function(err, user) {
                    if (err) return errorResponse(err.code, err.message, err.errCode, res);
                    res.set('Access-Control-Expose-Headers', 'API-Token');
                    res.set(TOKEN_HEADER, user.token);
                    delete user.password;
                    delete user.ip;
                    res.json(201, user);
                });
            });
            // test if they passed up a wallet address, if so, verify it
            // and passit along
        } else if (userData.withdrawAddress) {
            app.get('container').get('utils').checkAddress(userData.withdrawAddress, function(err) {
                if (err) return errorResponse(400, err.message, err.errCode, res);
                UserController.create(userData, function(err, user) {
                    if (err) return errorResponse(err.code, err.message, err.errCode, res);
                    delete user.password;
                    delete user.ip;
                    res.json(201, user);
                });
            });
        } else {
            UserController.create(userData, function(err, user) {
                if (err) return errorResponse(err.code, err.message, err.errCode, res);
                delete user.password;
                delete user.ip;
                res.json(201, user);
            });
        }
    };

    swagger.addPost({
        'spec': {
            description : "Create a new user",
            path : "/user",
            notes : "Create a new user",
            summary : "Create a new user. On successfully created, it will return 201 status code with the created user json",
            method: "POST",
            parameters : [swagger.bodyParam("User", "User object to be saved", "User")],
            type : "User",
            errorResponses : [swagger.errors.invalid('params'), {code: 500, message: 'Internal Error'}],
            nickname : "createUser"
        },
        'action': function (req, res) {
            var userData = req.body;
            var userAgent = req.get('user-agent');
            var affiliateToken = req.body.affiliateToken;
            userData.ip = req.ip;
            UserController.getAffiliateTag(userData.ip, userAgent, affiliateToken || undefined, function(err, tag) {
                if (err) {
                    if (err.code === 404) {
                        // if we did not find a record the ip/user agent combo, just create a user
                        logger.warn("no affiliate tag found, creating user sans affiliate");
                        return createUser(userData, res);
                    } else {
                        return errorResponse(err.code, err.message, err.errCode, res);
                    }
                } else {
                    logger.debug("got affiliate tag for %s (%s)", userData.ip, tag.affiliateId, {});
                    userData.affiliateToken = tag.affiliateToken;
                    return createUser(userData, res);
                }
            });
        }
    });


    swagger.addGet({
        'spec': {
            description : "Confirm the email token",
            path : "/confirm/{emailToken}",
            notes : "Confirm the email token. On successfully confirmed, 0.001 bitcoin will be credited to the user.",
            summary : "Confirm the email token",
            method: "GET",
            parameters : [swagger.pathParam("emailToken", "Email token to confirm", "string")],
            errorResponses : [
                swagger.errors.invalid('email token'),
                swagger.errors.notFound('email token'),
                {code: 500, message: 'Internal Error'}
            ],
            nickname : "confirmEmailToken"
        },
        'action': function (req, res) {
            var token = req.params.emailToken;
            UserController.confirmEmail(token, function(err, result) {
                if (err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(result);
            });
        }
    });

    swagger.addGet({
        'spec': {
            description : "Authenticate user or refresh API token",
            path : "/auth",
            notes : "Authenticate user by verifying the credentials encoded in the authorization header. " +
                "On successfully authenticated, it returns API token for subsequence calls. " +
                "If the request passed with API token, it will refresh the API token string.",
            summary : "Get or refresh API token",
            method: "GET",
            parameters : [
                swagger.headerParam("authorization", "Basic or Bearer token string to authenticate", "string", true),
                swagger.queryParam("one_time_pass", "One time password", "string")
            ],
            errorResponses : [
                swagger.errors.invalid('basic credentials or API token'),
                {code: 500, message: 'Internal Error'}
            ],
            type: "User",
            nickname : "getAPIToken"
        },
        'action': function (req, res) {
            var authHeader = req.get('authorization');
            if (!authHeader) return errorResponse(400, 'No credentials found', '059', res);
            var ip = req.ip;
            var oneTimePassword = req.query.one_time_pass;
            if (AUTH_REGEXP.test(authHeader)) {
                var authParts = new Buffer(authHeader.split(" ")[1], 'base64').toString().split(/([^:]*):(.*)/);
                if (!authParts[0]) {
                    authParts.shift();
                }
                var alias = authParts[0];
                var password = authParts[1];
                UserController.authenticate(alias, password, ip, oneTimePassword, function(err, user) {
                    if (err) return errorResponse(err.code, err.message, err.errCode, res);
                    res.set('Access-Control-Expose-Headers', 'API-Token');
                    res.set(TOKEN_HEADER, user.token);
                    delete user.password;
                    delete user.ip;
                    res.json(user);
                });
            } else if (TOKEN_AUTH_REGEXP.test(authHeader)) {
                var token = authHeader.split(" ")[1];
                if (!token) return errorResponse(400, "Invalid API token header", '057', res);
                UserController.refreshToken(token, ip, function(err, user) {
                    if (err) return errorResponse(err.code, err.message, err.errCode, res);
                    res.set('Access-Control-Expose-Headers', 'API-Token');
                    res.set(TOKEN_HEADER, user.token);
                    delete user.password;
                    delete user.ip;
                    res.json(user);
                });
            } else if(req.query.withdrawAddress) {
                var withdrawAddress = req.query.withdrawAddress;
                var currency = req.query.currency || "btc";
                // logger.debug('logging in anonymous user %s', withdrawAddress);
                UserController.authenticateAnonymous(withdrawAddress, currency, ip, function(err, user) {
                    if (err) return errorResponse(err.code, err.message, err.errCode, res);
                    res.set('Access-Control-Expose-Headers', 'API-Token');
                    res.set(TOKEN_HEADER, user.token);
                    delete user.password;
                    delete user.ip;
                    res.json(user);
                });
            } else {
                return errorResponse(400, 'invalid auth header', '060', res);
            }
        }
    });

    var checkAuth = function(req, res, next) {
        // logger.debug('checking auth');
        var authHeader = req.get('authorization');
        if (!authHeader) {
            return errorResponse(400, 'You must supply an API token', '058', res);
        }
        var token;
        if (TOKEN_AUTH_REGEXP.test(authHeader)) {
            token = authHeader.split(" ")[1];
        } else {
            return errorResponse(400, "Invalid API token header", '057', res);
        }
        if (!token) return errorResponse(400, "Invalid API token header", '057', res);
        UserController.checkToken(token, function(err, user) {
            if (err) return errorResponse(err.code, err.message, err.errCode, res);
            req.user = user;
            // logger.debug(user._id, {});
            res.set('Access-Control-Expose-Headers', 'API-Token');
            res.set(TOKEN_HEADER, user.token);
            next();
        });
    };

    app.all('/user/*', checkAuth);

    app.param('userId', function(req, res, next, userId) {
        // logger.debug('checking userId param');
        var oId = ensureObjectId(userId);
        if (oId !== null) {
            req.userId = oId;
            // logger.debug(req.userId, {});
            //ignore compare with the userIds for internal calls
            if (req.internal === true)
                return next();
            if (!req.userId.equals(req.user._id)) {
                return errorResponse(401, "You cannot access another user", '061', res);
            }
            next();
        } else {
            return errorResponse(412, 'Invalid id provided ' + userId, '004', res);
        }
    });

    app.param('affiliateId', function(req, res, next, affiliateId) {
        // logger.debug('checking userId param');
        var oId = ensureObjectId(affiliateId);
        if (oId !== null) {
            req.affiliateId = oId;
            checkAuth(req, res, function() {
                if (!req.user.affiliateData) return errorResponse(412, 'User is not an affiliate', null, res);
                if (!req.affiliateId.equals(req.user._id)) {
                    return errorResponse(401, "You cannot access another user", '061', res);
                }
                next();
            });
        } else {
            return errorResponse(412, 'Invalid id provided ' + affiliateId, '004', res);
        }
    });

    app.param('associateId', function(req, res, next, associateId) {
        UserController.read(associateId, function(err, associate) {
            if(err) return errorResponse(err.code, err.message, err.errCode, res);
            if(!associate.affiliate || !req.affiliateId.equals(associate.affiliate))
                return errorResponse(401, "You cannot access another user who are not your associate", '076');
            req.associate = associate;
            next();
        });
    });

    app.param('currency', function(req, res, next, currency) {
        if (CURRENCIES.indexOf(currency) < 0) {
            errorResponse(400, 'invalid currency ' + currency, '062', res);
        } else {
            req.currency = currency;
            next();
        }
    });

    swagger.addGet({
        'spec': {
            description : "Get user object json",
            path : "/user/{userId}",
            notes : "Return user object json",
            summary : "Return user object json",
            method: "GET",
            parameters : [
                swagger.headerParam("authorization", "API token", "string", true),
                swagger.pathParam("userId", "user id", "string")
            ],
            errorResponses : [
                swagger.errors.invalid('API token'),
                {code: 401, message: "You cannot access another user"},
                {code: 412, message: "Invalid id provided"},
                {code: 500, message: 'Internal Error'}
            ],
            type: "User",
            nickname : "getUser"
        },
        'action': function (req, res) {
            delete req.user.password;
            delete req.user.ip;
            if (req.query.omitNotifications) {
                delete req.user.notifications;
            }
            res.json(req.user);
        }
    });

    swagger.addGet({
        'spec': {
            description : "Get user bonus history",
            path : "/user/{userId}/bonushistory/{currency}",
            notes : "Return user bonus history",
            summary : "Return user bonus history",
            method: "GET",
            parameters : [
                swagger.headerParam("authorization", "API token", "string", true),
                swagger.pathParam("userId", "user id", "string"),
                swagger.pathParam("currency", "currency", "string")
            ],
            errorResponses : [
                swagger.errors.invalid('API token'),
                {code: 401, message: "You cannot access another user"},
                {code: 412, message: "Invalid id provided"},
                {code: 500, message: 'Internal Error'}
            ],
            type: "User",
            nickname : "getUser"
        },
        'action': function (req, res) {
            UserController.getBonusHistory(req.user, req.currency, function(err, bonusHistory) {
                if (err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(bonusHistory);
            });
        }
    });

    swagger.addGet({
        'spec': {
            description : "Get user cashback history",
            path : "/user/{userId}/cashbackhistory/{currency}",
            notes : "Return user cashbackhistory",
            summary : "Return user cashbackhistory",
            method: "GET",
            parameters : [
                swagger.headerParam("authorization", "API token", "string", true),
                swagger.pathParam("userId", "user id", "string"),
                swagger.pathParam("currency", "currency", "string")
            ],
            errorResponses : [
                swagger.errors.invalid('API token'),
                {code: 401, message: "You cannot access another user"},
                {code: 412, message: "Invalid id provided"},
                {code: 500, message: 'Internal Error'}
            ],
            type: "User",
            nickname : "getUser"
        },
        'action': function (req, res) {
            var page = req.query.page || 0;
            var limit = req.query.limit || 30;
            UserController.getCashbacks(req.user, page, limit, req.currency, function(err, cashbackHistory) {
                if (err) return errorResponse(err.code, err.message, err.errCode, res);
                if (!cashbackHistory.length) return res.send(204);
                res.json(cashbackHistory);
            });
        }
    });

    swagger.addPut({
        'spec': {
            description : "Update an user",
            path : "/user/{userId}",
            notes : "Return user object json",
            summary : "Return updated user json with status code 202",
            method: "PUT",
            parameters : [
                swagger.headerParam("authorization", "API token", "string", true),
                swagger.pathParam("userId", "user id", "string"),
                {
                    "name" : "alias",
                    "description" : "A new alias",
                    "type" : "string",
                    "required" : false,
                    "paramType" : "form"
                },
                {
                    "name" : "email",
                    "description" : "A new email",
                    "type" : "string",
                    "required" : false,
                    "paramType" : "form"
                },
                {
                    "name" : "password",
                    "description" : "A new password",
                    "type" : "string",
                    "required" : false,
                    "paramType" : "form"
                },
                {
                    "name" : "btcWithdrawAddress",
                    "description" : "Main wallet address",
                    "type" : "string",
                    "required" : true,
                    "paramType" : "form"
                },
                {
                    "name" : "btcBackupWithdrawAddress",
                    "description" : "Backup wallet address",
                    "type" : "string",
                    "required" : false,
                    "paramType" : "form"
                },
                {
                    "name" : "signature",
                    "description" : "Signature of the signed message for the main wallet address",
                    "type" : "string",
                    "required" : true,
                    "paramType" : "form"
                },
                {
                    "name" : "signature_old",
                    "description" : "Signature of the signed message for the previous main wallet address",
                    "type" : "string",
                    "required" : false,
                    "paramType" : "form"
                },
                {
                    "name" : "backupSignature",
                    "description" : "Signature of the signed message for the backup wallet address",
                    "type" : "string",
                    "required" : true,
                    "paramType" : "form"
                }
            ],
            errorResponses : [
                swagger.errors.invalid('API token'),
                {code: 401, message: "You cannot access another user"},
                {code: 412, message: "Invalid id provided"},
                {code: 500, message: 'Internal Error'}
            ],
            type: "User",
            nickname : "updateUser"
        },
        'action': function (req, res) {
            var user = req.user;
            var server_user = {};
            var newData = req.body;
            app.get('container').resolve(function(utils){
                async.series([
                    function getUser(cb){
                        UserController.read(user._id, function(err, _user) {
                            if (err) return cb(err);
                            server_user = _user;
                            cb();
                        });
                    },
                    function checkMainAddress(cb){
                        utils.checkAddress(newData.btcWithdrawAddress, function(err){
                            if(err) return cb({code: 400, message: 'Invalid main wallet address', errCode: '063'});
                            cb();
                        });
                    },
                    function checkSignature(cb){
                        utils.checkSignature(newData.btcWithdrawAddress, newData.signature, req.user.challenge, function(err){
                            logger.info(newData.signature);
                            if(err) return cb({code: 412, message: 'Invalid signature for main address', errCode: '064'});
                            cb();
                        });
                    },
                    function checkBackupAddress(cb){
                        if(!newData.btcBackupWithdrawAddress)
                            return cb();
                        if(newData.btcWithdrawAddress === newData.btcBackupWithdrawAddress)
                            return cb({code: 400, message: 'Main wallet address should not be the same as the backup address', errCode: '065'});
                        utils.checkAddress(newData.btcWithdrawAddress, function(err){
                            if(err) return cb({code: 400, message: 'Invalid backup wallet address', errCode: '066'});
                            cb();
                        });
                    },
                    function checkBackupSig(cb){
                        if(!newData.btcBackupWithdrawAddress)
                            return cb();
                        utils.checkSignature(newData.btcBackupWithdrawAddress, newData.backupSignature, req.user.challenge, function(err){
                            if(err) return cb({code: 412, message: 'Invalid signature for backup address', errCode: '067'});
                            cb();
                        });
                    },
                    function checkBackupSignatureOld(cb){
                        if(server_user.withdraw.btc.backup.address && newData.btcBackupWithdrawAddress !== server_user.withdraw.btc.backup.address) {
                            logger.info("check backup old sig");
                            utils.checkSignature(server_user.withdraw.btc.backup.address, newData.backupSignature_old, req.user.challenge, function(err){
                                logger.info(newData.backupSignature_old);
                                if(err) return cb({code: 412, message: 'Invalid signature for previous backup address', errCode: '064'});
                                cb();
                            });
                        } else {
                            logger.info("no check backup old sig");
                            cb();
                        }
                    },
                    function checkSignatureOld(cb){

                        if(server_user.withdraw.btc.address && newData.btcWithdrawAddress !== server_user.withdraw.btc.address) {
                            logger.info("check old sig");
                            utils.checkSignature(server_user.withdraw.btc.address, newData.signature_old, req.user.challenge, function(err){
                                logger.info(newData.signature_old);
                                if(err) return cb({code: 412, message: 'Invalid signature for previous address', errCode: '064'});
                                cb();
                            });
                        } else {
                            logger.info("no check old sig");
                            cb();
                        }
                    },
                    function updateUser(cb){
                        UserController.update(user, newData, function(err) {
                            if (err) return cb(err);
                            cb();
                        });
                    },
                    function getUpdatedUser(cb){
                        UserController.read(user._id, function(err, _user) {
                            if (err) return cb(err);
                            user = _user;
                            delete user.password;
                            delete user.ip;
                            cb();
                        });
                    }
                ], function(err){
                    if(err) return errorResponse(err.code, err.message, err.errCode, res);
                    res.json(202, user);
                });
            });
        }
    });

    swagger.addPut({
        'spec': {
            description : "Reset password",
            path : "/password/reset",
            notes : "Reset ther user password, needs signed a message using the user withdraw address.",
            summary : "Reset password",
            method: "PUT",
            parameters : [
                swagger.formParam("withdrawAddress", "Withdraw Address", "string"),
                swagger.formParam("challenge", "Withdraw Address", "string"),
                swagger.formParam("signature", "Signature", "string"),
                swagger.formParam("password", "New Password", "string")
            ],
            errorResponses : [
                swagger.errors.invalid('API token'),
                {code: 500, message: 'Internal Error'}
            ],
            type: "User",
            nickname : "resetPassword"
        },
        'action': function (req, res) {
            var user;
            var params = req.body;
            if(params.password === undefined)
                return errorResponse(400, 'New password must be set', res);
            var utils = app.get('container').get('utils');
            async.series([
                function getUserByAddress(cb){
                    UserController.getByWithdrawAddress(params.withdrawAddress, 'btc', function(err, _user){
                        if(err) return cb(new HTTPError(err.code, err.message, err.errCode));
                        user = _user;
                        cb();
                    });
                },
                function checkAddress(cb){
                    utils.checkAddress(params.withdrawAddress, function(err){
                        if(err) return cb(new HTTPError(err.code, err.message, err.errCode));
                        cb();
                    });
                },
                function checkSignature(cb){
                    utils.checkSignature(params.withdrawAddress, params.signature, params.challenge, function(err){
                        if(err) return cb(new HTTPError(err.code, err.message, err.errCode));
                        cb();
                    });
                },
                function setNewPassword(cb){
                    var newData = {
                        alias: user.alias,
                        email: user.email,
                        password: params.password,
                        btcWithdrawAddress: params.withdrawAddress
                    };
                    UserController.update(user, newData, function(err){
                        if(err) return cb(new HTTPError(err.code, err.message, err.errCode));
                        cb();
                    });
                }
            ], function(err){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                delete user.password;
                delete user.ip;
                res.send(202, user);
            });
        }
    });

    swagger.addGet({
        'spec': {
            description : "Get a challenge string for signing with a bitcoin private key",
            path : "/user/{userId}/challenge",
            notes : "Return challenge string",
            summary : "Return challenge string",
            method: "GET",
            parameters : [
                swagger.headerParam("authorization", "API token", "string", true),
                swagger.pathParam("userId", "user id", "string")
            ],
            errorResponses : [
                swagger.errors.invalid('API token'),
                {code: 401, message: "You cannot access another user"},
                {code: 412, message: "Invalid id provided"},
                {code: 500, message: 'Internal Error'}
            ],
            nickname : "getChallengeString"
        },
        'action': function (req, res) {
            UserController.getChallengeString(req.userId, function(err, challenge) {
                if (err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json({challenge: challenge});
            });
        }
    });

    swagger.addGet({
        'spec': {
            description : "Get a challenge string for signing with a bitcoin private key for password reset",
            path : "/password/challenge",
            notes : "Return challenge string",
            summary : "Return challenge string",
            method: "GET",
            nickname : "getChallengeStringForPasswordReset"
        },
        'action': function (req, res) {
            res.json({challenge: UserController.getChallengeStringForPasswordReset()});
        }
    });

    swagger.addPost({
        'spec': {
            description : "Generate TOTP secret key to be shared with the devices",
            path : "/user/{userId}/totp",
            notes : "Return secret key",
            summary : "Generate TOTP secret key",
            method: "POST",
            parameters : [
                swagger.pathParam("userId", "user id", "string")
            ],
            nickname : "getTotpSecretKey"
        },
        'action': function (req, res) {
            UserController.generateTotpSecret(req.user._id, function(err, secret){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json({totpSecret: secret});
            });
        }
    });

    swagger.addPut({
        'spec': {
            description : "Activate TOTP authentication if the one time pass is correct",
            path : "/user/{userId}/totp/activate/{oneTimePass}",
            notes : "Valid the one time pass, and activate the TOTP authentication in the future",
            summary : "Activate TOTP authentication",
            method: "PUT",
            parameters : [
                swagger.pathParam("userId", "user id", "string"),
                swagger.pathParam("oneTimePass", "TOTP one time password", "string")
            ],
            nickname : "activateTOTPAuthentication"
        },
        'action': function (req, res) {
            var oneTimePass = req.params.oneTimePass;
            UserController.activateTotp(req.user._id, oneTimePass, function(err, secret){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json({totpSecret: secret});
            });
        }
    });

    swagger.addPut({
        'spec': {
            description : "Deactivate TOTP authentication",
            path : "/user/{userId}/totp/deactivate",
            notes : "Deactivate the TOTP authentication",
            summary : "Deactivate TOTP authentication",
            method: "PUT",
            parameters : [
                swagger.pathParam("userId", "user id", "string")
            ],
            nickname : "activateTOTPAuthentication"
        },
        'action': function (req, res) {
            UserController.deactivateTotp(req.user._id, function(err){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(200);
            });
        }
    });

    swagger.addDelete({
        spec: {
            description: "Log out a user",
            path: "/user/{userId}",
            notes: "Deletes the specified user's token",
            summary: "Log out a user",
            method: "DELETE",
            parameters: [
                swagger.headerParam("authorization", "API token", "string", true),
                swagger.pathParam("userId", "user id", "string")
            ],
            errorResponses: [
                {code: 401, message: "You cannot access another user"},
                {code: 404, message: "User id not found"}
            ],
            type: "User",
            nickname: "logout"
        },
        action: function(req, res) {
            UserController.clearToken(req.user.token, function(err) {
                if (err) return errorResponse(err.code, err.message, err.errCode, res);
                UserController.clearSocket(req.user._id, function(err) {
                    if (err) return errorResponse(err.code, err.message, err.errCode, res);
                    res.send(202);
                });
            });
        }
    });

    swagger.addGet({
        spec: {
            description : "Accept a bonus",
            path : "/user/{userId}/bonus/accept/{currency}/{bonusId}",
            summary : "Accept a user bonus",
            method: "GET",
            parameters : [
                swagger.headerParam("authorization", "API token", "string", true),
                swagger.pathParam("userId", "user id", "string"),
                swagger.pathParam("currency", "currency", "string"),
                swagger.queryParam("bonusId", "id of bonus to accept", "string")
            ],
            errorResponses : [
                swagger.errors.invalid('API token'),
                {code: 401, message: "You cannot access another user"},
                {code: 412, message: "Invalid params"},
                {code: 500, message: 'Internal Error'}
            ],
            type: "User",
            nickname : "acceptBonus"
        },
        action: function(req, res) {
            UserController.acceptBonus(req.user, req.params.bonusId, req.currency, function(err, user) {
                if (err) return errorResponse(err.code, err.message, err.errCode, res);
                if (user.socket) {
                    notification.emit('user update', user.socket, user);
                } else {
                    logger.warn("user %s (%s) accepted a bonus without a socket", user.alias, user._id, {});
                }
                res.json(user);
            });
        }
    });

    swagger.addGet({
        spec: {
            description : "Reject a bonus",
            path : "/user/{userId}/bonus/reject/{currency}/{bonusId}",
            summary : "Reject a user bonus",
            method: "GET",
            parameters : [
                swagger.headerParam("authorization", "API token", "string", true),
                swagger.pathParam("userId", "user id", "string"),
                swagger.pathParam("currency", "currency", "string"),
                swagger.queryParam("bonusId", "id of bonus to accept", "string")
            ],
            errorResponses : [
                swagger.errors.invalid('API token'),
                {code: 401, message: "You cannot access another user"},
                {code: 412, message: "Invalid params"},
                {code: 500, message: 'Internal Error'}
            ],
            type: "User",
            nickname : "acceptBonus"
        },
        action: function(req, res) {
            UserController.rejectBonus(req.user, req.params.bonusId, req.currency, function(err, user) {
                if (err) return errorResponse(err.code, err.message, err.errCode, res);
                if (user.socket) {
                    notification.emit('user update', user.socket, user);
                } else {
                    logger.warn("user %s (%s) rejected a bonus without a socket", user.alias, user._id, {});
                }
                res.json(user);
            });
        }
    });

    swagger.addGet({
        'spec': {
            description : "Initiate a user withdraw",
            path : "/user/{userId}/withdraw/{currency}",
            notes : "On successfully changed, if the user has an open socket, it will trigger 'player updated' event via the socket",
            summary : "Initiate a user withdraw",
            method: "GET",
            parameters : [
                swagger.headerParam("authorization", "API token", "string", true),
                swagger.pathParam("userId", "user id", "string"),
                swagger.pathParam("currency", "currency", "string"),
                swagger.queryParam("amount", "withdraw bitcoin amount", "float")
            ],
            errorResponses : [
                swagger.errors.invalid('API token'),
                {code: 401, message: "You cannot access another user"},
                {code: 412, message: "Invalid params"},
                {code: 500, message: 'Internal Error'}
            ],
            type: "User",
            nickname : "initiateWithdraw"
        },
        'action': function (req, res) {
            var amount = req.query.amount;
            amount = parseInt(amount, 10);
            if(isNaN(amount)) return errorResponse(400, 'Invalid format for withdraw amount', '068', res);
            app.get("container").get("UserController").withdraw(req.userId, req.currency, amount, function(err, result) {
                if (err) return errorResponse(err.code, err.message, err.errCode, res);
                delete result.user.password;
                delete result.user.ip;
                if (result.user.socket) {
                    notification.emit('user update', result.user.socket, result.user);
                    notification.emit('withdraw', result.user.socket, result.user, result.transaction);
                }
                res.json(result);
            });
        }
    });

    swagger.addPut({
        'spec': {
            description : "Add a withdraw address",
            path : "/user/{userId}/address/withdraw/{currency}",
            notes : "",
            summary : "Add a withdraw address",
            method: "PUT",
            parameters : [
                swagger.headerParam("authorization", "API token", "string", true),
                swagger.pathParam("userId", "user id", "string"),
                swagger.pathParam("currency", "currency", "string"),
                swagger.formParam("address", "Address to add", "string"),
                swagger.formParam("originalSig", " The challenge string signed by the users original address (not required if this is the first address being added)", "string"),
                swagger.formParam("sig", "The challenge string signed by the address being added", "string")
            ],
            nickname : "addWithdrawAddress"
        },
        'action': function (req, res) {
            var address = req.body.address;
            var originalSig = req.body.originalSig;
            var newSig = req.body.sig;
            var currency = req.currency;
            var user = req.user;
            if (!user.challenge) return errorResponse(412, 'you must get a challenge message first', res);
            var allValid = new EventEmitter();
            allValid.once('validated', function() {
                // logger.debug('address and sig validated');
                UserController.addWithdrawAddress(user._id, address, currency, function(err, address) {
                    if (err) return errorResponse(err.code || 500, err.message, err.errCode, res);
                    res.json(202, {address: address});
                });
            });
            app.get('container').get('utils').checkAddress(address, function(err) {
                if (err) return errorResponse(400, 'Invalid address', '055', res);
                // logger.debug('checking sig', {address: address, sig: newSig});
                app.get('container').get('utils').checkSignature(address, newSig, user.challenge, function(err) {
                    if (err) return errorResponse(412, 'Invalid signature', '056', res);
                    // if this is the first address added, then consider it valid after checking the new address
                    if (!user.withdraw[currency]) return allValid.emit('validated');
                    // otherwise, check the old address' signature as well
                    // logger.debug('checking sig', {address: user.withdraw[currency].address, sig: originalSig});
                    app.get('container').get('utils').checkSignature(user.withdraw[currency].address, originalSig, user.challenge, function(err) {
                        if (err) return errorResponse(412, 'Invalid original signature', '069', res);
                        allValid.emit('validated');
                    });
                });
            });
        }
    });

    // lock down the app access by a key, use the app-keygen script in /bin to make a new key
    var appTest = function(req, res, next, _app) {
        // bypass check for dev
        if (app.get('env') === 'development' || app.get('env') === 'test'){
            //mark it as internal request so no need to authenticate using /user/* inteceptor
            req.internal = true;
            logger.warn('bypassing app key check');
            return next();
        }
        var keyGiven = req.get('app-key');
        appkeys.findOne({_id: _app}, function(err, appkey) {
            if (err) return errorResponse(500, err.message, '032', res);
            if (keyGiven === undefined) return errorResponse(418, 'Ah ah ah, you didn\'t say the magic word.', '070', res);
            if (!appkey) return errorResponse(418, 'Ah ah ah, you didn\'t say the magic word.', '070', res);
            var appHash = appkey.hash;
            bcrypt.compare(keyGiven, appHash, function(err, res) {
                if (err) return errorResponse(500, err.message, '032', res);
                if (res !== true) return errorResponse(418, 'Ah ah ah, you didn\'t say the magic word.', '070', res);
                req.internal = true;
                next();
            });
        });
    };
    app.param('app', appTest);

    app.param('creditDebit', function(req, res, next, creditDebit) {
        if (creditDebit === 'credit') {
            req.action = 'credit';
            next();
        } else if (creditDebit === 'debit'){
            req.action = 'debit';
            next();
        } else {
            errorResponse(400, 'invalid action', '071', res);
        }
    });
    var BONUSES = require('../lib/bonuses');

    var cleanBonus = function(req, res) {
        var bonusName = req.body.bonusName;
        var currency = req.body.currency || 'btc';
        var bonusConf;
        if (bonusName) {
            if (BONUSES.hasOwnProperty(bonusName)) {
                bonusConf = BONUSES[bonusName];
            } else {
                return errorResponse(400, "Invalid bonus name", undefined, res);
            }
        } else {
            var type = req.body.type;
            if (BONUSES.types.indexOf(type) < 0) return errorResponse(400, "invalid type", undefined, res);
            var autostart = req.body.autostart ? true : false;
            bonusConf = {
                currency: currency,
                type: type,
                autostart: autostart,
            };
            var unlockMultiplier = parseFloat(req.body.unlockMultiplier);
            if (isNaN(unlockMultiplier)) return errorResponse(400, "invalid unlock multiplier", undefined, res);
            bonusConf.unlockMultiplier = unlockMultiplier;
        }
        if (bonusConf.type === "straight") {
            // get initial value
            var initial = parseInt(req.body.initial, 10);
            if (bonusName) {
                // if a valid initial value was provided
                // otherwise use the default 1.8
                if (!isNaN(initial)) {
                    if (initial > (10).toSatoshi()) return errorResponse(418, "initial value too big, contact the dev to raise the limit", undefined, res);
                    bonusConf.initial = initial;
                }
            } else {
                if (isNaN(initial)) return errorResponse(400, "invalid initial value", undefined, res);
                if (initial > (10).toSatoshi()) return errorResponse(418, "that's too big, contact the dev to raise the limit", undefined, res);
                bonusConf.initial = initial;
            }
        } else if (bonusConf.type === "match") {
            // get initial value
            var max = parseInt(req.body.max, 10);
            bonusConf.max = max;
            if (bonusName) {
                // if a valid initial value was provided
                // otherwise use the default 1.8
                if (!isNaN(max)) {
                    if (max > (10).toSatoshi()) return errorResponse(418, "max value too big, contact the dev to raise the limit", undefined, res);
                    bonusConf.max = max;
                }
            } else {
                if (isNaN(max)) return errorResponse(400, "invalid max match", undefined, res);
                if (max > (10).toSatoshi()) return errorResponse(418, "max value too big, contact the dev to raise the limit", undefined, res);
                bonusConf.max = max;
            }
        }
        // save the app name that created this
        bonusConf.app = req.params.app;
        return bonusConf;
    };

    swagger.addPost({
        'spec': {
            description : "Give a bonus to a user",
            path : "/bonus/{app}/{userId}",
            notes : "",
            summary : "Grants a user a bonus, either pre configured, or supplied via POST JSON",
            method: "POST",
            parameters : [
                swagger.headerParam("app-key", "This app key is compared using bcrypt to the hash of the key stored in `config/app-keys.json` as an object with app names for keys (see below) and key hashes for values. Use the [generator script] (bin/app-keygen) to generate a key/hash pair", "string"),
                swagger.pathParam("app", "the name of the app as it appears in the config/app-keys.json file", "string"),
                swagger.pathParam("userId", "User id", "string"),
                swagger.formParam("bonusName", "Name of a preconfigured bonus", "string"),
                swagger.formParam("type", "bonus type, \"match\" or \"straight\"", "string"),
                swagger.formParam("currency", "currency", "string"),
                swagger.formParam("autostart", "Bonus is \"started\" as soon as it's accepted, defaults to false", "boolean"),
                swagger.formParam("unlockMultiplier", "\"Rollover\" amount", "float"),
                swagger.formParam("max", "Max amount for a match bonus (does not apply to other types)", "integer"),
                swagger.formParam("initial", "Initial value for bonus, only for \"straight\" type", "integer")
            ],
            nickname : "creditDebitAccount"
        },
        'action': function (req, res) {
            var bonusConf = cleanBonus(req, res);
            if (!bonusConf) return;
            UserController.giveBonus(req.userId, bonusConf, true, function(err, user) {
                if (err) return errorResponse(err.code, err.message, undefined, res);
                return res.json(user);
            });
        }
    });

    swagger.addPost({
        'spec': {
            description : "Mark an affiliate tag",
            path : "/affiliate/{affiliateToken}",
            notes : "Make a tag for this ip/user agent combo for the affiliate tag",
            summary : "Tag a user for an affiliate",
            method: "POST",
            parameters : [swagger.pathParam("affiliateToken", "Affiliate token string", "string")],
            errorResponses : [
                swagger.errors.invalid('affiliate token'),
                swagger.errors.notFound('affiliate token'),
                {code: 500, message: 'Internal Error'}
            ],
            nickname : "confirmEmailToken"
        },
        'action': function (req, res) {
            var token = req.params.affiliateToken;
            var ip = req.ip;
            var userAgent = req.get('user-agent');
            if (!userAgent) errorResponse(400, "missing user agent", null, res);
            if (!ip) errorResponse(400, "missing ip", null, res);
            if (!token) errorResponse(400, "missing affiliate token", null, res);
            UserController.getAffiliateTag(ip, userAgent, token, function(err, tag) {
                if (err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(tag);
            });
        }
    });

    swagger.addGet({
        spec: {
            description: "Get affiliate stats",
            path : "/affiliate/{affiliateId}",
            notes : "Includes number of associates, transactions",
            summary : "Affiliate stats",
            method: "GET",
            parameters : [
                swagger.pathParam("affiliateId", "User Id of the affiliate account", "string"),
                swagger.queryParam("start", "start date for transactions", "date string"),
                swagger.queryParam("end", "end date for transactions", "date string"),
            ],
            nickname : "getAffiliateStats"
        },
        'action': function (req, res) {
            var returnData = {};
            var start = new Date(req.query.start);
            var end = new Date(req.query.end);
            if (start.toString === 'Invalid Date') return errorResponse(400, "invalid start date", null, res);
            if (end.toString === 'Invalid Date') return errorResponse(400, "invalid end date", null, res);
            logger.debug("getting affiliate stats from %s to %s for %s (%s)", start, end, req.user.alias, req.user._id, {});
            async.series([
                function(done) {
                    UserController.getAffiliateAssociates(req.user, function(err, associates) {
                        if (err) return done(new HTTPError(500, "error getting associates"));
                        returnData.associates = associates;
                        done();
                    });
                },
                function(done) {
                    UserController.getAffiliateTransactions(req.user, start, end, function(err, transactions) {
                        if (err) return done(new HTTPError(500, "error getting transactions: " + err.message));
                        returnData.transactions = transactions;
                        done();
                    });
                }
            ], function(err) {
                if (err) return errorResponse(err.code, err.message, err.errCode, res);
                var txs = returnData.transactions.slice();
                returnData.associates.forEach(function(associate) {
                    var userTxs = txs.filter(function(tx) {
                        return tx.meta.associate && tx.meta.associate.equals(associate._id);
                    });
                    associate.revenue = userTxs.reduce(function(previousVal, currentTx) {
                        return previousVal + currentTx.amtIn;
                    }, 0);
                    // delete associate._id;
                });
                // remove meta and refId (has associate user ids in it)
                returnData.transactions.forEach(function(tx) {
                    // delete tx.meta;
                    delete tx.refId;
                });
                res.json(returnData);
            });
        }
    });

    swagger.addGet({
        spec: {
            description: "Get affiliate associates",
            path : "/affiliate/{affiliateId}/associates",
            notes : "Get affiliate associates",
            summary : "Associates stats",
            method: "GET",
            parameters : [
                swagger.pathParam("affiliateId", "User Id of the affiliate account", "string")
            ],
            nickname : "getAffiliateAssociatesStats"
        },
        'action': function (req, res) {
            UserController.getAffiliateAssociatesTotals(req.user, function(err, associates){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(associates);
            });
        }
    });

    swagger.addGet({
        spec: {
            description: "Get associate's game transactions",
            path : "/affiliate/{affiliateId}/associate/{associateId}",
            notes : "EVERY TRANSACTION for the player (NOT INCLUDING deposits/withdrawals/bonus)",
            summary : "Associate transactions",
            method: "GET",
            parameters : [
                swagger.pathParam("associateId", "User Id of the associate account", "string"),
                swagger.queryParam("sort", "Which column to sort", "string"),
                swagger.queryParam("order", "Sort order", "integer"),
                swagger.queryParam("page", "Query page", "integer"),
                swagger.queryParam("size", "Page size", "integer")
            ],
            nickname : "getAssociateTransactions"
        },
        'action': function (req, res) {
            var options = {
                sort: req.param('sort'),
                order: parseInt(req.param('order')) || -1,
                page: parseInt(req.param('page')) || 1,
                size: parseInt(req.param('size')) || 500
            };
            UserController.getAssociateTransactions(req.associate, options, function(err, returnData){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                // returnData.transactions.forEach(function(tx){
                //     delete tx.meta;
                // });
                returnData.associateUsername = req.associate.alias;
                res.json(returnData);
            });
        }
    });

    swagger.addPut({
        spec: {
            description: "Make a user an affiliate",
            path : "/affiliate/{app}/{userId}",
            notes : "Makes a user an affiliate",
            summary : "Makes a user an affiliate",
            method: "PUT",
            parameters : [
                swagger.pathParam("app", "the name of the app as it appears in the config/app-keys.json file", "string"),
                swagger.pathParam("userId", "User id", "string"),
                swagger.formParam("type", "type of affiliate (\"cpa\" or \"revenue\")", ""),
                swagger.formParam("take", "a percentage take for revenue affiliates", "float"),
                swagger.formParam("reward", "a reward per aquisition for CPA affiliates (in Satoshi)", "int"),
            ],
            nickname : "creditDebitAccount"
        },
        'action': function (req, res) {
            var affiliateConf = {};
            if (req.body.type) affiliateConf.type = req.body.type;
            if (parseFloat(req.body.take)) affiliateConf.take = parseFloat(req.body.take);
            if (parseInt(req.body.reward, 10)) affiliateConf.reward = parseInt(req.body.reward, 10);
            UserController.makeAffiliate(req.userId, affiliateConf, function(err, user) {
                if (err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(user);
            });
        }
    });


    swagger.addPost({
        'spec': {
            description : "Give a bonus to a group of users",
            path : "/bonus/{app}",
            notes : "",
            summary : "Grants a user a bonus, either pre configured, or supplied via POST JSON",
            method: "POST",
            parameters : [
                swagger.headerParam("app-key", "This app key is compared using bcrypt to the hash of the key stored in `config/app-keys.json` as an object with app names for keys (see below) and key hashes for values. Use the [generator script] (bin/app-keygen) to generate a key/hash pair", "string"),
                swagger.pathParam("app", "the name of the app as it appears in the config/app-keys.json file", "string"),
                swagger.pathParam("userId", "User id", "string"),
                swagger.formParam("bonusName", "Name of a preconfigured bonus", "string"),
                swagger.formParam("type", "bonus type, \"match\" or \"straight\"", "string"),
                swagger.formParam("currency", "currency", "string"),
                swagger.formParam("autostart", "Bonus is \"started\" as soon as it's accepted, defaults to false", "boolean"),
                swagger.formParam("unlockMultiplier", "\"Rollover\" amount", "float"),
                swagger.formParam("max", "Max amount for a match bonus (does not apply to other types)", "integer"),
                swagger.formParam("initial", "Initial value for bonus, only for \"straight\" type", "integer")
            ],
            nickname : "creditDebitAccount"
        },
        'action': function (req, res) {
            var bonusConf = cleanBonus(req, res);
            if (!bonusConf) return;
            req.body.userIds.forEach(function(userId) {
                var succeded = [];
                var failed = [];
                UserController.giveBonus(userId, bonusConf, true, function(err, user) {
                    if (err) {
                        failed.push(userId);
                    } else {
                        succeded.push(user._id);
                    }
                    if (failed.length + succeded.length === req.body.userIds.length) {
                        res.json({
                            succeded: succeded.length,
                            failed: failed.length,
                            failedIds: failed
                        });
                    }
                });
            });
        }
    });

    swagger.addPost({
        'spec': {
            description : "Credit or Debit transaction to the account",
            path : "/transaction/{app}/{creditDebit}/{userId}",
            notes : "",
            summary : "Credit or Debit transaction to the account",
            method: "POST",
            parameters : [
                swagger.headerParam("app-key", "This app key is compared using bcrypt to the hash of the key stored in `config/app-keys.json` as an object with app names for keys (see below) and key hashes for values. Use the [generator script] (bin/app-keygen) to generate a key/hash pair", "string"),
                swagger.pathParam("app", "the name of the app as it appears in the config/app-keys.json file", "string"),
                swagger.pathParam("creditDebit", "Credit or debit", "string", ['credit', 'debit']),
                swagger.pathParam("userId", "User id", "string"),
                swagger.formParam("amount", "The amount to credit or debit the account", "integer"),
                swagger.formParam("type", "The type of transaction (this is up to the app, there may be a type registartion mechanism in the future)", "string"),
                swagger.formParam("refId", "The id of the thing that is causing this transaction (in the context of a game server talking to this server, it would likely be the gameId of the game that warrented this transaction)", "string"),
                swagger.formParam("meta", "A Javascript (JSON) object containing any other info that should be attached to this transaction, but does not fit one of the above params. This should be only 1 level deep (think of it as a simple key/value store)", "string"),
                swagger.formParam("currency", "currency", "string")
            ],
            nickname : "creditDebitAccount"
        },
        'action': function (req, res) {
            var amount = req.body.amount;
            if (amount === undefined) {
                return errorResponse(400, "invalid amount", '026', res);
            }
            UserController[req.action](req.userId, amount, req.body, function(err, user, transaction) {
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                delete user.password;
                delete user.ip;
                if (user.socket) {
                    notification.emit(req.action, user.socket, user, transaction);
                }
                res.json({
                    user: user,
                    transaction: transaction
                });
            });
        }
    });

    swagger.addGet({
        'spec': {
            description : "Get the history for a user's transaction",
            path : "/user/{userId}/transaction/{currency}/{since}",
            notes : "Get the transaction history since after a specified date.",
            summary : "Get transaction history",
            method: "GET",
            parameters : [
                swagger.headerParam("authorization", "API token", "string", true),
                swagger.pathParam("userId", "User id", "string"),
                swagger.pathParam("since", "Beginning date for the transactions occurred, in a format of 2014-01-01", "string"),
                swagger.pathParam("currency", "currency", "string")
            ],
            nickname : "queryTransactionHistory"
        },
        'action': function (req, res) {
            app.get('container').resolve(function(TransactionController){
                var page = req.query.page || 1;
                var limit = req.query.limit || 50;
                TransactionController.getHistory(req.params.currency, req.params.userId, req.params.since, page, limit, function(err, txs){
                    if(err) return errorResponse(err.code, err.message, err.errCode, res);
                    res.json(200, txs);
                });
            });
        }
    });

    swagger.addGet({
        'spec': {
            description : "Get all sticked notifications",
            path : "/user/{userId}/notification",
            notes : "Get all the notifications under an user",
            summary : "Get all sticked notifications",
            method: "GET",
            parameters : [
                swagger.pathParam("userId", "User id", "string")
            ],
            nickname : "getAllNotifications"
        },
        'action': function (req, res) {
            UserController.getNotifications(req.params.userId, function(err, notifications){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(200, notifications);
            });
        }
    });

    swagger.addDelete({
        'spec': {
            description : "Dismiss a notification",
            path : "/user/{userId}/notification/{notificationId}",
            notes : "Change the stick of the notification to false, so it won't be retrieved next time",
            summary : "Dismiss a notification",
            method: "DELETE",
            parameters : [
                swagger.pathParam("userId", "User id", "string"),
                swagger.pathParam("userId", "Notification id", "string")
            ],
            nickname : "dismissNotification"
        },
        'action': function (req, res) {
            UserController.dismissNotification(req.user._id, req.params.notificationId, function(err){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.send(204);
            });
        }
    });

    swagger.addPut({
        'spec': {
            description : "Mark a notification as read",
            path : "/user/{userId}/notification/{notificationId}/read",
            notes : "Change the hasRead status to true",
            summary : "Mark a notification as read",
            method: "PUT",
            parameters : [
                swagger.pathParam("userId", "User id", "string"),
                swagger.pathParam("userId", "Notification id", "string")
            ],
            nickname : "markReadNotification"
        },
        'action': function (req, res) {
            UserController.markNotificationRead(req.user._id, req.params.notificationId, function(err, updatedNotification){
                if(err) return errorResponse(err.code, err.message, err.errCode. res);
                res.json(202, updatedNotification);
            });
        }
    });

    swagger.addGet({
        'spec': {
            description : "Get a notification",
            path : "/user/{userId}/notification/{notificationId}/read",
            notes : "Change the hasRead status to true. If it is a ticket notification, return the notification obj with the ticket embedded with whole conversation.",
            summary : "Read a notification, retrieve the embedded object that triggered the notification and mark as read",
            method: "GET",
            parameters : [
                swagger.pathParam("userId", "User id", "string"),
                swagger.pathParam("userId", "Notification id", "string")
            ],
            nickname : "readNotification"
        },
        'action': function (req, res) {
            async.waterfall([
                function getNotification(cb){
                    UserController.readNotification(req.user._id, req.params.notificationId, function(err, notification){
                        cb(err, notification);
                    });
                },
                function markNotificationRead(notification, cb){
                    UserController.markNotificationRead(req.user._id, req.params.notificationId, function(err, updatedNotification){
                        cb(err, updatedNotification);
                    });
                },
                function retrieveTicket(notification, cb){
                    if(notification.ticketId === undefined) return cb();
                    app.get('container').get('TicketController').get(notification.ticketId, function(err, ticket){
                        notification.ticket = ticket;
                        cb(err, notification);
                    });
                }
            ], function(err, notification){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(202, notification);
            });
        }
    });

    swagger.addPost({
        'spec': {
            description : "Send a message to betcoin support",
            path : "/user/{userId}/message/send",
            notes : "Send a message specified by customer to betcoin support",
            summary : "Send a message to betcoin support",
            method : "POST",
            parameters : [
                swagger.pathParam("userId", "User id", "string"),
                swagger.formParam("subject", "subject", "string"),
                swagger.formParam("message", "message body", "string")
            ],
            nickname : "sendSupportMessage"
        },
        'action': function (req, res) {
            var subject = req.body.subject;
            var message = req.body.message;
            UserController.sendSupportMessage(req.user, {
                subject: subject,
                message: message
            }, function(err){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.send(200);
            });
        }
    });
    swagger.addPost({
        'spec': {
            description : "Create a ticket by non-login users",
            path : "/ticket",
            notes : "For non-login users, it returns the ticket id for the non-login users to access the updates for the ticket.",
            summary : "Create a ticket by non-login users",
            method : "POST",
            parameters : [
                swagger.formParam("owner", "User name", "string"),
                swagger.formParam("email", "User email", "string"),
                swagger.formParam("subject", "Ticket description", "string"),
                swagger.formParam("description", "Ticket description", "string"),
                {
                    "name" : "priority",
                    "description" : "Ticket priority : low = 1, normal = 2, high = 3,  urgent = 4",
                    "type" : "integer",
                    "required" : true,
                    "paramType" : "form"
                },
                {
                    "name" : "type",
                    "description" : "Ticket type : incident = 1, question = 2, problem = 3,  task = 4",
                    "type" : "integer",
                    "required" : true,
                    "paramType" : "form"
                }
            ],
            nickname : "createTicketByAnonymous"
        },
        'action': function (req, res) {
            var ticketBody = req.body;
            app.get('container').get('TicketController').createForAnonymous(ticketBody, function(err, createdTicket){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(201, createdTicket);
            });
        }
    });

    swagger.addGet({
        spec: {
            descirption: "Get all tickets for a user (non closed)",
            path: "/user/{userId}/ticket",
            notes: "gets all of the open and pending tickets for a user",
            method: "GET",
            paremeters: [
                swagger.pathParam("userId", "a user id", "string")
            ],
            nickname: "getUserTickets"
        },
        action: function(req, res) {
            app.get('container').get('TicketController').getUserTickets(req.user._id, function(err, tickets) {
                if (err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(tickets);
            });
        }
    });

    swagger.addPost({
        'spec': {
            description : "Create a ticket by login users",
            path : "/user/{userId}/ticket",
            notes : "For login users, they can access to the updates of the tickets in their messages view",
            summary : "Create a ticket by login users",
            method : "POST",
            parameters : [
                swagger.formParam("subject", "Ticket description", "string"),
                swagger.formParam("description", "Ticket description", "string"),
                {
                    "name" : "priority",
                    "description" : "Ticket priority : low = 1, normal = 2, high = 3,  urgent = 4",
                    "type" : "integer",
                    "required" : true,
                    "paramType" : "form"
                },
                {
                    "name" : "type",
                    "description" : "Ticket type : incident = 1, question = 2, problem = 3,  task = 4",
                    "type" : "integer",
                    "required" : true,
                    "paramType" : "form"
                }
            ],
            nickname : "createTicketByUser"
        },
        'action': function (req, res) {
            var ticketBody = req.body;
            ticketBody.owner = req.user.alias;
            ticketBody.email = req.user.email;
            ticketBody.userId = req.user._id;
            async.waterfall([
                function createTicket(cb){
                    app.get('container').get('TicketController').createForUser(ticketBody, req.user, function(err, createdTicket){
                        if(err) return cb(err);
                        cb(null, createdTicket);
                    });
                },
                function sendEmailToAdmin(createdTicket, cb) {
                    UserController.sendSupportMessage(req.user, {
                        subject: createdTicket.subject,
                        message: createdTicket.description
                    }, function(err){
                        if(err) return cb(err);
                        cb(null, createdTicket);
                    });
                },
                function generateNotification(createdTicket, cb){
                    app.get('container').get('UserController').saveNotification(req.user._id, {
                        subject: createdTicket.subject,
                        message: createdTicket.description,
                        ticketId: createdTicket._id
                    }, function(err, createdNotification){
                        cb(err, createdTicket, createdNotification);
                    });
                }
            ], function(err, createdTicket){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(201, createdTicket);
            });
        }
    });

    swagger.addPut({
        'spec': {
            description : "Update a ticket's status by admin",
            path : "/ticket/{app}/{ticketId}",
            notes : "Update a ticket's status",
            summary : "Update a ticket",
            method : "PUT",
            parameters : [
                swagger.pathParam("ticketId", "Ticket id", "string"),
                swagger.formParam("status", "Ticket status : open = 1, closed = 2, pending = 3,  flagged = 4", "integer")
            ],
            nickname : "updateTicketStatus"
        },
        'action': function (req, res) {
            var ticketId = req.params.ticketId;
            var status = req.body.status;
            app.get('container').get('TicketController').update({
                ticketId : ticketId,
                status : status
            }, function(err, updatedTicket){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(202, updatedTicket);
            });
        }
    });

    swagger.addPut({
        'spec': {
            description : "Update a ticket's status by login user",
            path : "/user/{userId}/ticket/{ticketId}/status/{status}",
            notes : "Update a ticket's status, and returns the updated ticket object",
            summary : "Update a ticket",
            method : "PUT",
            parameters : [
                swagger.pathParam("userId", "User id", "string"),
                swagger.pathParam("ticketId", "Ticket id", "string"),
                swagger.pathParam("status", "Ticket status : open = 1, closed = 2, pending = 3,  flagged = 4", "integer")
            ],
            nickname : "updateTicketStatus"
        },
        'action': function (req, res) {
            var ticketId = req.params.ticketId;
            var status = req.params.status;
            app.get('container').get('TicketController').update({
                ticketId : ticketId,
                status : status,
                userId : req.user._id
            }, function(err, updatedTicket){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(202, updatedTicket);
            });
        }
    });

    swagger.addGet({
        'spec': {
            description : "Get a ticket",
            path : "/ticket/{ticketId}",
            notes : "Get a ticket by a ticket id",
            summary : "Get a ticket",
            method : "GET",
            parameters : [
                swagger.pathParam("ticketId", "Ticket id", "string")
            ],
            nickname : "getTicket"
        },
        'action': function (req, res) {
            var ticketId = req.params.ticketId;
            app.get('container').get('TicketController').get(ticketId, function(err, ticket){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(200, ticket);
            });
        }
    });

    swagger.addPut({
        'spec': {
            description : "Add a ticket comment by admin",
            path : "/ticket/{app}/{ticketId}/comment",
            notes : "Add a ticket comment by admin",
            summary : "Add a ticket comment",
            method : "PUT",
            parameters : [
                swagger.pathParam("ticketId", "Ticket id", "string"),
                swagger.formParam("comment", "Ticket comment", "string"),
                {
                    "name" : "status",
                    "description" : "Ticket status used by admin comment : open = 1, closed = 2, pending = 3,  flagged = 4",
                    "type" : "integer",
                    "required" : true,
                    "paramType" : "form"
                }
            ],
            nickname : "addTicketCommentByAdmin"
        },
        'action': function (req, res) {
            var ticketId = req.params.ticketId;
            var message = req.body.message;
            var status = req.body.status;
            var ticket;
            async.series([
                function addComment(cb){
                    app.get('container').get('TicketController').updateComment({
                        ticketId: ticketId,
                        message: message,
                        status: status,
                        isAdmin: true
                    }, function(err, _ticket){
                        if(err) return cb(err);
                        ticket = _ticket;
                        cb();
                    });
                },
                function notification(cb){
                    if(ticket.userId){
                        app.get('container').get('UserController').updateTicketNotification(ticket.userId, ticketId, function(err){
                            if (err) return cb(err);
                            cb();
                        });
                    }else cb();
                }
            ], function(err){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(201, ticket);
            });
        }
    });
    swagger.addPost({
        'spec': {
            description : "Add a ticket comment by anonymous",
            path : "/ticket/{ticketId}/comment",
            notes : "Add a ticket comment by anonymous",
            summary : "Add a ticket comment",
            method : "PUT",
            parameters : [
                swagger.pathParam("ticketId", "Ticket id", "string"),
                swagger.formParam("comment", "Ticket comment", "string"),
                {
                    "name" : "status",
                    "description" : "Ticket status used by anonymous comment : open = 1, closed = 2, pending = 3,  flagged = 4",
                    "type" : "integer",
                    "required" : true,
                    "paramType" : "form"
                }
            ],
            nickname : "addTicketCommentByAnonymous"
        },
        'action': function (req, res) {
            var ticketId = req.params.ticketId;
            var message = req.body.message;
            var status = req.body.status;
            var ticket;
            async.series([
                function addComment(cb){
                    app.get('container').get('TicketController').updateComment({
                        ticketId: ticketId,
                        message: message,
                        status: status,
                    }, function(err, _ticket){
                        if(err) return cb(err);
                        ticket = _ticket;
                        cb();
                    });
                }
            ], function(err){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(201, ticket);
            });
        }
    });
    swagger.addPost({
        'spec': {
            description : "Add a ticket comment by login user",
            path : "/user/{userId}/ticket/{ticketId}/comment",
            notes : "Add a ticket comment either by login user.",
            summary : "Add a ticket comment",
            method : "POST",
            parameters : [
                swagger.pathParam("userId", "User id", "string"),
                swagger.pathParam("ticketId", "Ticket id", "string"),
                swagger.formParam("comment", "Ticket comment", "string"),
                {
                    "name" : "status",
                    "description" : "Ticket status used by admin comment : open = 1, closed = 2, pending = 3,  flagged = 4",
                    "type" : "integer",
                    "required" : true,
                    "paramType" : "form"
                }
            ],
            nickname : "addTicketCommentByUser"
        },
        'action': function (req, res) {
            var ticketId = req.params.ticketId;
            var message = req.body.message;
            var status = req.body.status;
            app.get('container').get('TicketController').updateComment({
                ticketId: ticketId,
                message: message,
                status: status,
                userId: req.user._id
            }, function(err, ticket){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(201, ticket);
            });
        }
    });

    swagger.addGet({
        'spec': {
            description : "Get a list of tickets based on status",
            path : "/ticket/{app}/status/{status}",
            notes : "Get a list of tickets based on status",
            summary : "Get a list of tickets based on status",
            method : "GET",
            parameters : [
                swagger.pathParam("status", "Ticket status", "integer")
            ],
            nickname : "getTicketByStatus"
        },
        'action': function (req, res) {
            var status = parseInt(req.params.status);
            app.get('container').get('TicketController').getTicketsByStatus(status, function(err, result){
                if(err) return errorResponse(err.code, err.message, err.errCode, res);
                res.json(200, result);
            });
        }
    });

    swagger.addGet({
        'spec': {
            description : "Generate QR code image based on bitcoin address",
            path : "/qrcode/{address}",
            notes : "Generate QR code image for bitcoin addresses",
            summary : "Generate QR code image based on bitcoin address",
            method : "GET",
            parameters : [
                swagger.pathParam("address", "Bitcoin address", "string")
            ],
            nickname : "getBitcoinAddress"
        },
        'action': function (req, res) {
            var code = qr.image('bitcoin:' + req.params.address.toString(), {size: 5});
            code.pipe(res);
        }
    });

    swagger.addGet({
        'spec': {
            description : "Generate QR code for google 2 factor authentication",
            path : "/qrcode/google-two-factor/{secret}",
            notes : "Generate QR code for google 2 factor authentication",
            summary : "Generate QR code for google 2 factor authentication",
            method : "GET",
            parameters : [
                swagger.pathParam("secret", "Totp Secret", "string")
            ],
            nickname : "getGoogleAuthenticationQRCode"
        },
        'action': function (req, res) {
            var code = qr.image('otpauth://totp/betcoin.tm?secret=' + req.params.secret.toString(), {size: 5});
            code.pipe(res);
        }
    });

    swagger.addPost({
        spec: {
            description : "Send notification message to a list of users.",
            path : "/notification/{app}",
            notes : "It add a new notification to user.notifications. It also can be specified to send the message via email. This is currently used by the backoffice.",
            summary : "Send notifications from backoffice",
            method: "POST",
            parameters : [
                swagger.headerParam("app-key", "This app key is compared using bcrypt to the hash of the key stored in `config/app-keys.json` as an object with app names for keys (see below) and key hashes for values. Use the [generator script] (bin/app-keygen) to generate a key/hash pair", "string"),
                swagger.pathParam("app", "the name of the app as it appears in the config/app-keys.json file", "string"),
                swagger.formParam("userIds", "the list of the users, to which the notification message is sending"),
                swagger.formParam("subject", "the message subject", "string"),
                swagger.formParam("message", "the message body", "string"),
                swagger.formParam("sendEmail", "email template. If this is set it will send the message as an email to the user as well.", "string"),
            ],
            nickname : "sendGroupNotifications"
        },
        action : function (req, res) {
            var params = req.body;
            if((req.body.userIds instanceof Array) === false){
                return errorResponse(400, 'userIds parameter must be an array', '073', res);
            }
            var userIds = params.userIds.slice();
            var UserController = app.get('container').get('UserController');
            var fails = 0;
            var failedIds = [];
            var successes = 0;
            var looper = function() {
                var userId = userIds.shift();
                if (userId !== undefined) {
                    UserController.saveNotification(userId, params, function(err) {
                        if (err) {
                            logger.error("error sending notification for user %s: %s", userId, err.message);
                            fails += 1;
                            failedIds.push(userId);
                        } else {
                            successes += 1;
                        }
                        looper();
                    });
                } else {
                    var returnObj = {
                        userIds: req.body.userIds.length,
                        success: successes,
                        fail: fails
                    };
                    if (fails !== 0) {
                        returnObj.failedIds = failedIds;
                    }
                    res.send(200, returnObj);
                }
            };
            looper();
        }
    });

    swagger.addPut({
        spec: {
            description : "Backoffice operations on an user",
            path : "/{app}/user/{userId}/{action}",
            notes : "Valid actions are lock, unlock, omit, unomit, trust, untrust",
            summary : "Backoffice operations on an user",
            method: "PUT",
            parameters : [
                swagger.pathParam("userId", "user id", "string")
            ],
            nickname : "actionsOnUser"
        },
        action : function (req, res) {
            appTest(req, res, function() {
                var action = req.params.action;
                var validActions = ['lock', 'unlock', 'omit', 'unomit', 'trust', 'untrust'];
                if(validActions.indexOf(action) === -1){
                    return errorResponse(400, 'Invalid params', '075', res);
                }
                app.get('container').get('UserController')[action+'User'](req.params.userId, function(err){
                    if(err) return errorResponse(500, 'Server error', '032', res);
                    res.json({});
                });
            }, "backoffice");
        }
    });

    swagger.addGet({
        spec: {
            description : "Get existing or generate new user token",
            path : "/{app}/user/{userId}/token",
            notes : "A way for the autobet system to access to user token, while not interfering the login users.",
            summary : "For Autobet system to get user token",
            method: "GET",
            parameters : [
                swagger.pathParam("userId", "user id", "string")
            ],
            nickname : "internalGetUserToken"
        },
        action : function (req, res) {
            appTest(req, res, function() {
                var userId = req.params.userId;
                UserController.read(userId, function(err, user) {
                    if(req.params.omitNotifications){
                        delete user.notifications;
                    }
                    if(err) return err.send(res);
                    if(user.token){
                        res.json(user);
                    }else{
                        UserController.updateToken(user, function(err, userWithToken){
                            res.json(userWithToken);
                        });
                    }
                });
            }, "autobet");
        }
    });

    swagger.addGet({
        spec: {
            description : "Get user's transactions total",
            path : "/user/{userId}/transactions/totals/{currency}",
            notes : "aggregate the user's transaction and get the totals",
            summary : "Get user's transactions total",
            method: "GET",
            parameters : [
                swagger.pathParam("userId", "user id", "string"),
                swagger.pathParam("currency", "currency", "string")
            ],
            nickname : "userTransactionTotals"
        },
        action : function (req, res) {
            app.get('container').resolve(function(TransactionController){
                TransactionController.getTotals({userId: req.user._id, currency: req.params.currency}, function(err, totals) {
                    if(err) return errorResponse(err.code, err.message, '032', res);
                    res.json(totals && totals[0]);
                });
            });
        }
    });

    // Configures the app's base path and api version.
    swagger.configureSwaggerPaths("", "api-docs", "");
    swagger.configure("/", "1.0.0");
};
