'use strict';

var express = require('express');
var logger = require('logger-npm')();
try {
    require('newrelic');
} catch (ex) {
    logger.warn("not using new relic");

}
var argv = require('optimist')
    .default ({port: 8443})
    .boolean(['ssl'])
    .argv;
var cors = require('cors');
var mongo = require('mongowrap').getConnection();
var bitcoind = require('bitcoin-wallet');
require('bitcoin-math');



var PlayerAPI = function(){
    var that = this;
    var app, server;
    app = new express();
    
    this.setContainer = function(container) {
        this.container = container;
    };

    this.getContainer = function() {
        if (this.container === undefined) {
            var ContainerService = require('./lib/dependable-container');
            var containerService = new ContainerService();
            this.container = containerService.initContainer();
        }
        return this.container;
    };

    this.init = function(callback) {

        if (argv.ssl) {
            var fs = require('fs');
            var options = {
                key: fs.readFileSync('ssl/STAR_betcoin_tm.key'),
                cert: fs.readFileSync('ssl/STAR_betcoin_tm.chained.crt'),
                ca: fs.readFileSync('ssl/STAR_betcoin_tm.ca-bundle')
            };
            server = require('https').createServer(options, app);

        } else {
            server = require('http').createServer(app);
        }

        server.listen(argv.port, function(err) {
            if (err) throw err;
            logger.info('%s server started on port %d', argv.ssl ? 'https' : 'http', argv.port);
        });

        app.configure(function() {
            app.use(cors());
            app.use(express.json());
            app.use(function(req, res, next) {
                res.set('X-Powered-By', 'Necromancy');
                next();
            });
            app.use(logger.middleware);
            app.set('trust proxy', true);
        });

        app.configure('development', function() {
            logger.warn('You are running in dev mode, app key checks are bypassed');
            app.use(express.errorHandler());
        });

        mongo = this.getContainer().get('mongo');
        mongo.getDb(function(err, db) {
            if (err) throw err;
            mongo.getSupportDb(function(err, supportDb) {
                if (err) throw err;
                var TransactionController = require('./controllers/transaction')(db.collection('transactions'));
                var UserController = require('./controllers/user')(db.collection('users'),
                                                                   db.collection('affiliate_tags'),
                                                                   TransactionController,
                                                                   db);
                var TicketController = require('./controllers/ticket')(supportDb.collection('tickets'));
                // set up timer for bonus expiration
                var clearExpiredBonuses = function() {
                    UserController.expireBonusOffers('btc', function(err, updated) {
                        if (err) return logger.error(err.message);
                        logger.info("expired bonuses cleared from %d users", updated);
                        setTimeout(clearExpiredBonuses, (24*60*60*1000));
                    });
                };
                clearExpiredBonuses();

                // reset all sockets since we are restarting the server
                db.collection('users').update({}, {$set: {socket: false}}, {multi: true}, function(err) {
                    if (err) throw err;
                });
                that.getContainer().get('socket').on('close', function() {
                    db.collection('users').update({}, {$set: {socket: false}}, {multi: true}, function(err) {
                        if (err) logger.log('error', 'error resetting player sockets: %s', err.message);
                    });
                });

                UserController.setContainer(that.getContainer());
                TicketController.setContainer(that.getContainer());
                that.getContainer().register('logger', logger);
                that.getContainer().register('UserController', UserController);
                that.getContainer().register('TransactionController', TransactionController);
                that.getContainer().register('TicketController', TicketController);
                that.getContainer().register('appkeys', db.collection('appkeys'));
                app.set('container', that.getContainer());
                app.set('db', db);
                // app.set('io', io);
                app.set('bitcoind', bitcoind);
                app.set('logger', logger);
                app.set('UserController', UserController);
                app.set('TransactionController', TransactionController);
                // routes
                require('./routes')(app);
                // bitcoind listener
                var BitcoinListener = require('./bitcoin-listener');
                var bitcoinListener = new BitcoinListener();
                bitcoinListener.setContainer(that.getContainer());
                that.getContainer().register('BitcoinListener', bitcoinListener);
                bitcoinListener.listen();

                if (callback) return callback();
            });
        });
    };

    this.getExpressApp = function() {
        return app;
    };
};


if (process.env.NODE_ENV !== 'test')
    (new PlayerAPI()).init();

module.exports = PlayerAPI;
