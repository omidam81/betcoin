'use strict';

/* global describe */
/* global it */

var assert = require('assert');
var async = require('async');
var mongoMock = require('../mock/model-store').getModella();
var logger = require('../mock/logger');
var User = require('../../src/models/user')(mongoMock, logger, undefined); // will mock the Wallet soon

var USERNAME_SEED = 10000000000000000000;
var getUsername = function() {
    var username = USERNAME_SEED.toString(36);
    USERNAME_SEED += 1000000000;
    return username;
};

describe('User', function() {
    describe('creating a user', function() {
        it('should create a user object', function() {
            var user = new User({
                username: 'foo',
                password: 'pass',
                email: 'test@betcoin.tm',
                ip: '0.0.0.0'
            });
            user.save(function(err) {
                assert.ifError(err);
                assert.equal(user.username(), 'foo');
                assert.equal(user.password(), 'pass');
                assert.equal(user.ip(), '0.0.0.0');
                assert.ok(user.affiliateToken());
            });
        });
        it('should not overlap affiliate ids', function() {
            var affiliateTokens = [];
            async.times(25000, function(n, next) {
                var user = new User({
                    username: getUsername(),
                    password: 'pass',
                    email: 'test@betcoin.tm',
                    ip: '0.0.0.0'
                });
                user.save(function(err) {
                    assert.ifError(err);
                    if (affiliateTokens.indexOf(user.affiliateToken()) < 0) {
                        affiliateTokens.push(user.affiliateToken());
                        next();
                    } else {
                        throw "duplicate affiliate id!";
                    }
                });
            });
        });
    });
});
