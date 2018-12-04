'use strict';

var container = require('dependable').container();

// register an app name, used for various things
container.register('appName', 'lottery');
// such as the database name
container.register('appDbName', function(appName) {
    return appName + 'db';
});
// register mongo connector, includes method for retrieving
// modella model storage
container.register('mongo', require('mongo-npm'));
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
container.register('betLimits', function() {
    return function(cb) {
        return cb(undefined, {max: Infinity, min: 100});
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
// register the scheduler for the game payouts
container.register('Scheduler', require('./scheduler'));
// register socket.io now, the server it will attach to will be
// resitered later
container.register('namespace', 'lottery');
container.register('io', require('socket-npm'));
// register the game configs
container.register('games', require('./games'));
// now get the models
// the models have DI compatable function signatures
container.register('Bet', require('../models/bet'));
container.register('Lottery', require('../models/lottery'));
// and the controllers
// the controllers also have DI compatable function signatures
container.register('LotteryController', require('../controllers/lottery'));
container.register('BetController', require('../controllers/bet'));

module.exports = container;
