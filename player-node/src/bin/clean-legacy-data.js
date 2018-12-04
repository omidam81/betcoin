'use strict';

var Container = require('../lib/dependable-container');
var container = new Container().initContainer();
var async = require('async');

var mongo = container.get('mongo');
mongo.getDb(function(err, db) {
    if (err) throw err;

    var TransactionController = require('../controllers/transaction')(db.collection('transactions'));
    var Users = db.collection('users');
    var UserController = require('../controllers/user')(Users, db.collection('affiliate_tags'), TransactionController);
    UserController.setContainer(container);
    container.register('UserController', UserController);

    container.resolve(function(UserController) {
        Users.find({affiliateData: {$exists: false}}).toArray(function(err, users) {
            if (err) throw err;
            async.eachSeries(users, function(user, done) {
                UserController.makeAffiliate(user, function(err) {
                    if (err) console.error(err.message);
                    done();
                });
            }, function(err) {
                if (err) throw err;
                process.exit();
            });
        });
    });
});
