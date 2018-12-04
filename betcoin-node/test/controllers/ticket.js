'use strict';

/* global describe */
/* global it */
/* global before */
/* global beforeEach */
/* global getUsername */
/* global container */
/* global request */

var assert = require('assert');
var async = require('async');
var User = container.get('User');
var Ticket = container.get('Ticket');
var auth = container.get('auth');

var user;
var ticketTestClear = function(done) {
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
        Ticket.removeAll({}, function(err) {
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

    var ticket;
    var makeTicket = function(done) {
        var message = "You guys suck";
        var subject = "Screw off";
        generateRequest('post', '/ticket')
            .set('Authorization', 'Bearer ' + user.token())
            .send({
                message: message,
                subject: subject
            })
            .expect(201)
            .expect(function(res) {
                var thisTicket = res.body;
                assert.equal(thisTicket.subject, subject);
                assert.equal(thisTicket.thread.length, 1);
                assert.equal(thisTicket.userId, user.primary().toString());
                assert.equal(thisTicket.thread[0].userId, user.primary().toString());
                assert.equal(thisTicket.thread[0].message, message);
                ticket = thisTicket;
            }).end(done);
    };

    describe('TicketController', function() {
        before(function(done) {
            async.parallel([
                function(fin) {
                    User.removeAll({}, fin);
                },
                function(fin) {
                    Ticket.removeAll({}, fin);
                }
            ], function(err) {
                return done(err);
            });
        });
        describe('POST /ticket', function() {
            beforeEach(ticketTestClear);
            it('should create a new ticket', function(done) {
                makeTicket(done);
            });
        });
        describe('GET /ticket/:ticketId?', function() {
            beforeEach(ticketTestClear);
            beforeEach(makeTicket);
            it('should get a user\'s tickets', function(done) {
                generateRequest('get', '/ticket')
                    .set('Authorization', 'Bearer ' + user.token())
                    .expect(200)
                    .expect(function(res) {
                        var thisTicket = res.body[0];
                        assert.equal(thisTicket._id, ticket._id);
                        assert.equal(thisTicket.userId, user.primary().toString());
                    }).end(done);
            });
            it('should get a specific ticket', function(done) {
                generateRequest('get', '/ticket/' + ticket._id)
                    .set('Authorization', 'Bearer ' + user.token())
                    .expect(200)
                    .expect(function(res) {
                        var thisTicket = res.body;
                        assert.equal(thisTicket._id, ticket._id);
                        assert.equal(thisTicket.userId, user.primary().toString());
                    }).end(done);
            });
        });
        describe('PUT /ticket/:ticketId', function() {
            beforeEach(ticketTestClear);
            beforeEach(makeTicket);
            it('should post a comment as the user', function(done) {
                var message = "I mean you guys fucking blow";
                generateRequest('put', '/ticket/' + ticket._id)
                    .set('Authorization', 'Bearer ' + user.token())
                    .send({
                        message: message
                    })
                    .expect(202)
                    .expect(function(res) {
                        var thisTicket = res.body;
                        assert.equal(thisTicket.thread.length, 2);
                        assert.equal(thisTicket.userId, user.primary().toString());
                        assert.equal(thisTicket.thread[1].userId, user.primary().toString());
                        assert.equal(thisTicket.thread[1].message, message);
                        assert.equal(thisTicket.thread[1].createdAt, thisTicket.updatedAt);
                    }).end(done);
            });
            it('should not allow you to update another user\'s ticket', function(done) {
                var newUser = new User({
                    username: getUsername(),
                    email: 'test@betcoin.tm',
                    password: 'password10',
                    ip: '0.0.0.0',
                    token: auth.generateToken(),
                    challenge: 'foo'
                });
                newUser.save(function(err) {
                    assert.ifError(err);
                    generateRequest('put', '/ticket/' + ticket._id)
                        .set('Authorization', 'Bearer ' + newUser.token())
                        .expect(418, /You cannot access another user's ticket/, done);
                });
            });
        });
    });
};
