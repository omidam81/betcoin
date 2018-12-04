'use strict';

var mongo = require('mongodb');
require('./loggers');
var logger = require('winston').loggers.get('main');

// a mongo connection cache
// pass in host & port
// it returns a function accepting dbName, collectionName & callback

var mongoConfig;
try {
    mongoConfig = require('../config/mongo.local');
} catch (e) {
    console.log("loading dist config for mongo");
    mongoConfig = require('../config/mongo.dist');
}
var cachedConnections = {};

var getConn = function(dbname, collection, cb) {

    var cacheName = dbname + "/" + collection;
    if (cachedConnections[cacheName]) {
        try {
            return cb(undefined, cachedConnections[cacheName]);
        } catch(e) {
            logger.log('warn', 'problem with cached connection for %s, getting a fresh one', cacheName, e);
            delete(cachedConnections[cacheName]);
            return getConn(dbname, collection, cb);
        }
    }

    var connectString = 'mongodb://';
    connectString += mongoConfig.host + ':' + mongoConfig.port + '/';
    connectString += dbname;
    connectString += '?w=1';
    mongo.MongoClient.connect(connectString, function(err, db) {
        if (err) return cb(err);
        try {
            var adminDb = db.admin();
            adminDb.authenticate(mongoConfig.user, mongoConfig.password, function(err) {
                if (err) {
                    cb(err);
                } else {
                    var coll = db.collection(collection);
                    cachedConnections[cacheName] = coll;
                    cb(undefined, coll);
                }
            });
        } catch (e) {
            logger.log('error', 'error communicating to %s/%s', dbname, collection);
            cb(e);
        }
    });
};

module.exports = getConn;
