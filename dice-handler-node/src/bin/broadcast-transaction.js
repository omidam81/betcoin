'use strict';

var recoverTx = require('../dice-handler').recoverTx;
var argv = require('yargs')
        .usage('Usage $0 bitcointxidstring')
        .demand(1)
        .argv;

recoverTx(argv._[0], function(err, games) {
    if (err) return console.error(err);
    console.log(games);
    process.exit();
});
