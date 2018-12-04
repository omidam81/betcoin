'use strict';

var modella = require('modella');
var validators = require('modella-validators');
var filter = require('modella-filter');
var provable = require('provably-fair-npm');
var HTTPError = require('httperror-npm');

module.exports = function(modelStore, PlayerInterface, logger) {


    var Bet = modella('bet')
            .attr('_id')
            .attr('server_seed', {required: true, format: /[a-f0-9]{32}/}) // server_seed is always 16 bytes of hex
            .attr('seed_hash', {required: true, format: /[a-f0-9]+/}) // seed_hash is a hex encoded sha256
            .attr('init_time', {required: true, type: 'number'}) // init_time is the unix timestamp of the game init
            .attr('lock', {type: 'boolean'})
            .attr('lottery_id')
            .attr('lottery_interval')
            .attr('player_id')
            .attr('player_alias')
            .attr('wager', {type: 'number'})
            .attr('client_seed')
            .attr('combined_seed')
            .attr('ip', {format: /([0-9]{1,3}\.){3}[0-9]{1,3}/, filtered: true})
            .attr('createdAt'); // createdAt is the Date object of when the game was actually played

    Bet.use(validators);
    Bet.use(modelStore);
    Bet.use(filter);

    var unplayedCleanup = function() {
        var cutoff = new Date(new Date() - (60*60*1000)); // 1 hour old
        Bet.removeAll({
            init_time: {$lt: cutoff.getTime()},
            client_seed: {$exists: false}
        }, function(err, removed) {
            if (err) return logger.error(err.message);
            logger.info("removed %d old, unplayed records", removed);
            setTimeout(unplayedCleanup, (60 * 60 * 1000));
        });
    };
    unplayedCleanup();

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

    Bet.prototype.play = function(params, cb) {
        // don't let a game be played twice!
        if (this.has('client_seed')) {
            logger.warn('someone tried to play a game twice! - %s', this.player_id());
            return cb(new HTTPError(400, "this game has already been played"));
        }
        var self = this;
        // get params from object
        var client_seed = params.client_seed;
        var wager = parseInt(params.wager, 10);
        var player_id = params.player_id;
        var ip = params.ip;
        var lotteryId = params.lottery.primary();
        var lotteryInterval = params.lottery.interval();
        if (!lotteryId) return cb(new HTTPError(400, "invalid lottery id"));
        var leftovers = (wager % params.lottery.ticket_price());
        if (leftovers) {
            logger.info("wager not divisible by ticket price, adjusting from %d to %d", wager.toBitcoinString(), (wager - leftovers).toBitcoinString());
            wager = wager - leftovers;
        }
        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));
        // debit the player for the wager they made, even if it was 0
        // (the player server will allow this, and it is used to track
        // "free games" if they are allowed)
        PlayerInterface.debit(player_id, wager, {
            type: "lottery:wager",
            refId: "wager:" + self.primary(),
        }, function(err, player) {
            if (err) return cb(new HTTPError(500, "error debiting the player: " + err.message));
            logger.info("%d tickets purchased for %s lottery by %s (%s)", wager / params.lottery.ticket_price(), params.lottery.interval(), player.alias, player._id, {});
            var combined_seed = provable.sha512hmac(client_seed, self.server_seed());
            // assign the new values to the self
            self.set({
                player_id: player._id,
                player_alias: player.alias,
                wager: wager,
                lottery_id: lotteryId,
                lottery_interval: lotteryInterval,
                combined_seed: combined_seed,
                client_seed: client_seed,
                ip: ip,
                createdAt: new Date(),
            });
            // save the game data
            self.save(function(err) {
                if (err) return cb(new HTTPError(500, "error saving game data after bet!: " + err.message));
                return cb(undefined, self);
            });
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

    Bet.init = function(cb) {
        logger.debug('Bet.init');
        var server_seed = provable.getRandomSeed();
        var createTime = new Date().getTime();
        var newBet = new Bet({
            server_seed: server_seed,
            // hash using the provable library's hashing function
            seed_hash: provable.sha256sum(server_seed),
            init_time: createTime,
            lock: false
        });
        newBet.save(function(err) {
            if (err) {
                return cb(new HTTPError(500, err.message || err));
            }
            // only return a hash of the server seed and any other init info
            cb(undefined, {
                nextGameId: newBet.primary(),
                sha256: newBet.seed_hash()
            });
        });
    };

    Bet.checkLock = function(gameId, cb) {
        Bet.find(gameId, function(err, gameData) {
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

    return Bet;
};
