'use strict';


var mongoskin = require('mongoskin');
var extend = require('util')._extend;
var url = require('url');

var MONGO_ENV_CONF = {
    primaryUrl: "MONGO_PRIMARY_PORT",
    secondaryUrl: "MONGO_SECONDARY_PORT",
    user: "MONGO_USER",
    password: "MONGO_PASSWORD",
    replSet: "MONGO_REPLICA_SET"
};

var parsedUrlPrimary = url.parse(process.env[MONGO_ENV_CONF.primaryUrl]);
if (!parsedUrlPrimary.hostname || !parsedUrlPrimary.port) {
    throw new Error(MONGO_ENV_CONF.primaryUrl + " is an invalid url");
}
var parsedUrlSecondary = url.parse(process.env[MONGO_ENV_CONF.secondaryUrl]);
if (!parsedUrlSecondary.hostname || !parsedUrlSecondary.port) {
    throw new Error(MONGO_ENV_CONF.secondaryUrl + " is an invalid url");
}
var mongoconf = {
    host: parsedUrlPrimary.hostname + ',' + parsedUrlSecondary.hostname,
    port: parsedUrlPrimary.port,
    user: process.env[MONGO_ENV_CONF.user],
    password: process.env[MONGO_ENV_CONF.password],
    replSet: process.env[MONGO_ENV_CONF.replSet]
};

var mongoskinString = 'mongodb://' + mongoconf.user + ':' + mongoconf.password + '@' + mongoconf.host + '/';
var mongoskinParams = {
    auto_reconnect: true,
    safe: true,
    readPreference: 'secondary',
    replicaSet: mongoconf.replSet
};

module.exports = function() {

    var Mongo = function(){

        this.getDbByConnectionString = function(string){
            if (this.dbs === undefined)
                this.dbs = {};
            return this.dbs[string];
        };

        this.addDbByConnectionString = function(string, db){
            if (this.dbs === undefined)
                this.dbs = {};
            this.dbs[string] = db;
        };
    };

    Mongo.prototype.getDb = function (dbname, options) {
        if (options === undefined) options = {};
        var self = this;
        var connString = mongoskinString + dbname;
        var db = this.getDbByConnectionString(connString);
        if(db !== undefined){
            return db;
        }
        var connParams = extend({}, mongoskinParams);
        if (options.authdb) {
            connParams.authSource = options.authdb;
        } else {
            connParams.authSource = dbname;
        }
        db = mongoskin.db(connString, connParams);
        self.addDbByConnectionString(connString, db);
        return db;
    };

    return new Mongo();

};
