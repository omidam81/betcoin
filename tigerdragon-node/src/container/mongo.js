'use strict';

var url = require('url');
var extend = require('util')._extend;
var modellaMongo = require('modella-mongo');
var mongoskin = require('mongoskin');

// DO NOT CHANGE THE MONGO_PORT KEY NAME! This naming is used by
// docker and is needed to conneect the containers. Don't change the
// other ones either unless you have a good reason, but you can, since
// they are not auto set by docker in any way
var MONGO_ENV_CONF = {
    url: "MONGO_PORT",
    user: "MONGO_USER",
    password: "MONGO_PASSWORD",
    replSet: "MONGO_REPLICA_SET"
};


// get the mongo config from the environment
if (process.env[MONGO_ENV_CONF.url] === undefined) {
    throw new Error(MONGO_ENV_CONF.url + " not found in environment variables");
}
var parsedUrl = url.parse(process.env[MONGO_ENV_CONF.url]);
if (!parsedUrl.hostname || !parsedUrl.port) {
    throw new Error(MONGO_ENV_CONF.url + " is an invalid url");
}
var mongoconf = {
    host: parsedUrl.hostname,
    port: parsedUrl.port,
    user: process.env[MONGO_ENV_CONF.user],
    password: process.env[MONGO_ENV_CONF.password],
    replSet: process.env[MONGO_ENV_CONF.replSet],
};

if (!mongoconf.user) {
    throw new Error(MONGO_ENV_CONF.user + " not found in environment variables");
}

if (!mongoconf.password) {
    throw new Error(MONGO_ENV_CONF.password + " not found in environment variables");
}

// set up common connection string
var connectString = mongoconf.user + ':' + mongoconf.password + '@' + mongoconf.host + '/';
// and base params for mongoskin
var mongoskinParams = {
    auto_reconnect: true,
    safe: true
};

// add the replica set config if defined
if (mongoconf.replSet) {
    mongoskinParams.replicaSet = mongoconf.replSet;
}

module.exports = function() {
    var connections = {};
    var modellas = {};
    return {
        // get a database
        getDb: function(options) {
            var connString = 'mongodb://' + this.getConnectionString(options);
            console.log(connString);
            var db = connections[connString];
            if(db === undefined){
                var connParams = this.getConnectionOptions(options);
                db = mongoskin.db(connString, connParams);
                connections[connString] = db;
            }
            return db;
        },
        // get the modella mongo based storage
        getModella: function(options) {
            var connString = this.getConnectionString(options);
            var modelStore = modellas[connString];
            if (modelStore === undefined) {
                var connParams = this.getConnectionOptions(options);
                modelStore = modellaMongo(connString, connParams);
                modellas[connString] = modelStore;
            }
            return modelStore;
        },
        // build a connection string using options.dbname
        getConnectionString: function(options) {
            if (!options.dbname) throw new Error("missing 'dbname' key from mongo connection options");
            return connectString + options.dbname;
        },
        // get connection options using options.authdb, if it is
        // missing options.dbname is used
        getConnectionOptions: function(options) {
            var connParams = extend({}, mongoskinParams);
            if (options.authdb) {
                connParams.authSource = options.authdb;
            } else {
                connParams.authSource = options.dbname;
            }
        }
    };
};
