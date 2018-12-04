'use strict';

var queue = [];
var queueRunning = false;
var logger = require('../../logger')();

var push = function(rawTx) {
    logger.verbose("adding tx to queue");
    queue.push(rawTx);
    if (!queueRunning) {
        logger.verbose("queue not running, kicking it off");
        start();
    }
};

var start = function() {
    if (queueRunning) return;
    queueRunning = true;
    var nextTx = queue.shift();
    if (!nextTx) {
        logger.verbose("queue empty, going dormant");
        queueRunning = false;
        return;
    }
    nextTx.once('signed', function() {
        queueRunning = false;
        start();
    });
    nextTx.once('failed', function(errorCode) {
        nextTx.emit('queue failure', errorCode);
        queueRunning = false;
        start();
    });
    logger.verbose("starting raw tx signing process");
    nextTx.start();
};

module.exports = {
    start: start,
    push: push
};
