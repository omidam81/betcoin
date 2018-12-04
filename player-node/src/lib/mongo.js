'use strict';


var mongowrap = require('mongowrap');
var mongo = mongowrap.getConnection();

var Mongo = {};
Mongo.getDb = function (callback) {
    mongo.getDb('playerdb', callback);
};

Mongo.getSupportDb = function(cb) {
    mongo.getDb('supportdb', cb);
};

Mongo.getLogDb = function(cb) {
    mongo.getDb('logs', cb);
};

Mongo.getConnection = function(config) {
    return mongowrap.getConnection(config);
};

Mongo.ensureObjectId = function(string) {
  return mongowrap.ensureObjectId(string);
};

module.exports = Mongo;
