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
var Notification = container.get('Notification');
var NotificationController = container.get('NotificationController');
var auth = container.get('auth');

var notificationController = new NotificationController();
var user;
var notificationTestClear = function(done) {
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
        Notification.removeAll({}, function(err) {
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

    describe('NotificationController', function() {
        before(function(done) {
            async.parallel([
                function(fin) {
                    User.removeAll({}, fin);
                },
                function(fin) {
                    Notification.removeAll({}, fin);
                }
            ], function(err) {
                return done(err);
            });
        });
        describe('Internal Methods', function() {
            describe('#create', function() {
                beforeEach(notificationTestClear);
                it('should create a notification for a user', function(done) {
                    notificationController.create(user.primary(), {
                        message: "message here"
                    }, function(err, note) {
                        assert.ifError(err);
                        assert.ok(note);
                        assert.equal(note.userId().toString(), user.primary().toString());
                        assert.equal(note.message(), "message here");
                        done();
                    });
                });
            });
        });
        describe('GET /notification/:noteId?', function() {
            beforeEach(notificationTestClear);
            var note;
            beforeEach(function(done) {
                notificationController.create(user.primary(), {
                    message: "message here"
                }, function(err, _note) {
                    assert.ifError(err);
                    assert.ok(_note);
                    assert.equal(_note.userId().toString(), user.primary().toString());
                    assert.equal(_note.message(), "message here");
                    assert.ifError(_note.beenRead);
                    note = _note;
                    done();
                });
            });
            it('should get a user\'s notifications', function(done) {
                generateRequest('get', '/notification')
                    .set('Authorization', 'Bearer ' + user.token())
                    .expect(200)
                    .expect(function(res) {
                        var thisNote = res.body[0];
                        assert.equal(thisNote._id, note.primary().toString());
                        assert.equal(thisNote.userId, user.primary().toString());
                    }).end(done);
            });
            it('should get a specific notification', function(done) {
                generateRequest('get', '/notification/' + note.primary())
                    .set('Authorization', 'Bearer ' + user.token())
                    .expect(200)
                    .expect(function(res) {
                        var thisNote = res.body;
                        assert.equal(thisNote._id, note.primary().toString());
                        assert.equal(thisNote.userId, user.primary().toString());
                    }).end(done);
            });
        });
        describe('PUT /notification/:noteId', function() {
            beforeEach(notificationTestClear);
            var note;
            beforeEach(function(done) {
                notificationController.create(user.primary(), {
                    message: "message here"
                }, function(err, _note) {
                    assert.ifError(err);
                    assert.ok(_note);
                    assert.equal(_note.userId().toString(), user.primary().toString());
                    assert.equal(_note.message(), "message here");
                    assert.ifError(_note.beenRead);
                    note = _note;
                    done();
                });
            });
            it('should mark a notification as read', function(done) {
                generateRequest('put', '/notification/' + note.primary())
                    .set('Authorization', 'Bearer ' + user.token())
                    .expect(202)
                    .expect(function(res) {
                        var thisNote = new Notification(res.body);
                        assert(thisNote.beenRead);
                    }).end(done);
            });
            it('should not allow you to update another user\'s notification', function(done) {
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
                    generateRequest('put', '/notification/' + note.primary())
                        .set('Authorization', 'Bearer ' + newUser.token())
                        .expect(418, /You cannot edit someone else's notification/, done);
                });
            });
        });
    });
};
