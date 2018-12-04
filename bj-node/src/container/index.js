'use strict';

var container = require('dependable').container();

// register an app name, used for various things
container.register('appName', 'bj');
// such as the database name
container.register('appDbName', function(appName) {
    return appName + 'db';
});
// register mongo connector, includes method for retrieving
// modella model storage
container.register('mongo', require('./mongo'));
// logger
container.register('logger', function(appName, mongo) {
    // set up database logging
    var logdb = mongo.getDb({dbname: 'logs'});
    var appLogs = logdb.collection(appName);
    return require('logger-npm')(appLogs);
});
// register a betLimits function, in reality, this should be
// retrieved from mongo and it should automatically set itself,
// this is a contrived example
container.register('betLimits', function(mongo, logger, appDbName) {
    var db = mongo.getDb({dbname: appDbName});
    db.bind('config');
    return function(cb) {
        db.config.findOne({_id:"betlimits"}, function(err, betlimits) {
            if (err) return cb(err);
            if (!betlimits) {
                betlimits = {_id: "betlimits", max: (0.01).toSatoshi(), min: 100};
                logger.warn('no betlimits found in config, setting value', betlimits);
                db.config.insert(betlimits, function(err) {
                    if (err) logger.error(err.message);
                });
            }
            return cb(undefined, betlimits);
        });
    };
});
// register the player interface
container.register('PlayerInterface', require('player-interface-node'));
// register the mongo wrapper for the models
// this has to be wrapped so the injector does not try to inject 'Model'
// this is what modella exposes to it's plugins
container.register('modelStore', function(appDbName, mongo) {
    return mongo.getModella({
        dbname: appDbName
    });
});
// register socket.io now, the server it will attach to will be
// resitered later
container.register('namespace', 'bj');
container.register('io', require('socket-npm'));
// now get the models
// the models have DI compatable function signatures
container.register('Game', require('../models/game'));
// and the controllers
// the controllers also have DI compatable function signatures
container.register('GameController', require('../controllers/game'));

container.register('GameLogic', require('./gamelogic'));

module.exports = container;
