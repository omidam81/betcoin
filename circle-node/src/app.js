'use strict';

require('newrelic');
var express = require('express');
var logger = require('./lib/logger')('main');
var argv = require('yargs')
        .boolean(['ssl'])
        .default({port: 8443})
        .argv;
var app = express();
require('bitcoin-math');

app.set('trust proxy', true);
app.use(require('cors')());
app.use(express.json());
app.use(express.urlencoded());

var CircleApi = function() {
};

CircleApi.prototype.setContainer = function(container) {
    this.container = container;
};

CircleApi.prototype.getContainer = function() {
    if (this.container === undefined) {
        this.container = require('./lib/dep-container')();
    }
    return this.container;
};

CircleApi.prototype.init = function(ssl, port) {
    var server = this.getServer(ssl);
    // set up routing
    require('./routes')(app, this.getContainer());
    // make the server listen
    server.listen(port, function(err) {
        if (err) throw err;
        logger.log('info', '%s server started on port %d', ssl ? 'https' : 'http', port);
    });
};

CircleApi.prototype.getServer = function(ssl) {
    if (ssl) {
        var fs = require('fs');
        var options = {
            key: fs.readFileSync('ssl/STAR_betcoin_tm.key'),
            cert: fs.readFileSync('ssl/STAR_betcoin_tm.chained.crt'),
            ca: fs.readFileSync('ssl/STAR_betcoin_tm.ca-bundle')
        };
        return require('https').createServer(options, app);

    } else {
        return require('http').createServer(app);
    }
};


if (require.main === module) {
    var api = new CircleApi();
    api.init(argv.ssl, argv.port);
}

module.exports = CircleApi;
