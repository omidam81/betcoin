'use strict';

var crypto = require('crypto');

module.exports = function(BaseGameModel, logger, HTTPError, provable) {

    var Game = BaseGameModel('keno')
            .attr('init_array', {required: true, type: 'string', format: /[0-9,]+/}) // comma separated number list
            .attr('initial_hash', {required: true, format: /[a-f0-9]+/}) // initial_hash is a hex encoded sha256
            .attr('final_array', {type: 'string', format: /[0-9,]+/}) // comma separated number list
            .attr('payout_multiplier')
            .attr('result')
            .attr('bets'); // the bets

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

    var getPayouts = function(game) {
        var matches = 0;

        for(var i=0; i<game.bets.length; i++) {
            if(game.result.indexOf(game.bets[i]) !== -1) {
                matches++;
            }
        }
        logger.keno('##### bets %s, matches %s #####', game.bets.length, matches);
        return betCountMatchesMap[game.bets.length.toString()][matches.toString()];
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

        var player = params.user;
        var player_id = player.primary();
        var ip = params.ip;
        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));

        // logger.keno("playing seed: ",client_seed," with bets",JSON.stringify(bets));
        var initArray = self.init_array().split(',');
        // shuffle the init array with the server seed
        var serverArray = seededShuffle(initArray, self.server_seed());
        //shuffle the server array with the client seed
        var finalArray = seededShuffle(serverArray, client_seed);

        var result = [];

        for(var i=0; i<extracted; i++) {
          result.push(parseInt(finalArray[i],10));
        }

        var payout_multiplier = 0;
        if (bets.length > 0) {
            payout_multiplier = getPayouts({bets:bets,result:result});
        }
        var payout = wager * payout_multiplier;


        // logger.keno('##### playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
        // logger.keno('result');

        // logger.keno('wager %d winnings %d player profit %d',
        //              wager.toBitcoin(),
        //              payout.toBitcoin(),
        //              (payout - wager).toBitcoin());
        // assign the new values to the self
        self.set({
            player_id: player_id,
            player_alias: player.username(),
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
        logger.keno('##### done playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
        // save the game data
        self.save(function(err) {
            if (err) return cb(new HTTPError(500, "error saving game data after spin!: " + err.message));
            return cb(undefined, self);
        });
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

    Game.init = function(user, cb) {
        // logger.keno('Game.init');

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
            player_id: user.primary(),
            player_alias: user.username(),
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

    return Game;
};
