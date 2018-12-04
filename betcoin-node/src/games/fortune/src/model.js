'use strict';

var crypto = require('crypto');

module.exports = function(BaseGameModel, GameLogic, logger, HTTPError, provable) {

    var Game = BaseGameModel('fortune')
        .attr('init_array', {required: true, type: 'string', format: /[0-9,]+/}) // comma separated number list
        .attr('initial_hash', {required: true, format: /[a-f0-9]+/}) // initial_hash is a hex encoded sha256
        .attr('final_array', {type: 'string', format: /[0-9,]+/}) // comma separated number list
        .attr('payout_multiplier')
        .attr('payouts')
        .attr('result')
        .attr('lucky_number')
        .attr('bets'); // the bets

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
        var wager = parseInt(params.wager, 10);

        var player = params.user;
        var player_id = player.primary();
        var ip = params.ip;

        // logger.fortune("playing seed: ",client_seed," with bets",JSON.stringify(bets));
        var initArray = self.init_array().split(',');
        // shuffle the init array with the server seed
        var serverArray = provable.seededShuffle(initArray, self.server_seed());
        //shuffle the server array with the client seed
        var finalArray = provable.seededShuffle(serverArray, client_seed);
        // result is the first number of the final array
        var result = parseInt(finalArray[0],10);
        var payouts = 0;
        try{
            payouts = GameLogic.getPayouts({bets:bets,result:result});
        }catch(e){
            return cb(e);
        }
        var payout_multiplier = parseFloat(payouts.sum+0,10)/parseFloat(wager+0,10);
        var winnings = payouts.sum;

        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));

        // logger.fortune('##### playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
        // logger.fortune('result');

        // logger.fortune('wager %d winnings %d player profit %d',
        //                wager.toBitcoin(),
        //                winnings.toBitcoin(),
        //                (winnings - wager).toBitcoin());
        // assign the new values to the self
        self.set({
            player_id: player_id,
            player_alias: player.username(),
            wager: wager,
            client_seed: client_seed,
            winnings: winnings,
            result: result,
            currency: params.currency,
            lucky_number: GameLogic.getLuckyNumberByResult(result),
            final_array: finalArray.join(','),
            bets: bets,
            payouts: payouts.betpayouts,
            payout_multiplier: payout_multiplier,
            ip: ip,
            lock: false,
            createdAt: new Date(),
        });
        logger.fortune('##### done playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
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
        logger.fortune('Game.init');

        var server_seed = provable.getRandomSeed();
        var createTime = new Date().getTime();
        var initSeed = crypto.randomBytes(16).toString('hex');
        var unshuffled = [];

        for (var i = 0; i < 51; i++) {
            unshuffled.push(i);
        }

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
