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
var format = require('util').format;
var async = require('async');
var User = container.get('User');
var Wallet = container.get('Wallet');
var auth = container.get('auth');

var user;
var wallet;
// defining these here makes it easier to just copy this file for another game
var GAME = 'roulette';
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
    before(function() {
        var GameController = container.get('gameControllers')[GAME];
        controller = new GameController();
    });
    describe(GAME, function() {
        beforeEach(function(done) { testClear(COIN, done); });
        describe('GET /' + GAME + '/next', function() {
            it('should get the next game', function(done) {
                request.get('/' + GAME + '/next')
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
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
                request.get('/' + GAME + '/next')
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
                request.post('/' + GAME)
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        client_seed: getUsername(),
                        bets: "{\"[23]\":500,\"[14,17]\":500}"
                    })
                    .expect(200)
                    .expect(function(res) {
                        assert.ok(res.body.winnings !== undefined);
                        assert.ok(res.body.payout_multiplier !== undefined);
                    })
                    .end(function(err, res) {
                        if (err) return done(err);
                        Wallet.get(wallet.primary(), function(err, _wallet) {
                            if (err) return done(err);
                            var newBalance = INITIAL_BALANCE - 1000 + res.body.winnings;
                            if (newBalance !== _wallet.balance()) {
                                var errString = format("Balance mismatch after gameplay %d !== %d",
                                                       newBalance,
                                                       _wallet.balance());
                                return done(new Error(errString));
                            }
                            return done();
                        });
                    });
            });

            it('should reject an invalid gameId', function(done) {
                request.post('/' + GAME)
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: '542cd48c5cb3ec0600000000',
                        client_seed: getUsername(),
                        bets: "{\"[23]\":500,\"[14,17]\":500}"
                    })
                    .expect(404)
                    .expect(function(res) {
                        assert.equal(res.body.message, "game not found");
                    })
                    .end(done);
            });

            it('should reject a missing gameId', function(done) {
                request.post('/' + GAME)
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        client_seed: getUsername(),
                        bets: "{\"[23]\":500,\"[14,17]\":500}"
                    })
                    .expect(400)
                    .expect(function(res) {
                        assert.equal(res.body.message, "missing game id from play request");
                    })
                    .end(done);
            });

            it('should reject a game that has been played already', function(done) {
                request.post('/' + GAME)
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        client_seed: getUsername(),
                        bets: "{\"[23]\":500,\"[14,17]\":500}"
                    })
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        assert.ok(res.body.winnings !== undefined);
                        assert.ok(res.body.payout_multiplier !== undefined);
                        setTimeout(function() {
                            request.post('/' + GAME)
                                .set('X-Currency', COIN)
                                .set('Authorization', 'Bearer ' + user.token())
                                .send({
                                    gameId: nextGameId,
                                    client_seed: getUsername(),
                                    bets: "{\"[23]\":500,\"[14,17]\":500}"
                                })
                                .expect(422)
                                .expect(function (res) {
                                    assert.equal(res.body.message, "This game has already been played");
                                })
                                .end(done);
                        }, controller.LAST_GAME_MIN_TIME + 1);
                    });
            });

            it('should reject a game that is played too fast', function(done) {
                request.post('/' + GAME)
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        client_seed: getUsername(),
                        bets: "{\"[23]\":500,\"[14,17]\":500}"
                    })
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        assert.ok(res.body.winnings !== undefined);
                        assert.ok(res.body.payout_multiplier !== undefined);
                        request.post('/' + GAME)
                            .set('X-Currency', COIN)
                            .set('Authorization', 'Bearer ' + user.token())
                            .send({
                                gameId: nextGameId,
                                client_seed: getUsername(),
                                bets: "{\"[23]\":500,\"[14,17]\":500}"
                            })
                            .expect(429, /You must wait [0-9.]+s to play again/)
                            .end(done);
                    });
            });

            it('should reject a missing wager', function(done) {
                request.post('/' + GAME)
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        client_seed: getUsername()
                    })
                    .expect(400)
                    .expect(function(res) {
                        assert.equal(res.body.message, "Invalid bets");
                    })
                    .end(done);
            });

            it('should reject a NaN wager', function(done) {
                request.post('/' + GAME)
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        client_seed: getUsername(),
                        bets: "{\"[23]\":500,\"[14,17]\":\"a\"}"
                    })
                    .expect(400)
                    .expect(function(res) {
                        assert.equal(res.body.message, "invalid wager in play request");
                    })
                    .end(done);
            });

            it('should reject a missing client seed', function(done) {
                request.post('/' + GAME)
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        bets: "{\"[23]\":500,\"[14,17]\":500}"
                    })
                    .expect(400)
                    .expect(function(res) {
                        assert.equal(res.body.message, "missing client seed from play request");
                    })
                    .end(done);
            });

        });

        describe('GET /' + GAME + '/:id', function() {
            var nextGameId;
            beforeEach(function(done) {
                request.get('/' + GAME + '/next')
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

            it('should get an unplayed game', function(done) {
                request.get('/' + GAME + '/' + nextGameId)
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .expect(200)
                    .expect(function(res) {
                        assert.ok(res.body.server_seed === undefined);
                        assert.ok(/[a-f0-9]/.test(res.body.sha256));
                        assert.ok(/[a-f0-9]/.test(res.body.nextGameId));
                    })
                    .end(done);
            });

            it('should get a played game', function(done) {
                request.post('/' + GAME)
                    .set('X-Currency', COIN)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        gameId: nextGameId,
                        client_seed: getUsername(),
                        bets: "{\"[23]\":500,\"[14,17]\":500}"
                    })
                    .expect(200)
                    .expect(function(res) {
                        assert.ok(res.body.winnings !== undefined);
                        assert.ok(res.body.payout_multiplier !== undefined);
                    })
                    .end(function(err) {
                        if (err) return done(err);
                        request.get('/' + GAME + '/' + nextGameId)
                            .set('X-Currency', COIN)
                            .set('Authorization', 'Bearer ' + user.token())
                            .expect(200)
                            .expect(function(res) {
                                assert.ok(res.body.server_seed !== undefined);
                            })
                            .end(done);
                    });
            });
        });

        describe('GET /' + GAME + '/leaderboard', function() {
            it ('should get a leaderboard', function(done) {
                async.times(5, function(i, next) {
                    var nextGameId;
                    request.get('/' + GAME + '/next')
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
                            request.post('/' + GAME)
                                .set('X-Currency', COIN)
                                .set('Authorization', 'Bearer ' + user.token())
                                .send({
                                    gameId: nextGameId,
                                    client_seed: getUsername(),
                                    bets: "{\"[23]\":500,\"[14,17]\":500}"
                                })
                                .expect(200)
                                .expect(function(res) {
                                    assert.ok(res.body.winnings !== undefined);
                                    assert.ok(res.body.payout_multiplier !== undefined);
                                })
                                .end(function(err) {
                                    return next(err);
                                });
                        });
                }, function(err) {
                    if (err) return done(err);
                    request.get('/' + GAME + '/leaderboard')
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
    });
};
