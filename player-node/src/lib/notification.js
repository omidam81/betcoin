'use strict';

module.exports = function() {
    this.setContainer = function(container) {
        this.container = container;
    };

    this.getContainer = function() {
        return this.container;
    };

    this.emit = function(event, socketId) {
        var logger = this.getContainer().get('logger');
        var io;
        try {
            io = this.getContainer().get('socket');
        } catch (ex) {
            return logger.error("socket io not registered in the container");
        }
        var emitArgs = Array.prototype.slice.call(arguments, 2);
        emitArgs.unshift(event);
        emitArgs.unshift(socketId);
        io.send.apply(io, emitArgs);
    };

    this.notify = function(event, socketId, msgObj) {
        var logger = this.getContainer().get('logger');
        var io;
        try {
            io = this.getContainer().get('socket');
        } catch (ex) {
            return logger.error("socket io not registered in the container");
        }
        if((msgObj instanceof Array) === false) {
            msgObj = [msgObj];
        }
        io.send(socketId, event, msgObj);
    };
};
