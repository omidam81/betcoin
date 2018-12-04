'use strict';

var winston = require('winston');
var ObjectID = require('mongoskin').ObjectID;
var util = require('util');
var http = require('http');
var extend = require('util')._extend;
var argv = require('yargs')
    .count("verbose")
    .alias("v", "verbose")
    .count("quiet")
    .alias("q", "quiet")
    .argv;

var logLevel = 'crypto';
if (argv.verbose === 1) logLevel = 'verbose';
if (argv.verbose === 2) logLevel = 'silly';
if (argv.quiet === 1) logLevel = 'express';
if (argv.quiet === 2) logLevel = 'info';
if (argv.quiet === 3) logLevel = 'warn';
if (argv.quiet === 4) logLevel = 'error';
if (argv.quiet === 5) logLevel = 'silent';

if (argv.logLevel) logLevel = argv.logLevel;

var levels = extend({}, winston.config.cli.levels);
delete levels.input;
delete levels.verbose;
delete levels.prompt;
levels = extend(levels, {
    verbose: 1,
    crypto: 2,
    express: 3,
    silent: 10
});

var colors = extend(winston.config.cli.colors, {
    express: 'grey',
    crypto: 'cyan',
    verbose: 'grey'
});

var USER_MAP = {};
var OID_REGEXP = /([a-f0-9]{24})/ig;
var BITCOIN_REGEXP = /(.*)bitcoin(d?)(.*)/;
var LITECOIN_REGEXP = /(.*)litecoin(d?)(.*)/;
var DOGECOIN_REGEXP = /(.*)dogecoin(d?)(.*)/;
var PPCOIN_REGEXP = /(.*)ppcoin(d?)(.*)/;
var NAMECOIN_REGEXP = /(.*)namecoin(d?)(.*)/;
var DEFAULT_OPTIONS = {
    level: logLevel,
    colorize: true,
    timestamp: true,
    games: []
};

var MongoLogger = function(options) {
    this.name = 'mongoLogger';
    this.level = 'silly';
    this.db = options.db;
};

util.inherits(MongoLogger, winston.Transport);

MongoLogger.prototype.log = function(level, message, meta, cb) {
    if (meta.constructor === ObjectID) {
        message = util.format(message, meta.toString());
        meta = {};
    }
    var matches;
    var userIds = [];
    var usernames = [];
    while ((matches = OID_REGEXP.exec(message)) !== null) {
        var oid = matches[1];
        if (USER_MAP[oid]) {
            userIds.push(oid);
            usernames.push(USER_MAP[oid]);
        }
    }
    if (meta.userId) {
        userIds.push(meta.userId);
    }
    if (meta.username) {
        usernames.push(meta.username);
    }
    if (level !== 'verbose')
    this.db.insert({
        level: level,
        message: message.replace(/\u001b\[[0-9]{1,2}m/g, ''),
        meta: meta,
        timestamp: new Date(),
        userIds: userIds,
        usernames: usernames
    }, function(err) {
        if (err) return cb(err);
        cb(undefined, true);
    });
};
var CustomLogger = function(options) {
    this.name = 'betcoinLogger';
    winston.transports.Console.call(this, options);
};

util.inherits(CustomLogger, winston.transports.Console);

CustomLogger.prototype.log = function(level, message, meta) {
    var args = Array.prototype.slice.apply(arguments);
    if (meta.constructor === ObjectID) {
        message = util.format(message, meta.toString());
    }
    args[2] = {}; // ignore meta on the console, it will be logged winto mongo
    var c = 'white';
    if (level === 'verbose' || level === 'crypto' || level === 'express') {
        c = 'grey';
    }
    message = message.replace(BITCOIN_REGEXP, '$1'[c] + 'bitcoin$2'.yellow.bold + '$3'[c]);
    message = message.replace(LITECOIN_REGEXP, '$1'[c] + 'litecoin$2'.blue.bold + '$3'[c]);
    message = message.replace(DOGECOIN_REGEXP, '$1'[c] + 'dogecoin$2'.magenta.bold + '$3'[c]);
    message = message.replace(PPCOIN_REGEXP, '$1'[c] + 'ppcoin$2'.red.bold + '$3'[c]);
    message = message.replace(NAMECOIN_REGEXP, '$1'[c] + 'namecoin$2'.yellow.bold + '$3'[c]);
    var matches;
    while ((matches = OID_REGEXP.exec(message)) !== null) {
        var oid = matches[1];
        if (USER_MAP[oid]) {
            message = message.replace(oid, USER_MAP[oid].bold);
        }
    }
    message = message[c];
    args[1] = message;
    this.constructor.super_.prototype.log.apply(this, args);
};

module.exports = function(logCollection, options) {
    if (arguments.length === 0) {
        options = {};
    } else if (options === undefined) {
        options = logCollection;
        logCollection = null;
    }
    options = util._extend(DEFAULT_OPTIONS, options);
    var transports = [new CustomLogger(options)];
    if (logCollection) {
        transports.push(new MongoLogger({
            db: logCollection
        }));
    }

    var levels = {
        silly: 0,
        verbose: 1,
        crypto: 2
    };

    var logLevel = 3;
    options.games = options.games.concat([
        'express',
        'debug',
        'info',
        'warn',
        'error',
        'silent'
    ]);
    options.games.forEach(function(game) {
        levels[game] = logLevel;
        if (!colors[game]) colors[game] = 'magenta';
        logLevel += 1;
    });

    winston.setLevels(levels);
    winston.addColors(colors);

    var logger = new winston.Logger({
        transports: transports,
        levels: levels
    });

    logger.middleware = function(req, res, next) {
        req._startTime = Date.now();
        var doLog = function() {
            res.removeListener('finish', doLog);
            res.removeListener('close', doLog);
            if (res.headersSent) {
                var status = res.statusCode;
                var resTime = Date.now() - req._startTime;
                var baseColor = 'grey';
                var color;
                if      (status < 200) color = 'grey';
                else if (status < 300) color = 'green';
                else if (status < 400) color = 'blue';
                else if (status < 500) color = 'yellow';
                else                   color = 'red';

                var timeColor;
                if      (resTime < 500)  timeColor = "green";
                else if (resTime < 1500) timeColor = "yellow";
                else                     timeColor = "red";

                var path = req.originalUrl || req.path;
                var meta = {
                    method: req.method,
                    path: path,
                    status: status,
                    time: resTime
                };
                if (req.route) {
                    meta.route = (req.baseUrl || '') + req.route.path;
                }
                if (req.user) {
                    meta.userId = req.user.primary();
                    meta.username = req.user.username();
                }
                var errString = "";
                if (status >= 400) {
                    baseColor = color;
                    if (res.locals.error) {
                        errString += "- " + res.locals.error.message;
                        meta.error = res.locals.error.message;
                    }
                }
                logger.log('express',
                           "%s %s %s:%s %s %s ms",
                           req.method[baseColor],
                           path[baseColor],
                           status.toString()[color],
                           http.STATUS_CODES[status][color],
                           errString,
                           resTime.toString()[timeColor],
                           meta);
            } else {
                logger.error('headers not sent, but reached \'finish\' event');
            }
        };
        res.on('close', doLog);
        res.on('finish', doLog);
        next();
    };

    logger.mapUser = function(userId, username) {
        userId = userId.toString();
        if (!USER_MAP[userId]) {
            logger.verbose("mapping userid %s to username %s", userId, username);
            USER_MAP[userId] = username;
        }
    };

    return logger;
};
