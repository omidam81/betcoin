'use strict';

var events = require('events');
var util = require('util');

var Request = function(conf) {
    this.path = conf.path || '/';
    this.params = conf.params || {};
    this.body = conf.body || {};
    this.query = conf.query || {};
    this.method = conf.method || 'GET';
    this.headers = conf.headers || {};
    this.ip = conf.ip || '0.0.0.0';
    this.user = conf.user;
    this.wallet = conf.wallet;
};

var Response = function() {
};

util.inherits(Response, events.EventEmitter);

Response.prototype.send = function(data) {
    if (data && data.toJSON) data = data.toJSON();
    this.response = data;
    this.emit('finished', this.statusCode || 200, data);
};

Response.prototype.json = Response.prototype.send;

Response.prototype.status = function(code) {
    this.statusCode = code;
    return this;
};


module.exports = {
    Request: Request,
    Response: Response
};

