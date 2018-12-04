'use strict';

require('newrelic');
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

var LotteryApi = function(container) {
    this.container = container;
};

LotteryApi.prototype.init = function(port) {
    var server = this.getServer();
    // register the app for the routes
    this.container.register('app', function(logger) {
        // log the requests
        app.use(logger.middleware);
        return app;
    });
    // register the server for socket.io to connect to
    this.container.register('server', server);
    // initialize routing
    this.container.register('routes', require('./routes'));
    // resolve deps and start the application
    // routes required to resolve all other deps
    this.container.resolve(function(routes, LotteryController, Scheduler, games, logger) {
        // bootstrap games
        games.forEach(function(game) {
            LotteryController.active(game.interval, function(err, lotteries) {
                if (err) throw err;
                if (!lotteries.length) {
                    var config = Scheduler.getStartAndEnd(game.interval);
                    config.interval = game.interval;
                    LotteryController.create(config, function(err, lottery) {
                        if (err) throw err;
                        logger.debug("bootstrapped %s lottery", lottery.interval());
                    });
                } else {
                    logger.debug("%s lottery exists", lotteries[0].interval());
                    Scheduler.scheduleLottery(lotteries[0], LotteryController.create);
                }
            });
        });
        // make the server listen
        server.listen(port, function(err) {
            if (err) throw err;
            logger.info('server started on port %d', port);
        });
    });
};

LotteryApi.prototype.getServer = function() {
    return http.createServer(app);
};


if (require.main === module) {
    var container = require('./container');
    var api = new LotteryApi(container);
    api.init(argv.port);
}

module.exports = LotteryApi;
