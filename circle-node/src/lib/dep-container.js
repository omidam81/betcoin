'use strict';

var dependable = require('dependable');
var logger = require('./logger')('main');
var url = require('url');

var MONGO_ENV_CONF = {
    url: "MONGO_PORT_27017_TCP",
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
    authdb: MONGO_ENV_CONF.authdb
};

logger.debug(mongoconf);
var connectString = mongoconf.user + ':' + mongoconf.password + '@' + mongoconf.host + '/circledb';
var mongoskinParams = {
    auto_reconnect: true,
    safe: true,
    authSource: 'circledb',
};
var modellaMongo = require('modella-mongo')(connectString, mongoskinParams);

var mongoskin = require('mongoskin');
var circledb = mongoskin.db('mongodb://' + connectString, mongoskinParams);
circledb.bind('config');

var ContainerService = function() {
    var container = dependable.container();
    // logger
    container.register('logger', logger);
    // register game configuration
    container.register('games', require('../config/games'));
    // register the player interface
    container.register('PlayerInterface', require('player-interface-node'));
    // register the config collection
    container.register('circledb', circledb);
    // register namespace and socket
    container.register('namespace', 'circle');
    container.register('io', require('socket-npm'));
    // register a max bet retriever
    container.register('betLimits', function(circledb) {
        return function(cb) {
            circledb.config.findOne({_id:"betlimits"}, function(err, betlimits) {
                if (err) return cb(err);
                if (!betlimits) {
                    betlimits = {_id: "betlimits", max: (50).toSatoshi(), min: 100};
                    logger.warn('no betlimits found in config, setting value', betlimits);
                    circledb.config.insert(betlimits, function(err) {
                        if (err) logger.error(err.message);
                    });
                }
                return cb(undefined, betlimits);
            });
        };
    });
    // register the mongo wrapper for the models
    // this has to be wrapped so the injector does not try to inject 'Model'
    // this is what modella exposes to it's plugins
    container.register('modelStore', function() { return modellaMongo; });
    // now get the models
    // the models have DI compatable function signatures
    container.register('Circle', require('../models/circle'));
    // and the controllers
    // the controllers also have DI compatable function signatures
    container.register('CircleController', require('../controllers/circle'));
    // return the container
    return container;
};

module.exports = ContainerService;
