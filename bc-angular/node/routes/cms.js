'use strict';

var ejs = require('ejs');
var fs = require('fs');
var url = require('url');

var logger = require('logger-npm')();

module.exports = function(type) {
    var baseURL = process.env[type.toUpperCase() + '_BASE_URL'];
    if (baseURL === undefined) {
        baseURL = 'https://office.betcoin.tm:8443/api/v1/' + type;
    }
    baseURL = url.parse(baseURL);

    var http = require(baseURL.protocol.replace(/:$/, ''));

    var doRequest = function(path, cb) {
        var reqOptions = {
            host: baseURL.hostname,
            path: baseURL.path + '/' + path,
            port: baseURL.port,
            method: 'GET',
            rejectUnauthorized: false
        };
        http.request(reqOptions, function(res) {
            logger.debug('got response for %s%s', baseURL.host, reqOptions.path);
            var jsonString = '';
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                jsonString += chunk;
            });
            res.on('end', function() {
                var data;
                try {
                    data = JSON.parse(jsonString);
                } catch(ex) {
                    return cb(new Error(jsonString));
                }
                if (res.statusCode === 200) {
                    cb(undefined, data);
                } else {
                    cb(new Error(jsonString));
                }
            });
        }).on('error', function(err) {
            logger.error('doRequest error: %s', err.message);
            return cb(err);
        }).end();
    };

    var list = function(res) {
        doRequest('', function(err, data) {
            if (err) {
                res.statusCode = err.code || 500;
                return res.end(err.message);
            }
            var filename = __dirname + '/../templates/' + type + '-list.ejs';
            fs.readFile(filename, {encoding: 'utf8'}, function(err, template) {
                if (err) {
                    res.statusCode = 400;
                    return res.end();
                }
                try {
                    var html = ejs.render(template, {
                        locals: data[0]
                    });
                    return res.end(html);
                } catch (ex) {
                    res.statusCode = 500;
                    return res.end(ex.message);
                }
            });
        });
    };

    var entry = function(id, res) {
        doRequest('/' + id, function(err, data) {
            if (err) {
                res.statusCode = err.code || 500;
                return res.end(err.message);
            }
            var filename = __dirname + '/../templates/' + type + '-entry.ejs';
            fs.readFile(filename, {encoding: 'utf8'}, function(err, template) {
                if (err) return list(res);
                try {
                    var html = ejs.render(template, {
                        locals: data
                    });
                    return res.end(html);
                } catch (ex) {
                    res.statusCode = 500;
                    return res.end(ex.message);
                }
            });
        });
    };

    return {
        list: list,
        entry: entry
    };

};
