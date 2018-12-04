'use strict';

var container = require('dependable').container();

// register an app name, used for various things
container.register('appName', 'autobet');
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
container.register('namespace', 'autobet');
container.register('io', require('socket-npm'));

container.register('WorkflowExecutor', require('./workflow'));
container.register('Autobet', require('../models/autobet'));
container.register('AutobetController', require('../controllers/autobet'));
container.register('DefaultAutobets', require('./default-autobets'));
var config;
try {
    config = require('../config/local');
}catch(ex){
    try {
        config = require('../config/dev');
    }catch(ex){
        try{
            config = require('../config/prod');
        }catch(ex){
        }
    }
}
container.register('Config', config);

module.exports = container;
