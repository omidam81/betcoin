var winston = require('winston');

winston.setLevels(winston.config.cli.levels);
winston.addColors(winston.config.cli.colors);

var commonTransports = [
    new winston.transports.Console({
        colorize: true,
        level: 'silly',
        timestamp: true
    }),
    new winston.transports.File({
        filename: __dirname + '/../logs/dice.log',
        level: 'silly',
        timestamp: true
    })
];

winston.loggers.add('main',{
    transports: commonTransports
});
