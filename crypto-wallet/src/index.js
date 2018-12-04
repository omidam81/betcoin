'use strict';

// this file is for when this is used as a module

module.exports = function(config) {
    var crypto = require('bitcoin').Client(config);
    // add additional functions here
    // crypto.send = require('./lib/send');
    return crypto;
};
