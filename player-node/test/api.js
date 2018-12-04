'use strict';
var request = require('supertest');
var assert = require('assert');
var async = require('async');
var sinon = require('sinon');
var io = require('socket.io-client');

describe('bc player API', function() {
    var clearDb = function(callback) {
        async.series([

            function(cb) {
                mongo.getCollection('playertestdb', 'users', function(err, collection) {
                    assert.ifError(err);
                    collection.remove(function(err) {
                        assert.ifError(err);
                        cb();
                    });
                });
            },
            function(cb) {
                mongo.getCollection('playertestdb', 'transactions', function(err, collection) {
                    assert.ifError(err);
                    collection.remove(function(err) {
                        assert.ifError(err);
                        cb();
                    });
                });
            },
            function(cb) {
                mongo.getCollection('playertestdb', 'tickets', function(err, collection) {
                    assert.ifError(err);
                    collection.remove(function(err) {
                        assert.ifError(err);
                        cb();
                    });
                });
            }
        ], function() {
            callback();
        });
    };
    var mongo = require('mongowrap').getConnection();
    var playerApp, playerServer, emailStub;
    var container;
    var basicToken = 'Zm9vYmFyMTIzNDU6MTQ0bTIwMTIwMA==';//foobar12345:144m201200

    beforeEach(function(done) {
        var PlayerApp = require('../src/app');
        playerApp = new PlayerApp();
        playerServer = playerApp.getExpressApp();
        async.series([

            function(cb) {
                playerApp.setContainer(undefined);
                container = playerApp.getContainer();
                container.get('bitcoind').getNewAddress = function(param, callback) {
                    callback(null, 'depositeAddress');
                };
                container.get('mongo').getDb = function(callback) {
                    mongo.getDb('playertestdb', function(err, db) {
                        callback(err, db);
                    });
                };
                emailStub = sinon.stub(container.get('mailer'), 'send', function(email, template, options, callback){
                    if (callback) {
                        callback();
                    }
                });
                cb();
            },
            function(cb) {
                clearDb(cb);
            },
            function(cb) {
                playerApp.init(cb);
            }
        ], function() {
            done();
        });
    });
    afterEach(function(done) {
        playerApp.getContainer().get('socket.io').server.close();
        done();
    });
    describe('user operations', function() {
        describe('user creation', function() {
            it('should create user account, and user should be provided with deposit address', function(done) {
                request(playerServer).post('/user').send({
                    alias: 'foobar12345',
                    password: '144m201200',
                    email: 'test@test.com'
                }).expect(201).end(function(err, res) {
                    assert.ifError(err);
                    assert.equal('foobar12345', res.body.alias);
                    assert.equal('test@test.com', res.body.email);
                    assert.equal('depositeAddress', res.body.deposit.btc.address);
                    done();
                });
            });
            it('should output 400 error for missing password', function(done) {
                request(playerServer).post('/user').send({
                    alias: 'foobar12345',
                    email: 'test@test.com'
                }).expect(400).end(function(err, res) {
                    assert.ifError(err);
                    assert.equal('Missing password', res.body.message);
                    done();
                });
            });
            it('should output 400 error for invalid password format', function(done) {
                request(playerServer).post('/user').send({
                    alias: 'foobar12345',
                    password: 'abc',
                    email: 'test@test.com'
                }).expect(400).end(function(err, res) {
                    assert.ifError(err);
                    assert.equal('Invalid password', res.body.message);
                    done();
                });
            });
            it('Sign up and Login Should reject non-alphanumeric passwords on server side', function (done) {
                async.series([
                    function test1(cb){
                        request(playerServer).post('/user').send({
                            alias: 'foobar12345',
                            password: 'abcskjfkaj_',
                            email: 'test@test.com'
                        }).expect(400).end(function(err, res) {
                            assert.ifError(err);
                            assert.equal('Invalid password', res.body.message);
                            cb();
                        });
                    },
                    function test2(cb){
                        request(playerServer).post('/user').send({
                            alias: 'foobar12345',
                            password: 'abcs',
                            email: 'test@test.com'
                        }).expect(400).end(function(err, res) {
                            assert.ifError(err);
                            assert.equal('Invalid password', res.body.message);
                            cb();
                        });
                    },
                    function test3(cb){
                        request(playerServer).post('/user').send({
                            alias: 'foobar12345',
                            password: 'abcs_',
                            email: 'test@test.com'
                        }).expect(400).end(function(err, res) {
                            assert.ifError(err);
                            assert.equal('Invalid password', res.body.message);
                            cb();
                        });
                    },
                    function test4(cb){
                        request(playerServer).post('/user').send({
                            alias: 'foobar12345',
                            password: 'abcs123_',
                            email: 'test@test.com'
                        }).expect(400).end(function(err, res) {
                            assert.ifError(err);
                            assert.equal('Invalid password', res.body.message);
                            cb();
                        });
                    },
                    function test5(cb){
                        request(playerServer).post('/user').send({
                            alias: 'foobar12345',
                            password: 'abcs123',
                            email: 'test@test.com'
                        }).expect(400).end(function(err, res) {
                            assert.ifError(err);
                            assert.equal('Invalid password', res.body.message);
                            cb();
                        });
                    },
                    function test6(cb){
                        request(playerServer).post('/user').send({
                            alias: 'foobar12345',
                            password: 'abcs123456',
                            email: 'test@test.com'
                        }).expect(201).end(function(err, res) {
                            assert.ifError(err);
                            cb();
                        });
                    },
                    function login(cb){
                        request(playerServer).get('/auth').set('authorization', 'Basic ' + 'Zm9vYmFyMTIzNDU6YWJjczEyMzQ1Ng==')
                            .expect(200).end(function(err, res) {
                            assert.ifError(err);
                            assert(res.header['access-control-expose-headers']);
                            assert(res.header['api-token']);
                            cb();
                        });
                    }
                    ], function(){
                        done();
                    });
            });
            xit('should output 400 error for missing email when the request includes create wallet', function(done) {
                request(playerServer).post('/user').send({
                    alias: 'foobar12345',
                    password: '144m201200',
                    createWallet: true
                }).expect(400).end(function(err, res) {
                    assert.ifError(err);
                    assert.equal('Email required to create a wallet', res.body.message);
                    done();
                });
            });
            xit('should create a new wallet if the createWallet param is set to true', function(done) {
                container.register('utils', new function() {
                    this.createBlockchainWallet = function(pwd, email, cb) {
                        cb(undefined, {
                            address: 'test address'
                        });
                    };
                });
                // process.env.NODE_ENV='production';
                request(playerServer).post('/user').send({
                    alias: 'foobar12345',
                    password: '144m201200',
                    createWallet: true,
                    email: 'test@test.com'
                }).expect(201).end(function(err, res) {
                    assert.ifError(err);
                    assert.equal('test address', res.body.withdraw.btc.address);
                    assert.equal('test address', res.body.newWallet.address);
                    done();
                });
            });
            it('should add a withdraw address if the withdrawAddress param is set and valid', function(done) {
                container.get('bitcoind').validateAddress = function(address, cb) {
                    cb(undefined, {
                        isvalid: true
                    });
                };
                request(playerServer).post('/user').send({
                    alias: 'foobar12345',
                    password: '144m201200',
                    withdrawAddress: 'test address',
                    email: 'test@test.com'
                }).expect(201).end(function(err, res) {
                    assert.ifError(err);
                    assert.equal('test address', res.body.withdraw.btc.address);
                    assert.ifError(res.body.newWallet);
                    done();
                });
            });
            it('should output 400 error if the withdrawAddress param is set and invalid', function(done) {
                container.get('bitcoind').validateAddress = function(address, cb) {
                    cb(undefined, {
                        isvalid: false
                    });
                };
                // container.register('bitcoind', require('bitcoin-wallet'));
                request(playerServer).post('/user').send({
                    alias: 'foobar12345',
                    password: '144m201200',
                    withdrawAddress: 'test address',
                    email: 'test@test.com'
                }).expect(400).end(function(err, res) {
                    assert.ifError(err);
                    assert.equal('Invalid Address', res.body.message);
                    assert.ifError(res.body.newWallet);
                    done();
                });
            });
        });
        describe('get user', function() {
            it('should output 400 error if the requests dont contains the api token', function(done) {
                request(playerServer).get('/user/1')
                    .expect(400).end(function(err, res) {
                        assert.ifError(err);
                        assert.equal('You must supply an API token', res.body.message);
                        done();
                    });
            });
            it('should output 400 error if the requests contains invalid api token', function(done) {
                request(playerServer)
                    .get('/user/1')
                    .set('authorization', 'Basic abc')
                    .expect(400).end(function(err, res) {
                        assert.ifError(err);
                        assert.equal('Invalid API token header', res.body.message);
                        done();
                    });
            });
            it('should return an user object json', function(done) {
                var objId;
                async.series([

                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'abc'
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function(cb) {
                        request(playerServer)
                            .get('/user/' + objId)
                            .set('authorization', 'Bearer abc')
                            .expect(200).end(function(err, res) {
                                assert.ifError(err);
                                assert.equal(objId, res.body._id);
                                assert.equal('abc', res.body.token);
                                cb();
                            });
                    }
                ], function() {
                    done();
                });
            });
            describe('verify', function() {
                describe('alias', function() {
                    it('should indicate the alias exists for an account', function(done) {
                        async.series([

                            function(cb) {
                                container.register('utils', new function() {
                                    this.createBlockchainWallet = function(pwd, email, cb) {
                                        cb(undefined, {
                                            address: 'test address'
                                        });
                                    };
                                });
                                request(playerServer).post('/user').send({
                                    alias: 'foobar12345',
                                    password: '144m201200',
                                    createWallet: true,
                                    email: 'test@test.com'
                                }).expect(201).end(function(err, res) {
                                    assert.ifError(err);
                                    // assert.equal('test address', res.body.withdraw.btc.address);
                                    // assert.equal('test address', res.body.newWallet.address);
                                    cb();
                                });
                            },
                            function(cb) {
                                request(playerServer)
                                    .get('/verify/alias/foobar12345')
                                    .expect(200)
                                    .end(function(err, res) {
                                        assert.ifError(err);
                                        assert.equal(res.body.exist, true);
                                        cb();
                                    });
                            }
                        ], function() {
                            done();
                        });
                    });
                    it('should indicate the alias not exists for any accounts', function(done) {
                        async.series([

                            function(cb) {
                                container.register('utils', new function() {
                                    this.createBlockchainWallet = function(pwd, email, cb) {
                                        cb(undefined, {
                                            address: 'test address'
                                        });
                                    };
                                });
                                request(playerServer).post('/user').send({
                                    alias: 'foobar12345',
                                    password: '144m201200',
                                    createWallet: true,
                                    email: 'test@test.com'
                                }).expect(201).end(function(err, res) {
                                    assert.ifError(err);
                                    // assert.equal('test address', res.body.withdraw.btc.address);
                                    // assert.equal('test address', res.body.newWallet.address);
                                    cb();
                                });
                            },
                            function(cb) {
                                request(playerServer)
                                    .get('/verify/alias/foobar1234')
                                    .expect(200)
                                    .end(function(err, res) {
                                        assert.ifError(err);
                                        assert.equal(res.body.exist, false);
                                        cb();
                                    });
                            }
                        ], function() {
                            done();
                        });
                    });
                    xit('should show error when it is an invalid alias', function(done) {
                        async.series([

                            function(cb) {
                                container.register('utils', new function() {
                                    this.createBlockchainWallet = function(pwd, email, cb) {
                                        cb(undefined, {
                                            address: 'test address'
                                        });
                                    };
                                });
                                request(playerServer).post('/user').send({
                                    alias: 'foobar12345',
                                    password: '144m201200',
                                    createWallet: true,
                                    email: 'test@test.com'
                                }).expect(201).end(function(err, res) {
                                    assert.ifError(err);
                                    // assert.equal('test address', res.body.withdraw.btc.address);
                                    // assert.equal('test address', res.body.newWallet.address);
                                    cb();
                                });
                            },
                            function(cb) {
                                request(playerServer)
                                    .get('/verify/alias/foo')
                                    .expect(400)
                                    .end(function(err, res) {
                                        assert.ifError(err);
                                        assert.equal(res.body.message, 'invalid alias');
                                        cb();
                                    });
                            }
                        ], function() {
                            done();
                        });
                    });
                });
                describe('withdraw address', function() {
                    xit('should indicate the withdraw address has been used for an account', function(done) {
                        async.series([

                            function(cb) {
                                container.register('utils', new function() {
                                    this.createBlockchainWallet = function(pwd, email, cb) {
                                        cb(undefined, {
                                            address: 'testaddress'
                                        });
                                    };
                                });
                                request(playerServer).post('/user').send({
                                    alias: 'foobar12345',
                                    password: '144m201200',
                                    createWallet: true,
                                    email: 'test@test.com'
                                }).expect(201).end(function(err, res) {
                                    assert.ifError(err);
                                    // assert.equal('testaddress', res.body.withdraw.btc.address);
                                    // assert.equal('testaddress', res.body.newWallet.address);
                                    cb();
                                });
                            },
                            function(cb) {
                                request(playerServer)
                                    .get('/verify/withdrawAddress/testaddress')
                                    .expect(200)
                                    .end(function(err, res) {
                                        assert.ifError(err);
                                        assert.equal(res.body.exist, true);
                                        cb();
                                    });
                            }
                        ], function() {
                            done();
                        });
                    });
                    it('should indicate the withdraw address has been used for an account', function(done) {
                        async.series([

                            function(cb) {
                                container.register('utils', new function() {
                                    this.createBlockchainWallet = function(pwd, email, cb) {
                                        cb(undefined, {
                                            address: 'testaddress'
                                        });
                                    };
                                });
                                request(playerServer).post('/user').send({
                                    alias: 'foobar12345',
                                    password: '144m201200',
                                    createWallet: true,
                                    email: 'test@test.com'
                                }).expect(201).end(function(err, res) {
                                    assert.ifError(err);
                                    // assert.equal('testaddress', res.body.withdraw.btc.address);
                                    // assert.equal('testaddress', res.body.newWallet.address);
                                    cb();
                                });
                            },
                            function(cb) {
                                request(playerServer)
                                    .get('/verify/withdrawAddress/test')
                                    .expect(200)
                                    .end(function(err, res) {
                                        assert.ifError(err);
                                        assert.equal(res.body.exist, false);
                                        cb();
                                    });
                            }
                        ], function() {
                            done();
                        });
                    });
                });
            });
        });
        describe('update user', function() {
            it('should return an user object json', function(done) {
                var objId;
                var userData = {
                    alias: 'test123456',
                    email: 'test@test.com',
                    password: '12abcdefgh',
                    btcWithdrawAddress: 'newaddress',
                    btcBackupWithdrawAddress: 'backupaddress',
                    signature: 'sign',
                    _id: 'abc'
                };
                var utils = container.get('utils');
                utils.checkAddress = function(address, callback) {
                    callback(undefined);
                };
                utils.checkSignature = function(address, sign, message, callback) {
                    callback(undefined);
                };
                async.series([

                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'abc',
                                withdraw: {
                                    btc:{
                                        address: 'newaddress'
                                    }
                                }
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function(cb) {
                        request(playerServer)
                            .put('/user/' + objId)
                            .send(userData)
                            .set('authorization', 'Bearer abc')
                            .expect(202).end(function(err, res) {
                                assert.ifError(err);
                                assert.equal(res.body._id, objId);
                                assert.equal(res.body.alias, userData.alias);
                                assert.equal(res.body.email, userData.email);
                                assert.equal(res.body._id, objId);
                                assert.equal(res.body.withdraw.btc.address, 'newaddress');
                                assert.equal(res.body.withdraw.btc.backup.address, 'backupaddress');
                                assert.ifError(res.body.password);
                                cb();
                            });
                    },
                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').findOne({
                                _id: objId
                            }, function(err, user) {
                                assert.equal(user.alias, userData.alias);
                                assert.notEqual(user.password, userData.password);
                                assert.equal(user.withdraw.btc.address, 'newaddress');
                                assert.equal(user.withdraw.btc.backup.address, 'backupaddress');
                                cb();
                            });
                        });
                    }
                ], function() {
                    done();
                });
            });
            it('should allow update without backup address', function(done) {
                var objId;
                var userData = {
                    alias: 'test123456',
                    email: 'test@test.com',
                    password: '12abcdefgh',
                    btcWithdrawAddress: 'newaddress',
                    signature: 'sign',
                    _id: 'abc'
                };
                var utils = container.get('utils');
                utils.checkAddress = function(address, callback) {
                    callback(undefined);
                };
                utils.checkSignature = function(address, sign, message, callback) {
                    callback(undefined);
                };
                async.series([

                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'abc',
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function(cb) {
                        request(playerServer)
                            .put('/user/' + objId)
                            .send(userData)
                            .set('authorization', 'Bearer abc')
                            .expect(202).end(function(err, res) {
                                assert.ifError(err);
                                assert.equal(res.body._id, objId);
                                assert.equal(res.body.alias, userData.alias);
                                assert.equal(res.body.email, userData.email);
                                assert.equal(res.body._id, objId);
                                assert.ifError(res.body.password);
                                cb();
                            });
                    },
                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').findOne({
                                _id: objId
                            }, function(err, user) {
                                assert.equal(user.alias, userData.alias);
                                assert.notEqual(user.password, userData.password);
                                assert.equal(user.withdraw.btc.address, 'newaddress');
                                assert.equal(user.withdraw.btc.backup.address, null);
                                cb();
                            });
                        });
                    }
                ], function() {
                    done();
                });
            });
            it('should not allow same address for the main and backup', function (done) {
                var objId;
                var userData = {
                    alias: 'test',
                    email: 'test@test.com',
                    password: '12abcdefgh',
                    btcWithdrawAddress: 'newaddress',
                    btcBackupWithdrawAddress: 'newaddress',
                    signature: 'sign',
                    _id: 'abc'
                };
                var utils = container.get('utils');
                utils.checkAddress = function(address, callback) {
                    callback(undefined);
                };
                utils.checkSignature = function(address, sign, message, callback) {
                    callback(undefined);
                };
                async.series([

                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'abc',
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function(cb) {
                        request(playerServer)
                            .put('/user/' + objId)
                            .send(userData)
                            .set('authorization', 'Bearer abc')
                            .expect(400).end(function(err) {
                                assert.ifError(err);
                                cb();
                            });
                    }
                ], function() {
                    done();
                });
            });
            it('should not allow update if the address is not valid', function (done) {
                var objId;
                var userData = {
                    alias: 'test',
                    email: 'test@test.com',
                    password: '12abcdefgh',
                    btcWithdrawAddress: 'newaddress',
                    btcBackupWithdrawAddress: 'backupaddress',
                    signature: 'sign',
                    _id: 'abc'
                };
                var utils = container.get('utils');
                utils.checkAddress = function(address, callback) {
                    callback({});
                };
                async.series([

                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'abc',
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function(cb) {
                        request(playerServer)
                            .put('/user/' + objId)
                            .send(userData)
                            .set('authorization', 'Bearer abc')
                            .expect(400).end(function(err) {
                                assert.ifError(err);
                                cb();
                            });
                    }
                ], function() {
                    done();
                });
            });
            it('should not allow update if the signature is not valid', function (done) {
                var objId;
                var userData = {
                    alias: 'test',
                    email: 'test@test.com',
                    password: '12abcdefgh',
                    btcWithdrawAddress: 'newaddress',
                    btcBackupWithdrawAddress: 'backupaddress',
                    signature: 'sign',
                    _id: 'abc'
                };
                var utils = container.get('utils');
                utils.checkSignature = function(address, sign, message, callback) {
                    callback({});
                };
                async.series([

                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'abc',
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function(cb) {
                        request(playerServer)
                            .put('/user/' + objId)
                            .send(userData)
                            .set('authorization', 'Bearer abc')
                            .expect(400).end(function(err) {
                                assert.ifError(err);
                                cb();
                            });
                    }
                ], function() {
                    done();
                });
            });
            it('should not update the main address if the address is already used by the others', function (done) {
                var objId;
                var userData = {
                    alias: 'test',
                    email: 'test@test.com',
                    password: '12abcdefgh',
                    btcWithdrawAddress: 'newaddress',
                    btcBackupWithdrawAddress: 'backupaddress',
                    signature: 'sign',
                    _id: 'abc'
                };
                var utils = container.get('utils');
                utils.checkAddress = function(address, callback) {
                    callback(undefined);
                };
                utils.checkSignature = function(address, sign, message, callback) {
                    callback(undefined);
                };
                async.series([

                    function mockUser(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'abc',
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function mockAnotherUser(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'a',
                                withdraw: {
                                    btc:{
                                        address: 'newaddress'
                                    }
                                }
                            }, function() {
                                cb();
                            });
                        });
                    },
                    function(cb) {
                        request(playerServer)
                            .put('/user/' + objId)
                            .send(userData)
                            .set('authorization', 'Bearer abc')
                            .expect(400).end(function(err) {
                                assert.ifError(err);
                                cb();
                            });
                    }
                ], function() {
                    done();
                });
            });
            it('should not update the main address if the address is already used as backup address by the others', function (done) {
                var objId;
                var userData = {
                    alias: 'test',
                    email: 'test@test.com',
                    password: '12abcdefgh',
                    btcWithdrawAddress: 'newaddress',
                    btcBackupWithdrawAddress: 'backupaddress',
                    signature: 'sign',
                    _id: 'abc'
                };
                var utils = container.get('utils');
                utils.checkAddress = function(address, callback) {
                    callback(undefined);
                };
                utils.checkSignature = function(address, sign, message, callback) {
                    callback(undefined);
                };
                async.series([

                    function mockUser(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'abc',
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function mockAnotherUser(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'a',
                                withdraw: {
                                    btc:{
                                        backup:{
                                            address: 'newaddress'
                                        }
                                    }
                                }
                            }, function() {
                                cb();
                            });
                        });
                    },
                    function(cb) {
                        request(playerServer)
                            .put('/user/' + objId)
                            .send(userData)
                            .set('authorization', 'Bearer abc')
                            .expect(400).end(function(err) {
                                assert.ifError(err);
                                cb();
                            });
                    }
                ], function() {
                    done();
                });
            });
            it('should not update the backup address if the address is already used by the others', function (done) {
                var objId;
                var userData = {
                    alias: 'test',
                    email: 'test@test.com',
                    password: '12abcdefgh',
                    btcWithdrawAddress: 'newaddress',
                    btcBackupWithdrawAddress: 'backupaddress',
                    signature: 'sign',
                    _id: 'abc'
                };
                var utils = container.get('utils');
                utils.checkAddress = function(address, callback) {
                    callback(undefined);
                };
                utils.checkSignature = function(address, sign, message, callback) {
                    callback(undefined);
                };
                async.series([

                    function mockUser(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'abc',
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function mockAnotherUser(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'a',
                                withdraw: {
                                    btc:{
                                        address: 'backupaddress'
                                    }
                                }
                            }, function() {
                                cb();
                            });
                        });
                    },
                    function(cb) {
                        request(playerServer)
                            .put('/user/' + objId)
                            .send(userData)
                            .set('authorization', 'Bearer abc')
                            .expect(400).end(function(err) {
                                assert.ifError(err);
                                cb();
                            });
                    }
                ], function() {
                    done();
                });
            });
            it('should upgrade anonymous account when user updated necessary details', function(done) {
                var objId;
                var userData = {
                    alias: 'test123456',
                    email: 'test@test.com',
                    password: '12abcdefgh',
                    btcWithdrawAddress: 'newaddress',
                    signature: 'sign',
                    _id: 'abc'
                };
                var utils = container.get('utils');
                utils.checkAddress = function(address, callback) {
                    callback(undefined);
                };
                utils.checkSignature = function(address, sign, message, callback) {
                    callback(undefined);
                };
                async.series([

                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'abc',
                                anonymous: true,
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function(cb) {
                        request(playerServer)
                            .put('/user/' + objId)
                            .send(userData)
                            .set('authorization', 'Bearer abc')
                            .expect(202).end(function(err, res) {
                                assert.ifError(err);
                                assert.equal(res.body._id, objId);
                                assert.equal(res.body.alias, userData.alias);
                                assert.equal(res.body.email, userData.email);
                                assert.equal(res.body.anonymous, false);
                                assert.equal(res.body._id, objId);
                                assert.ifError(res.body.password);
                                cb();
                            });
                    },
                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').findOne({
                                _id: objId
                            }, function(err, user) {
                                assert.equal(user.alias, userData.alias);
                                assert.notEqual(user.password, userData.password);
                                assert.equal(user.anonymous, false);
                                assert.equal(user.withdraw.btc.address, 'newaddress');
                                assert.equal(user.withdraw.btc.backup.address, null);
                                cb();
                            });
                        });
                    }
                ], function() {
                    done();
                });
            });
            it('should not upgrade anonymous account if user has not provided all necessary details', function(done) {
                var objId;
                var userData = {
                    alias: 'test123456',
                    email: 'test@test.com',
                    // password: '12abcdefgh',
                    btcWithdrawAddress: 'newaddress',
                    signature: 'sign',
                    _id: 'abc'
                };
                var utils = container.get('utils');
                utils.checkAddress = function(address, callback) {
                    callback(undefined);
                };
                utils.checkSignature = function(address, sign, message, callback) {
                    callback(undefined);
                };
                async.series([

                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'abc',
                                anonymous: true,
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function(cb) {
                        request(playerServer)
                            .put('/user/' + objId)
                            .send(userData)
                            .set('authorization', 'Bearer abc')
                            .expect(202).end(function(err, res) {
                                assert.ifError(err);
                                assert.equal(res.body._id, objId);
                                assert.equal(res.body.alias, userData.alias);
                                assert.equal(res.body.email, userData.email);
                                assert.equal(res.body.anonymous, true);
                                assert.equal(res.body._id, objId);
                                assert.ifError(res.body.password);
                                cb();
                            });
                    },
                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').findOne({
                                _id: objId
                            }, function(err, user) {
                                assert.equal(user.alias, userData.alias);
                                assert.equal(user.anonymous, true);
                                assert.equal(user.withdraw.btc.address, 'newaddress');
                                assert.equal(user.withdraw.btc.backup.address, null);
                                cb();
                            });
                        });
                    }
                ], function() {
                    done();
                });
            });
        });
        describe('challenge string', function() {
            it('should generate challenge string', function(done) {
                var objId;
                var userData = {
                    alias: 'test',
                    email: 'test@test.com',
                    password: '12abcdefgh',
                    _id: 'abc'
                };
                async.series([

                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                token: 'abc',
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function(cb) {
                        request(playerServer)
                            .get('/user/' + objId + '/challenge')
                            .set('authorization', 'Bearer abc')
                            .expect(200).end(function(err, res) {
                                assert.ifError(err);
                                assert.notEqual(res.body.challenge, null);
                                cb();
                            });
                    },
                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').findOne({
                                _id: objId
                            }, function(err, user) {
                                assert.notEqual(user.password, userData.password);
                                cb();
                            });
                        });
                    }
                ], function() {
                    done();
                });
            });
        });
        describe('password reset', function () {
            it('should reset password by using main address', function (done) {
                var userId;
                container.resolve(function(mongo, utils){
                    utils.checkAddress = function(address, callback) {
                        callback(undefined, {
                            isvalid: true
                        });
                    };
                    utils.checkSignature = function(address, signature, message, callback) {
                        callback(undefined);
                    };
                    async.series([
                        function mockUser(cb){
                            mongo.getDb(function(err, db) {
                                db.collection('users').insert({
                                    password: 'abc',
                                    alias: 'foobar',
                                    token: 'abc',
                                    withdraw:{
                                        btc:{
                                            address: 'address1',
                                            backup:{
                                                address: 'address2'
                                            }
                                        }
                                    }
                                }, function(err, docs) {
                                    userId = docs[0]._id;
                                    cb();
                                });
                            });
                        },
                        function resetPassword(cb){
                            request(playerServer)
                                .put('/password/reset')
                                .send({
                                    alias: 'foobar',
                                    password: 'abc12345678910',
                                    withdrawAddress: 'address1'
                                })
                                .expect(202)
                                .set('authorization', 'Bearer abc')
                                .end(function(err, res){
                                    assert.ifError(err);
                                    cb();
                                });
                        },
                        function verify(cb){
                            mongo.getDb(function(err, db) {
                                db.collection('users').findOne({
                                    token: 'abc',
                                }, function(err, doc) {
                                    assert.ifError(err);
                                    assert.notEqual(doc.password, 'abc');
                                    cb();
                                });
                            });
                        }
                        ], function(){
                            done();
                        });
                });
            });
            it('should reset password by using backup address', function (done) {
                var userId;
                container.resolve(function(mongo, utils){
                    utils.checkAddress = function(address, callback) {
                        callback(undefined, {
                            isvalid: true
                        });
                    };
                    utils.checkSignature = function(address, signature, message, callback) {
                        callback(undefined);
                    };
                    async.series([
                        function mockUser(cb){
                            mongo.getDb(function(err, db) {
                                db.collection('users').insert({
                                    password: 'abc',
                                    token: 'abc',
                                    alias: 'foobar',
                                    withdraw:{
                                        btc:{
                                            address: 'address1',
                                            backup:{
                                                address: 'address2'
                                            }
                                        }
                                    }
                                }, function(err, docs) {
                                    userId = docs[0]._id;
                                    cb();
                                });
                            });
                        },
                        function resetPassword(cb){
                            request(playerServer)
                                .put('/password/reset')
                                .send({
                                    alias: 'foobar',
                                    password: 'abc12345678910',
                                    withdrawAddress: 'address2'
                                })
                                .expect(202)
                                .set('authorization', 'Bearer abc')
                                .end(function(err, res){
                                    assert.ifError(err);
                                    cb();
                                });
                        },
                        function verify(cb){
                            mongo.getDb(function(err, db) {
                                db.collection('users').findOne({
                                    token: 'abc',
                                }, function(err, doc) {
                                    assert.ifError(err);
                                    assert.notEqual(doc.password, 'abc');
                                    cb();
                                });
                            });
                        }
                        ], function(){
                            done();
                        });
                });
            });

        });
        describe('email', function() {
            it('should output 404 error if confirm email token not found', function(done) {
                request(playerServer).get('/confirm/abctoken').expect(404).end(function(err, res) {
                    assert.ifError(err);
                    done();
                });
            });
        });
        describe('transaction', function() {
            describe('withdraw', function() {
                xit('should initiate a user withdraw', function(done) {
                    var objId, apiToken, emailToken;
                    async.series([

                        function(cb) {
                            container.register('utils', new function() {
                                this.createBlockchainWallet = function(pwd, email, cb) {
                                    cb(undefined, {
                                        address: 'test address'
                                    });
                                };
                            });
                            //create user
                            request(playerServer).post('/user').send({
                                alias: 'foobar12345',
                                password: '144m201200',
                                createWallet: true,
                                email: 'test@test.com'
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                objId = res.body._id;
                                emailToken = res.body.emailToken;
                                // assert.equal('test address', res.body.withdraw.btc.address);
                                // assert.equal('test address', res.body.newWallet.address);
                                cb();
                            });
                        },
                        function(cb) {
                            //get api token
                            request(playerServer).get('/auth').set('authorization', 'Basic '+basicToken).expect(200).end(function(err, res) {
                                assert.ifError(err);
                                assert(res.header['access-control-expose-headers']);
                                assert(res.header['api-token']);
                                apiToken = res.header['api-token'];
                                cb();
                            });
                        },
                        function(cb) {
                            //confirm email to get deposit btc awarded
                            request(playerServer).get('/confirm/' + emailToken).expect(200).end(function(err, res) {
                                assert.ifError(err);
                                assert.equal('email confirmation', res.body.transaction.type);
                                assert.equal('btc', res.body.transaction.currency);
                                //0.001 equals to 100000 satoshi
                                assert.equal(100000, res.body.transaction.amtIn);
                                assert.equal(100000, res.body.user.balance.btc);
                                cb();
                            });
                        },
                        function mockWithdrawAddress(cb) {
                            container.get('mongo').getDb(function(err, db) {
                                db.collection('users').update({
                                    alias: 'foobar12345'
                                }, {
                                    $set:{
                                        withdraw:{
                                            btc: 'address'
                                        }
                                    }
                                }, cb);
                            });
                        },
                        function(cb) {
                            var stub = sinon.stub(container.get('bitcoind'), 'send', function(params, callback) {
                                callback(undefined, 'txid', container.get('constants').txfee);
                            });
                            request(playerServer)
                                .get('/user/' + objId + '/withdraw/btc?amount=10000')
                                .set('authorization', 'Bearer ' + apiToken)
                                .expect(200).end(function(err, res) {
                                    assert.ifError(err);
                                    assert.equal(80000, res.body.user.balance.btc);
                                    stub.restore();
                                    cb();
                                });
                        }
                    ], function() {
                        done();
                    });
                });
                it('should add a withdraw address', function(done) {
                    var objId, apiToken, emailToken;
                    async.series([

                        function(cb) {
                            //create user
                            var utils = container.get('utils');
                            utils.checkAddress = function(address, callback) {
                                callback(undefined, {
                                    isvalid: true
                                });
                            };
                            utils.checkSignature = function(address, signature, message, callback) {
                                callback(undefined);
                            };
                            request(playerServer).post('/user').send({
                                alias: 'foobar12345',
                                password: '144m201200',
                                //createWallet: true,
                                email: 'test@test.com'
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                objId = res.body._id;
                                emailToken = res.body.emailToken;
                                // assert.equal('test address', res.body.newWallet.address);
                                cb();
                            });
                        },
                        function(cb) {
                            //get api token
                            request(playerServer).get('/auth').set('authorization', 'Basic '+basicToken).expect(200).end(function(err, res) {
                                assert.ifError(err);
                                assert(res.header['access-control-expose-headers']);
                                assert(res.header['api-token']);
                                apiToken = res.header['api-token'];
                                cb();
                            });
                        },
                        function(cb) {
                            request(playerServer)
                                .get('/user/' + objId + '/challenge')
                                .set('authorization', 'Bearer ' + apiToken)
                                .expect(200).end(function(err, res) {
                                    assert.ifError(err);
                                    assert.notEqual(res.body.challenge, null);
                                    cb();
                                });
                        },
                        function(cb) {
                            //withdraw
                            request(playerServer)
                                .put('/user/' + objId + '/address/withdraw/btc')
                                .send({
                                    address: 'test'
                                })
                                .set('authorization', 'Bearer ' + apiToken)
                                .expect(202).end(function(err, res) {
                                    assert.ifError(err);
                                    assert.equal(res.body.address, 'test');
                                    cb();
                                });
                        },
                        //check newly added address
                        function(cb) {
                            request(playerServer)
                                .get('/user/' + objId)
                                .set('authorization', 'Bearer ' + apiToken)
                                .expect(200).end(function(err, res) {
                                    assert.ifError(err);
                                    assert.equal(res.body.withdraw.btc.address, 'test');
                                    cb();
                                });
                        }
                    ], function() {
                        done();
                    });
                });
                it('should not add a withdraw address it is already used by the other users', function(done) {
                    var objId, apiToken, emailToken;
                    async.series([
                        function mockOtherUser(cb){
                            container.get('mongo').getDb(function(err, db) {
                                db.collection('users').insert({
                                    token: 'aaa',
                                    withdraw: {
                                        btc: {
                                            address: 'test'
                                        }
                                    }
                                }, function() {
                                    cb();
                                });
                            });
                        },
                        function(cb) {
                            //create user
                            var utils = container.get('utils');
                            utils.checkAddress = function(address, callback) {
                                callback(undefined, {
                                    isvalid: true
                                });
                            };
                            utils.checkSignature = function(address, signature, message, callback) {
                                callback(undefined);
                            };
                            request(playerServer).post('/user').send({
                                alias: 'foobar12345',
                                password: '144m201200',
                                email: 'test@test.com'
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                objId = res.body._id;
                                emailToken = res.body.emailToken;
                                cb();
                            });
                        },
                        function(cb) {
                            //get api token
                            request(playerServer).get('/auth').set('authorization', 'Basic '+basicToken).expect(200).end(function(err, res) {
                                assert.ifError(err);
                                assert(res.header['access-control-expose-headers']);
                                assert(res.header['api-token']);
                                apiToken = res.header['api-token'];
                                cb();
                            });
                        },
                        function(cb) {
                            request(playerServer)
                                .get('/user/' + objId + '/challenge')
                                .set('authorization', 'Bearer ' + apiToken)
                                .expect(200).end(function(err, res) {
                                    assert.ifError(err);
                                    assert.notEqual(res.body.challenge, null);
                                    cb();
                                });
                        },
                        function(cb) {
                            //withdraw
                            request(playerServer)
                                .put('/user/' + objId + '/address/withdraw/btc')
                                .send({
                                    address: 'test'
                                })
                                .set('authorization', 'Bearer ' + apiToken)
                                .expect(400).end(function(err) {
                                    assert.ifError(err);
                                    cb();
                                });
                        }
                    ], function() {
                        done();
                    });
                });
            });
            describe('credit or debit', function() {
                it('should credit to account', function(done) {
                    var objId, apiToken, emailToken;
                    async.series([

                        function(cb) {
                            container.get('utils').createBlockchainWallet = function(pwd, email, cb) {
                                cb(undefined, {
                                    address: 'test address'
                                });
                            };
                            //create user
                            // container.register('bitcoind', require('../../bitcoin-wallet'));
                            request(playerServer).post('/user').send({
                                alias: 'foobar12345',
                                password: '144m201200',
                                createWallet: true,
                                email: 'test@test.com'
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                objId = res.body._id;
                                emailToken = res.body.emailToken;
                                // assert.equal('test address', res.body.newWallet.address);
                                cb();
                            });
                        },
                        function(cb) {
                            //get api token
                            request(playerServer).get('/auth').set('authorization', 'Basic '+ basicToken).expect(200).end(function(err, res) {
                                assert.ifError(err);
                                assert(res.header['access-control-expose-headers']);
                                assert(res.header['api-token']);
                                apiToken = res.header['api-token'];
                                cb();
                            });
                        },
                        function(cb) {
                            //withdraw
                            request(playerServer)
                                .post('/transaction/app/credit/' + objId)
                                .send({
                                    type: 'type',
                                    refId: 'refId',
                                    amount: 100,
                                    currency: 'abc'
                                })
                                .set('authorization', 'Bearer ' + apiToken)
                                .expect(200).end(function(err, res) {
                                    assert.ifError(err);
                                    assert.equal(res.body.transaction.amtIn, 100);
                                    assert.equal(res.body.transaction.currency, 'abc');
                                    assert.equal(res.body.transaction.type, 'type');
                                    assert.equal(res.body.transaction.refId, 'refId');
                                    cb();
                                });
                        }
                    ], function() {
                        done();
                    });
                });
                it('should debit to account', function(done) {
                    var objId, apiToken, emailToken;
                    async.series([

                        function(cb) {
                            container.get('utils').createBlockchainWallet = function(pwd, email, cb) {
                                cb(undefined, {
                                    address: 'test address'
                                });
                            };
                            //create user
                            container.register('bitcoind', require('bitcoin-wallet'));
                            request(playerServer).post('/user').send({
                                alias: 'foobar12345',
                                password: '144m201200',
                                createWallet: true,
                                email: 'test@test.com'
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                objId = res.body._id;
                                emailToken = res.body.emailToken;
                                // assert.equal('test address', res.body.newWallet.address);
                                cb();
                            });
                        },
                        function(cb) {
                            container.get('mongo').getDb(function(err, db){
                                db.collection('users').update({alias:'foobar12345'}, {
                                    $set:{
                                        withdraw:{
                                            'abc':{
                                                address:'abc'
                                            }
                                        },
                                        balance:{
                                            'abc': 10000000
                                        }
                                    }
                                }, function(){
                                    cb();
                                });
                            });
                        },
                        function(cb) {
                            //get api token
                            request(playerServer).get('/auth').set('authorization', 'Basic '+basicToken).expect(200).end(function(err, res) {
                                assert.ifError(err);
                                assert(res.header['access-control-expose-headers']);
                                assert(res.header['api-token']);
                                apiToken = res.header['api-token'];
                                cb();
                            });
                        },
                        function(cb) {
                            //withdraw
                            request(playerServer)
                                .post('/transaction/app/debit/' + objId)
                                .send({
                                    type: 'type',
                                    refId: 'refId',
                                    amount: 100,
                                    currency: 'abc',
                                    meta: {
                                        test: 'string'
                                    }
                                })
                                .set('authorization', 'Bearer ' + apiToken)
                                .expect(200).end(function(err, res) {
                                    assert.ifError(err);
                                    assert.equal(res.body.transaction.amtOut, 100);
                                    assert.equal(res.body.transaction.currency, 'abc');
                                    assert.equal(res.body.transaction.type, 'type');
                                    assert.equal(res.body.transaction.refId, 'refId');
                                    assert.equal(res.body.transaction.meta.test, 'string');
                                    cb();
                                });
                        }
                    ], function() {
                        done();
                    });
                });
            });
            describe('history', function () {
                var clock;
                afterEach(function (done) {
                    if(clock) {
                        clock.restore();
                    }
                    done();
                });
                it('should return transaction history', function (done) {
                    var userId;
                    clock = sinon.useFakeTimers(new Date('2014-01-02').getTime());
                    container.resolve(function(mongo){
                        async.series([
                            function mockUser(cb){
                                mongo.getDb(function(err, db) {
                                    db.collection('users').insert({
                                        token: 'abc',
                                    }, function(err, docs) {
                                        userId = docs[0]._id;
                                        cb();
                                    });
                                });
                            },
                            function mockTransaction(cb){
                                mongo.getDb(function(err, db){
                                    db.collection('transactions').insert({
                                        userId: mongo.ensureObjectId(userId),
                                        currency: 'btc',
                                        date: new Date()
                                    }, function(err){
                                        assert.ifError(err);
                                        cb();
                                    });
                                });
                            },
                            function mockTransaction(cb){
                                mongo.getDb(function(err, db){
                                    db.collection('transactions').insert({
                                        userId: mongo.ensureObjectId(userId),
                                        currency: 'btc',
                                        date: new Date()
                                    }, function(err){
                                        assert.ifError(err);
                                        cb();
                                    });
                                });
                            },
                            function mockTransaction(cb){
                                mongo.getDb(function(err, db){
                                    db.collection('transactions').insert({
                                        userId: mongo.ensureObjectId(userId),
                                        currency: 'btc',
                                        date: new Date('2013-12-30')
                                    }, function(err){
                                        assert.ifError(err);
                                        cb();
                                    });
                                });
                            },
                            function assertTransactionHistory(cb){
                                request(playerServer)
                                    .get('/user/' + userId + '/transaction/btc/2014-01-01')
                                    .expect(200)
                                    .set('authorization', 'Bearer abc')
                                    .end(function(err, res){
                                        assert.ifError(err);
                                        assert.equal(res.body.length, 2);
                                        cb();
                                    });
                            }
                            ], function(){
                                done();
                            });
                    });
                });
            });
        });
        describe('notification', function() {
            describe('notify', function() {
                xit('should notify the updates via socket when user are connected', function(done) {
                    var userId, socket;
                    async.series([

                        function(cb) {
                            request(playerServer).post('/user').send({
                                alias: 'foobar12345',
                                password: '144m201200',
                                email: 'test@test.com'
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                userId = res.body._id;
                                assert.equal('foobar12345', res.body.alias);
                                assert.equal('test@test.com', res.body.email);
                                assert.equal('depositeAddress', res.body.deposit.btc.address);
                                cb();
                            });
                        },
                        function(cb) {
                            var objId = container.get('mongo').ensureObjectId(userId);
                            container.get('mongo').getDb(function(err, db) {
                                db.collection('users').update({
                                    _id: objId
                                }, {
                                    $push: {
                                        notifications: {
                                            $each: [{
                                                message: 'test notification 1',
                                                stick: true
                                            }, {
                                                message: 'test notification 2',
                                                stick: false
                                            }]
                                        }
                                    }
                                }, function(err) {
                                    cb(err);
                                });
                            });
                        },
                        function(cb) {
                            socket = io.connect('http://0.0.0.0:8443', {
                                'log level': 0,
                                transports: ['websocket'],
                                'force new connection': true
                            });
                            socket.on('connect', function(data) {
                                socket.emit('subscribe', userId);
                                socket.on('subscribed', function() {
                                    cb();
                                });
                            });
                        },
                        function(cb) {
                            socket.on('notification', function(notifications) {
                                //should only return the stick notification
                                assert.equal(notifications.length, 1);
                                assert.equal(notifications[0].message, 'test notification 1');
                                cb();
                            });
                        }
                    ], function() {
                        done();
                    });
                });
                it('should dismiss an notification, and should not show the dismissed notification next time', function(done) {
                    var user, notif1, notif2;
                    var UserController = container.get('UserController');
                    async.series([

                        function(cb) {
                            request(playerServer).post('/user').send({
                                alias: 'foobar12345',
                                password: '144m201200',
                                email: 'test@test.com'
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                user = res.body;
                                assert.equal('foobar12345', res.body.alias);
                                assert.equal('test@test.com', res.body.email);
                                assert.equal('depositeAddress', res.body.deposit.btc.address);
                                cb();
                            });
                        },
                        function(cb) {
                            UserController.saveNotification(user._id, {
                                subject: 's1',
                                message: 'm1'
                            }, function(err, notification) {
                                notif1 = notification;
                                UserController.saveNotification(user._id, {
                                    subject: 's2',
                                    message: 'm2'
                                }, function(err, notification) {
                                    notif2 = notification;
                                    cb();
                                });
                            });
                        },
                        function(cb) {
                            UserController.checkToken = function(token, callback) {
                                callback(undefined, user);
                            };
                            cb();
                        },
                        function(cb) {
                            request(playerServer)
                                .del('/user/' + user._id + '/notification/' + notif1.id)
                                .set('authorization', 'Bearer abc')
                                .expect(204)
                                .end(function(err, res) {
                                    assert.ifError(err);
                                    cb();
                                });
                        },
                        function(cb) {
                            UserController.checkToken = function(token, callback) {
                                callback(undefined, user);
                            };
                            cb();
                        },
                        function(cb) {
                            request(playerServer)
                                .get('/user/' + user._id + '/notification/')
                                .set('authorization', 'Bearer abc')
                                .expect(200)
                                .end(function(err, res) {
                                    assert.ifError(err);
                                    assert.equal(1, res.body.length);
                                    cb();
                                });
                        }
                    ], function() {
                        done();
                    });
                });
                it('should send updates via socket for each newly created notification', function(done) {
                    var user, socket, notif1, notif2;
                    var UserController = container.get('UserController');
                    async.series([

                        function(cb) {
                            request(playerServer).post('/user').send({
                                alias: 'foobar12345',
                                password: '144m201200',
                                email: 'test@test.com'
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                user = res.body;
                                assert.equal('foobar12345', res.body.alias);
                                assert.equal('test@test.com', res.body.email);
                                assert.equal('depositeAddress', res.body.deposit.btc.address);
                                cb();
                            });
                        },
                        function(cb) {
                            socket = io.connect('http://0.0.0.0:8443', {
                                'log level': 0,
                                transports: ['websocket'],
                                'force new connection': true
                            });
                            socket.on('connect', function(data) {
                                socket.emit('subscribe', user._id);
                                socket.on('subscribed', function() {
                                    cb();
                                });
                            });
                        },
                        function(cb) {
                            UserController.saveNotification(user._id, {
                                subject: 's1',
                                message: 'm1'
                            }, function(err, notification) {
                                notif1 = notification;
                                UserController.saveNotification(user._id, {
                                    subject: 's2',
                                    message: 'm2'
                                }, function(err, notification) {
                                    notif2 = notification;
                                });
                            });
                            var callback = sinon.stub();
                            callback.onFirstCall().returns(1);
                            callback.onSecondCall().returns(2);
                            socket.on('notification', function(notifications) {
                                var callCount = callback();
                                if (callCount === 1) {
                                    assert.equal(notifications.length, 1);
                                    assert.equal(notifications[0].message, 'm1');
                                    assert.equal(notifications[0].hasRead, false);
                                    return;
                                }
                                if (callCount === 2) {
                                    assert.equal(notifications.length, 1);
                                    assert.equal(notifications[0].hasRead, false);
                                    cb();
                                }
                            });
                        }
                    ], function() {
                        done();
                    });
                });
                it('should send notification unread counts via socket for each newly created notification', function(done) {
                    var user, socket, notif1, notif2;
                    var UserController = container.get('UserController');
                    async.series([

                        function(cb) {
                            request(playerServer).post('/user').send({
                                alias: 'foobar12345',
                                password: '144m201200',
                                email: 'test@test.com'
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                user = res.body;
                                assert.equal('foobar12345', res.body.alias);
                                assert.equal('test@test.com', res.body.email);
                                assert.equal('depositeAddress', res.body.deposit.btc.address);
                                cb();
                            });
                        },
                        function(cb) {
                            socket = io.connect('http://0.0.0.0:8443', {
                                'log level': 0,
                                transports: ['websocket'],
                                'force new connection': true
                            });
                            socket.on('connect', function(data) {
                                socket.emit('subscribe', user._id);
                                socket.on('subscribed', function() {
                                    cb();
                                });
                            });
                        },
                        function(cb) {
                            //save new notification, it should increment the unread count
                            UserController.saveNotification(user._id, {
                                subject: 's1',
                                message: 'm1'
                            }, function(err, notification) {
                                notif1 = notification;
                                UserController.saveNotification(user._id, {
                                    subject: 's2',
                                    message: 'm2'
                                }, function(err, notification) {
                                    notif2 = notification;
                                });
                            });
                            var callback = sinon.stub();
                            callback.onFirstCall().returns(1);
                            callback.onSecondCall().returns(2);
                            callback.onThirdCall().returns(3);
                            socket.on('notification unread', function(unreads) {
                                var callCount = callback();
                                if (callCount === 1) {
                                    assert.equal(unreads, 0);
                                    return;
                                }
                                if (callCount === 2) {
                                    assert.equal(unreads, 1);
                                    return;
                                }
                                if (callCount === 3) {
                                    assert.equal(unreads, 2);
                                    cb();
                                }
                            });
                        },
                        function(cb) {
                            UserController.checkToken = function(token, callback) {
                                callback(undefined, user);
                            };
                            cb();
                        },
                        function(cb) {
                            //mark read, it should reduce the count
                            socket.on('notification unread', function(unreads) {
                                assert.equal(1, unreads);
                                cb();
                            });
                            request(playerServer)
                                .put('/user/' + user._id + '/notification/' + notif1.id + '/read')
                                .set('authorization', 'Bearer abc')
                                .expect(202)
                                .end(function(err, res) {
                                    assert.ifError(err);
                                });
                        }
                    ], function() {
                        done();
                    });
                });
                xit('should reduce the count when a notification is dismissed', function(done) {
                    var user, socket, notif1, notif2;
                    var UserController = container.get('UserController');
                    async.series([

                        function(cb) {
                            request(playerServer).post('/user').send({
                                alias: 'foobar12345',
                                password: '144m201200',
                                email: 'test@test.com'
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                user = res.body;
                                assert.equal('foobar12345', res.body.alias);
                                assert.equal('test@test.com', res.body.email);
                                assert.equal('depositeAddress', res.body.deposit.btc.address);
                                cb();
                            });
                        },
                        function(cb) {
                            socket = io.connect('http://0.0.0.0:8443', {
                                'log level': 0,
                                transports: ['websocket'],
                                'force new connection': true
                            });
                            socket.on('connect', function(data) {
                                socket.emit('subscribe', user._id);
                                socket.on('subscribed', function() {
                                    cb();
                                });
                            });
                        },
                        function(cb) {
                            UserController.checkToken = function(token, callback) {
                                callback(undefined, user);
                            };
                            cb();
                        },
                        function(cb) {
                            //save new notification, it should increment the unread count
                            UserController.saveNotification(user._id, {
                                subject: 's1',
                                message: 'm1'
                            }, function(err, notification) {
                                notif1 = notification;
                                UserController.saveNotification(user._id, {
                                    subject: 's2',
                                    message: 'm2'
                                }, function(err, notification) {
                                    notif2 = notification;
                                    request(playerServer)
                                        .del('/user/' + user._id + '/notification/' + notif1.id)
                                        .set('authorization', 'Bearer abc')
                                        .expect(204)
                                        .end(function(err) {
                                            assert.ifError(err);
                                        });
                                    request(playerServer)
                                        .put('/user/' + user._id + '/notification/' + notif1.id + '/read')
                                        .set('authorization', 'Bearer abc')
                                        .expect(202)
                                        .end(function(err) {
                                            assert.ifError(err);
                                        });
                                });
                            });
                            var callback = sinon.stub();
                            callback.onFirstCall().returns(1);
                            callback.onSecondCall().returns(2);
                            callback.onThirdCall().returns(3);
                            callback.onCall(3).returns(4);
                            socket.on('notification unread', function(unreads) {
                                var callCount = callback();
                                if (callCount === 1) {
                                    //triggered by connection
                                    assert.equal(unreads, 0);
                                    return;
                                }
                                if (callCount === 2) {
                                    //triggered by first notification saved
                                    assert.equal(unreads, 1);
                                    return;
                                }
                                if (callCount === 3) {
                                    //triggered by second notification saved
                                    assert.equal(unreads, 2);
                                    return;
                                }
                                if (callCount === 4) {
                                    //triggered by dismissed
                                    assert.equal(unreads, 1);
                                    cb();
                                }
                            });
                        }
                    ], function() {
                        done();
                    });
                });
                xit('should not reduce twice for a read notifiction that has been dismissed', function(done) {
                    var user, socket, notif1, notif2;
                    var UserController = container.get('UserController');
                    async.series([

                        function(cb) {
                            request(playerServer).post('/user').send({
                                alias: 'foobar12345',
                                password: '144m201200',
                                email: 'test@test.com'
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                user = res.body;
                                assert.equal('foobar12345', res.body.alias);
                                assert.equal('test@test.com', res.body.email);
                                assert.equal('depositeAddress', res.body.deposit.btc.address);
                                cb();
                            });
                        },
                        function(cb) {
                            socket = io.connect('http://0.0.0.0:8443', {
                                'log level': 0,
                                transports: ['websocket'],
                                'force new connection': true
                            });
                            socket.on('connect', function(data) {
                                socket.emit('subscribe', user._id);
                                socket.on('subscribed', function() {
                                    cb();
                                });
                            });
                        },
                        function(cb) {
                            UserController.checkToken = function(token, callback) {
                                callback(undefined, user);
                            };
                            cb();
                        },
                        function(cb) {
                            //save new notification, it should increment the unread count
                            UserController.saveNotification(user._id, {
                                subject: 's1',
                                message: 'm1'
                            }, function(err, notification) {
                                notif1 = notification;
                                UserController.saveNotification(user._id, {
                                    subject: 's2',
                                    message: 'm2'
                                }, function(err, notification) {
                                    notif2 = notification;
                                    request(playerServer)
                                        .put('/user/' + user._id + '/notification/' + notif1.id + '/read')
                                        .set('authorization', 'Bearer abc')
                                        .expect(202)
                                        .end(function(err) {
                                            assert.ifError(err);
                                            request(playerServer)
                                                .del('/user/' + user._id + '/notification/' + notif1.id)
                                                .set('authorization', 'Bearer abc')
                                                .expect(204)
                                                .end(function(err) {
                                                    assert.ifError(err);
                                                });
                                        });
                                });
                            });
                            var callback = sinon.stub();
                            callback.onFirstCall().returns(1);
                            callback.onSecondCall().returns(2);
                            callback.onThirdCall().returns(3);
                            callback.onCall(3).returns(4);
                            callback.onCall(4).returns(5);
                            socket.on('notification unread', function(unreads) {
                                var callCount = callback();
                                if (callCount === 1) {
                                    //triggered by connection
                                    assert.equal(unreads, 0);
                                    return;
                                }
                                if (callCount === 2) {
                                    //triggered by first notification saved
                                    assert.equal(unreads, 1);
                                    return;
                                }
                                if (callCount === 3) {
                                    //triggered by second notification saved
                                    assert.equal(unreads, 2);
                                    return;
                                }
                                if (callCount === 4) {
                                    //triggered by read
                                    assert.equal(unreads, 1);
                                }
                                if (callCount === 5) {
                                    //triggered by dismissed
                                    assert.equal(unreads, 1);
                                    cb();
                                }
                            });
                        }
                    ], function() {
                        done();
                    });
                });
                it('should mark an notification as read', function(done) {
                    var user, notif1, notif2;
                    var UserController = container.get('UserController');
                    async.series([

                        function(cb) {
                            request(playerServer).post('/user').send({
                                alias: 'foobar12345',
                                password: '144m201200',
                                email: 'test@test.com'
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                user = res.body;
                                cb();
                            });
                        },
                        function(cb) {
                            UserController.saveNotification(user._id, {
                                subject: 's1',
                                message: 'm1'
                            }, function(err, notification) {
                                notif1 = notification;
                                UserController.saveNotification(user._id, {
                                    subject: 's2',
                                    message: 'm2'
                                }, function(err, notification) {
                                    notif2 = notification;
                                    cb();
                                });
                            });
                        },
                        function(cb) {
                            UserController.checkToken = function(token, callback) {
                                callback(undefined, user);
                            };
                            cb();
                        },
                        function(cb) {
                            request(playerServer)
                                .put('/user/' + user._id + '/notification/' + notif2.id + '/read')
                                .set('authorization', 'Bearer abc')
                                .expect(202)
                                .end(function(err, res) {
                                    assert.ifError(err);
                                    assert.equal(true, res.body.hasRead);
                                    assert.equal(notif2.id, res.body.id);
                                    cb();
                                });
                        }
                    ], function() {
                        done();
                    });
                });
                it('should get a list of notifications', function(done) {
                    var userId, user, notif1, notif2;
                    var UserController = container.get('UserController');
                    async.series([

                        function(cb) {
                            request(playerServer).post('/user').send({
                                alias: 'foobar12345',
                                password: '144m201200',
                                email: 'test@test.com'
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                userId = res.body._id;
                                user = res.body;
                                assert.equal('foobar12345', res.body.alias);
                                assert.equal('test@test.com', res.body.email);
                                assert.equal('depositeAddress', res.body.deposit.btc.address);
                                cb();
                            });
                        },
                        function(cb) {
                            UserController.saveNotification(userId, {
                                subject: 's1',
                                message: 'm1'
                            }, function(err, notification) {
                                notif1 = notification;
                                UserController.saveNotification(userId, {
                                    subject: 's2',
                                    message: 'm2'
                                }, function(err, notification) {
                                    notif2 = notification;
                                    cb();
                                });
                            });
                        },
                        function(cb) {
                            UserController.checkToken = function(token, callback) {
                                callback(undefined, user);
                            };
                            cb();
                        },
                        function(cb) {
                            request(playerServer)
                                .get('/user/' + user._id + '/notification/')
                                .set('authorization', 'Bearer abc')
                                .expect(200)
                                .end(function(err, res) {
                                    assert.ifError(err);
                                    assert.equal(2, res.body.length);
                                    cb();
                                });
                        }
                    ], function() {
                        done();
                    });
                });
            });
        });
    });
    describe('api token', function() {
        it('should authenticate user and return tokens for the valid authorization header', function(done) {
            var userData = {
                alias: 'foobar12345',
                password: '144m201200',
                email: 'foo@bar.com'
            };
            async.series([

                function(cb) {
                    container.get('mongo').getDb(function(err, db) {
                        var UserController = require('../src/controllers/user')(db.collection('users'));
                        UserController.setContainer(container);
                        UserController.create(userData, function(err, user) {
                            assert.ifError(err);
                            assert(user._id);
                            assert.equal(userData.alias, user.alias);
                            assert.equal(userData.email, user.email);
                            cb();
                        });
                    });
                },
                function(cb) {
                    request(playerServer).get('/auth').set('authorization', 'Basic '+basicToken).expect(200).end(function(err, res) {
                        assert.ifError(err);
                        assert(res.header['access-control-expose-headers']);
                        assert(res.header['api-token']);
                        assert(res.body.emailToken);
                        assert(res.body.token);
                        assert.equal(userData.alias, res.body.alias);
                        assert.equal(userData.email, res.body.email);
                        assert.ifError(res.body.password);
                        cb();
                    });
                }
            ], function() {
                done();
            });
        });
        it('should refresh API token for the requests with existing valid API token', function(done) {
            var userData = {
                alias: 'foobar12345',
                password: '144m201200',
                email: 'foo@bar.com'
            };
            var apiToken;
            async.series([

                function(cb) {
                    container.get('mongo').getDb(function(err, db) {
                        var UserController = require('../src/controllers/user')(db.collection('users'));
                        UserController.setContainer(container);
                        UserController.create(userData, function(err, user) {
                            assert.ifError(err);
                            assert(user._id);
                            assert.equal(userData.alias, user.alias);
                            assert.equal(userData.email, user.email);
                            cb();
                        });
                    });
                },
                function(cb) {
                    request(playerServer).get('/auth').set('authorization', 'Basic '+basicToken).expect(200).end(function(err, res) {
                        assert.ifError(err);
                        assert(res.header['access-control-expose-headers']);
                        assert(res.header['api-token']);
                        assert(res.body.emailToken);
                        assert(res.body.token);
                        apiToken = res.body.token;
                        assert.equal(userData.alias, res.body.alias);
                        assert.equal(userData.email, res.body.email);
                        assert.ifError(res.body.password);
                        cb();
                    });
                },
                function(cb) {
                    request(playerServer).get('/auth').set('authorization', 'Bearer ' + apiToken).expect(200).end(function(err, res) {
                        assert.ifError(err);
                        assert(res.header['access-control-expose-headers']);
                        assert(res.header['api-token']);
                        assert(res.body.emailToken);
                        assert(res.body.token);
                        //generated a new token
                        assert.notEqual(apiToken, res.body.token);
                        assert.equal(userData.alias, res.body.alias);
                        assert.equal(userData.email, res.body.email);
                        assert.ifError(res.body.password);
                        cb();
                    });
                }
            ], function() {
                done();
            });
        });
        it('should return error for the requests without authorization header', function(done) {
            request(playerServer).get('/auth').expect(400).end(function(err, res) {
                //confirm it responses 400 code
                assert.ifError(err);
                //confirm it outputs the error message
                assert(res.error);
                done();
            });
        });
        it('should return error for the requests with invalid authorization header string', function(done) {
            request(playerServer).get('/auth').set('authorization', 'asic abc').expect(400).end(function(err, res) {
                assert.ifError(err);
                assert(res.error);
                done();
            });
        });
    });
    describe('email', function() {
        it('should send message to betcoin support for customer', function(done) {
            var objId;
            var userData = {
                alias: 'test',
                email: 'test@test.com',
                token: 'abc'
            };
            async.series([

                function(cb) {
                    container.get('mongo').getDb(function(err, db) {
                        db.collection('users').insert(userData, function(err, docs) {
                            objId = docs[0]._id;
                            cb();
                        });
                    });
                },
                function(cb) {
                    container.get('mailer').send = function(email, template, options, callback) {
                        assert.equal('support@betcoin.tm', email);
                        assert.equal('contact_us', template);
                        assert.equal('test', options.user.alias);
                        assert.equal('test@test.com', options.user.email);
                        callback();
                    };
                    request(playerServer)
                        .post('/user/' + objId + '/message/send')
                        .send({
                            subject: 'test',
                            message: 'message body'
                        })
                        .set('authorization', 'Bearer abc')
                        .expect(200).end(function(err, res) {
                            assert.ifError(err);
                            cb();
                        });
                }
            ], function() {
                done();
            });
        });
    });
    describe('ticket', function() {
        describe('for non-login user', function() {
            it('should create a ticket', function(done) {
                request(playerServer).post('/ticket').send({
                    owner: 'test',
                    email: 'email',
                    subject: 'subject',
                    description: 'description',
                    priority: 1,
                    type: 1
                }).expect(201).end(function(err, res) {
                    assert.ifError(err);
                    assert(res.body._id);
                    assert.equal('test', res.body.owner);
                    assert.equal('email', res.body.email);
                    assert.equal('subject', res.body.subject);
                    assert.equal('description', res.body.description);
                    assert.equal(1, res.body.priority);
                    assert.equal(1, res.body.type);
                    assert.equal(3, res.body.status);
                    done();
                });
            });

            // this needs an update to be able to use the app key system
            xit('should update a ticket', function(done) {
                var ticketId;
                var form = {
                    owner: 'test',
                    email: 'email',
                    subject: 'subject',
                    description: 'description',
                    priority: 1,
                    type: 1
                };
                async.series([

                    function(cb) {
                        request(playerServer).post('/ticket').send(form).expect(201).end(function(err, res) {
                            ticketId = res.body._id;
                            cb();
                        });
                    },
                    function(cb) {
                        request(playerServer).put('/ticket/' + ticketId).expect(202).end(function(err, res) {
                            assert.ifError(err);
                            assert(res.body._id);
                            assert.equal(form.owner, res.body.owner);
                            assert.equal(form.email, res.body.email);
                            assert.equal(form.subject, res.body.subject);
                            assert.equal(form.description, res.body.description);
                            assert.equal(form.priority, res.body.priority);
                            assert.equal(form.type, res.body.type);
                            assert.equal(2, res.body.status);
                            cb();
                        });
                    }
                ], function() {
                    done();
                });
            });

            it('should get a ticket', function(done) {
                var ticketId;
                var form = {
                    owner: 'test',
                    email: 'email',
                    subject: 'subject',
                    description: 'description',
                    priority: 1,
                    type: 1
                };
                async.series([

                    function(cb) {
                        request(playerServer).post('/ticket').send(form).expect(201).end(function(err, res) {
                            ticketId = res.body._id;
                            cb();
                        });
                    },
                    function(cb) {
                        request(playerServer).get('/ticket/' + ticketId).expect(200).end(function(err, res) {
                            assert.ifError(err);
                            assert(res.body._id);
                            assert.equal(form.owner, res.body.owner);
                            assert.equal(form.email, res.body.email);
                            assert.equal(form.subject, res.body.subject);
                            assert.equal(form.description, res.body.description);
                            assert.equal(form.priority, res.body.priority);
                            assert.equal(form.type, res.body.type);
                            assert.equal(3, res.body.status);
                            cb();
                        });
                    }
                ], function() {
                    done();
                });
            });

            it('should add new ticket comments by user', function(done) {
                var ticketId;
                var form = {
                    owner: 'test',
                    email: 'email',
                    subject: 'subject',
                    description: 'description',
                    priority: 1,
                    type: 1
                };
                async.series([

                    function(cb) {
                        request(playerServer).post('/ticket').send(form).expect(201).end(function(err, res) {
                            ticketId = res.body._id;
                            cb();
                        });
                    },
                    function(cb) {
                        request(playerServer).post('/ticket/' + ticketId + '/comment')
                            .send({
                                message: 'comment1',
                                isAdmin: false
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                assert(res.body._id);
                                assert.equal(form.owner, res.body.owner);
                                assert.equal(form.email, res.body.email);
                                assert.equal(form.subject, res.body.subject);
                                assert.equal(form.description, res.body.description);
                                assert.equal(form.priority, res.body.priority);
                                assert.equal(form.type, res.body.type);
                                assert.equal(3, res.body.status);
                                assert.equal(1, res.body.comments.length);
                                assert.equal('comment1', res.body.comments.pop().message);
                                cb();
                            });
                    },
                    function(cb) {
                        request(playerServer).post('/ticket/' + ticketId + '/comment')
                            .send({
                                message: 'comment2',
                                isAdmin: false
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                assert(res.body._id);
                                assert.equal(form.owner, res.body.owner);
                                assert.equal(form.email, res.body.email);
                                assert.equal(form.subject, res.body.subject);
                                assert.equal(form.description, res.body.description);
                                assert.equal(form.priority, res.body.priority);
                                assert.equal(form.type, res.body.type);
                                assert.equal(3, res.body.status);
                                assert.equal(2, res.body.comments.length);
                                assert.equal('comment2', res.body.comments.pop().message);
                                cb();
                            });
                    }
                ], function() {
                    done();
                });
            });
        });

        describe('for login user', function() {
            it('should create a ticket', function(done) {
                var objId, ticketId;
                async.series([

                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                alias: 'alias',
                                email: 'email',
                                token: 'abc',
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function(cb) {
                        request(playerServer).post('/user/' + objId + '/ticket')
                            .send({
                                owner: 'test',
                                email: 'email',
                                subject: 'subject',
                                description: 'description',
                                priority: 1,
                                type: 1
                            })
                            .set('authorization', 'Bearer abc')
                            .expect(201).end(function(err, res) {
                                assert.ifError(err);
                                assert(res.body._id);
                                ticketId = res.body._id;
                                assert.equal(objId, res.body.userId);
                                assert.equal('alias', res.body.owner);
                                assert.equal('email', res.body.email);
                                assert.equal('subject', res.body.subject);
                                assert.equal('description', res.body.description);
                                assert.equal(1, res.body.priority);
                                assert.equal(1, res.body.type);
                                assert.equal(3, res.body.status);
                                cb();
                            });

                    },
                    function(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').find().toArray(function(err, docs) {
                                assert.ifError(err);
                                assert.equal(docs.length, 1);
                                var notifications = docs[0].notifications;
                                assert.equal(notifications.length, 1);
                                assert.equal(notifications[0].ticketId, ticketId);
                                assert.equal(notifications[0].stick, true);
                                assert.equal(notifications[0].hasRead, false);
                                assert.equal(notifications[0].subject, 'subject');
                                assert.equal(notifications[0].message, 'description');
                                cb();
                            });
                        });
                    }
                ], function() {
                    done();
                });
            });

            it('should be able to read a ticket', function(done) {
                //should mark the notification as read
                //should retrieve the ticket object by using the ref id stored in notification
                var objId, ticketId, notifyId;
                async.series([

                    function mockUser(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                alias: 'alias',
                                email: 'email',
                                token: 'abc',
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function createTicket(cb) {
                        request(playerServer).post('/user/' + objId + '/ticket')
                            .send({
                                owner: 'test',
                                email: 'email',
                                subject: 'subject',
                                description: 'description',
                                priority: 1,
                                type: 1
                            })
                            .set('authorization', 'Bearer abc')
                            .expect(201).end(function(err, res) {
                                assert.ifError(err);
                                assert(res.body._id);
                                ticketId = res.body._id;
                                assert.equal('alias', res.body.owner);
                                assert.equal('email', res.body.email);
                                assert.equal('subject', res.body.subject);
                                assert.equal('description', res.body.description);
                                assert.equal(1, res.body.priority);
                                assert.equal(1, res.body.type);
                                assert.equal(3, res.body.status);
                                cb();
                            });

                    },
                    function assertNotificationCreatedByTicket(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').find().toArray(function(err, docs) {
                                assert.ifError(err);
                                assert.equal(docs.length, 1);
                                var notifications = docs[0].notifications;
                                notifyId = notifications[0].id;
                                assert.equal(notifications.length, 1);
                                assert.equal(notifications[0].ticketId, ticketId);
                                assert.equal(notifications[0].stick, true);
                                assert.equal(notifications[0].hasRead, false);
                                assert.equal(notifications[0].subject, 'subject');
                                assert.equal(notifications[0].message, 'description');
                                cb();
                            });
                        });
                    },
                    function readTicketNotification(cb) {
                        request(playerServer)
                            .get('/user/' + objId + '/notification/' + notifyId + '/read')
                            .set('authorization', 'Bearer abc')
                            .expect(202)
                            .end(function(err, res) {
                                assert.ifError(err);
                                assert.equal(res.body.ticketId, ticketId);
                                assert.equal(res.body.stick, true);
                                assert.equal(res.body.hasRead, true);
                                assert.equal(res.body.ticket.subject, 'subject');
                                assert.equal(res.body.ticket.description, 'description');
                                assert.equal(res.body.ticket.owner, 'alias');
                                assert.equal(res.body.ticket.email, 'email');
                                assert.equal(res.body.ticket.priority, 1);
                                assert.equal(res.body.ticket.type, 1);
                                assert.equal(res.body.ticket.status, 3);
                                cb();
                            });
                    }
                ], function() {
                    done();
                });
            });

            it('should update a ticket by user', function(done) {
                var objId, ticketId;
                async.series([

                    function mockUser(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                alias: 'alias',
                                email: 'email',
                                token: 'abc',
                            }, function(err, docs) {
                                objId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function createTicket(cb) {
                        request(playerServer).post('/user/' + objId + '/ticket')
                            .send({
                                subject: 'subject',
                                description: 'description',
                                priority: 1,
                                type: 1
                            })
                            .set('authorization', 'Bearer abc')
                            .expect(201).end(function(err, res) {
                                assert.ifError(err);
                                ticketId = res.body._id;
                                assert(res.body.status, 3);
                                cb();
                            });

                    },
                    function updateTicketStatus(cb) {
                        request(playerServer).put('/user/'+ objId +'/ticket/' + ticketId + '/status/2')
                            .set('authorization', 'Bearer abc')
                            .expect(202).end(function(err, res) {
                                assert.ifError(err);
                                assert(res.body._id);
                                assert.equal('alias', res.body.owner);
                                assert.equal('email', res.body.email);
                                assert.equal('subject', res.body.subject);
                                assert.equal('description', res.body.description);
                                assert.equal(1, res.body.priority);
                                assert.equal(1, res.body.type);
                                assert.equal(2, res.body.status);
                                cb();
                            });
                    }
                ], function() {
                    done();
                });
            });
            it('should add new ticket comments by user', function(done) {
                var ticketId, userId;
                async.series([

                    function mockUser(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                alias: 'alias',
                                email: 'email',
                                token: 'abc',
                            }, function(err, docs) {
                                userId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function createTicket(cb) {
                        request(playerServer).post('/user/' + userId + '/ticket')
                            .set('authorization', 'Bearer abc')
                            .send({
                                subject: 'subject',
                                description: 'description',
                                priority: 1,
                                type: 1
                            })
                            .set('authorization', 'Bearer abc')
                            .expect(201).end(function(err, res) {
                                assert.ifError(err);
                                ticketId = res.body._id;
                                assert(res.body.status, 3);
                                cb();
                            });

                    },
                    function addComment(cb) {
                        request(playerServer).post('/user/'+ userId +'/ticket/' + ticketId + '/comment')
                            .set('authorization', 'Bearer abc')
                            .send({
                                message: 'comment1',
                                isAdmin: false
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                assert(res.body._id);
                                assert.equal(1, res.body.comments.length);
                                assert.equal('comment1', res.body.comments.pop().message);
                                cb();
                            });
                    },
                    function addAnotherComment(cb) {
                        request(playerServer).post('/user/'+ userId +'/ticket/' + ticketId + '/comment')
                            .set('authorization', 'Bearer abc')
                            .send({
                                message: 'comment2',
                                isAdmin: false
                            }).expect(201).end(function(err, res) {
                                assert.ifError(err);
                                assert.equal(2, res.body.comments.length);
                                assert.equal('comment2', res.body.comments.pop().message);
                                cb();
                            });
                    }
                ], function() {
                    done();
                });
            });
        });

        describe('for admin', function() {
            // this is being habdled by support-node and backoffice-node
            xit('should add new ticket comments by admin', function(done) {
                var ticketId, userId, lastUpdate;
                var form = {
                    subject: 'subject',
                    description: 'description',
                    priority: 1,
                    type: 1
                };
                async.series([

                    function mockUser(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').insert({
                                alias: 'alias',
                                email: 'email',
                                token: 'abc',
                            }, function(err, docs) {
                                userId = docs[0]._id;
                                cb();
                            });
                        });
                    },
                    function createTicket(cb) {
                        request(playerServer)
                            .post('/user/' + userId + '/ticket')
                            .set('authorization', 'Bearer abc')
                            .send({
                                subject: 'subject',
                                description: 'description',
                                priority: 1,
                                type: 1
                            })
                            .expect(201).end(function(err, res) {
                                assert.ifError(err);
                                ticketId = res.body._id;
                                assert(res.body.status, 3);
                                cb();
                            });

                    },
                    function getNotification(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').find().toArray(function(err, users){
                                assert.ifError(err);
                                assert.equal(users.length, 1);
                                assert.equal(users[0].notifications.length, 1);
                                assert(users[0].notifications[0].datetime);
                                lastUpdate = users[0].notifications[0].datetime;
                                cb();
                            });
                        });
                    },
                    function mockAdmin(cb) {
                        container.get('admin').getOfficeDb(function(err, db){
                            assert.ifError(err);
                            db.collection('users').insert({token:'abc'}, cb);
                        });
                    },
                    function addComment(cb) {
                        request(playerServer).post('/ticket/' + ticketId + '/comment')
                            .send({
                                message: 'comment1',
                                isAdmin: true,
                                status: 3
                            })
                            .set('authorization', 'Bearer abc')
                            .expect(201).end(function(err, res) {
                                assert.ifError(err);
                                assert(res.body._id);
                                assert.equal('alias', res.body.owner);
                                assert.equal('email', res.body.email);
                                assert.equal(form.subject, res.body.subject);
                                assert.equal(form.description, res.body.description);
                                assert.equal(form.priority, res.body.priority);
                                assert.equal(form.type, res.body.type);
                                assert.equal(3, res.body.status);
                                assert.equal(1, res.body.comments.length);
                                assert.equal('comment1', res.body.comments.pop().message);
                                assert.equal(emailStub.callCount, 1);
                                cb();
                            });
                    },
                    function verifyNotification(cb) {
                        container.get('mongo').getDb(function(err, db) {
                            db.collection('users').find().toArray(function(err, users){
                                assert.ifError(err);
                                assert.equal(users.length, 1);
                                assert.equal(users[0].notifications.length, 1);
                                assert.notEqual(users[0].notifications[0].datetime.getTime(), lastUpdate.getTime());
                                cb();
                            });
                        });
                    }
                ], function() {
                    done();
                });
            });

            xit('should get a list of new tickets', function(done) {
                async.series([
                    function mockTickets(cb){
                        async.series([
                            function(_cb){
                                container.get('mongo').getDb(function(err, db) {
                                    db.collection('tickets').insert({
                                        status: 1
                                    }, function(err){
                                        assert.ifError(err);
                                        _cb();
                                    });
                                });
                            },
                            function(_cb){
                                container.get('mongo').getDb(function(err, db) {
                                    db.collection('tickets').insert({
                                        status: 1
                                    }, function(err){
                                        assert.ifError(err);
                                        _cb();
                                    });
                                });
                            },
                            function(_cb){
                                container.get('mongo').getDb(function(err, db) {
                                    db.collection('tickets').insert({
                                        status: 2
                                    }, function(err){
                                        assert.ifError(err);
                                        _cb();
                                    });
                                });
                            },
                            ], function(){
                                cb();
                            });
                    },
                    function mockAdmin(cb){
                        container.get('admin').getOfficeDb(function(err, db){
                            assert.ifError(err);
                            db.collection('users').insert({token:'abc'}, cb);
                        });
                    },
                    function getTicketsByStatus(cb){
                        request(playerServer)
                            .get('/ticket/status/1')
                            .set('authorization', 'Bearer abc')
                            .expect(200).end(function(err, res) {
                                assert.ifError(err);
                                assert.equal(res.body.result, true);
                                assert.equal(res.body.data.length, 2);
                                cb();
                            });
                    },
                    function getZeroTicketsByStatus(cb){
                        request(playerServer)
                            .get('/ticket/status/3')
                            .set('authorization', 'Bearer abc')
                            .expect(200).end(function(err, res) {
                                assert.ifError(err);
                                assert.equal(res.body.result, true);
                                assert.equal(res.body.data.length, 0);
                                cb();
                            });
                    }
                    ], function(){
                        done();
                    });
            });
        });
    });
});
