'use strict';

var express = require('express');
var argv = require('optimist')
    .default({
        port: 8443
    })
    .boolean(['ssl'])
    .argv;
var cors = require('cors');

var BackofficeApi = function(container) {
    this.app = new express();
    this.container = container;
};

BackofficeApi.prototype.init = function(port, callback) {
    var logger = this.container.get('logger');
    logger.info('init');
    var server = require('http').createServer(this.app);
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(logger.middleware);
    this.app.use(express.errorHandler());

    // require('./routes')(this.app, this.container);
    // require('./account')(this.app, this.container);

    this.container.resolve({app: this.app, container: this.container}, require('./routes'));
    this.container.resolve({app: this.app, container: this.container}, require('./account'));
    this.container.resolve({app: this.app}, require('./support'));
    this.container.resolve({app: this.app}, require('./games'));
    this.container.resolve({app: this.app}, require('./games/dice'));
    this.container.resolve({app: this.app}, require('./games/dice-new'));
    this.container.resolve({app: this.app}, require('./games/circle'));
    this.container.resolve({app: this.app}, require('./games/reel'));
    this.container.resolve({app: this.app}, require('./games/prize'));
    this.container.resolve({app: this.app}, require('./games/roulette'));
    this.container.resolve({app: this.app}, require('./games/war'));
    this.container.resolve({app: this.app}, require('./games/bj'));
    this.container.resolve({app: this.app}, require('./games/baccarat'));
    this.container.resolve({app: this.app}, require('./games/paigow'));
    this.container.resolve({app: this.app}, require('./games/hilo'));
    this.container.resolve({app: this.app}, require('./games/fortune'));
    this.container.resolve({app: this.app}, require('./games/sicbo'));
    this.container.resolve({app: this.app}, require('./games/keno'));
    this.container.resolve({app: this.app}, require('./games/coinflip'));
    this.container.resolve({app: this.app}, require('./games/caribbean'));
    this.container.resolve({app: this.app}, require('./games/3card'));
    this.container.resolve({app: this.app}, require('./games/videopoker'));
    this.container.resolve({app: this.app}, require('./games/tiles'));
    this.container.resolve({app: this.app}, require('./games/craps'));
    this.container.resolve({app: this.app}, require('./games/lottery'));
    this.container.resolve({app: this.app}, require('./games/tigerdragon'));
    this.container.resolve({app: this.app}, require('./games/fantan'));
    this.container.resolve({app: this.app}, require('./games/baccpo'));


    server.listen(port, function(err) {
        if (err) throw err;
        logger.info('started http server on port %d', port);
        if(callback){
            return callback();
        }
    });
};



if (require.main === module) {
    var api = new BackofficeApi(require('./lib/container'));
    api.init(argv.port);
}


module.exports = BackofficeApi;
