'use strict';

var winston = require('winston');

winston.setLevels(winston.config.cli.levels);
winston.addColors(winston.config.cli.colors);

var transports;
if (process.env.NODE_ENV === 'test') {
    transports = [
        new winston.transports.File({
            filename: '/dev/null'
        })
    ];
} else {
    transports = [
        new winston.transports.Console({
            colorize: true,
            level: 'silly',
            timestamp: true
        })
    ];
}

winston.loggers.add('main', {
    transports: transports
});

module.exports = function(loggerName) {
    return winston.loggers.get(loggerName);
};
