'use strict';

var crypto = require('crypto');
var modella = require('modella');
var validators = require('modella-validators');
var filter = require('modella-filter');
var provable = require('provably-fair-npm');
var HTTPError = require('httperror-npm');
var async = require('async');

// this object stores the bet count lookup table which determines the
// payout for a given match number: betCountMatchesMap[betCount][matches]

var betCountMatchesMap = {
    "1": {
        "0": 0,
        "1": 3.8
    },
    "2": {
        "0": 0,
        "1": 1,
        "2": 9.5
    },
    "3": {
        "0": 0,
        "1": 0,
        "2": 3.35,
        "3": 35
    },
    "4": {
        "0": 0,
        "1": 0,
        "2": 1,
        "3": 9.35,
        "4": 110
    },
    "5": {
        "0": 0,
        "1": 0,
        "2": 0,
        "3": 1,
        "4": 33.5,
        "5": 720
    },
    "6": {
        "0": 0,
        "1": 0,
        "2": 0,
        "3": 1,
        "4": 6,
        "5": 125,
        "6": 2000
    },
    "7": {
        "0": 0,
        "1": 0,
        "2": 0,
        "3": 1,
        "4": 2.3,
        "5": 32,
        "6": 350,
        "7": 5000
    },
    "8": {
        "0": 0,
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 1,
        "5": 12,
        "6": 103,
        "7": 1700,
        "8": 30000
    }
};

var extracted = 20; // numbers of balls which are extracted

module.exports = function(modelStore, PlayerInterface, logger) {

    var Game = modella('keno')
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
        try {
            var betsTmp = [];
            bets.forEach(function(bet) {
                if (betsTmp.indexOf(bet) >= 0) {
                    throw new HTTPError(418, "You can only place a bet once on each number");
                } else {
                    betsTmp.push(bet);
                }
            });
        } catch (ex) {
            return cb(ex);
        }
        var wager = params.wager;

        var player_id = params.player_id;
        var ip = params.ip;
        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));

        // debit the player for the wager they made, even if it was 0
        // (the player server will allow this, and it is used to track
        // "free games" if they are allowed)
        var debitPlayer = function(done) {
            PlayerInterface.debit(player_id, wager, {
                type: "keno:wager",
                refId: "wager:" + self.primary(),
            }, function(err, player) {
                if (err) return done(new HTTPError(500, "error debiting the player: " + err.message));
                return done(undefined, player);
            });
        };
        var playGame = function(player, done) {

            logger.info("playing seed: ",client_seed," with bets",JSON.stringify(bets));
            var initArray = self.init_array().split(',');
            // shuffle the init array with the server seed
            var serverArray = seededShuffle(initArray, self.server_seed());
            //shuffle the server array with the client seed
            var finalArray = seededShuffle(serverArray, client_seed);

            var result = [];

            for(var i=0; i<extracted; i++) {
              result.push(parseInt(finalArray[i],10));
            }

            var payout_multiplier = getPayouts({bets:bets,result:result});

            var payout = wager * payout_multiplier;

            logger.debug('##### playing game %s for %s (%s) #####', self.primary(), player.alias, player_id);
            logger.debug('result');

            logger.debug('wager %d winnings %d player profit %d',
                         wager.toBitcoin(),
                         payout.toBitcoin(),
                         (payout - wager).toBitcoin());
            // assign the new values to the self
            self.set({
                player_id: player._id,
                player_alias: player.alias,
                wager: wager,
                client_seed: client_seed,
                winnings: payout,
                result: result,
                final_array: finalArray.join(','),
                bets: bets,
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
                if (payout > 0 && PlayerInterface !== null) {
                    PlayerInterface.credit(player._id, payout, {
                        type: "keno:winnings",
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
      var matches = 0;

      for(var i=0; i<game.bets.length; i++) {
        if(game.result.indexOf(game.bets[i]) !== -1) {
          matches++;
        }
      }

      return betCountMatchesMap[game.bets.length.toString()][matches.toString()];
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

        for (var i = 1, max = 80; i <= max; i++) {
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
