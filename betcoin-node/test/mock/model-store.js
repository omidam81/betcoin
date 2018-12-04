'use strict';

var memory = require('modella-memory');

module.exports = {
    getModella: function() {
        return memory();
    }
};
