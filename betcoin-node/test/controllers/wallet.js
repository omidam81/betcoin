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
var auth = container.get('auth');

var user;
var walletTestClear = function(done) {
    user = new User({
        username: getUsername(),
        email: 'test@betcoin.tm',
        password: 'password10',
        ip: '0.0.0.0',
        token: auth.generateToken(),
        challenge: 'foo'
    });
    user.save(function(err) {
        assert.ifError(err);
        Wallet.removeAll({}, function(err) {
            assert.ifError(err);
            done();
        });
    });
};

var getAllAddresses = function(type) {
    if (!type) type = 'player';
    var addresses = {};
    Object.keys(ADDRESSES).forEach(function(coin) {
        addresses[coin] = ADDRESSES[coin][type].address;
    });
    return addresses;
};

var COIN = 'bitcoin';

module.exports = function() {
    describe('WalletController', function() {
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
        describe('GET /wallet/challenge', function() {
            beforeEach(walletTestClear);
            it('should get a challenge string for the user', function(done) {
                request.get('/wallet/challenge')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .expect(200, /[a-zA-Z0-9]{32}/, done);
            });
        });
        describe('POST /wallet/:userId', function() {
            beforeEach(walletTestClear);
            it('should create a new wallet', function(done) {
                var addresses = {
                    'bitcoin': ADDRESSES[COIN].player.address
                };
                var signature = ADDRESSES[COIN].player.signature;
                request.post('/wallet/' + user.primary())
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        addresses: addresses,
                        signature: signature
                    })
                    .expect(201)
                    .expect(function(res) {
                        var wallets = res.body;
                        assert.ok(wallets.bitcoin);
                        var wallet = wallets.bitcoin;
                        assert.equal(wallet.playerId, undefined);
                        assert.equal(wallet.withdrawAddress, addresses.bitcoin);
                        assert.ok(wallet.depositAddress);
                    })
                    .end(done);
            });

            it('should create a new wallet with alt coins', function(done) {
                var addresses = getAllAddresses();
                var signature = ADDRESSES[COIN].player.signature;
                request.post('/wallet/' + user.primary())
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        addresses: addresses,
                        signature: signature
                    })
                    .expect(201)
                    .expect(function(res) {
                        var wallets = res.body;
                        Object.keys(addresses).forEach(function(coin) {
                            assert.ok(wallets[coin]);
                            var wallet = wallets[coin];
                            assert.equal(wallet.playerId, undefined);
                            assert.equal(wallet.withdrawAddress, addresses[coin]);
                            assert.ok(wallet.depositAddress);
                        });
                    })
                    .end(done);
            });

            it('should create empty wallets for missing coins', function(done) {
                var addresses = getAllAddresses();
                delete addresses.litecoin;
                var signature = ADDRESSES[COIN].player.signature;
                request.post('/wallet/' + user.primary())
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        addresses: addresses,
                        signature: signature
                    })
                    .expect(201)
                    .expect(function(res) {
                        var wallets = res.body;
                        Object.keys(addresses).forEach(function(coin) {
                            assert.ok(wallets[coin]);
                            var wallet = wallets[coin];
                            assert.equal(wallet.playerId, undefined);
                            assert.equal(wallet.withdrawAddress, addresses[coin]);
                            assert.ok(wallet.depositAddress);
                        });
                        assert.ok(wallets.litecoin);
                        assert.ifError(wallets.litecoin.withdrawAddress);
                    })
                    .end(done);
            });

            it('should fail if the user has not gotten a challenge string', function(done) {
                var addresses = getAllAddresses();
                var signature = ADDRESSES[COIN].player.signature;
                user.challenge('');
                user.save(function(err) {
                    assert.ifError(err);
                    request.post('/wallet/' + user.primary())
                        .set('X-Currency', COIN)
                        .set('Authorization', 'Bearer ' + user.token())
                        .send({
                            addresses: addresses,
                            signature: signature
                        })
                        .expect(412, /You must get a message to sign first/, done);
                });
            });
            it('should fail if missing a bitcoin address address', function(done) {
                var addresses = getAllAddresses();
                delete addresses.bitcoin;
                var signature = ADDRESSES[COIN].player.signature;
                request.post('/wallet/' + user.primary())
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        addresses: addresses,
                        signature: signature
                    })
                    .expect(400, /Missing bitcoin address/, done);
            });
            it('should fail if missing a signature', function(done) {
                var addresses = getAllAddresses();
                request.post('/wallet/' + user.primary())
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        addresses: addresses
                    })
                    .expect(400, /Missing signature/, done);
            });
            it('should fail if the signature is invalid', function(done) {
                var addresses = getAllAddresses();
                var signature = ADDRESSES[COIN].player.signature.replace(/[\/+]/, "");
                request.post('/wallet/' + user.primary())
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        addresses: addresses,
                        signature: signature
                    })
                    .expect(400, /Malformed base64 encoding/, done);
            });
            it('should fail if the bitcoin address is invalid', function(done) {
                var addresses = getAllAddresses();
                addresses.bitcoin = addresses.bitcoin.replace(/[a-mo-zA-Z]/, 'I'); // I is an invalid character in an address
                var signature = ADDRESSES[COIN].player.signature;
                request.post('/wallet/' + user.primary())
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        addresses: addresses,
                        signature: signature
                    })
                    .expect(406, new RegExp("Invalid " + COIN + " address"), done);
            });
            it('should fail if an altcoin address is invalid', function(done) {
                var addresses = getAllAddresses();
                addresses.dogecoin = addresses.dogecoin.replace(/[a-mo-zA-Z]/, 'I'); // I is an invalid character in an address
                var signature = ADDRESSES[COIN].player.signature;
                request.post('/wallet/' + user.primary())
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        addresses: addresses,
                        signature: signature
                    })
                    .expect(406, new RegExp("Invalid dogecoin address"), done);
            });
            it('should fail if the address is a deposit address', function(done) {
                var addresses = getAllAddresses();
                addresses.bitcoin = ADDRESSES[COIN].server.address;
                var signature = ADDRESSES[COIN].server.signature;
                request.post('/wallet/' + user.primary())
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        addresses: addresses,
                        signature: signature
                    })
                    .expect(406, /This is a Betcoin deposit address, don't do that/, done);
            });
            it('should fail if withdraw address is already in use', function(done) {
                var addresses = getAllAddresses();
                var signature = ADDRESSES[COIN].player.signature;
                request.post('/wallet/' + user.primary())
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        addresses: addresses,
                        signature: signature
                    })
                    .end(function(err) {
                        if (err) return done(err);
                        var user2 = new User({
                            username: getUsername(),
                            email: 'test@betcoin.tm',
                            password: 'password10',
                            ip: '0.0.0.0',
                            token: auth.generateToken(),
                            challenge: 'foo'
                        });
                        user2.save(function(err) {
                            if (err) return done(err);
                            request.post('/wallet/' + user2.primary())
                                .set('X-Currency', COIN)
                                .set('Authorization', 'Bearer ' + user2.token())
                                .send({
                                    addresses: addresses,
                                    signature: signature
                                })
                                .expect(409, /This [a-z]+coin withdraw address is already in use/, done);

                        });
                    });
            });
            it('should fail if the user already has a wallet for that currency', function(done) {
                var addresses = getAllAddresses();
                var signature = ADDRESSES[COIN].player.signature;
                request.post('/wallet/' + user.primary())
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        addresses: addresses,
                        signature: signature
                    })
                    .end(function(err) {
                        if (err) return done(err);
                        request.post('/wallet/' + user.primary())
                            .set('X-Currency', COIN)
                            .set('Authorization', 'Bearer ' + user.token())
                            .send({
                                addresses: addresses,
                                signature: signature
                            })
                            .expect(409, new RegExp("You already have a " + COIN + " wallet"), done);
                    });
            });
        });
        describe('GET /wallet/:userId', function() {
            beforeEach(walletTestClear);
            it('should get a user\'s wallet', function(done) {
                var addresses = getAllAddresses();
                var signature = ADDRESSES[COIN].player.signature;
                request.post('/wallet/' + user.primary())
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        addresses: addresses,
                        signature: signature
                    })
                    .expect(201)
                    .expect(function(res) {
                        var wallets = res.body;
                        Object.keys(addresses).forEach(function(coin) {
                            assert.ok(wallets[coin]);
                            var wallet = wallets[coin];
                            assert.equal(wallet.playerId, undefined);
                            assert.equal(wallet.withdrawAddress, addresses[coin]);
                            assert.ok(wallet.depositAddress);
                        });
                    })
                    .end(function(err) {
                        if (err) return done(err);
                        request.get('/wallet/' + user.primary())
                            .set('X-Currency', COIN)
                            .set('Authorization', 'Bearer ' + user.token())
                            .expect(200)
                            .expect(function(res) {
                                var wallets = res.body;
                                Object.keys(addresses).forEach(function(coin) {
                                    assert.ok(wallets[coin]);
                                    var wallet = wallets[coin];
                                    assert.equal(wallet.playerId, undefined);
                                    assert.equal(wallet.withdrawAddress, addresses[coin]);
                                    assert.ok(wallet.depositAddress);
                                });
                            })
                            .end(done);
                    });
            });
        });
    });
};
