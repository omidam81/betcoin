'use strict';

var crypto = require('crypto');
var MAX_ROLL = 65535;
var LOSE_PAYOUT = 0.005;
var HOUSE_EDGE = 0.0188;

module.exports = function(BaseGameModel, logger, HTTPError, provable) {

    var Game = BaseGameModel('dice')
        .attr('payout_multiplier')
        .attr('result')
        .attr('gameTarget', {type: 'number'}); // the game played

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

    Game.MAX_ROLL= MAX_ROLL;
    Game.HOUSE_EDGE = HOUSE_EDGE;

    Game.prototype.play = function(params, cb) {
        var self = this;
        // get params from object
        var client_seed = params.client_seed.toString();
        var gameTarget = parseInt(params.gameTarget, 10);
        if (isNaN(gameTarget)) return cb(new HTTPError(400, "Invalid game target"));
        var wager = parseInt(params.wager, 10);
        var player = params.user;
        var player_id = player.primary();
        var ip = params.ip;
        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));
        if(gameTarget >= MAX_ROLL) {
            return cb(new HTTPError(400, 'invalid game selection'));
        }
        // logger.dice("playing seed: %s with target %d for player %s (%s)", client_seed, gameTarget, player.username(), player_id, {});

        var hmac = crypto.createHmac('sha512', this.server_seed());
        hmac.update(client_seed);
        var hmachash = hmac.digest('hex');
        var partial = hmachash.substring(0, 4);
        var result = parseInt(partial, 16);
        if (result > MAX_ROLL) {
            throw {
                message: "Server computation error."
            };
        }
        // get the target for this game an determine if the play was a win
        var win = result < gameTarget;
        var winnings = 0;
        var payout = getPayout(gameTarget);
        if (win) {
            winnings = Math.floor(wager * payout);
        } else {
            winnings = Math.floor(wager * LOSE_PAYOUT);
        }

        // logger.dice('##### playing game %s for %s (%s) #####', this.primary(), player.username(), player_id, {});
        // logger.dice('result');

        // logger.dice('wager %d winnings %d player profit %d',
        //              wager.toBitcoin(),
        //              winnings.toBitcoin(),
        //              (winnings - wager).toBitcoin());
        // assign the new values to the self
        this.set({
            player_id: player_id,
            player_alias: player.username(),
            wager: wager,
            currency: params.currency,
            client_seed: client_seed,
            winnings: winnings,
            result: result,
            gameTarget: gameTarget,
            payout_multiplier: payout,
            ip: ip,
            lock: false,
            createdAt: new Date(),
        });
        logger.dice('##### done playing game %s for %s (%s) #####', this.primary(), player.username(), player_id, {});
        // save the game data
        this.save(function(err) {
            if (err) return cb(new HTTPError(500, "error saving game data after spin!: " + err.message));
            return cb(undefined, self);
        });
    };

    var getOdds = function(gameTarget) {
        return (1 - ((MAX_ROLL + 1 - gameTarget) / (MAX_ROLL + 1)));
    };

    var getPayout = function(gameTarget) {
        var odds = getOdds(gameTarget);
        var loseOdds = 1 - odds;
        var payout = 1 + (((HOUSE_EDGE * -1) - (LOSE_PAYOUT - 1) * loseOdds) / (odds));
        return payout;
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
        // logger.dice('Game.init');


        var server_seed = provable.getRandomSeed();
        var createTime = new Date().getTime();
        var newGame = new Game({
            player_id: user.primary(),
            player_alias: user.username(),
            server_seed: server_seed,
            // hash using the provable library's hashing function
            seed_hash: provable.sha256sum(server_seed),
            init_time: createTime,
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
