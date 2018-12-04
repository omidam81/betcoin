'use strict';

var dependable = require('dependable');

var mongo = require('./mongo')();
var logDb = mongo.getDb('logs');
var logger = require('logger-npm')(logDb.collection('backoffice'));

var container = dependable.container();
container.register('mongo', mongo);

container.register('logger', logger);

container.register('PlayerInterface', require('player-interface-node'));

// container.register('mailer', require('./mailer'));

container.register('getExchangeRate', require('./exchange-rate'));

container.register('queryGenerator', require('./query-generator'));

container.register('DataDefinition', require('./data-definitions-service'));

container.register('UserController', require('../controllers/user'));

container.register('AdminController', require('../controllers/admin'));

var configs = {
    games:['circle','reel','dice','fortune','sicbo','roulette','coinflip','keno','war','hilo','baccarat','bj','paigow','caribbean','3card','videopoker','tiles']
};
container.register('configs', configs);

module.exports = container;
