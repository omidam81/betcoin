'use strict';

// require('newrelic');
var http = require('http');
// this is express 4, see
// https://github.com/visionmedia/express/wiki/Migrating-from-3.x-to-4.x
// for changes from 3 to 4
var express = require('express');
// express 4 does not bundle middleware anymore
var bodyParser = require('body-parser');
var argv = require('yargs')
        .default({port: 8443})
        .argv;
var app = express();
// apply number prototypes across the board
require('bitcoin-math');

app.set('trust proxy', true);
app.use(require('cors')());
app.use(bodyParser());

var MinesweeperApi = function(container) {
    this.container = container;
};

MinesweeperApi.prototype.init = function(port) {
    var server = this.getServer();
    // register the app for the routes
    this.container.register('app', function(logger) {
        // log requests
        app.use(logger.middleware);
        return app;
    });
    // initialize routing
    this.container.register('routes', require('./routes'));
    // resolve deps and start the application
    // routes required to resolve all other deps
    this.container.resolve(function(routes, logger) {
        // make the server listen
        server.listen(port, function(err) {
            if (err) throw err;
            logger.info('server started on port %d', port);
        });
    });
};

MinesweeperApi.prototype.getServer = function() {
    return http.createServer(app);
};


if (require.main === module) {
    var container = require('./container');
    var api = new MinesweeperApi(container);
    api.init(argv.port);
}

module.exports = MinesweeperApi;
