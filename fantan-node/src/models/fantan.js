'use strict';

var modella = require('modella');
var validators = require('modella-validators');
var filter = require('modella-filter');
var provable = require('provably-fair-npm');
var HTTPError = require('httperror-npm');
var async = require('async');

module.exports = function(modelStore, PlayerInterface, logger, GameLogic) {

    var Game = modella('fantan')
            .attr('_id')
            .attr('server_seed', {required: true, format: /[a-f0-9]{32}/}) // server_seed is always 16 bytes of hex
            .attr('seed_hash', {required: true, format: /[a-f0-9]+/}) // seed_hash is a hex encoded sha256
            .attr('init_time', {required: true, type: 'number'}) // init_time is the unix timestamp of the game init
            .attr('final_array', {type: 'string', format: /[0-9,]+/}) // comma separated number list
            .attr('player_id')
            .attr('player_alias')
            .attr('payout_multiplier')
            .attr('payouts')
            .attr('result')
            .attr('dices')
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
        var matrixSeed = provable.sha512hmac(client_seed, self.server_seed());
        console.log('client seed', client_seed);
        console.log('server seed', self.server_seed());
        console.log('matrix seed', matrixSeed);
        var dices = provable.seededMatrix(matrixSeed, {
            height: 1,
            width: 3,
            min: 1,
            max: 6
        });
        var result = dices[0];
        var payouts;
        try{
            payouts = GameLogic.getPayouts({bets:bets,dices:result});
        }catch(e){
            return cb(e);
        }
        var payout_multiplier = parseFloat(payouts.sum,10)/parseFloat(wager+0,10);
        var winnings = payouts.sum;

        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));

        // debit the player for the wager they made, even if it was 0
        // (the player server will allow this, and it is used to track
        // "free games" if they are allowed)
        var debitPlayer = function(done) {
            PlayerInterface.debit(player_id, wager, {
                type: "fantan:wager",
                refId: "wager:" + self.primary(),
                meta: {
                    houseEdge: payouts.houseEdge
                }
            }, function(err, player) {
                if (err) return done(new HTTPError(500, "error debiting the player: " + err.message));
                return done(undefined, player);
            });
        };
        var playGame = function(player, done) {

            logger.debug('##### playing game %s for %s (%s) #####', self.primary(), player.alias, player_id);
            logger.debug('result', result.join(','));

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
                dices: result,
                result: payouts.winningNumber,
                final_array: result.join(','),
                bets: bets,
                payouts: payouts.betPayouts,
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
                        type: "fantan:winnings",
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
        var newGame = new Game({
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
