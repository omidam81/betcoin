'use strict';

var crypto = require('crypto');
var HOUSE_EDGE = 0.0165;

module.exports = function(BaseGameModel, logger, HTTPError, provable) {

    var Game = BaseGameModel('coinflip')
        .attr('init_array', {required: true, type: 'string', format: /[0-9,]+/}) // comma separated number list
        .attr('initial_hash', {required: true, format: /[a-f0-9]+/}) // initial_hash is a hex encoded sha256
        .attr('final_array', {type: 'string', format: /[0-9,]+/}) // comma separated number list
        .attr('payout_multiplier')
        .attr('result')
        .attr('bet');

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
        var self = this;
        // get params from object
        var client_seed = params.client_seed.toString();
        var bet = params.bet;
        if(bet.sides.length > 2 || bet.sides.length === 0){
            return cb(new HTTPError(400, "only allowed bet for one or two coins"));
        }
        if(bet.flips > 1){
            return cb(new HTTPError(400, "not allowed bet for more than 1 flip for one game"));
        }
        for(var i=0;i<bet.sides.length;i++){
            if(bet.sides[i] !== 0 && bet.sides[i] !== 1){
                return cb(new HTTPError(400, "not allowed bet for more than 3 flips for one game"));
            }
        }
        var wager = parseInt(params.wager, 10);
        if (isNaN(wager)) return cb(new HTTPError(400, "invalid wager"));
        var player = params.user;
        var player_id = player.primary();
        var ip = params.ip;

        // logger.coinflip("playing seed: ",client_seed," with bet",JSON.stringify(bet));
        var initArray = self.init_array().split(',');
        // shuffle the init array with the server seed
        var serverArray = provable.seededShuffle(initArray, self.server_seed());
        //shuffle the server array with the client seed
        var finalArray = provable.seededShuffle(serverArray, client_seed);
        // result is the the final array
        var result = finalArray;

        var payouts;
        try {
            payouts = getPayouts({bet:bet,result:result, wager: wager});
        } catch (ex) {
            return cb(new HTTPError(ex.code || 500, ex.message));
        }
        var payout_multiplier = parseFloat(payouts.sum+0,10)/parseFloat(wager+0,10);
        var winnings = payouts.sum;

        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));

        // logger.coinflip('##### playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
        // logger.coinflip('result', result.join(','));

        // logger.coinflip('wager %d winnings %d player profit %d',
        //                 wager.toBitcoin(),
        //                 winnings.toBitcoin(),
        //                 (winnings - wager).toBitcoin());
        // assign the new values to the self
        self.set({
            player_id: player_id,
            player_alias: player.username(),
            currency: params.currency,
            wager: wager,
            client_seed: client_seed,
            winnings: winnings,
            result: result.join(','),
            //final_array: finalArray.join(','),
            bet: bet,
            payout_multiplier: payout_multiplier,
            ip: ip,
            lock: false,
            createdAt: new Date(),
        });
        logger.coinflip('##### done playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
        // save the game data
        self.save(function(err) {
            if (err) return cb(new HTTPError(500, "error saving game data after spin!: " + err.message));
            return cb(undefined, self);
        });
    };

    var getPayouts = function(game) {
        logger.coinflip(game);
        var payoutsum = 0;
        var sides = game.bet.sides;
        var coins = sides.length;
        var wager = game.wager;
        var result = game.result;
        var multiplier = 0;
        var possibles = 2;
        var result0 = parseInt(result[0], 10);
        var result1 = parseInt(result[1], 10);
        if (isNaN(result0)) throw "non int in result array, this is fucked up";
        if (isNaN(result1)) throw "non int in result array, this is fucked up";

        if (coins === 1) {
            if (result0 === sides[0]) {
                multiplier = 1.967;
            }
        } else if (coins === 2) {
            possibles = 4;
            if (result0 === sides[0] && result1 === sides[1]) {
                multiplier = 3.934;
            }
        } else {
            throw new HTTPError(400, "invalid number of coins");
        }


        payoutsum = multiplier * wager;
        logger.coinflip("multiplier %d wager %s payoutsum %s", multiplier, wager.toBitcoin(), payoutsum.toBitcoin());
        var resultData = {sum: payoutsum, houseEdge: HOUSE_EDGE, gameOdds:1/possibles};
        logger.coinflip(resultData);
        return resultData;
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
        // logger.coinflip('Game.init');

        var server_seed = provable.getRandomSeed();
        var createTime = new Date().getTime();
        var initSeed = crypto.randomBytes(16).toString('hex');
        //init heads and tails, 0 for heads, 1 for tails
        var unshuffled = [0,1,0,1,0,1,0,1,0,1,0,1];

        var initArray = provable.seededShuffle(unshuffled, initSeed);
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
