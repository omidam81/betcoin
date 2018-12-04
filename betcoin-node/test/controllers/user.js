'use strict';

/* global describe */
/* global it */
/* global before */
/* global beforeEach */
/* global getUsername */
/* global ADDRESSES */
/* global container */
/* global request */

var assert = require('assert');
var async = require('async');
var User = container.get('User');
var Wallet = container.get('Wallet');
var cryptod = container.get('cryptod');
// var auth = container.get('auth');
var extend = require('util')._extend;

var userTestClear = function(done) {
    User.removeAll({}, function(err) {
        assert.ifError(err);
        Wallet.removeAll({}, function(err) {
            assert.ifError(err);
            done();
        });
    });
};


module.exports = function(COIN) {

    var generateRequest = function(method, path) {
        return request[method](path)
            .set('X-Currency', COIN);
    };

    var generateNewUserRequest = function(data) {
        if (!data) data = {};
        var defaultData = {
            username: getUsername(),
            email: 'test@betcoin.tm',
            password: 'password10',
            passwordConfirm: 'password10'
        };
        if (data.anonymous !== undefined || data.anonymous === true) {
            defaultData = {};
        }
        data = extend(defaultData, data);
        return generateRequest('post', '/user')
            .send(data);
    };

    var createUser = function(data, cb) {
        if (cb === undefined && 'function' === typeof data) {
            cb = data;
            data = {};
        }
        generateNewUserRequest(data)
            .expect(201)
            .expect(function(res) {
                var newUser = res.body;
                assert(!newUser.anonymous);
                assert(!newUser.ignore);
                assert(newUser.token);
                assert(newUser.username);
                // password hash is never returned
                assert(!newUser.password);
                assert(!newUser.ip);
                assert(!newUser.email);
                assert.equal(newUser.pendingEmail, 'test@betcoin.tm');
                assert(!newUser.emailToken);
                assert(newUser.affiliateToken);
                assert(newUser.createdAt);
                assert(newUser.updatedAt);
                assert(newUser.upgradedAt);
            }).end(function(err, res) {
                if (err) return cb(err);
                return cb(undefined, res.body);
            });
    };

    describe('UserController', function() {
        before(function(done) {
            async.parallel([
                function(fin) {
                    User.removeAll({}, fin);
                },
                function(fin) {
                    Wallet.removeAll({}, fin);
                },
                function(fin) {
                    async.each(Object.keys(ADDRESSES), function(coin, done) {
                        cryptod(coin).getNewAddress('player', function(err, address) {
                            if (err) return done(err);
                            cryptod(coin).signMessage(address, 'foo', function(err, signature) {
                                if (err) return done(err);
                                ADDRESSES[coin].server = {
                                    address: address,
                                    signature: signature
                                };
                                // return api.init(8443, done);
                                return done();
                            });
                        });
                    }, fin);
                }], function(err) {
                    return done(err);
                });
        });
        describe('POST /user', function() {
            beforeEach(userTestClear);
            it('should create a new user', function(done) {
                var username = getUsername();
                createUser({username: username}, done);
            });
            it('should create an anonymous user without an email', function(done) {
                generateNewUserRequest({anonymous: true, address: ADDRESSES[COIN].player.address})
                    .expect(201)
                    .expect(function(res) {
                        var newUser = res.body;
                        assert(newUser.anonymous);
                        assert(newUser.username);
                        assert(!newUser.ip);
                        assert(!newUser.email);
                        assert(!newUser.pendingEmail);
                        assert(!newUser.emailToken);
                        assert(!newUser.affiliateToken);
                        assert(newUser.createdAt);
                        assert(newUser.updatedAt);
                        assert(!newUser.upgradedAt);
                        assert(newUser.token);
                    })
                    .end(done);
            });
            it('should authenticate an anonymous user when they already exist', function(done) {
                generateNewUserRequest({anonymous: true, address: ADDRESSES[COIN].player.address})
                    .expect(201)
                    .expect(function(res) {
                        var newUser = res.body;
                        assert(newUser.anonymous);
                        assert(newUser.username);
                        assert(!newUser.email);
                        assert(!newUser.pendingEmail);
                        assert(!newUser.emailToken);
                        assert(!newUser.affiliateToken);
                        assert(newUser.createdAt);
                        assert(newUser.updatedAt);
                        assert(!newUser.upgradedAt);
                        assert(newUser.token);
                    })
                    .end(function(err, res) {
                        if (err) return done(err);
                        generateNewUserRequest({anonymous: true, address: ADDRESSES[COIN].player.address})
                            .expect(201)
                            .expect(function(authRes) {
                                assert(authRes.body.token !== res.body.token);
                                assert(authRes.body._id === res.body._id);
                            })
                            .end(done);
                    });
            });
            it('should reject non matching passwords', function(done) {
                generateNewUserRequest({password: 'password11'})
                    .expect(400, /Passwords do not match/, done);
            });
            it('should reject short passwords', function(done) {
                generateNewUserRequest({password: 'password', passwordConfirm: 'password'})
                    .expect(400, /Invalid password/, done);
            });
            it('should reject invalid usernames', function(done) {
                generateNewUserRequest({username: 'foo!'})
                    .expect(400, /Invalid username/, done);
            });
            it('should reject a missing username', function(done) {
                generateNewUserRequest({username: undefined})
                    .expect(400, /Missing username/, done);
            });
            it('should reject an invalid email address', function(done) {
                generateNewUserRequest({email: 'foo@bar'})
                    .expect(400, /pendingEmail is not a valid email address/, done);
            });
            it('should reject duplicate usernames', function(done) {
                generateNewUserRequest().end(function(err, res) {
                    var newUser = res.body;
                    generateNewUserRequest({username: newUser.username})
                        .expect(409, /Username exists/, done);
                });
            });
        });
        describe('GET /user/:userId', function() {
            beforeEach(userTestClear);
            it('should get a user', function(done) {
                createUser(function(err, newUser) {
                    assert.ifError(err);
                    generateRequest('get', '/user/' + newUser._id)
                        .set('Authorization', 'Bearer ' + newUser.token)
                        .expect(200, newUser, done);
                });
            });
            it('should not get a user without having a token', function(done) {
                generateRequest('get', '/user')
                    .expect(400, /no credentials found/, done);
            });
            it('should not allow you to get another user', function(done) {
                createUser(function(err, user) {
                    if (err) return done(err);
                    createUser(function(err, hacker) {
                        if (err) return done(err);
                        generateRequest('get', '/user/' + user._id)
                            .set('Authorization', 'Bearer ' + hacker.token)
                            .expect(418, /You cannot access another user/, done);
                    });
                });
            });
        });
        
        describe('PUT /user/:userId', function() {
            describe('updating a VIP', function() {
                beforeEach(userTestClear);
                var user;
                var thisRequest;
                var btcSignature = ADDRESSES.bitcoin.player.signature;
                beforeEach(function(done) {
                    createUser(function(err, _user) {
                        user = _user;
                        var addresses = {
                            bitcoin: ADDRESSES.bitcoin.player.address,
                            litecoin: ADDRESSES.litecoin.player.address
                        };
                        var signature = ADDRESSES.bitcoin.player.signature;
                        User.db.update({_id: new User.db.id(user._id)}, {$set: {challenge: 'foo'}}, function(err) {
                            assert.ifError(err);
                            generateRequest('post', '/wallet/' + user._id)
                                .set('Authorization', 'Bearer ' + user.token)
                                .send({
                                    addresses: addresses,
                                    signature: signature
                                })
                                .expect(201)
                                .expect(function(res) {
                                    var wallets = res.body;
                                    assert.ok(wallets.bitcoin);
                                    Object.keys(addresses).forEach(function(coin) {
                                        assert.ok(wallets[coin]);
                                        var wallet = wallets[coin];
                                        assert.equal(wallet.playerId, undefined);
                                        assert.equal(wallet.withdrawAddress, addresses[coin]);
                                        assert.ok(wallet.depositAddress);
                                    });
                                })
                                .end(function(err) {
                                    assert.ifError(err);
                                    thisRequest = generateRequest('put', '/user/' + user._id)
                                        .set('Authorization', 'Bearer ' + user.token);
                                    return done(err);
                                });
                        });
                    });
                });
                it('should update a user\'s username', function(done) {
                    var username = getUsername();
                    thisRequest.send({username: username, oldSignature: btcSignature})
                        .expect(202)
                        .expect(function(res) {
                            var newUser = res.body.user;
                            assert.equal(newUser.username, username);
                        }).end(done);
                });
                it('should update a user\'s password', function(done) {
                    var password = 'password11';
                    thisRequest.send({password: password, passwordConfirm: password, oldSignature: btcSignature})
                        .expect(202)
                        .expect(function(res) {
                            var newUser = res.body.user;
                            assert(!newUser.password); // we do not get the new hash back
                        }).end(done);
                });
                it('should update a user\'s email', function(done) {
                    var email = 'test2@betcoin.tm';
                    thisRequest.send({email: email, oldSignature: btcSignature})
                        .expect(202)
                        .expect(function(res) {
                            var newUser = res.body.user;
                            assert.equal(newUser.pendingEmail, email);
                        }).end(done);
                });
                it('should update a user\'s bitcoin address', function(done) {
                    var addresses = {
                        bitcoin: ADDRESSES.bitcoin.playerUpdate.address
                    };
                    thisRequest.send({
                        addresses: addresses,
                        oldSignature: btcSignature,
                        signature: ADDRESSES.bitcoin.playerUpdate.signature
                    })
                        .expect(202)
                        .expect(function(res) {
                            var newUser = res.body.user;
                            var wallets = res.body.wallets;
                            assert.equal(user.email, newUser.email);
                            assert.equal(user.username, newUser.username);
                            assert.equal(user._id, newUser._id);
                            Object.keys(addresses).forEach(function(coin) {
                                assert.ok(wallets[coin]);
                                var wallet = wallets[coin];
                                assert.equal(wallet.playerId, undefined);
                                assert.equal(wallet.withdrawAddress, addresses[coin]);
                            });
                        }).end(done);
                });
                it('should update a user\'s altcoin address', function(done) {
                    var addresses = {
                        litecoin: ADDRESSES.litecoin.playerUpdate.address
                    };
                    thisRequest.send({
                        addresses: addresses,
                        oldSignature: btcSignature
                    })
                        .expect(202)
                        .expect(function(res) {
                            var newUser = res.body.user;
                            var wallets = res.body.wallets;
                            assert.equal(user.email, newUser.email);
                            assert.equal(user.username, newUser.username);
                            assert.equal(user._id, newUser._id);
                            Object.keys(addresses).forEach(function(coin) {
                                assert.ok(wallets[coin]);
                                var wallet = wallets[coin];
                                assert.equal(wallet.playerId, undefined);
                                assert.equal(wallet.withdrawAddress, addresses[coin]);
                            });
                        }).end(done);
                });
                it('should create an altcoin wallet if one does not exist', function(done) {
                    var addresses = {
                        dogecoin: ADDRESSES.dogecoin.playerUpdate.address
                    };
                    thisRequest.send({
                        addresses: addresses,
                        oldSignature: btcSignature
                    })
                        .expect(202)
                        .expect(function(res) {
                            var newUser = res.body.user;
                            var wallets = res.body.wallets;
                            assert.equal(user.email, newUser.email);
                            assert.equal(user.username, newUser.username);
                            assert.equal(user._id, newUser._id);
                            Object.keys(addresses).forEach(function(coin) {
                                assert.ok(wallets[coin]);
                                var wallet = wallets[coin];
                                assert.equal(wallet.playerId, undefined);
                                assert.equal(wallet.withdrawAddress, addresses[coin]);
                            });
                        }).end(done);
                });
                it('should add a backup bitcoin address', function(done) {
                    var withdrawBackup = ADDRESSES.bitcoin.playerBackup.address;
                    var backupSignature = ADDRESSES.bitcoin.playerBackup.signature;
                    thisRequest.send({
                        withdrawBackup: withdrawBackup,
                        backupSignature: backupSignature,
                        oldSignature: btcSignature,
                    })
                        .expect(202)
                        .expect(function(res) {
                            var newUser = res.body.user;
                            var wallets = res.body.wallets;
                            assert.equal(user.email, newUser.email);
                            assert.equal(user.username, newUser.username);
                            assert.equal(user._id, newUser._id);
                            assert.ok(wallets.bitcoin);
                            assert.equal(wallets.bitcoin.withdrawBackup, withdrawBackup);
                        }).end(done);
                });
                it('should update a backup bitcoin address', function(done) {
                    var withdrawBackup = ADDRESSES.bitcoin.playerBackup.address;
                    var backupSignature = ADDRESSES.bitcoin.playerBackup.signature;
                    thisRequest.send({
                        withdrawBackup: withdrawBackup,
                        backupSignature: backupSignature,
                        oldSignature: btcSignature,
                    })
                        .expect(202)
                        .expect(function(res) {
                            var newUser = res.body.user;
                            var wallets = res.body.wallets;
                            assert.equal(user.email, newUser.email);
                            assert.equal(user.username, newUser.username);
                            assert.equal(user._id, newUser._id);
                            assert.ok(wallets.bitcoin);
                            assert.equal(wallets.bitcoin.withdrawBackup, withdrawBackup);
                        }).end(function(err) {
                            if (err) return done(err);
                            // put the prediefined challenge back in
                            User.db.update({_id: new User.db.id(user._id)}, {$set: {challenge: 'foo'}}, function(err) {
                                if (err) return done(err);
                                var newBackup = ADDRESSES.bitcoin.playerUpdate.address;
                                var newBackupSignature = ADDRESSES.bitcoin.playerUpdate.signature;
                                generateRequest('put', '/user/' + user._id)
                                    .set('Authorization', 'Bearer ' + user.token)
                                    .send({
                                        withdrawBackup: newBackup,
                                        backupSignature: newBackupSignature,
                                        oldBackupSignature: backupSignature,
                                        oldSignature: btcSignature
                                    })
                                    .expect(202)
                                    .expect(function(res) {
                                        var newUser = res.body.user;
                                        var wallets = res.body.wallets;
                                        assert.equal(user.email, newUser.email);
                                        assert.equal(user.username, newUser.username);
                                        assert.equal(user._id, newUser._id);
                                        assert.ok(wallets.bitcoin);
                                        assert.equal(wallets.bitcoin.withdrawBackup, newBackup);
                                    })
                                    .end(done);
                            });
                        });
                });
                it('should do everything in one request', function(done) {
                    var addresses = {
                        dogecoin: ADDRESSES.dogecoin.playerUpdate.address,
                        litecoin: ADDRESSES.litecoin.playerUpdate.address,
                        bitcoin: ADDRESSES.bitcoin.playerUpdate.address
                    };
                    var newBtcSignature = ADDRESSES.bitcoin.playerUpdate.signature;
                    var withdrawBackup = ADDRESSES.bitcoin.playerBackup.address;
                    var backupSignature = ADDRESSES.bitcoin.playerBackup.signature;
                    var email = 'test2@betcoin.tm';
                    var password = 'password11';
                    var username = getUsername();
                    thisRequest.send({
                        addresses: addresses,
                        oldSignature: btcSignature,
                        signature: newBtcSignature,
                        withdrawBackup: withdrawBackup,
                        backupSignature: backupSignature,
                        username: username,
                        password: password,
                        passwordConfirm: password,
                        email: email,
                    })
                        .expect(202)
                        .expect(function(res) {
                            var newUser = res.body.user;
                            var wallets = res.body.wallets;
                            assert.equal(email, newUser.pendingEmail);
                            assert.equal(username, newUser.username);
                            assert.equal(user._id, newUser._id);
                            Object.keys(addresses).forEach(function(coin) {
                                assert.ok(wallets[coin]);
                                var wallet = wallets[coin];
                                assert.equal(wallet.playerId, undefined);
                                assert.equal(wallet.withdrawAddress, addresses[coin]);
                            });
                            assert.equal(wallets.bitcoin.withdrawBackup, withdrawBackup);
                        }).end(function(err) {
                            if (err) return done(err);
                            // put the prediefined challenge back in
                            User.db.update({_id: new User.db.id(user._id)}, {$set: {challenge: 'foo'}}, function(err) {
                                if (err) return done(err);
                                // shuffle the addresses around and do it all
                                // again, to make sure you can also update a
                                // backup address with a full request
                                var addresses = {
                                    dogecoin: ADDRESSES.dogecoin.player.address,
                                    litecoin: ADDRESSES.litecoin.player.address,
                                    bitcoin: ADDRESSES.bitcoin.player.address
                                };
                                var newBtcSignature = ADDRESSES.bitcoin.player.signature;
                                var withdrawBackup = ADDRESSES.bitcoin.playerBackupUpdate.address;
                                var backupSignature = ADDRESSES.bitcoin.playerBackupUpdate.signature;
                                var email = 'test3@betcoin.tm';
                                var password = 'password12';
                                var username = getUsername();
                                generateRequest('put', '/user/' + user._id)
                                    .set('Authorization', 'Bearer ' + user.token)
                                    .send({
                                        addresses: addresses,
                                        oldSignature: ADDRESSES.bitcoin.playerUpdate.signature,
                                        signature: newBtcSignature,
                                        withdrawBackup: withdrawBackup,
                                        backupSignature: backupSignature,
                                        username: username,
                                        password: password,
                                        passwordConfirm: password,
                                        email: email,
                                    })
                                    .expect(202)
                                    .expect(function(res) {
                                        var newUser = res.body.user;
                                        var wallets = res.body.wallets;
                                        assert.equal(email, newUser.pendingEmail);
                                        assert.equal(username, newUser.username);
                                        assert.equal(user._id, newUser._id);
                                        Object.keys(addresses).forEach(function(coin) {
                                            assert.ok(wallets[coin]);
                                            var wallet = wallets[coin];
                                            assert.equal(wallet.playerId, undefined);
                                            assert.equal(wallet.withdrawAddress, addresses[coin]);
                                        });
                                        assert.equal(wallets.bitcoin.withdrawBackup, withdrawBackup);
                                    }).end(done);
                            });
                        });
                });
                it('should update a user\'s full info at once', function(done) {
                    var email = 'test2@betcoin.tm';
                    var password = 'password11';
                    var username = getUsername();
                    thisRequest.send({
                        username: username,
                        password: password,
                        passwordConfirm: password,
                        email: email,
                        oldSignature: btcSignature
                    })
                        .expect(202)
                        .expect(function(res) {
                            var newUser = res.body.user;
                            assert.equal(newUser.pendingEmail, email);
                            assert(!newUser.password); // we do not get the new hash back
                            assert.equal(newUser.username, username);
                        }).end(done);
                });
                it('should not allow you to update another user', function(done) {
                    createUser(function(err, hacker) {
                        if (err) return done(err);
                        generateRequest('put', '/user/' + user._id)
                            .set('Authorization', 'Bearer ' + hacker.token)
                            .send({username: 'foobarman'})
                            .expect(418, /You cannot access another user/, done);
                    });
                });
                it('should reject non matching passwords', function(done) {
                    thisRequest.send({password: 'password11', passwordConfirm: 'password12', oldSignature: btcSignature})
                        .expect(400, /Passwords do not match/, done);
                });
                it('should reject short passwords', function(done) {
                    thisRequest.send({password: 'pass', passwordConfirm: 'pass', oldSignature: btcSignature})
                        .expect(400, /Invalid password/, done);
                });
                it('should reject invalid usernames', function(done) {
                    thisRequest.send({username: 'foo!', oldSignature: btcSignature})
                        .expect(400, /Invalid username/, done);
                });
                it('should reject an invalid email address', function(done) {
                    thisRequest.send({email: 'foo@barcom', oldSignature: btcSignature})
                        .expect(400, /pendingEmail is not a valid email address/, done);
                });
                it('should reject duplicate usernames', function(done) {
                    createUser(function(err, newUser) {
                        if (err) return done(err);
                        thisRequest.send({username: newUser.username, oldSignature: btcSignature})
                            .expect(409, /Username exists/, done);
                    });
                });
                it('should reject identical bitcoin and backup addresses', function(done) {
                    var addresses = {
                        bitcoin: ADDRESSES.bitcoin.playerUpdate.address
                    };
                    var newBtcSignature = ADDRESSES.bitcoin.playerUpdate.signature;
                    var withdrawBackup = addresses.bitcoin;
                    var backupSignature = newBtcSignature;
                    thisRequest.send({
                        addresses: addresses,
                        oldSignature: btcSignature,
                        signature: newBtcSignature,
                        withdrawBackup: withdrawBackup,
                        backupSignature: backupSignature
                    })
                        .expect(400, /The bitcoin address and the backup address cannot be the same/, done);
                });
                it('should fail if the user has not gotten a challenge string', function(done) {
                    // erase the challenge string we got for the other tests
                    User.db.update({_id: new User.db.id(user._id)}, {$unset: {challenge: ''}}, function(err) {
                        assert.ifError(err);
                        thisRequest.send().expect(412, /You must get a message to sign first/, done);
                    });
                });
                it('should fail if missing old signature', function(done) {
                    thisRequest.send({username: getUsername()}).expect(400, /Missing signature/, done);
                });
                it('should reject a withdraw address update with a deposit address', function(done) {
                    var addresses = {
                        bitcoin: ADDRESSES.bitcoin.server.address
                    };
                    thisRequest.send({
                        addresses: addresses,
                        oldSignature: btcSignature,
                        signature: ADDRESSES.bitcoin.server.signature
                    }).expect(406, /This is a Betcoin deposit address, don't do that/, done);
                });
                it('should reject a withdraw address update with an invalid address', function(done) {
                    var addresses = {
                        bitcoin: ADDRESSES.bitcoin.playerUpdate.address.replace(/[a-mo-zA-Z]/, 'I')
                    };
                    thisRequest.send({
                        addresses: addresses,
                        oldSignature: btcSignature,
                        signature: ADDRESSES.bitcoin.playerUpdate.signature
                    }).expect(406, new RegExp("Invalid " + COIN + " address"), done);
                });
                it('should reject a backup withdraw address with a deposit address', function(done) {
                    var addresses = {
                        bitcoin: ADDRESSES.bitcoin.server.address
                    };
                    thisRequest.send({
                        withdrawBackup: addresses.bitcoin,
                        oldSignature: btcSignature,
                        backupSignature: ADDRESSES.bitcoin.server.signature
                    }).expect(406, /This is a Betcoin deposit address, don't do that/, done);
                });
                it('should reject a backup withdraw address with an invalid address', function(done) {
                    var addresses = {
                        bitcoin: ADDRESSES.bitcoin.playerUpdate.address.replace(/[a-mo-zA-Z]/, 'I')
                    };
                    thisRequest.send({
                        withdrawBackup: addresses.bitcoin,
                        oldSignature: btcSignature,
                        backupSignature: ADDRESSES.bitcoin.playerUpdate.signature
                    }).expect(406, new RegExp("Invalid " + COIN + " address"), done);
                });
                it('should reject a backup withdraw address update with a deposit address', function(done) {
                    var withdrawBackup = ADDRESSES.bitcoin.playerBackup.address;
                    var backupSignature = ADDRESSES.bitcoin.playerBackup.signature;
                    thisRequest.send({
                        withdrawBackup: withdrawBackup,
                        backupSignature: backupSignature,
                        oldSignature: btcSignature,
                    })
                        .expect(202)
                        .expect(function(res) {
                            var newUser = res.body.user;
                            var wallets = res.body.wallets;
                            assert.equal(user.email, newUser.email);
                            assert.equal(user.username, newUser.username);
                            assert.equal(user._id, newUser._id);
                            assert.ok(wallets.bitcoin);
                            assert.equal(wallets.bitcoin.withdrawBackup, withdrawBackup);
                        }).end(function(err) {
                            if (err) return done(err);
                            // put the prediefined challenge back in
                            User.db.update({_id: new User.db.id(user._id)}, {$set: {challenge: 'foo'}}, function(err) {
                                if (err) return done(err);
                                var newBackup = ADDRESSES.bitcoin.server.address;
                                var newBackupSignature = ADDRESSES.bitcoin.server.signature;
                                generateRequest('put', '/user/' + user._id)
                                    .set('Authorization', 'Bearer ' + user.token)
                                    .send({
                                        withdrawBackup: newBackup,
                                        backupSignature: newBackupSignature,
                                        oldBackupSignature: backupSignature,
                                        oldSignature: btcSignature
                                    }).expect(406, /This is a Betcoin deposit address, don't do that/, done);
                            });
                        });
                });
                it('should reject a backup withdraw address update with an invalid address', function(done) {
                    var withdrawBackup = ADDRESSES.bitcoin.playerBackup.address;
                    var backupSignature = ADDRESSES.bitcoin.playerBackup.signature;
                    thisRequest.send({
                        withdrawBackup: withdrawBackup,
                        backupSignature: backupSignature,
                        oldSignature: btcSignature,
                    })
                        .expect(202)
                        .expect(function(res) {
                            var newUser = res.body.user;
                            var wallets = res.body.wallets;
                            assert.equal(user.email, newUser.email);
                            assert.equal(user.username, newUser.username);
                            assert.equal(user._id, newUser._id);
                            assert.ok(wallets.bitcoin);
                            assert.equal(wallets.bitcoin.withdrawBackup, withdrawBackup);
                        }).end(function(err) {
                            if (err) return done(err);
                            // put the prediefined challenge back in
                            User.db.update({_id: new User.db.id(user._id)}, {$set: {challenge: 'foo'}}, function(err) {
                                if (err) return done(err);
                                var newBackup = ADDRESSES.bitcoin.playerBackupUpdate.address
                                    .replace(/[a-mo-zA-Z]/, 'I'); // I is an invalid character in an address
                                var newBackupSignature = ADDRESSES.bitcoin.playerBackupUpdate.signature;
                                generateRequest('put', '/user/' + user._id)
                                    .set('Authorization', 'Bearer ' + user.token)
                                    .send({
                                        withdrawBackup: newBackup,
                                        backupSignature: newBackupSignature,
                                        oldBackupSignature: backupSignature,
                                        oldSignature: btcSignature
                                    }).expect(406, new RegExp("Invalid " + COIN + " address"), done);
                            });
                        });
                });
            });
            describe('upgrading an anonymous user', function() {
                var user;
                var thisRequest;
                beforeEach(userTestClear);
                beforeEach(function(done) {
                    generateNewUserRequest({anonymous: true, address: ADDRESSES[COIN].playerBackup.address})
                        .expect(201)
                        .expect(function(res) {
                            var newUser = res.body;
                            assert(newUser.anonymous);
                            assert(newUser.username);
                            assert(!newUser.ip);
                            assert(!newUser.email);
                            assert(!newUser.pendingEmail);
                            assert(!newUser.emailToken);
                            assert(!newUser.affiliateToken);
                            assert(newUser.createdAt);
                            assert(newUser.updatedAt);
                            assert(!newUser.upgradedAt);
                            assert(newUser.token);
                            user = newUser;
                        })
                                            .end(function(err) {
                            if (err) return done(err);
                            User.db.update({_id: new User.db.id(user._id)}, {$set: {challenge: 'foo'}}, function(err) {
                                if (err) return done(err);
                                thisRequest = generateRequest('put', '/user/' + user._id)
                                    .set('Authorization', 'Bearer ' + user.token);
                                done();
                            });
                        });
                });
                it('should upgrade an anonymous user', function(done) {
                    thisRequest.send({
                        signature: ADDRESSES[COIN].playerBackup.signature,
                        password: 'password10',
                        passwordConfirm: 'password10',
                        username: getUsername(),
                        email: 'foo@bar.com'
                    })
                        .expect(202)
                        .expect(function(res) {
                            var newUser = res.body.user;
                            assert(newUser);
                            assert(!newUser.anonymous);
                            var newWallets = res.body.wallets;
                            assert(newWallets);
                            var currencies = Object.keys(newWallets);
                            assert.equal(currencies.length, 3);
                        }).end(done);
                });
                it('should fail if missing a signature', function(done) {
                    thisRequest.send({
                        password: 'password10',
                        passwordConfirm: 'password10',
                        username: getUsername(),
                        email: 'foo@bar.com'
                    })
                        .expect(400, /Missing signature/, done);
                });
            });
        });
    });
    describe('DELETE /user/:userId', function() {
        beforeEach(userTestClear);
        it('should remove a user\'s token', function(done) {
            createUser(function(err, user) {
                if (err) return done(err);
                generateRequest('delete', '/user/' + user._id)
                    .set('Authorization', 'Bearer ' + user.token)
                    .expect(200, done);
            });
        });
        it('should not allow you to log out another user', function(done) {
            createUser(function(err, user) {
                if (err) return done(err);
                createUser(function(err, hacker) {
                    if (err) return done(err);
                    generateRequest('delete', '/user/' + user._id)
                        .set('Authorization', 'Bearer ' + hacker.token)
                        .expect(418, /You cannot access another user/, done);
                });
            });
        });
    });
    
    describe('TOTP 2 factor auth', function () {
        describe('GET /user/:userId/totp', function () {
            beforeEach(userTestClear);
            it('should return totp secret', function (done) {
                createUser(function(err, newUser){
                    assert.ifError(err);
                    generateRequest('get', '/user/' + newUser._id + '/totp')
                        .set('Authorization', 'Bearer ' + newUser.token)
                        .expect(200)
                        .expect(function(res){
                            assert.ok(res.body.totpSecret);
                        })
                        .end(done);
                });
            });
            it('should reject when it is with invalid user token', function (done) {
                createUser(function(err, newUser){
                    assert.ifError(err);
                    generateRequest('get', '/user/' + newUser._id + '/totp')
                        .set('Authorization', 'Bearer ' + newUser.token + 'invalid')
                        .expect(403)
                        .end(done);
                });
            });
        });
        describe('activation and deactivation', function () {
            var speakeasy = require('speakeasy');
            var newUser;
            var userdefault = {
                username: 'test123',
                password: 'password10'
            };
            beforeEach(function (done) {
                userTestClear(function(){
                    createUser(userdefault ,function(err, _newUser){
                        assert.ifError(err);
                        generateRequest('get', '/user/' + _newUser._id + '/totp')
                            .set('Authorization', 'Bearer ' + _newUser.token)
                            .expect(function(res){
                                assert.ok(res.body.totpSecret);
                                newUser = _newUser;
                                newUser.totpSecret = res.body.totpSecret;
                            })
                            .end(done);
                    });
                });
            });
            describe('PUT /user/:userId/totp', function () {
                it('should activate totp auth', function (done) {
                    generateRequest('put', '/user/' + newUser._id + '/totp')
                        .set('Authorization', 'Bearer ' + newUser.token)
                        .send({oneTimePass: speakeasy.time({key: newUser.totpSecret, encoding: 'base32'})})
                        .expect(204)
                        .end(done);
                });
                it('should reject when request with invalid one time pass', function (done) {
                    generateRequest('put', '/user/' + newUser._id + '/totp')
                        .set('Authorization', 'Bearer ' + newUser.token)
                        .send({oneTimePass: 1234566})
                        .expect(400, /Incorrect one time password/, done);
                });
            });
            describe('DELETE /user/:userId/totp', function () {
                beforeEach(function (done) {
                    generateRequest('put', '/user/' + newUser._id + '/totp')
                        .set('Authorization', 'Bearer ' + newUser.token)
                        .send({oneTimePass: speakeasy.time({key: newUser.totpSecret, encoding: 'base32'})})
                        .expect(204)
                        .end(done);
                });
                it('should deactivate totp auth', function (done) {
                    generateRequest('delete', '/user/' + newUser._id + '/totp')
                        .set('Authorization', 'Bearer ' + newUser.token)
                        .send({oneTimePass: speakeasy.time({key: newUser.totpSecret, encoding: 'base32'})})
                        .expect(204)
                        .end(done);
                });
                it('should reject when request with invalid one time pass', function (done) {
                    generateRequest('delete', '/user/' + newUser._id + '/totp')
                        .set('Authorization', 'Bearer ' + newUser.token)
                        .expect(204, done);
                });
            });
            describe('login using 2 factor', function () {
                beforeEach(function (done) {
                    generateRequest('put', '/user/' + newUser._id + '/totp')
                        .set('Authorization', 'Bearer ' + newUser.token)
                        .send({oneTimePass: speakeasy.time({key: newUser.totpSecret, encoding: 'base32'})})
                        .expect(204)
                        .end(done);
                });
                it('should login with one time password', function (done) {
                    generateRequest('get', '/user/auth?one_time_pass=' + speakeasy.time({key: newUser.totpSecret, encoding: 'base32'}))
                        .set('Authorization', 'Basic ' + new Buffer(userdefault.username+':'+userdefault.password).toString('base64'))
                        .expect(202)
                        .end(done);
                });
                it('should reject with invalid one time password', function (done) {
                    generateRequest('get', '/user/auth?one_time_pass=1234566')
                        .set('Authorization', 'Basic ' + new Buffer(userdefault.username+':'+userdefault.password).toString('base64'))
                        .expect(400, /invalid one time password for 2 factor auth/, done);
                });
            });
        });
    });
};
