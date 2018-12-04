/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
    app_name : ['fantan'],
    logging : {
        level : 'info'
    },
    rules: {
        ignore: [
            '^/socket.io/\*/xhr-polling', // jshint ignore:line
            '^/socket.io/.*'
        ]
    }
};
