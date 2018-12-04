'use strict';

var util = require('util');
var STATUS_CODES = require('http').STATUS_CODES;

var HTTPError = function(code, message) {
    if (STATUS_CODES.hasOwnProperty(code)) {
        this.code = code;
    } else {
        this.code = 500;
    }
    if (message === undefined) {
        this.message = STATUS_CODES[this.code];
    } else {
        this.message = message;
    }
};

util.inherits(HTTPError, Error);

module.exports = HTTPError;
