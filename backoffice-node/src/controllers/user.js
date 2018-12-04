'use strict';
var ObjectId = require('mongoskin').ObjectID;

var UserController = function(mongo) {
    var controller = this;
    var db = mongo.getDb('playerdb');
    db.bind('users');
    db.bind('transactions');

    controller.getOmittedUserIds = function(callback){
        db.users.find({
            omitted: true
        }).toArray(function(err, omittedUsers) {
            var omittedUserIds = [];
            if(!omittedUsers){
                return callback(undefined,[]);
            }
            omittedUsers.forEach(function(user) {
                omittedUserIds.push(new ObjectId(user._id));
            });
            callback(undefined, omittedUserIds);
        });
    };

    controller.getOmittedUserGameIds = function(gameType, callback) {
        db.users.find({
            omitted: true
        }).toArray(function(err, omittedUsers) {
            var omittedUserIds = [];
            omittedUsers.forEach(function(user) {
                omittedUserIds.push(user._id);
            });
            db.transactions.aggregate([{
                $match: {
                    userId: {
                        $in: omittedUserIds
                    },
                    type: {
                        $regex: gameType
                    }
                }
            }, {
                $project: {
                    'type': 1,
                    'refId': 1
                }
            }], function(err, transactions) {
                var gameIds = [];
                transactions.forEach(function(transaction) {
                    if (!transaction.refId || transaction.refId.split(':').length !== 2) {
                        return;
                    }
                    gameIds.push(new ObjectId(transaction.refId.split(':')[1]));
                });
                callback(undefined, gameIds);
            });
        });
    };

    return controller;
};

module.exports = UserController;