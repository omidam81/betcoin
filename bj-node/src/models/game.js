'use strict';

var modella = require('modella');
var validators = require('modella-validators');
var filter = require('modella-filter');
var provable = require('provably-fair-npm');
var HTTPError = require('httperror-npm');
var async = require('async');

module.exports = function(modelStore, GameLogic, PlayerInterface, logger) {

    var Game = modella('bj')
            .attr('_id')
            .attr('server_seed', {required: true, format: /[a-f0-9]{32}/}) // server_seed is always 16 bytes of hex
            .attr('seed_hash', {required: true, format: /[a-f0-9]+/}) // seed_hash is a hex encoded sha256
            .attr('init_time', {required: true, type: 'number'}) // init_time is the unix timestamp of the game init
            .attr('final_array')
            .attr('status')
            .attr('player_id')
            .attr('player_alias')
            .attr('winnings')
            .attr('player_hands')
            .attr('dealer_hand')
            .attr('remainingcards')
            .attr('wager', {type: 'number'})
            .attr('client_seed')
            .attr('ip', {format: /([0-9]{1,3}\.){3}[0-9]{1,3}/, filtered: true})
            .attr('lock')
            .attr('startedAt') // startedAt is the Date object of when the first game action was taken
            .attr('createdAt'); // createdAt is the Date object of when the game was actually played

    Game.use(validators);
    Game.use(modelStore);
    Game.use(filter);

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
                type: "bj:wager",
                refId: "wager:" + self.primary(),
            }, function(err, player) {
                if (err) return done(new HTTPError(500, "error debiting the player: " + err.message));
                return done(undefined, player);
            });
        };
        var playGame = function(player, done) {

            console.log("playing seed: ",client_seed);
            var winnings = 0;

            var status = 'began';
            var initVars = GameLogic.initHands(client_seed + self.server_seed(), wager, player);
            initVars.playerHands[0].wager = wager;
            var result = GameLogic.getResult({
                playerHands: initVars.playerHands,
                dealerHand: initVars.dealerHand,
                remainingCards: initVars.remainingCards
            });
            winnings = result.totalPayout || winnings;

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
                winnings: winnings,
                client_seed: client_seed,
                status: result.allFinished?'finished':status,
                player_hands: result.playerHands,
                dealer_hand: result.dealerHand,
                remainingcards: result.remainingCards,
                final_array: initVars.allCards,
                ip: ip,
                lock: false,
                startedAt: new Date(),
                createdAt: new Date()
            });
            logger.debug('##### done playing game %s for %s (%s) #####', self.primary(), player.alias, player_id);
            // save the game data
            self.save(function(err) {
                if (err) return done(new HTTPError(500, "error saving game data after game start: " + err.message));

                //hide dealer card's hold card
                if(!result.allFinished){
                    result.dealerHand.cards.splice(result.dealerHand.cards.length - 1, 1);
                    self.set({dealer_hand: result.dealerHand});
                }
                // credit the user their winnings, if any
                if (winnings > 0 && PlayerInterface !== null) {
                    PlayerInterface.credit(player._id, winnings, {
                        type: "bj:winnings",
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

    Game.prototype.nextAction = function(params, cb) {
        var self = this;
        var betType = params.bet;
        var wager = self.wager();
        var doNextAction = function(){
            var player = null;
            if (arguments.length > 1) {
                player = arguments[0];
            }
            var done = arguments[arguments.length - 1];
            var playerHands = self.player_hands();
            var dealerHand = self.dealer_hand();
            var remainingCards = self.remainingcards();
            for(var hand in playerHands){
                if(playerHands.hasOwnProperty(hand)){
                    if(playerHands[hand].finished){
                        continue;
                    }
                    playerHands[hand].betHistory = playerHands[hand].betHistory || [];
                    playerHands[hand].betHistory.push(betType);
                    break;
                }
            }
            var result;
            try{
                result = GameLogic.getResult({
                    playerHands: playerHands,
                    dealerHand: dealerHand,
                    remainingCards: remainingCards,
                    player: player,
                    wager: self.wager()
                });
                playerHands = result.playerHands;
                dealerHand = result.dealerHand;
                remainingCards = result.remainingCards;
            }catch(e){
                return done(e);
            }

            self.set({
                wager: wager,
                winnings: result.totalPayout,
                status: result.allFinished?'finished':'gaming',
                player_hands: playerHands,
                dealer_hand: dealerHand,
                remainingcards: remainingCards,
                lock: false,
                createdAt: new Date()
            });
            self.save(function(err){
                if (err) return done(new HTTPError(500, "error saving game data after spin!: " + err.message));
                //hide dealer card's hold card
                if(!result.allFinished){
                    result.dealerHand.cards.splice(result.dealerHand.cards.length - 1, 1);
                    self.set({dealer_hand: result.dealerHand});
                }
                // credit the user their winnings, if any
                if (self.winnings() > 0 && PlayerInterface !== null) {
                    PlayerInterface.credit(self.player_id(), self.winnings(), {
                        type: "bj:winnings",
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
        var debitPlayer = function(done) {
            PlayerInterface.debit(params.player_id, this.wager(), {
                type: "bj:wager",
                refId: "wager:" + this.primary() + ':' + betType,
                meta:{
                    houseEdge: 0.01248
                }
            }, function(err, player) {
                if (err) return done(new HTTPError(err.code || 500, "error debiting the player: " + err.message));
                //increment the wager amount
                return done(undefined, player);
            });
        };
        var waterfall = [doNextAction];
        if(betType === 'double' || betType === 'split'){
            wager *= 2;
            waterfall.unshift(debitPlayer.bind(this));
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
            if (gameData.status() === 'finished') return cb(new HTTPError(423, 'game has already been played'));
            gameData.lock(true);
            gameData.save(function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                cb(undefined, gameData);
            });
        });
    };

    return Game;
};
