'use strict';

var bcrypt = require('bcrypt');
var crypto = require('crypto');
var speakeasy = require('speakeasy');

module.exports = function(UserCollection, config) {
    if (config === undefined) {
        config = {
            username: 'username',
            password: 'password',
            token: 'token',
            header: 'API-Token'
        };
    }

    var generateToken = function() {
        return crypto.randomBytes(16).toString('hex');
    };

    var AUTH_REGEXP = /^Basic /;
    var TOKEN_REGEXP = /^Bearer /;

    var getToken = function(req, res) {
        var authHeader = req.get('authorization');
        if (!authHeader) return res.send(400, "no credentials found");
        if (!AUTH_REGEXP.test(authHeader)) return res.send(400, "invalid auth header");
        var authParts = new Buffer(authHeader.split(" ")[1], 'base64').toString().split(/([^:]*):(.*)/);
        if (!authParts[0]) {
            authParts.shift();
        }
        var username = authParts[0];
        var password = authParts[1];
        var query = {};
        query[config.username] = username;
        UserCollection.findOne(query, function(err, user) {
            if (err) return res.send(500, err.message);
            if (!user) return res.send(403, "invalid user name or password");
            bcrypt.compare(password, user[config.password], function(err, valid) {
                if (err) return res.send(500, err.message);
                if (valid) {
                    if (user.totp === true){
                        var oneTimePass = req.query.oneTimePass;
                        if(!oneTimePass){
                            return res.send(401,{message: "one time password is required", errCode:'079'});
                        }
                        var validOneTimePass = speakeasy.time({key: user.totpSecret, encoding: 'base32'});
                        if(validOneTimePass !== oneTimePass){
                            return res.send(403, {message: "incorrect one time password", errCode:'077'});
                        }
                    }

                    var token = generateToken();
                    var update = {};
                    update[config.token] = token;
                    UserCollection.update({_id: user._id}, {$set: update}, function(err) {
                        if (err) return res.send(500, err.message);
                        res.set('Access-Control-Expose-Headers', config.header);
                        res.set(config.header, token);
                        res.send(202);
                    });
                } else {
                    res.send(403, "invalid user name or password");
                }
            });
        });
    };

    var extractToken = function(req, res, next) {
        var tokenHeader = req.get('authorization');
        if (!tokenHeader) return res.send(400, "no credentials found");
        if (!TOKEN_REGEXP.test(tokenHeader)) return res.send(400, "invalid token header");
        req.token = tokenHeader.split(" ")[1];
        next();
    };

    var destroyToken = function(req, res) {
        extractToken(req, res, function() {
            var update = {};
            update[config.token] = "";
            UserCollection.update({token: res.token}, {$unset: update}, function(err) {
                if (err) return res.send(500, err.message);
                res.send();
            });
        });
    };

    var checkToken = function(req, res, next) {
        extractToken(req, res, function() {
            var query = {};
            query[config.token] = req.token;
            UserCollection.findOne(query, function(err, user) {
                if (err) return res.send(500, err.message);
                if (!user) return res.send(403);
                req.user = user;
                res.set('Access-Control-Expose-Headers', config.header);
                res.set(config.header, user[config.token]);
                next();
            });
        });
    };

    return {
        getToken: getToken,
        destroyToken: destroyToken,
        checkToken: checkToken
    };
};

module.exports.hashPassword = function(password, cb) {
    return bcrypt.hash(password, 10, cb);
};

module.exports.checkPassword = function(password, hash, cb) {
    return bcrypt.compare(password, hash, cb);
};
