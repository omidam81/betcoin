'use strict';


var async = require('async');
var moment = require('moment');


module.exports = function(User, TransactionController, logger, Config) {

    // these are the waterfall functions
    // they run in this order

    // get all recently active users (60 minutes, the timer runs every
    // 30 so we should be ok)
    var getActiveUsers = function(cb) {
        var refDate = moment().subtract(40, 'minutes');
        logger.verbose('getting active users since %s', refDate.toISOString());
        User.all({
            updatedAt: {
                $gte: refDate.toDate()
            },
            $or: [
                {pendingVipLevel: {$exists: false}},
                {pendingVipLevel: {$gte: -1}}
            ]
        }, function(err, users) {
            if (err) return cb(err);
            logger.verbose('found %d users', users.length);
            return cb(undefined, users);
        });
    };

    // get the configuration for the bonus levels
    var getConfig = function(users, cb) {
        Config.get('vipLevels', function(err, vipLevels) {
            logger.verbose('got vip level config');
            return cb(err, users, vipLevels);
        });
    };

    // map the users with the amounts they have wagered lifetime
    var getWagered = function(users, vipLevels, cb) {
        var txController = new TransactionController();
        async.map(users, function(user, done) {
            logger.mapUser(user.primary(), user.username());
            txController.getTotalWagered(user.primary(), 'bitcoin', {'meta.bonus': {$ne: true}}, function(err, total){
                if (err) return done(err);
                user.totalWagered = total;
                return done(undefined, user);
            });
        }, function(err, _users) {
            logger.verbose('mapped total wagered to users');
            return cb(err, _users, vipLevels);
        });
    };

    var processUsers = function(users, vipLevels, cb) {
        async.each(users, function(user, done) {
            // check for blocked users
            if (user.pendingVipLevel() === -2) return done();
            // do not advance if there is an IP lock
            if (user.lock() && user.lock() === 'ip') return done();
            var nextLevel = (user.pendingVipLevel() || user.vipLevel() || 0) + 1;
            // check if the last upgrade was cancelled, and if so,
            // check the level above where they had their last upgrade
            if (user.pendingVipLevel() === -1) {
                nextLevel = (user.vipLevel() || 0) + 2;
                // make sure they still have a level to advance to,
                // since the last operation may have made the
                // 'nextLevel' point to an invite only VIP level
                while (vipLevels[nextLevel] &&
                       vipLevels[nextLevel].wagered &&
                       vipLevels[nextLevel].wagered === Infinity) {
                    nextLevel -= 1;
                }
            }
            if (!vipLevels[nextLevel]) return done();
            async.whilst(function() {
                return vipLevels[nextLevel] &&
                    user.totalWagered >= vipLevels[nextLevel].wagered;
            }, function(fin) {
                if (vipLevels[nextLevel].manual) {
                    user.pendingVipLevel(nextLevel);
                    logger.info('pending advancement of user %s to %s', user.primary(), vipLevels[nextLevel]._id);
                } else {
                    user.vipLevel(nextLevel);
                    logger.info('advancing user %s to %s', user.primary(), vipLevels[nextLevel]._id);
                }
                nextLevel += 1;
                return user.save(fin);
            }, function(err) {
                return done(err);
            });
        }, cb);
    };

    return {
        name: 'vip level processor',
        interval: '1 minute',
        task: function(job, done) {
            async.waterfall([
                getActiveUsers,
                getConfig,
                getWagered,
                processUsers
            ], done);
        }
    };
};
