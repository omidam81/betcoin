'use strict';
/**
 * Module dependencies.
 */

var express = require('express');
var fs = require('fs');
var argv = require('optimist')
    .boolean(['ssl'])
    .default({port: 8443})
    .argv;
var mongoose = require('mongoose');
var app = express();
var url = require('url');
var URL_KEY = 'MONGO_PORT_27017_TCP';
var USER_KEY = 'MONGO_USER';
var PASSWORD_KEY = 'MONGO_PASSWORD';

app.configure(function() {
    if (process.env[URL_KEY] === undefined) {
        throw new Error(URL_KEY + " not found in environment variables");
    }
    var parsedUrl = url.parse(process.env[URL_KEY]);
    if (!parsedUrl.hostname || !parsedUrl.port) {
        throw new Error(URL_KEY + " is an invalid url");
    }
    app.set('dbUrl', 'mongodb://' +
            process.env[USER_KEY] + ':' + process.env[PASSWORD_KEY] +
            '@' + parsedUrl.hostname + ':' + parsedUrl.port +
            '/supportdb');
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(require('cors')());
    app.use(app.router);
});

// for development configuration of the middleware
app.configure('development',function () {
    app.use(express.errorHandler());
});

// for production configuration of the middleware
app.configure('production', function(){
    require('newrelic');
    app.use(function(err, req, res){
        res.json(500, {response: "Something wrong on the request"});
    });
});

// connect to mongodb
mongoose.connect(app.get('dbUrl'), function onMongooseError(err){
    if(err) {
        console.log('Error connecting to database', err);
    } else {

        if (argv.ssl) {
            var options = {
                key: fs.readFileSync('./ssl/STAR_betcoin_tm.key'),
                cert: fs.readFileSync('./ssl/STAR_betcoin_tm.crt'),
                ca: fs.readFileSync('./ssl/STAR_betcoin_tm.ca-bundle')
            };
            var server = require('https').createServer(options, app);
            server.listen(argv.port, function(err) {
                if (err) throw err;
                console.log('https api started on port %d', argv.port);
            });
        } else {
            app.listen(argv.port, function(err) {
                if (err) throw err;
                console.log('api started on port %d', argv.port);
            });
        }

    }
});

require('./app/routes/')(app);
