'use strict';

var speakeasy = require('speakeasy');
var ObjectId = require('mongoskin').ObjectID;
var ensureObjectId = function(thing) {
    if (thing instanceof ObjectId) return thing;
    try {
        thing = new ObjectId(thing);
        return thing;
    } catch (ex) {
        return null;
    }
};

var UserController = function(mongo, logger) {
    var controller = this;
    var db = mongo.getDb('officedb');
    db.bind('users');

    var ensureUser = function(userish, cb) {
        if (!userish) return cb({code: 400, message: 'missing user id'});
        if (userish._id && ensureObjectId(userish._id) !== null) {
            return cb(undefined, userish);
        }
        var userId = ensureObjectId(userish);
        if (userId !== null) {
            controller.read(userId, function(err, user) {
                if (err) return cb(err);
                cb(undefined, user);
            });
        } else {
            cb({code: 400, message: 'invalid user or user id'});
        }
    };

    controller.read = function(userId, cb) {
        userId = ensureObjectId(userId);
        if (userId === null) return cb({code: 400, message: 'invalid user id'});
        db.users.findOne({_id: userId}, function(err, user) {
            if (err) return cb({code: 500, message: err.message});
            if (!user) return cb({code: 404, message: 'user id ' + userId + ' not found'});
            cb(undefined, user);
        });
    };

    controller.generateTotpSecret = function(userId, cb) {
        userId = ensureObjectId(userId);
        if (userId === null) return cb({code: 400, message: 'invalid user id'});
        logger.info("generate totp secret: %s", userId.toHexString());
        var totpSecret = speakeasy.generate_key({length: 20}).base32;
        db.users.update({_id: userId}, {$set:{totpSecret: totpSecret}}, function(err){
            if(err) return cb(err);
            cb(undefined, totpSecret);
        });
    };

    controller.activateTotp = function(userId, oneTimePass, cb) {
        ensureUser(userId, function(err, user){
            if(err) return cb(err);
            if(!user.totpSecret){
                return cb({code: 400, message: "Totp secret is undefined"});
            }
            if(controller.validateTotp(user, oneTimePass)){
                db.users.update({_id: user._id}, {$set: {totp: true}}, function(err){
                    cb(err);
                });
            }else{
                cb({code: 400, message: "Incorrect one time password"});
            }
        });
    };

    controller.deactivateTotp = function(userId, cb) {
        ensureUser(userId, function(err, user){
            if(err) return cb(err);
            db.users.update({_id: user._id}, {$unset: {totp: '', totpSecret: ''}}, function(err){
                cb(err);
            });
        });
    };

    controller.validateTotp = function(user, oneTimePass) {
        var validOneTimePass = speakeasy.time({key: user.totpSecret, encoding: 'base32'});
        if(validOneTimePass !== oneTimePass){
            return false;
        }
        return true;
    };

    return controller;
};

module.exports = UserController;
