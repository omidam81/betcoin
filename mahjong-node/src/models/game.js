'use strict';


var modella = require('modella');
var validators = require('modella-validators');
var filter = require('modella-filter');
var provable = require('provably-fair-npm');
var HTTPError = require('httperror-npm');
var async = require('async');

module.exports = function(modelStore, GameLogic, PlayerInterface, logger) {

    var Game = modella('mahjong')
            .attr('_id')
            .attr('last_game_id')
            .attr('init_time', {required: true, type: 'number'}) // init_time is the unix timestamp of the game init
            .attr('player_id')
            .attr('player_alias')
            .attr('server_seed', {required: true, format: /[a-f0-9]{32}/}) // server_seed is always 16 bytes of hex
            .attr('seed_hash', {required: true, format: /[a-f0-9]+/}) // seed_hash is a hex encoded sha256
            .attr('client_seed')
            .attr('final_array')
            .attr('player_seat') // east|south|west|north
            .attr('players_hand')
            .attr('remaining_hand')
            .attr('is_win')
            .attr('is_push')
            .attr('wager', {type: 'number'})
            .attr('status', {type: 'string'})
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
        var lastGameId = params.last_game_id;
        var player_id = params.player_id;
        var ip = params.ip;
        var client_seed = params.client_seed;
        var wager = parseInt(params.wager, 10);
        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));

        var playGame = function(player, done) {
            logger.info("playing seed: ",client_seed);
            var lastHistory = self.lastResult;
            var previous = '';
            if(lastHistory){
                previous = lastHistory.seat();
            }
            var hands = GameLogic.initHands(client_seed + self.server_seed(), previous);

            logger.debug('##### playing game %s for %s (%s) #####', self.primary(), player.alias, player_id);
            logger.debug('result');


            // assign the new values to the self
            self.set({
                player_id: player._id,
                player_alias: player.alias,
                wager: wager,
                client_seed: client_seed,
                last_game_id: lastGameId,
                winnings: 0,
                final_array: hands.allTiles,
                players_hand: hands.playersHand,
                player_seat: hands.seat,
                status: 'began',
                ip: ip,
                lock: false,
                startedAt: new Date(),
                createdAt: new Date()
            });
            logger.debug('##### done playing game %s for %s (%s) #####', self.primary(), player.alias, player_id);
            // save the game data
            self.save(function(err) {
                if (err) return done(new HTTPError(500, "error saving game data after game start: " + err.message));
                // credit the user their winnings, if any
                return done(undefined, self);
            });
        };
        var debitPlayer = function(done) {
            PlayerInterface.debit(player_id, wager, {
                type: "mahjong:wager",
                refId: "wager:" + self.primary()
            }, function(err, player) {
                if (err) return done(new HTTPError(500, "error debiting the player: " + err.message));
                return done(undefined, player);
            });
        };
        var getLastResult = function(){
            var done = arguments[arguments.length - 1];
            if(!lastGameId){
                return done();
            }

            Game.find(lastGameId, function(err, gameData){
                if(err) return done(new HTTPError(500, 'internal error'));
                if(gameData.player_id() !== player_id){
                    return done(new HTTPError(418, 'You cannot play for another player'));
                }
                if(gameData.status() !== 'finished'){
                    return done(new HTTPError(418, 'You cannot play next game until current game is finished'));
                }
                self.lastResult = gameData;
                done();
            });
        };
        var waterfall = [getLastResult, playGame];
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
        logger.debug('Game.nextAction');
        //TODO: nextAction params
        var self = this;
        var split = params.split;
        var houseWay = params.house_way;

        var doNextAction = function(){
            var done = arguments[arguments.length - 1];
            var playerHand = self.player_hand();
            var dealerHand = self.dealer_hand();

            var result;
            try{
                result = GameLogic.getResult({
                    playerHand: playerHand,
                    dealerHand: dealerHand,
                    split: split,
                    wager: self.wager(),
                    houseWay: houseWay
                });
                playerHand = result.playerHand;
                dealerHand = result.dealerHand;
            }catch(e){
                console.log(result, houseWay, e);
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
                lock: false,
                createdAt: new Date()
            });
            self.save(function(err){
                if (err) return done(new HTTPError(500, "error saving game data after spin!: " + err.message));
                // credit the user their winnings, if any
                if (self.winnings() > 0 && PlayerInterface !== null) {
                    PlayerInterface.credit(self.player_id(), self.winnings(), {
                        type: "mahjong:winnings",
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

            Game.find({last_game_id: gameData.last_game_id()}, function(err, exist){
                if(err) return cb(new HTTPError(500, err.message));
                if(gameData.last_game_id()&&exist) return cb(new HTTPError(419, 'the game has been played'));
                gameData.lock(true);
                gameData.save(function(err) {
                    if (err) return cb(new HTTPError(500, err.message));
                    cb(undefined, gameData);
                });
            });
        });
    };

    return Game;
};
