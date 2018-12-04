'use strict';

require('bitcoin-math');
require('colors');
var fs = require('fs');

var container = require('dependable').container();

// register an app name, used for various things
container.register('appName', 'betcoin');
// register mongo connector, includes method for retrieving
// modella model storage
container.register('mongo', require('./mongo'));
container.register('userDbName', 'userdb');
container.register('gameDbName', 'gamedb');
container.register('userModelStore', function(mongo, userDbName) {
    var store = mongo.getModella({dbname: userDbName});
    store.ensureObjectId = mongo.ensureObjectId;
    return store;
});
container.register('gameModelStore', function(mongo, gameDbName) {
    var store = mongo.getModella({dbname: gameDbName});
    store.ensureObjectId = mongo.ensureObjectId;
    return store;
});
// logger
container.register('logger', function(appName, mongo, gameNames) {
    // set up database logging
    var logdb = mongo.getDb({dbname: 'logs'});
    var appLogs = logdb.collection(appName);
    return require('../lib/logger')(appLogs, {
        games: gameNames
    });
});

// register the express error handler, used to localize the error strings
container.register('expressErrorHandler', require('./express-error-handler'));

// register currency middleware
container.register('currencyMiddleware', require('../lib/currency'));
// register socket.io now, the server it will attach to will be
// resitered later
container.register('io', require('./websocket'));

// get the emailer
container.register('mailer', require('./mailer'));

// register the key/value config storage
container.register('Config', require('./config'));

container.register('CURRENCIES', [
    'bitcoin',
    'litecoin',
    'dogecoin',
    'ppcoin',
    'namecoin'
]);

container.register('CURRENCY_ABBREVIATIONS', {
    'bitcoin'  : 'BTC',
    'litecoin' : 'LTC',
    'dogecoin' : 'XDG',
    'ppcoin'   : 'PPC',
    'namecoin' : 'NMC'
});

container.register('FIAT_CURRENCIES', [
    'USD',
    'CNY'
]);

container.register('CURRENCY_REGEXP', function(CURRENCIES) {
    return new RegExp("(" + CURRENCIES.join("|") + ")");
});

// register the cryptod types
var cryptod = require('../lib/cryptod');
container.register('bitcoind', function(logger, HTTPError, CURRENCIES) {
    return cryptod('bitcoin', process.env.BITCOIN_TESTNET, logger, HTTPError, CURRENCIES);
});
container.register('litecoind', function(logger, HTTPError, CURRENCIES) {
    return cryptod('litecoin', process.env.LITECOIN_TESTNET, logger, HTTPError, CURRENCIES);
});
container.register('dogecoind', function(logger, HTTPError, CURRENCIES) {
    return cryptod('dogecoin', process.env.DOGECOIN_TESTNET, logger, HTTPError, CURRENCIES);
});
container.register('ppcoind', function(logger, HTTPError, CURRENCIES) {
    return cryptod('ppcoin', process.env.PPCOIN_TESTNET, logger, HTTPError, CURRENCIES);
});
container.register('namecoind', function(logger, HTTPError, CURRENCIES) {
    return cryptod('namecoin', process.env.NAMECOIN_TESTNET, logger, HTTPError, CURRENCIES);
});
// register a getter for the cryptod types
container.register('cryptod', function(bitcoind, litecoind, dogecoind, ppcoind, namecoind, HTTPError) {
    return function(type) {
        if (type === 'bitcoin') return bitcoind;
        if (type === 'litecoin') return litecoind;
        if (type === 'dogecoin') return dogecoind;
        if (type === 'ppcoin') return ppcoind;
        if (type === 'namecoin') return namecoind;
        throw new HTTPError(500, "Invalid cryptod type");
    };
});

container.register('getExchangeRate', require('./exchange-rate'));

// register the models
container.register('Notification', require('../models/notification'));
container.register('Transaction', require('../models/transaction'));
container.register('AdminTransaction', require('../models/admin-transaction'));
container.register('Ticket', require('../models/ticket'));
container.register('Bonus', require('../models/bonus'));
container.register('Wallet', require('../models/wallet'));
container.register('AffiliateRecord', require('../models/affiliate-record'));
container.register('User', require('../models/user'));
container.register('AdminUser', require('../models/admin'));
container.register('Autobet', require('../models/autobet'));
container.register('SavedSearch', require('../models/saved-search'));
container.register('CashoutRequest', require('../models/cashout-request'));

// register the auth functions (requires the User model)
container.register('auth', require('./auth'));
container.register('adminAuth', function(AdminUser, Wallet, logger, HTTPError) {
    return require('./auth')(AdminUser, Wallet, logger, HTTPError);
});

// register the controllers
container.register('NotificationController', require('../controllers/notification'));
container.register('TicketController', require('../controllers/ticket'));
container.register('CashbackController', require('../controllers/cashback'));
container.register('AffiliateController', require('../controllers/affiliate'));
container.register('BonusController', require('../controllers/bonus'));
container.register('CounterController', require('../controllers/counter'));
container.register('JackpotController', require('../controllers/jackpot'));
container.register('UserController', require('../controllers/user'));
container.register('TransactionController', require('../controllers/transaction'));
container.register('WalletController', require('../controllers/wallet'));
container.register('BackofficeController', require('../controllers/backoffice'));
container.register('SupportController', require('../controllers/support'));
container.register('AutobetController', require('../controllers/autobet'));
container.register('StatsController', require('../controllers/stats'));

container.register('CryptoListener', require('./crypto-listener'));


// loop through games and register them
var games = fs.readdirSync(__dirname + '/../games');
var gameDependencies = [];
var gameNames = [];

games.forEach(function(game) {
    var containerName = game[0].toUpperCase() + game.slice(1, game.length) + "Game";
    container.register(containerName, require('../games/' + game));
    gameDependencies.push(containerName);
    gameNames.push(game);
});

if (process.env.INCLUDE_DEV_GAMES) {
    // loop through games and register them
    var devgames = fs.readdirSync(__dirname + '/../devgames');
    devgames.forEach(function(game) {
        var containerName = game[0].toUpperCase() + game.slice(1, game.length) + "Game";
        container.register(containerName, require('../devgames/' + game));
        gameDependencies.push(containerName);
        gameNames.push(game);
    });
}

container.register('gameNames', gameNames);
container.register('gameControllers', {}); // a place to store game controller constructors, for testing purposes

var allGamesFunc;
// this is way hacky, but it's the idea I have at this moment, it is
// being ignored by jshint because using the Function constructor is
// considered a form of eval which is bad. In this case, we control
// this string entirely, but there should probably be a better way of
// doing this

// one solution would to basically write out every gam in the
// definition somewhere in another file, then we could move this mock
// function inside of there, but for now while we are adding a lot of
// games, this dynamic approach works best

/* jshint ignore:start */
// this function will be converted to a string for our nasty eval
var mockFunc = function(app, gameNames, gameControllers, auth, WalletController, logger) {
    var args = Array.prototype.slice.call(arguments, 6);
    args.forEach(function(gameExport, index) {
        var name = gameNames[index];
        // assign the game's controller to a hashed object so we can
        // get the controllers in testing
        gameControllers[name] = gameExport.controller;
        var readWallet = function(req, res, next) {
            var wc = new WalletController(req.currency);
            wc.readMiddleware(req, res, next);
        };
        if (gameExport.publicRouter) {
            logger.verbose("mounting public endpoints for %s", name);
            app.use('/' + name, gameExport.publicRouter);
            if (gameExport.mountPath) {
                app.use(gameExport.mountPath, gameExport.publicRouter);
            }
        }
        // make the app use() the game's routes, mounted to the game
        // name
        logger.verbose("mounting authed endpoints for %s", name);
        app.use('/' + name, auth.checkToken, readWallet);
        app.use('/' + name, gameExport.router);
        if (gameExport.mountPath) {
            app.use(gameExport.mountPath, auth.checkToken, readWallet)
            app.use(gameExport.mountPath, gameExport.router);
        }
    });
    return args;
};
// make it a string and take out the stuff we don't need, oof
var funcString = mockFunc.toString()
    .replace(/^function ?\(.*\) \{/, '') // delete the definition
    .replace(/\};?$/, '') // delete the trailing brace
    .trim(); // trim whitespace off the ends
// now make a super function that calls all of the games as dependencies
allGamesFunc = new Function('app, gameNames, gameControllers, auth, WalletController, logger, ' +
                            gameDependencies.join(','), funcString);
/* jshint ignore:end */
container.register('Games', allGamesFunc);

// initialize routing

//these will be injected in the order they appear in the function
// definition in routes/index
container.register('adminRoutes', require('../routes/admin'));
container.register('backofficeRoutes', require('../routes/backoffice'));
container.register('userRoutes', require('../routes/user'));
container.register('walletRoutes', require('../routes/wallet'));
container.register('bonusRoutes', require('../routes/bonus'));
container.register('ticketRoutes', require('../routes/ticket'));
container.register('notificationRoutes', require('../routes/notification'));
container.register('autobetRoutes', require('../routes/autobet'));
container.register('routes', require('../routes'));

// backoffice stuff
container.register('ListQuery', require('../lib/backoffice/list-query'));
container.register('AggregationQuery', require('../lib/backoffice/agg-query'));
container.register('GameTotalQuery', require('../lib/backoffice/game-total-query'));

// autobet
container.register('AutobetWorkflow', require('../lib/autobet/workflow'));
container.register('DefaultAutobets', require('../lib/autobet/default-autobets'));

// register error locales
var localeFiles = fs.readdirSync(__dirname + '/../locales');
var locales = {};
localeFiles.forEach(function(localeFile) {
    locales[localeFile.replace(/\.jso?n?$/, '')] = require('../locales/' + localeFile);
});
// register some things for the games to use
container.register('locales', locales);
container.register('HTTPError', require('../lib/http-error'));

container.register('provable', require('../lib/provably-fair'));
container.register('BaseModel', require('../lib/base-model'));
container.register('BaseGameModel', require('../lib/base-game-model'));
container.register('BaseGameController', require('../lib/base-game-controller'));
container.register('BaseMultipartGameController', require('../lib/base-multipart-game-controller'));
container.register('HubspotApi', require('../lib/hubspotApi'));
container.register('container', container);

module.exports = container;
