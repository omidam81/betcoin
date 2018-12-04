'use strict';

var queue = [];
var queueRunning = false;

var push = function(rawTx) {
    queue.push(rawTx);
    if (!queueRunning) {
        start();
    }
};

var start = function() {
    if (queueRunning) return;
    queueRunning = true;
    var nextTx = queue.shift();
    if (!nextTx) {
        queueRunning = false;
        return;
    }
    nextTx.once('signed', function() {
        queueRunning = false;
        start();
    });
    nextTx.once('failed', function(errorCode) {
        nextTx.emit('queue failure', errorCode);
    });
    nextTx.start();
};

module.exports = {
    start: start,
    push: push
};
