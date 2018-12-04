'use strict';

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var domain = require('domain');

/**
 * The backend server app
 * @class
 * @param {Container} container A dependable container with the necessary dependencies registered
 */
function Api(container) {
    this.container = container;
}

/**
 * Init the api's http server
 * @param {number} port The port on which to listen for http requests
 */
Api.prototype.init = function(port, cb) {
    var self = this;
    // register the app for the routes
    this.registerApp();
    // register the server for socket.io to connect to
    this.registerServer();
    // resolve deps and start the application
    // routes required to resolve all other deps
    // resolve the routes to bootstrap the application
    this.container.resolve(function(routes, server, logger) {
        // games must resolve after routes
        self.container.resolve(function(Games, CryptoListener, app, expressErrorHandler) {
            app.use(expressErrorHandler);
            // start listening to the coind servers
            CryptoListener.listen(function(err) {
                if (err) throw err;
                // make the server listen
                server.listen(port, function(err) {
                    if (err) throw err;
                    logger.info('server started on port %d', port);
                    if (cb) cb();
                });
            });
        });
    });
};

/**
 * Register the app to the container
 */
Api.prototype.registerApp = function() {
    this.container.register('app', function(logger) {
        var app = express();
        // get real user IP address instead of proxy server's IP
        app.enable('trust proxy');
        app.use(function(req, res, next) {
            res.set('X-Powered-By', 'Tiny Turtles on Cocaine');
            next();
        });
        // CORS to allow from other domains
        app.use(require('cors')());
        // we are only reading JSON here
        app.use(bodyParser.json());
        // log the requests
        app.use(logger.middleware);
        // ping url
        app.get('/ping', function(req, res) { return res.send('pong'); });
        return app;
    });
};

/**
 * Register the server to the container
 */
Api.prototype.registerServer = function() {
    this.container.register('server', function(app) {
       return http.createServer(app);
    });
};

Api.prototype.die = function(cb) {
    this.container.get('server').close(function(err) {
        return cb(err);
    });

};

if (require.main === module) {
    var argv = require('yargs')
        .default({port: 8443})
        .argv;
    var container = require('./container');
    var api = new Api(container);
    // setup a domain so we can email the admins when the server crashes
    var d = domain.create();
    d.on('error', function(err) {
        var mailer = container.get('mailer');
        var logger = container.get('logger');
        var HTTPError = container.get('HTTPError');
        var errString;
        if (!err) {
            errString = new Error().stack;
        } else if (!err.stack) {
            if (err === HTTPError) {
                logger.error("HTTPError class received!");
                err = new Error().stack;
            }
            errString = err.toString();
        } else {
            errString = err.stack.toString();
        }
        if (process.env.CRASH_REPORTS) {
            mailer.sendBasic(mailer.ADMINS, "THE SERVER CRASHED!!!", new Date().toISOString() + "\n\n" + errString, function() {
                logger.error("SERVER CRASH!!!", errString);
                process.exit(1);
            });
        }
    });
    d.run(function() {
        api.init(argv.port);
    });
}

module.exports = Api;
