'use strict';

var modella = require('modella');
var validators = require('modella-validators');
var filter = require('modella-filter');
var provable = require('provably-fair-npm');
var HTTPError = require('httperror-npm');
var async = require('async');

module.exports = function(modelStore, GameLogic, PlayerInterface, logger) {

    var Game = modella('oasis')
            .attr('_id')
            .attr('server_seed', {required: true, format: /[a-f0-9]{32}/}) // server_seed is always 16 bytes of hex
            .attr('seed_hash', {required: true, format: /[a-f0-9]+/}) // seed_hash is a hex encoded sha256
            .attr('init_time', {required: true, type: 'number'}) // init_time is the unix timestamp of the game init
            .attr('final_array')
            .attr('player_id')
            .attr('player_alias')
            .attr('payouts')
            .attr('payout_multiplier')
            .attr('dealer_hand')
            .attr('player_hand')
            .attr('is_win')
            .attr('is_push')
            .attr('is_fold')
            .attr('wager', {type: 'number'})
            .attr('status', {type: 'string'})
            .attr('client_seed')
            .attr('winnings', {type: 'number'})
            .attr('ip', {format: /([0-9]{1,3}\.){3}[0-9]{1,3}/, filtered: true})
            .attr('lock')
            .attr('startedAt') // startedAt is the Date object of when the first game action was taken
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
        var wager = parseInt(params.wager, 10);
        var player_id = params.player_id;
        var ip = params.ip;

        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));

        // debit the player for the wager they made, even if it was 0
        // (the player server will allow this, and it is used to track
        // "free games" if they are allowed)
        var debitPlayer = function(done) {
            PlayerInterface.debit(player_id, wager, {
                type: "oasis:wager",
                refId: "wager:" + self.primary(),
                meta: {
                    houseEdge: 0.0523
                }
            }, function(err, player) {
                if (err) return done(new HTTPError(500, "error debiting the player: " + err.message));
                return done(undefined, player);
            });
        };
        var playGame = function(player, done) {
            logger.info("playing seed: ",client_seed);
            var hands = GameLogic.initHands(client_seed + self.server_seed());
            var finalArray = hands.allCards;
            var playerHand = {
                initCards : hands.playerCards,
                rnk : hands.playerCardsRank,
                sub_rnk : hands.playerCardsSubRank
            };
            var dealerHand = {
                initCards : hands.dealerCards
            };

            logger.debug('##### playing game %s for %s (%s) #####', self.primary(), player.alias, player_id);
            logger.debug('result');

            // assign the new values to the self
            self.set({
                player_id: player._id,
                player_alias: player.alias,
                wager: wager,
                client_seed: client_seed,
                winnings: 0,
                final_array: finalArray,
                dealer_hand: dealerHand,
                player_hand: playerHand,
                status: 'began',
                ip: ip,
                lock: false,
                startedAt: new Date(),
                createdAt: new Date()
            });
            logger.debug('##### done playing game %s for %s (%s) #####', self.primary(), player.alias, player_id);
            // save the game data
            self.save(function(err) {
                if (err) return done(new HTTPError(500, "error saving game data after game start!: " + err.message));

                //hide dealer card's hold card
                dealerHand.initCards.splice(1, dealerHand.initCards.length - 1);
                self.set({dealer_hand: dealerHand});

                // credit the user their winnings, if any
                return done(undefined, self);
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
    
    Game.prototype.nextAction = function(params, cb) {
        var self = this;
        var isRaise = params.raise;
        var holds = params.holds;
        // debit the player for the wager they made, even if it was 0
        // (the player server will allow this, and it is used to track
        // "free games" if they are allowed)
        var debitPlayer = null;
        if (isRaise) {
            debitPlayer = function (done) {
                PlayerInterface.debit(self.player_id(), self.wager() * 2, {
                    type: "oasis:wager",
                    refId: "wager:" + self.primary() + ":raise",
                    meta: {
                        houseEdge: 0.0146
                    }
                }, function (err, player) {
                    if (err) return done(new HTTPError(500, "error debiting the player: " + err.message));
                    self.set({
                        wager: self.wager() + self.wager() * 2
                    });
                    return done(undefined, player);
                });
            };
        }

        var doNextAction = function(){
            var done = arguments[arguments.length - 1];

            var playerHand = self.player_hand();
            var dealerHand = self.dealer_hand();

            var result;
            try{
                console.log(JSON.stringify(dealerHand), JSON.stringify(playerHand));
                result = GameLogic.getResult(dealerHand, playerHand, self.wager(), isRaise, holds);
                console.log(result);
                playerHand = result.playerHand;
                dealerHand = result.dealerHand;
            }catch(e){
                console.log(result, e);
                if(e.code === 400){
                    return done(e);
                }else{
                    self.lock(true);
                    self.save(function(){
                        return done(e);
                    });
                }
                return;
            }

            self.set({
                winnings: result.payout,
                status: 'finished',
                player_hand: playerHand,
                dealer_hand: dealerHand,
                is_win: result.isWin,
                is_push: result.isPush,
                is_fold: result.isFold,
                lock: false,
                createdAt: new Date()
            });
            self.save(function(err){
                if (err) return done(new HTTPError(500, "error saving game data after spin!: " + err.message));

                // credit the user their winnings, if any
                if (self.winnings() > 0 && PlayerInterface !== null) {
                    PlayerInterface.credit(self.player_id(), self.winnings(), {
                        type: "oasis:winnings",
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
        var waterfall = [doNextAction];
        // ignore debit for testing/simulation
        if (isRaise) {
            if (PlayerInterface !== null) {
                waterfall.unshift(debitPlayer.bind(this));
            } else {
                waterfall.unshift(function (done) {
                    done(undefined, {alias: "simulation", _id: "simulation"});
                });
            }
        }
        async.waterfall(waterfall, function(err){
            if(err) return cb(err);
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
            if (gameData.startedAt()&&gameData.status()==='finished') return cb(new HTTPError(423, 'game has already been played'));
            gameData.save(function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                cb(undefined, gameData);
            });
        });
    };
    Game.prototype.switchAction = function(params, cb) {
        var self = this;
        var holds = params.holds;

        var doSwitchAction = function(){
            var done = arguments[arguments.length - 1];

            var playerHand = self.player_hand();

            try{
                console.log(JSON.stringify(playerHand));
                playerHand.initCard = GameLogic.getPlayerFinalCards(playerHand, holds, self.final_array());
            }catch(e){
                if(e.code === 400){
                    return done(e);
                }else{
                    self.lock(true);
                    self.save(function(){
                        return done(e);
                    });
                }
                return;
            }

            self.set({
                //is_win: result.is_win,
                //winnings: result.payout,
                status: 'switch',
                player_hand: playerHand,
                lock: false,
                createdAt: new Date()
            });
            self.save(function(err){
                if (err) return done(new HTTPError(500, "error saving game data after spin!: " + err.message));

                // credit the user their winnings, if any
                /*
                if (self.winnings() > 0 && PlayerInterface !== null) {
                    PlayerInterface.credit(self.player_id(), self.winnings(), {
                        type: "videopoker:winnings",
                        refId: "winnings:" + self.primary()
                    }, function(err) {
                        if (err) return done(new HTTPError(500, "error crediting player!: " + err.message));
                        return done(undefined, self);
                    });
                } else {
                    return done(undefined, self);
                }*/

            });
        };
        var waterfall = [doSwitchAction];
        async.waterfall(waterfall, function(err){
            if(err) return cb(err);
            return cb(undefined, self);
        });
    };
    return Game;
};
