'use strict';

var http = require('http');
var url = require('url');
var ensureObjectId = require('mongowrap').ensureObjectId;
var Etcd = require('node-etcd');
var etcd = new Etcd('172.17.42.1');
var logger;

try {
    logger = require('./logger')('main');
} catch (e) {
    logger = console;
}

var ETCD_KEY = "backends/player_node";

var PLAYER_SERVER;

var parseUrl = function(playerUrl) {
    PLAYER_SERVER = url.parse(playerUrl);

    if (PLAYER_SERVER.hostname === null) throw "Malformed PLAYER_SERVER_PORT variable: " + playerUrl;
    if (PLAYER_SERVER.port === null) throw "Malformed PLAYER_SERVER_PORT variable: " + playerUrl;
    PLAYER_SERVER.port = parseInt(PLAYER_SERVER.port, 10);
};

etcd.get(ETCD_KEY, function(err, response) {
    var playerUrl;
    if (err) {
        if (process.env.PLAYER_SERVER_PORT) {
            playerUrl = process.env.PLAYER_SERVER_PORT;
        } else {
            throw "You must have the environment variable PLAYER_SERVER_PORT set to use the player server interface";
        }
        parseUrl(playerUrl);
    } else {
        playerUrl = 'tcp://' + response.node.value;
        parseUrl(playerUrl);
        var watcher = etcd.watcher(ETCD_KEY);
        watcher.on("change", function(data) {
            if (data.node && data.node.value) parseUrl('tcp://' + data.node.value);
        });
    }

});

if (!process.env.APP_KEY) {
    throw "You must have the environment variable APP_KEY set to use the player server interface";
}

var APP_KEY = process.env.APP_KEY.split(":");

var doRequest = function(reqConf, body, cb) {
    if (cb === undefined && typeof body === 'function') {
        cb = body;
        body = undefined;
    }
    if (!PLAYER_SERVER || !PLAYER_SERVER.hostname) {
        return cb(new Error("PLAYER_SERVER not ready yet"));
    }
    var req = http.request(reqConf);
    req.on('response', function(res) {
        var jsonString = "";
        res.on('data', function(chunk) {
            jsonString += chunk;
        });
        res.on('end', function() {
            var resData;
            try {
                resData = JSON.parse(jsonString);
            } catch (e) {
                if (e.name === 'SyntaxError') {
                    return cb(new Error("Invalid JSON returned from server: " + e.message + ' string: ' + jsonString));
                } else {
                    return cb(e);
                }
            }
            if (res.statusCode >= 200 && res.statusCode <= 204) {
                cb(undefined, resData);
            } else {
                var err = new Error("Player server returned error: " + resData.error || resData);
                err.code = res.statusCode;
                cb(err);
            }
        });
    });
    req.on('error', function(err) {
        return cb(err);
    });
    if (body) {
        req.end(JSON.stringify(body));
    } else {
        req.end();
    }
};

var doDebitCredit = function(path, body, cb) {
    if (cb === undefined && typeof body === 'function') {
        cb = body;
        body = undefined;
    }
    var reqConf = {
        host: PLAYER_SERVER.hostname,
        port: PLAYER_SERVER.port,
        method: 'POST',
        headers: {
            'App-Key': APP_KEY[1],
            'Content-Type': 'application/json'
        },
        path: path
    };
    doRequest(reqConf, body, cb);
};

var getInternalRequestConfigs = function(options){
    var configs = {
        host: PLAYER_SERVER.hostname,
        port: PLAYER_SERVER.port,
        headers: {
            'App-Key': APP_KEY[1],
            'Content-Type': 'application/json'
        }
    };
    Object.keys(options).forEach(function(key){
        configs[key] = options[key];
    });
    return configs;
};

module.exports.credit = function(userId, amount, options, cb) {
    userId = ensureObjectId(userId);
    if (userId === null) return cb(new Error("Invalid userId"));
    options.amount = parseInt(amount, 10);
    if (isNaN(options.amount)) return cb(new Error("invalid amount"));
    var reqUrl = '/transaction/' + APP_KEY[0] + '/credit/' + userId.toHexString();
    doDebitCredit(reqUrl, options, function(err, response) {
        if (err) return cb(err);
        cb(undefined, response.user, response.transaction);
    });
};

module.exports.debit = function(userId, amount, options, cb) {
    userId = ensureObjectId(userId);
    if (userId === null) return cb(new Error("Invalid userId"));
    options.amount = parseInt(amount, 10);
    if (isNaN(options.amount)) return cb(new Error("invalid amount"));
    var reqUrl = '/transaction/' + APP_KEY[0] + '/debit/' + userId.toHexString();
    doDebitCredit(reqUrl, options, function(err, response) {
        if (err) return cb(err);
        cb(undefined, response.user, response.transaction);
    });
};

module.exports.giveBonus = function(userId, bonusConf, cb) {
    userId = ensureObjectId(userId);
    if (userId === null) return cb(new Error("Invalid userId"));
    var reqConf = getInternalRequestConfigs({
        method: 'POST',
        path: '/bonus/' + APP_KEY[0] + '/' + userId.toHexString()
    });
    doRequest(reqConf, bonusConf, cb);
};

module.exports.giveBonuses = function(bonusConf, cb) {
    var reqConf = getInternalRequestConfigs({
        method: 'POST',
        path: '/bonus/' + APP_KEY[0]
    });
    doRequest(reqConf, bonusConf, cb);
};

module.exports.sendNotifications = function(params, cb) {
    var reqConf = getInternalRequestConfigs({
        method: 'POST',
        path: '/notification/' + APP_KEY[0]
    });
    doRequest(reqConf, params, cb);
};

module.exports.lockUser = function(params, cb) {
    var reqConf = getInternalRequestConfigs({
        method: 'PUT',
        path: '/' + APP_KEY[0] + '/user/' + params.userId + '/lock'
    });
    doRequest(reqConf, params, cb);
};

module.exports.unlockUser = function(params, cb) {
    var reqConf = getInternalRequestConfigs({
        method: 'PUT',
        path: '/' + APP_KEY[0] + '/user/' + params.userId + '/unlock'
    });
    doRequest(reqConf, params, cb);
};

module.exports.omitUser = function(params, cb) {
    var reqConf = getInternalRequestConfigs({
        method: 'PUT',
        path: '/' + APP_KEY[0] + '/user/' + params.userId + '/omit'
    });
    doRequest(reqConf, params, cb);
};

module.exports.unomitUser = function(params, cb) {
    var reqConf = getInternalRequestConfigs({
        method: 'PUT',
        path: '/' + APP_KEY[0] + '/user/' + params.userId + '/unomit'
    });
    doRequest(reqConf, params, cb);
};

module.exports.trustUser = function(params, cb) {
    var reqConf = getInternalRequestConfigs({
        method: 'PUT',
        path: '/' + APP_KEY[0] + '/user/' + params.userId + '/trust'
    });
    doRequest(reqConf, params, cb);
};

module.exports.untrustUser = function(params, cb) {
    var reqConf = getInternalRequestConfigs({
        method: 'PUT',
        path: '/' + APP_KEY[0] + '/user/' + params.userId + '/untrust'
    });
    doRequest(reqConf, params, cb);
};

module.exports.getTicket = function(params, cb) {
    var reqConf = getInternalRequestConfigs({
        method: 'GET',
        path: '/ticket/' + params.id
    });
    doRequest(reqConf, undefined, cb);
};

module.exports.getTicketList = function(params, cb) {
    var reqConf = getInternalRequestConfigs({
        method: 'GET',
        path: '/ticket/' + APP_KEY[0] + '/status' + '/' + params.status
    });
    doRequest(reqConf, undefined, cb);
};
module.exports.updateTicketStatus = function(params, cb) {
    var reqConf = getInternalRequestConfigs({
        method: 'PUT',
        path: '/ticket/' + APP_KEY[0] + '/' + params.id
    });
    doRequest(reqConf, params, cb);
};
module.exports.updateTicketWithComment = function(params, cb) {
    var reqConf = getInternalRequestConfigs({
        method: 'PUT',
        path: '/ticket/' + APP_KEY[0] + '/' + params.id + '/comment',
        body: params
    });
    doRequest(reqConf, params, cb);
};

module.exports.verifyToken = function(userId, token, cb) {
    userId = ensureObjectId(userId);
    if (userId === null) return cb(new Error("Invalid userId"));
    var reqUrl = '/user/' + userId.toHexString() + '?omitNotifications=true';
    var reqConf = {
        host: PLAYER_SERVER.hostname,
        port: PLAYER_SERVER.port,
        method: 'GET',
        headers: {
            'Authorization': "Bearer " + token,
            'Content-Type': 'application/json'
        },
        path: reqUrl
    };
    doRequest(reqConf, function(err, user) {
        if (err) {
            if (err.code === 401) {
                return cb(undefined, false);
            } else {
                return cb(new Error("error verifying token for " + userId + ': ' + err.message));
            }
        }
        return cb(undefined, token === user.token);
    });
};

module.exports.getToken = function(userId, cb) {
    userId = ensureObjectId(userId);
    if (userId === null) return cb(new Error("Invalid userId"));
    var reqConf = getInternalRequestConfigs({
        method: 'GET',
        path: '/' + APP_KEY[0] + '/user/' + userId.toHexString() + '/token?omitNotifications=true'
    });
    doRequest(reqConf, function(err, user) {
        if (err) {
            return cb(new Error("error get or refresh user token for " + userId + ': ' + err.message));
        }
        return cb(undefined, user.token, user);
    });
};

var STATUS_CODES = http.STATUS_CODES;
var TOKEN_AUTH_REGEXP = /^Bearer [a-f0-9]{32}/;

var errorResponse = function(status, message, errCode, res) {
    if (!STATUS_CODES.hasOwnProperty(status)) {
        status = 500;
    }
    var resObj = {
        error: STATUS_CODES[status],
        message: message,
        errCode: errCode
    };
    res.json(status, resObj);
};

// express middleware for extracting an auth token
module.exports.extractApiToken = function(req, res, next) {
    var authHeader = req.get('authorization');
    if (!authHeader) {
        req.token = false;
        return next();
    }

    if (!TOKEN_AUTH_REGEXP.test(authHeader)) return errorResponse(400, "Invalid API token header", '057', res);
    var token = authHeader.split(" ")[1];

    if (!token) {
        req.token = false;
    } else {
        req.token = token;
    }
    next();
};
