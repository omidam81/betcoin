'use strict';

var crypto = require('crypto');
var modella = require('modella');
var validators = require('modella-validators');
var filter = require('modella-filter');
var provable = require('provably-fair-npm');
var HTTPError = require('httperror-npm');
var async = require('async');

module.exports = function(modelStore, PlayerInterface, logger) {

    var Game = modella('roulette')
            .attr('_id')
            .attr('server_seed', {required: true, format: /[a-f0-9]{32}/}) // server_seed is always 16 bytes of hex
            .attr('seed_hash', {required: true, format: /[a-f0-9]+/}) // seed_hash is a hex encoded sha256
            .attr('init_time', {required: true, type: 'number'}) // init_time is the unix timestamp of the game init
            .attr('init_array', {required: true, type: 'string', format: /[0-9,]+/}) // comma separated number list
            .attr('initial_hash', {required: true, format: /[a-f0-9]+/}) // initial_hash is a hex encoded sha256
            .attr('final_array', {type: 'string', format: /[0-9,]+/}) // comma separated number list
            .attr('player_id')
            .attr('player_alias')
            .attr('payout_multiplier')
            .attr('payouts')
            .attr('result')
            .attr('bets') // the bets
            .attr('wager', {type: 'number'})
            .attr('client_seed')
            .attr('winnings', {type: 'number'})
            .attr('ip', {format: /([0-9]{1,3}\.){3}[0-9]{1,3}/, filtered: true})
            .attr('lock')
            .attr('createdAt'); // createdAt is the Date object of when the game was actually played

    Game.use(validators);
    Game.use(modelStore);
    Game.use(filter);

    var unplayedCleanup = function() {
        var cutoff = new Date(new Date() - (60*60*1000)); // 1 hour old
        Game.removeAll({
            init_time: {$lt: cutoff.getTime()},
            client_seed: {$exists: false}
        }, function(err, removed) {
            if (err) return logger.error(err.message);
            logger.info("removed %d old, unplayed records", removed);
            setTimeout(unplayedCleanup, (60 * 60 * 1000));
        });
    };
    unplayedCleanup();

    // shuffles an array based on a seed value
    // the result will always be the same with identical seed and items input
    // the code for this function is published as part of the provably fair system
    var seededShuffle = function(items, seed) {
        var counter = items.length;
        var partialDivisor = (parseInt('ffff', 16) + 1);
        var spinMin = 0;
        var spinMax = items.length - 1;
        while (counter > 0) {
            var sha = crypto.createHash('sha256');
            var partial = sha.update("" + counter + seed).digest('hex').substring(0, 4);
            var rand = parseInt(partial, 16) / partialDivisor;
            var randIndex = Math.floor(rand * (spinMax - spinMin + 1) + spinMin);
            counter--;
            var tmp = items[counter];
            items[counter] = items[randIndex];
            items[randIndex] = tmp;
        }
        return items;
    };


    /**
     * play
     *
     * The play function takes a client seed and a wager, along with
     * any other game params the user must specify
     *
     * The client seed is used to make a second shuffle after the
     * server seed has been used
     *
     * The player interface is used to debit and credit the user's
     * account based on the wager and resulting payout
     */

    Game.prototype.play = function(params, cb) {
        // don't let a game be played twice!
        if (this.has('client_seed')) {
            logger.warn('someone tried to play a game twice! - %s', this.player_id());
            return cb(new HTTPError(400, "this game has already been played"));
        }
        var self = this;
        // get params from object
        var client_seed = params.client_seed.toString();
        var bets = params.bets;
        var wager = params.wager;

        var player_id = params.player_id;
        var ip = params.ip;

        logger.info("playing seed: ",client_seed," with bets",JSON.stringify(bets));
        var initArray = self.init_array().split(',');
        // shuffle the init array with the server seed
        var serverArray = seededShuffle(initArray, self.server_seed());
        //shuffle the server array with the client seed
        var finalArray = seededShuffle(serverArray, client_seed);
        // result is the first number of the final array
        var result = parseInt(finalArray[0],10);

        var payouts = getPayouts({bets:bets,result:result});
        var payout_multiplier = parseFloat(payouts.sum+0,10)/parseFloat(wager+0,10);
        var winnings = payouts.sum;

        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));

        // debit the player for the wager they made, even if it was 0
        // (the player server will allow this, and it is used to track
        // "free games" if they are allowed)
        var debitPlayer = function(done) {
            PlayerInterface.debit(player_id, wager, {
                type: "roulette:wager",
                refId: "wager:" + self.primary(),
                meta: {
                    houseEdge:0.027,
                    gameOdds: payouts.gameOdds
                }
            }, function(err, player) {
                if (err) return done(new HTTPError(500, "error debiting the player: " + err.message));
                return done(undefined, player);
            });
        };
        var playGame = function(player, done) {

            logger.debug('##### playing game %s for %s (%s) #####', self.primary(), player.alias, player_id);
            logger.debug('result');

            logger.debug('wager %d winnings %d player profit %d',
                         wager.toBitcoin(),
                         winnings.toBitcoin(),
                         (winnings - wager).toBitcoin());
            // assign the new values to the self
            self.set({
                player_id: player._id,
                player_alias: player.alias,
                wager: wager,
                client_seed: client_seed,
                winnings: winnings,
                result: result,
                final_array: finalArray.join(','),
                bets: bets,
                payouts: payouts.betpayouts,
                payout_multiplier: payout_multiplier,
                ip: ip,
                lock: false,
                createdAt: new Date(),
            });
            logger.debug('##### done playing game %s for %s (%s) #####', self.primary(), player.alias, player_id);
            // save the game data
            self.save(function(err) {
                if (err) return done(new HTTPError(500, "error saving game data after spin!: " + err.message));
                // credit the user their winnings, if any
                if (winnings > 0 && PlayerInterface !== null) {
                    PlayerInterface.credit(player._id, winnings, {
                        type: "roulette:winnings",
                        refId: "winnings:" + self.primary()
                    }, function(err) {
                        if (err) return done(new HTTPError(500, "error crediting player!: " + err.message));
                        return done(undefined, self);
                    });
                } else {
                    return done(undefined, self);
                }
            });
        };
        var waterfall = [playGame];
        // ignore debit for testing/simulation
        if (PlayerInterface !== null) {
            waterfall.unshift(debitPlayer.bind(this));
        } else {
            waterfall.unshift(function(done) {
                done(undefined, {alias: "simulation", _id: "simulation"});
            });
        }
        async.waterfall(waterfall, function(err) {
            if (err) return cb(err);
            return cb(undefined, self);
        });
    };

    var getPayouts = function(game) {

        var betmap = {
            "[0]":36,
            "[1]":36,
            "[2]":36,
            "[3]":36,
            "[4]":36,
            "[5]":36,
            "[6]":36,
            "[7]":36,
            "[8]":36,
            "[9]":36,
            "[10]":36,
            "[11]":36,
            "[12]":36,
            "[13]":36,
            "[14]":36,
            "[15]":36,
            "[16]":36,
            "[17]":36,
            "[18]":36,
            "[19]":36,
            "[20]":36,
            "[21]":36,
            "[22]":36,
            "[23]":36,
            "[24]":36,
            "[25]":36,
            "[26]":36,
            "[27]":36,
            "[28]":36,
            "[29]":36,
            "[30]":36,
            "[31]":36,
            "[32]":36,
            "[33]":36,
            "[34]":36,
            "[35]":36,
            "[36]":36,
            "[0,1]":18,
            "[0,2]":18,
            "[0,3]":18,
            "[1,2]":18,
            "[2,3]":18,
            "[4,5]":18,
            "[5,6]":18,
            "[7,8]":18,
            "[8,9]":18,
            "[10,11]":18,
            "[11,12]":18,
            "[13,14]":18,
            "[14,15]":18,
            "[16,17]":18,
            "[17,18]":18,
            "[19,20]":18,
            "[20,21]":18,
            "[22,23]":18,
            "[23,24]":18,
            "[25,26]":18,
            "[26,27]":18,
            "[28,29]":18,
            "[29,30]":18,
            "[31,32]":18,
            "[32,33]":18,
            "[34,35]":18,
            "[35,36]":18,
            "[1,4]":18,
            "[2,5]":18,
            "[3,6]":18,
            "[4,7]":18,
            "[5,8]":18,
            "[6,9]":18,
            "[7,10]":18,
            "[8,11]":18,
            "[9,12]":18,
            "[10,13]":18,
            "[11,14]":18,
            "[12,15]":18,
            "[13,16]":18,
            "[14,17]":18,
            "[15,18]":18,
            "[16,19]":18,
            "[17,20]":18,
            "[18,21]":18,
            "[19,22]":18,
            "[20,23]":18,
            "[21,24]":18,
            "[22,25]":18,
            "[23,26]":18,
            "[24,27]":18,
            "[25,28]":18,
            "[26,29]":18,
            "[27,30]":18,
            "[28,31]":18,
            "[29,32]":18,
            "[30,33]":18,
            "[31,34]":18,
            "[32,35]":18,
            "[33,36]":18,
            "[0,1,2]":12,
            "[0,2,3]":12,
            "[1,2,3]":12,
            "[4,5,6]":12,
            "[7,8,9]":12,
            "[10,11,12]":12,
            "[13,14,15]":12,
            "[16,17,18]":12,
            "[19,20,21]":12,
            "[22,23,24]":12,
            "[25,26,27]":12,
            "[28,29,30]":12,
            "[31,32,33]":12,
            "[34,35,36]":12,
            "[1,2,4,5]":9,
            "[2,3,5,6]":9,
            "[4,5,7,8]":9,
            "[5,6,8,9]":9,
            "[7,8,10,11]":9,
            "[8,9,11,12]":9,
            "[10,11,13,14]":9,
            "[11,12,14,15]":9,
            "[13,14,16,17]":9,
            "[14,15,17,18]":9,
            "[16,17,19,20]":9,
            "[17,18,20,21]":9,
            "[19,20,22,23]":9,
            "[20,21,23,24]":9,
            "[22,23,25,26]":9,
            "[23,24,26,27]":9,
            "[25,26,28,29]":9,
            "[26,27,29,30]":9,
            "[28,29,31,32]":9,
            "[29,30,32,33]":9,
            "[31,32,34,35]":9,
            "[32,33,35,36]":9,
            "[0,1,2,3]":9,
            "[1,2,3,4,5,6]":6,
            "[4,5,6,7,8,9]":6,
            "[7,8,9,10,11,12]":6,
            "[10,11,12,13,14,15]":6,
            "[13,14,15,16,17,18]":6,
            "[16,17,18,19,20,21]":6,
            "[19,20,21,22,23,24]":6,
            "[22,23,24,25,26,27]":6,
            "[25,26,27,28,29,30]":6,
            "[28,29,30,31,32,33]":6,
            "[31,32,33,34,35,36]":6,
            "[1,4,7,10,13,16,19,22,25,28,31,34]":3,
            "[2,5,8,11,14,17,20,23,26,29,32,35]":3,
            "[3,6,9,12,15,18,21,24,27,30,33,36]":3,
            "[1,2,3,4,5,6,7,8,9,10,11,12]":3,
            "[13,14,15,16,17,18,19,20,21,22,23,24]":3,
            "[25,26,27,28,29,30,31,32,33,34,35,36]":3,
            "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]":2,
            "[2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36]":2,
            "[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]":2,
            "[2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]":2,
            "[1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35]":2,
            "[19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36]":2,
            "round[0]": 36,
            "round[1]": 36,
            "round[2]": 36,
            "round[3]": 36,
            "round[4]": 36,
            "round[5]": 36,
            "round[6]": 36,
            "round[7]": 36,
            "round[8]": 36,
            "round[9]": 36,
            "round[10]": 36,
            "round[11]": 36,
            "round[12]": 36,
            "round[13]": 36,
            "round[14]": 36,
            "round[15]": 36,
            "round[16]": 36,
            "round[17]": 36,
            "round[18]": 36,
            "round[19]": 36,
            "round[20]": 36,
            "round[21]": 36,
            "round[22]": 36,
            "round[23]": 36,
            "round[24]": 36,
            "round[25]": 36,
            "round[26]": 36,
            "round[27]": 36,
            "round[28]": 36,
            "round[29]": 36,
            "round[30]": 36,
            "round[31]": 36,
            "round[32]": 36,
            "round[33]": 36,
            "round[34]": 36,
            "round[35]": 36,
            "round[36]": 36,
            "voisins[15,12,32,35,0,3,26,26]": 4.5,
            "orphelins[6,9,14,17,17,20,31,34,1,1]": 3.6,
            "tiers[5,8,10,11,13,16,23,24,27,30,33,36]": 3
        };
        var round = /(voisins|orphelins|tiers|round)(\[.+\])/;
        var payoutsum = 0;
        var betpayouts = {};
        var possible = [];

        for (var i in game.bets) {
            if(game.bets.hasOwnProperty(i)) {
                var thispayout = betmap[i];
                var isRoundBet = false;
                var j, numbers, number;
                if (round.test(i)) {
                    isRoundBet = true;
                    var matches = round.exec(i);
                    j = matches[2];
                }

                if (!isRoundBet) {
                    numbers = JSON.parse(i);
                    logger.info(numbers, i);
                    for (var x = 0; x < numbers.length; x++) {
                        number = numbers[x];
                        if (possible.indexOf(number) < 0) possible.push(number);
                        if (game.result === number) {
                            logger.info("won", number, "on bet", i, "for", game.bets[i]);
                            betpayouts[i] = thispayout;
                            payoutsum += thispayout * game.bets[i];
                        }
                    }
                } else {
                    numbers = JSON.parse(j);
                    logger.info(numbers, i);
                    for (var y = 0; y < numbers.length; y++) {
                        number = numbers[y];
                        if (possible.indexOf(number) < 0) possible.push(number);
                        if (game.result === number) {
                            if (betpayouts[i]) {
                                betpayouts[i] += thispayout;
                            } else {
                                betpayouts[i] = thispayout;
                            }
                            payoutsum += thispayout * game.bets[i];
                        }
                    }
                }
            }
        }

        logger.info("%d possible of 37, gameOdds = %d", possible.length, possible.length / 37);


        var result = {
            sum: payoutsum,
            betpayouts: betpayouts,
            gameOdds: possible.length / 37
        };
        return result;
    };


    /**
     * init
     *
     * the init function is used to generate a new game for the player
     * to play
     *
     * The provably fair library is used to generate the server's
     * seed, and hash it to be presented to the player
     *
     * In using this template, there maye be additional data that has
     * to be set up for your game, be sure to include the extra data
     * in any hash you send back to the player (see the circle-node
     * project as an example)
     *
     * In this case we simply generate a server seed to flip a coin
     */

    Game.init = function(cb) {
        logger.debug('Game.init');

        var server_seed = provable.getRandomSeed();
        var createTime = new Date().getTime();
        var initSeed = crypto.randomBytes(16).toString('hex');
        var unshuffled = [];

        for (var i = 0, max = 37; i < max; i++) {
            unshuffled.push(i);
        }

        var initArray = seededShuffle(unshuffled, initSeed);
        // hash the init array (comma separated string) with the server seed
        var initArraySha = crypto.createHash('sha256');
        initArraySha.update(JSON.stringify({
            initialArray: initArray.join(','),
            serverSeed: server_seed
        }));
        var initArrayHash = initArraySha.digest('hex');

        var newGame = new Game({
            server_seed: server_seed,
            // hash using the provable library's hashing function
            seed_hash: provable.sha256sum(server_seed),
            init_time: createTime,
            init_array: initArray.join(','),
            initial_hash: initArrayHash,
            lock: false
        });
        newGame.save(function(err) {
            if (err) {
                return cb(new HTTPError(500, err.message || err));
            }
            // only return a hash of the server seed and any other init info
            cb(undefined, {
                nextGameId: newGame.primary(),
                sha256: newGame.seed_hash()
            });
        });
    };

    Game.checkLock = function(gameId, cb) {
        Game.find(gameId, function(err, gameData) {
            if (err) return cb(new HTTPError(500, err.message));
            if (!gameData) return cb(new HTTPError(404, 'game not found'));
            if (gameData.lock()) return cb(new HTTPError(423, 'game is already in progress'));
            gameData.lock(true);
            gameData.save(function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                cb(undefined, gameData);
            });
        });
    };

    return Game;
};
