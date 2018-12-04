'use strict';

/* global describe */
/* global it */
/* global beforeEach */
/* global before */
/* global getUsername */
/* global ADDRESSES */
/* global container */
/* global request */

var assert = require('assert');
var async = require('async');
var format = require('util').format;
var moment = require('moment');

var User = container.get('User');
var Wallet = container.get('Wallet');
var auth = container.get('auth');

var user;
var wallet;
// defining these here makes it easier to just copy this file for another game
var GAME = 'lottery';
var controller;

var INITIAL_BALANCE = 100000;

var testClear = function(currency, done) {
    controller.Game.removeAll(function(err) {
        assert.ifError(err);
        User.removeAll({}, function(err) {
            assert.ifError(err);
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
                    wallet = new Wallet({
                        userId: user.primary(),
                        currency: currency,
                        balance: INITIAL_BALANCE,
                        availableBalance: INITIAL_BALANCE,
                        withdrawAddress: ADDRESSES[currency].player.address
                    });
                    wallet.save(done);
                });
            });
        });
    });
};


module.exports = function(COIN) {
    var lotteryId;
    before(function(done) {
        var GameController = container.get('gameControllers')[GAME];
        controller = new GameController();
        controller.Lottery.init({
            server_seed: 'server_seed',
            seed_hash: 'seed',
            start: new Date(),
            end: moment().add(1, 'days').toDate(),
            interval: '10m',
            currency: 'bitcoin',
            ticket_price: 1000,
            lock: false
        }, function(err, data){
            lotteryId = data.nextGameId;
            done();
        });
    });
    describe(GAME, function() {
        beforeEach(function(done) { testClear(COIN, done); });
        describe('GET /' + GAME + '/next', function() {
            it('should get the next game', function(done) {
                request.get('/' + GAME + '/bet/next')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .query({game: 1})
                    .expect(200)
                    .expect(function(res) {
                        assert.ok(/[a-f0-9]/.test(res.body.sha256));
                        assert.ok(/[a-f0-9]/.test(res.body.nextGameId));
                    })
                    .end(done);
            });
        });


        describe('POST /' + GAME, function() {
            var nextGameId;
            beforeEach(function(done) {
                request.get('/' + GAME + '/bet/next')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .expect(200)
                    .expect(function(res) {
                        assert.ok(/[a-f0-9]/.test(res.body.sha256));
                        assert.ok(/[a-f0-9]/.test(res.body.nextGameId));
                    })
                    .end(function(err, res) {
                        if (err) return done(err);
                        nextGameId = res.body.nextGameId;
                        return done();
                    });
            });

            it('should play a game', function(done) {
                var newBalance;
                request.post('/' + GAME + '/bet/')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        lottery_id: lotteryId,
                        client_seed: getUsername(),
                        wager: 1000
                    })
                    .expect(200)
                    .expect(function(res) {
                        assert.equal(res.body.currency, COIN);
                        newBalance = INITIAL_BALANCE - res.body.wager + res.body.winnings;
                        assert.equal(newBalance, res.body.balance);
                    })
                    .end(function(err, res) {
                        if (err) return done(err);
                        Wallet.get(wallet.primary(), function(err, _wallet) {
                            if (err) return done(err);
                            if (newBalance !== _wallet.balance()) {
                                var errString = format("Balance mismatch after gameplay %d !== %d", newBalance, _wallet.balance());
                                return done(new Error(errString));
                            }
                            assert.equal(_wallet.balance(), res.body.balance);
                            return done();
                        });
                    });
            });

            it('should reject an invalid gameId', function(done) {
                request.post('/' + GAME + '/bet')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: '542cd48c5cb3ec0600000000',
                        lottery_id: lotteryId,
                        client_seed: getUsername(),
                        wager: 1000
                    })
                    .expect(404)
                    .expect(function(res) {
                        assert.equal(res.body.message, "game not found");
                    })
                    .end(done);
            });

            it('should reject a missing gameId', function(done) {
                request.post('/' + GAME + '/bet')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        lottery_id: lotteryId,
                        client_seed: getUsername(),
                        wager: 1000
                    })
                    .expect(400)
                    .expect(function(res) {
                        assert.equal(res.body.message, "missing game id from play request");
                    })
                    .end(done);
            });

            it('should reject a missing lottery_id', function(done) {
                request.post('/' + GAME + '/bet')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        client_seed: getUsername(),
                        wager: 1000
                    })
                    .expect(400)
                    .expect(function(res) {
                        assert.equal(res.body.message, "lottery id is required");
                    })
                    .end(done);
            });

            it('should reject a game that is played too fast', function(done) {
                request.post('/' + GAME + '/bet')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        lottery_id: lotteryId,
                        client_seed: getUsername(),
                        wager: 1000
                    })
                    .expect(200)
                    .end(function(err) {
                        if (err) return done(err);
                        request.post('/' + GAME + '/bet')
                            .set('X-Currency', COIN)
                            .set('Authorization', 'Bearer ' + user.token())
                            .send({
                                gameId: nextGameId,
                                lottery_id: lotteryId,
                                client_seed: getUsername(),
                                wager: 1000
                            })
                            .expect(429, /You must wait [0-9.]+s to play again/)
                            .end(done);
                    });
            });

            it('should reject a missing wager', function(done) {
                request.post('/' + GAME + '/bet')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        lottery_id: lotteryId,
                        client_seed: getUsername()
                    })
                    .expect(400)
                    .expect(function(res) {
                        assert.equal(res.body.message, "invalid wager in play request");
                    })
                    .end(done);
            });

            it('should reject a NaN wager', function(done) {
                request.post('/' + GAME + '/bet')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        lottery_id: lotteryId,
                        client_seed: getUsername(),
                        wager: 'foo'
                    })
                    .expect(400)
                    .expect(function(res) {
                        assert.equal(res.body.message, "invalid wager in play request");
                    })
                    .end(done);
            });

            it('should reject a missing client seed', function(done) {
                request.post('/' + GAME + '/bet')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        lottery_id: lotteryId,
                        wager: 1000
                    })
                    .expect(400)
                    .expect(function(res) {
                        assert.equal(res.body.message, "missing client seed from play request");
                    })
                    .end(done);
            });

            it('should reject wager less than 1000', function (done) {
                request.post('/' + GAME + '/bet')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        lottery_id: lotteryId,
                        client_seed: getUsername(),
                        wager: 100
                    })
                    .expect(400)
                    .expect(function(res) {
                        assert.equal(res.body.message, "Invalid wager");
                    })
                    .end(done);
            });

        });

        describe('GET /' + GAME + '/bet/leaderboard', function() {
            it ('should get a leaderboard', function(done) {
                async.times(5, function(i, next) {
                    var nextGameId;
                    request.get('/' + GAME + '/bet/next')
                        .set('X-Currency', COIN)
                        .set('Authorization', 'Bearer ' + user.token())
                        .query({game: 1})
                        .expect(200)
                        .expect(function(res) {
                            assert.ok(/[a-f0-9]/.test(res.body.sha256));
                            assert.ok(/[a-f0-9]/.test(res.body.nextGameId));
                        })
                        .end(function(err, res) {
                            if (err) return done(err);
                            nextGameId = res.body.nextGameId;
                            request.post('/' + GAME + '/bet')
                                .set('X-Currency', COIN)
                                .set('Authorization', 'Bearer ' + user.token())
                                .send({
                                    gameId: nextGameId,
                                    lottery_id: lotteryId,
                                    client_seed: getUsername(),
                                    wager: 1000
                                })
                                .expect(200)
                                .expect(function(res) {
                                    assert.ok(res.body.winnings !== undefined);
                                })
                                .end(function(err) {
                                    return next(err);
                                });
                        });
                }, function(err) {
                    if (err) return done(err);
                    request.get('/' + GAME + '/bet/leaderboard')
                        .set('X-Currency', COIN)
                        .set('Authorization', 'Bearer ' + user.token())
                        .expect(200)
                        .expect(function(res) {
                            assert.ok(Array.isArray(res.body));
                            assert.equal(res.body[0]._id, user.username());
                            assert.equal(res.body[0].wagered, 5000);
                        })
                        .end(done);

                });
            });

        });

        describe('GET /' + GAME + '/:id', function() {
            var nextGameId;
            it('should get an lottery by id', function(done) {
                request.get('/' + GAME + '/lottery/' + lotteryId)
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .expect(200)
                    .expect(function(res) {
                        assert.ok(res.body.server_seed === 'hidden');
                    })
                    .end(done);
            });

            it('should get an active lottery by interval', function(done) {
                request.get('/' + GAME + '/lottery/active/')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .expect(200)
                    .expect(function(res) {
                        assert.ok(res.body.length > 0);
                    })
                    .end(done);
            });

            it('should not allow to wager on outdated lottery', function (done) {
                controller.Lottery.init({
                    server_seed: 'server_seed',
                    seed_hash: 'seed',
                    start: moment().subtract(1, 'days').toDate(),
                    end: moment().subtract(1, 'days').toDate(),
                    interval: '10m',
                    currency: 'bitcoin',
                    ticket_price: 1000,
                    lock: false
                }, function(err, data){
                    lotteryId = data.nextGameId;
                    request.post('/' + GAME + '/bet/')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        lottery_id: lotteryId,
                        client_seed: getUsername(),
                        wager: 1000
                    })
                    .expect(423)
                    .expect(function(res){
                        assert.equal(res.body.message, "This lottery is already over");
                    })
                    .end(done);
                });
            });
        });
    });
};
