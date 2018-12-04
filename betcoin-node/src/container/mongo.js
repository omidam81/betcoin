'use strict';

var url = require('url');
var extend = require('util')._extend;
var modellaMongo = require('modella-mongo');
var mongoskin = require('mongoskin');
var ObjectId = mongoskin.ObjectID;

// DO NOT CHANGE THE MONGOD_PORT KEY NAME! This naming is used by
// docker and is needed to conneect the containers. Don't change the
// other ones either unless you have a good reason, but you can, since
// they are not auto set by docker in any way
var MONGOD_ENV_CONF = {
    primaryUrl: "MONGOD_PRIMARY_PORT",
    secondaryUrl: "MONGOD_SECONDARY_PORT",
    defaultUrl: "MONGOD_PORT",
    user: "MONGO_USER",
    password: "MONGO_PASSWORD",
    replSet: "MONGO_REPLICA_SET"
};

var parseUrl = function(mongoUrl) {
    var parsedUrl = url.parse(mongoUrl);

    if (parsedUrl.hostname === null) throw "Malformed PLAYER_SERVER_PORT variable: " + mongoUrl;
    if (parsedUrl.port === null) throw "Malformed PLAYER_SERVER_PORT variable: " + mongoUrl;
    parsedUrl.port = parseInt(parsedUrl.port, 10);
    return parsedUrl;
};

var getEnvConf = function(envKey) {
    if (process.env[envKey]) {
        var playerUrl = process.env[envKey];
        return parseUrl(playerUrl);
    } else {
        throw "You must have the environment variable " + envKey + " set";
    }
};

// and base params for mongoskin
var MONGOSKIN_PARAMS = {
    auto_reconnect: true,
    safe: true
};

var MONGOD_CONF = {};

var CONNECT_STRING = "";

var CONNECTIONS = {};
var MODELLAS = {};

var Mongo = {
    // get a database
    getDb: function(options) {
        var connString = 'mongodb://' + this.getConnectionString(options);
        var db = CONNECTIONS[connString];
        if(db === undefined){
            db = mongoskin.db(connString);
            CONNECTIONS[connString] = db;
        }
        return db;
    },
    getSecondaryDb: function(options) {
        var connString = 'mongodb://' + this.getConnectionString(options);
        connString += '?replicaSet=' + MONGOSKIN_PARAMS.replicaSet;
        connString += '&readPreference=secondary';
        var db = CONNECTIONS[connString];
        if(db === undefined){
            db = mongoskin.db(connString);
            CONNECTIONS[connString] = db;
        }
        return db;
    },
    // get the modella mongo based storage
    getModella: function(options) {
        var connString = this.getConnectionString(options);
        var modelStore = MODELLAS[connString];
        if (modelStore === undefined) {
            modelStore = modellaMongo(connString);
            MODELLAS[connString] = modelStore;
        }
        return modelStore;
    },
    // build a connection string using options.dbname
    getConnectionString: function(options) {
        if (!options.dbname) throw new Error("missing 'dbname' key from mongo connection options");
        return CONNECT_STRING + options.dbname;
    },
    // get connection options using options.authdb, if it is
    // missing options.dbname is used
    getConnectionOptions: function(options) {
        var connParams = extend({}, MONGOSKIN_PARAMS);
        if (options.authdb) {
            connParams.authSource = options.authdb;
        } else {
            connParams.authSource = options.dbname;
        }
        return connParams;
    },
    ObjectId: ObjectId,
    ensureObjectId: function (thing) {
        if (thing === undefined) return null;
        if (thing instanceof ObjectId) return thing;
        try {
            thing = new ObjectId(thing);
            return thing;
        } catch (ex) {
            return null;
        }
    },
    ready: false
};

var setConf = function(conf) {
    MONGOD_CONF = {
        host: 'mongod',
        port: conf.port
    };
    MONGOD_CONF.user = process.env[MONGOD_ENV_CONF.user];
    MONGOD_CONF.password = process.env[MONGOD_ENV_CONF.password];
    MONGOD_CONF.replSet = process.env[MONGOD_ENV_CONF.replSet];
    if (!MONGOD_CONF.user) {
        throw new Error(MONGOD_ENV_CONF.user + " not found in environment variables");
    }

    if (!MONGOD_CONF.password) {
        throw new Error(MONGOD_ENV_CONF.password + " not found in environment variables");
    }

    // set up common connection string
    Mongo.CONNECT_STRING = CONNECT_STRING = MONGOD_CONF.user + ':' + MONGOD_CONF.password + '@' + MONGOD_CONF.host + ':' + MONGOD_CONF.port + '/';
    // add the replica set config if defined
    if (MONGOD_CONF.replSet) {
        MONGOSKIN_PARAMS.replicaSet = MONGOD_CONF.replSet;
    }
    Mongo.ready = true;
};

var parsedUrl;
try {
    parsedUrl = getEnvConf(MONGOD_ENV_CONF.primaryUrl);
} catch (ex) {
    try {
        parsedUrl = getEnvConf(MONGOD_ENV_CONF.defaultUrl);
    } catch (ex) {
        parsedUrl = {
            host: 'mongo',
            port: 27017
        };
    }
}

setConf({
    host: parsedUrl.hostname,
    port: parsedUrl.port,
});

module.exports = function() {
    return Mongo;
};

module.exports.readSecondary = function() {
    Mongo.ready = false;
    MONGOSKIN_PARAMS.readPreference = "secondary";
};
