'use strict';

var container = require('../container');
var moment = require('moment');
var async = require('async');

var logger = container.get('logger');
var User = container.get('User');
var HubspotApi = container.get('HubspotApi');

var hubspotApi = new HubspotApi();

var refDate = moment().subtract(90, 'days').toDate();
logger.debug(refDate, {});
User.all({
    updatedAt: {$gte: refDate}
}, function(err, users) {
    if (err) throw err;
    logger.debug("found %d users", users.length);
    async.eachLimit(users, 5, function(user, done) {
        if (!user.email()) return done();
        user.wallet('bitcoin', function(err, wallet) {
            if (err) return logger.error("Error getting wallet for hubspot check");
            if (wallet.lastDepositAt()) {
                logger.debug("adding full customer");
                hubspotApi.addContact(user.primary(), function(err) {
                    if (err) return logger.error("Error adding user to hubspot");
                    return done();
                });
            } else {
                logger.debug("adding email confirmed");
                hubspotApi.addContact(user.primary(), 12/*verified email list*/, function(err) {
                    if (err) return logger.error("Error adding user to hubspot", err.message);
                    return done();
                });
            }
        });
    }, function(err) {
        if (err) throw err;
        process.exit();
    });
});
