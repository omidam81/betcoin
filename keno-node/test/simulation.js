'use strict';

require('bitcoin-math');

var cores = require('os').cpus().length;
var cluster = require('cluster');

var memory = require('modella-memory')();
var logger = require('logger-npm')();
var Keno = require('../src/models/keno')(memory, null, {
    debug: function(){},
    info: function() {}
});
var async = require('async');

var SIMULATIONS = 10000000;
var CLIENT_SEED_MAX = 9999999999;
var CLIENT_SEED_MIN = 1000000000;
var getClientSeed = function() {
    return Math.floor(Math.random() * (CLIENT_SEED_MAX - CLIENT_SEED_MIN + 1) + CLIENT_SEED_MIN);
}

var bets = [];
for (var n = 1; n < 81; n++) {
    bets.push(n);
}

var getBets = function() {
    var betCount = Math.floor(Math.random() * 8 + 1);
    // logger.debug("bet count: %d", betCount);
    var theseBets = [];
    var betCopy = bets.slice();
    // logger.debug("possible bets: %s", JSON.stringify(betCopy));
    for(var i = 0; i < betCount; i++) {
        var betIndex = Math.floor(Math.random() * (betCopy.length));
        // logger.debug("bet index: %d", betIndex);
        theseBets.push(betCopy[betIndex]);
        betCopy = betCopy.filter(function(value, index) { return index != betIndex });
        // logger.debug("possible bets: %s", JSON.stringify(betCopy));
    }
    return theseBets;
}

var totalWagered = 0;
var totalWinnings = 0;

if (cluster.isMaster) {
    logger.info("running %d workers with %d simulations each", cores, parseInt(SIMULATIONS / cores, 10));
                for (var i = 0; i < cores; i++) {
        cluster.fork();
    }
    var workersFinished = 0;
    Object.keys(cluster.workers).forEach(function(id) {
        cluster.workers[id].on('message', function(message) {
            totalWagered += message.wagered;
            totalWinnings += message.winnings;
        });
    });

    cluster.on('exit', function(worker) {
        logger.info("worker %s done", worker.id);
        workersFinished += 1;
        if (workersFinished === cores) {
            var profit = (totalWagered - totalWinnings);
            var profitPerWager = profit / SIMULATIONS;
            var houseEdge = profit / totalWagered;
            logger.info("Simulations    : %d", SIMULATIONS);
            logger.info("Total Wagered  : %s", totalWagered.toBitcoinString());
            logger.info("Total Winnings : %s", totalWinnings.toBitcoinString());
            logger.info("Profit         : %s", profit.toBitcoinString());
            logger.info("- Per Wager    : %s", profitPerWager.toBitcoinString());
            logger.info("House Edge     : %d%%", houseEdge * 100);
            process.exit();
        }
    });

} else {

    var wagered = 0;
    var winnings = 0;
    async.timesSeries(parseInt(SIMULATIONS / cores, 10), function(n, next) {
        if (n !== 0 && n % 10000 === 0) logger.info("worker %d: %d", cluster.worker.id, n);
        async.waterfall([
            Keno.init,
            function(keno, done) {
                Keno.find(keno.nextGameId, done)
            },
            function(keno, done) {
                keno.play({
                    game_id: keno.primary(),
                    client_seed: getClientSeed(),
                    wager: 100000,
                    bets: getBets(),
                    player_id: 'simulation',
                    player_alias: 'simulation',
                    ip: '0.0.0.0'
                }, done);   
            }
        ], function(err, keno) {
            wagered += keno.wager();
            winnings += keno.winnings();
            keno.remove();
            next();
        });
    }, function(err) {
        if (err) return logger.error(err);
        cluster.worker.send({wagered: wagered, winnings: winnings});
        process.exit()
    });
}
