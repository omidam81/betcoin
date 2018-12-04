'use strict';
//TODO: check wager calculation

var modella = require('modella');
var validators = require('modella-validators');
var filter = require('modella-filter');
var provable = require('provably-fair-npm');
var HTTPError = require('httperror-npm');
var async = require('async');

module.exports = function(modelStore, GameLogic, PlayerInterface, logger) {

    var Game = modella('craps')
            .attr('_id')
            .attr('last_game_id')
            .attr('init_time', {required: true, type: 'number'}) // init_time is the unix timestamp of the game init
            .attr('player_id')
            .attr('player_alias')
            .attr('server_seed', {required: true, format: /[a-f0-9]{32}/}) // server_seed is always 16 bytes of hex
            .attr('seed_hash', {required: true, format: /[a-f0-9]+/})
            .attr('client_seed')
            .attr('losts')
            .attr('wins')
            .attr('pushes')
            .attr('options')
            .attr('table')
            .attr('dices')
            .attr('wager')
            .attr('affected_wager')
            .attr('win_bets_up')
            .attr('winnings', {type: 'number'})
            .attr('return_bets')
            .attr('ip', {format: /([0-9]{1,3}\.){3}[0-9]{1,3}/, filtered: true})
            .attr('lock')
            .attr('startedAt') // startedAt is the Date object of when the first game action was taken
            .attr('createdAt'); // createdAt is the Date object of when the game was actually played

    Game.use(validators);
    Game.use(modelStore);
    Game.use(filter);

    var getAllBets = function(bets) {
        var wager = 0;
        for(var bet in bets) {
            if (bets.hasOwnProperty(bet)) {
                if (bets[bet] && bets[bet] > 0) {
                    wager += bets[bet];
                }
                continue;
            }
        }
        return wager;
    };

    Game.prototype.play = function(params, cb) {
        var self = this;
        var lastGameId = params.lastGameId;
        var player_id = params.player_id;
        var player_alias;
        var ip = params.ip;
        var client_seed = params.client_seed;
        var table = {bets: params.bets};
        var dices = GameLogic.rolldice(client_seed, self.server_seed());
        var wager = getAllBets(table.bets);
        var win_bets_up = params.win_bets_up;
        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));

        // history
        var playGame = function(){
            var done = arguments[arguments.length - 1];
            var lastHistory = self.lastResult;
            var previous = {};
            if(lastHistory){
                previous = lastHistory.table();
            }
            var result;
            try{
                result = GameLogic.getResults({table:table, dices:dices, previous: previous, win_bets_up: win_bets_up});
            }catch(e){
                return cb(e);
            }
            logger.debug('wager %d winnings %d player profit %d current dice %d last thepoint %d',
                         wager.toBitcoin(),
                         result.winnings.toBitcoin(),
                         (result.winnings - wager).toBitcoin(),
                         result.totalpoint,
                         previous.thepoint||0);

            self.set({
                client_seed: client_seed,
                last_game_id: lastGameId,
                wins: result.wins,
                losts: result.losts,
                pushes: result.pushes,
                affected_wager: result.affectedWager,
                win_bets_up: win_bets_up,
                dices: dices,
                wager: wager,
                winnings: result.winnings,
                table: result.table,
                player_id: player_id,
                player_alias: player_alias,
                ip: ip,
                lock: false,
                createdAt: new Date()
            });
            self.save(function(err){
                if (err) return done(new HTTPError(500, "error saving game data after spin!: " + err.message));
                self.set({options: GameLogic.analyzeOptions(result.table)});
                // credit the user their winnings, if any
                if (result.winnings > 0 && PlayerInterface !== null) {
                    PlayerInterface.credit(self.player_id(), result.winnings, {
                        type: "craps:winnings",
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
            var houseEdge = 0;
            if(wager > 0){
                houseEdge = GameLogic.getHouseEdge(table.bets);
            }
            logger.debug('house edge', houseEdge);
            PlayerInterface.debit(player_id, wager, {
                type: "craps:wager",
                refId: "wager:" + this.primary(),
                meta:{
                    houseEdge: houseEdge
                }
            }, function(err, player) {
                if (err) return done(new HTTPError(500, "error debiting the player: " + err.message));
                //increment the wager amount
                player_alias = player.alias;
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
        async.waterfall(waterfall, function(err){
            if(err) return cb(err);
            return cb(undefined, self);
        });
     };

    Game.prototype.returnBets = function(params, cb){
        var self = this;
        var returnBets = params.return_bets;
        var lastGameId = params.lastGameId;
        var player_id = params.player_id;

        var returnBetsAction = function(){
            var done = arguments[arguments.length - 1];
            var previousGame = self.lastResult;
            if(previousGame){
                previousGame = previousGame.filter();
            }else{
                previousGame = {};
            }
            var totalReturnWager;
            try{
                totalReturnWager = GameLogic.returnBets(returnBets, previousGame.table);
            }catch(ex){
                console.log(ex);
                return cb(ex);
            }
            logger.debug('return total wager $d', totalReturnWager.toBitcoin());

            self.set({
                winnings: totalReturnWager,
                affected_wager: totalReturnWager,
                return_bets: true,
                options: GameLogic.analyzeOptions(previousGame.table),
                table: previousGame.table,
                player_id: previousGame.player_id,
                player_alias: previousGame.player_alias,
                lock: false,
                createdAt: new Date()
            });
            self.save(function(err){
                if (err) return done(new HTTPError(500, "error saving game data after spin!: " + err.message));
                // credit the user their winnings, if any
                if (previousGame.winnings > 0 && PlayerInterface !== null) {
                    PlayerInterface.credit(self.player_id(), previousGame.winnings, {
                        type: "craps:winnings",
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
            PlayerInterface.debit(player_id, 0, {
                type: "craps:wager",
                refId: "wager:" + this.primary()
            }, function(err, player) {
                if (err) return done(new HTTPError(500, "error debiting the player: " + err.message));
                //increment the wager amount
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
                self.lastResult = gameData;
                done();
            });
        };
        var waterfall = [getLastResult, returnBetsAction];

        // ignore debit for testing/simulation
        if (PlayerInterface !== null) {
            //XXX: 
            waterfall.unshift(debitPlayer.bind(this));
            // waterfall.unshift(function(done) {
            //     done(undefined, {alias: "simulation", _id: "simulation"});
            // });
        } else {
            waterfall.unshift(function(done) {
                done(undefined, {alias: "simulation", _id: "simulation"});
            });
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
            init_time: createTime,
            server_seed: server_seed,
            // hash using the provable library's hashing function
            seed_hash: provable.sha256sum(server_seed),
            lock: false
        });
        newGame.save(function(err) {
            if (err) {
                return cb(new HTTPError(500, err.message || err));
            }
            // only return a hash of the server seed and any other init info
            cb(undefined, {
                nextGameId: newGame.primary(),
                seed_hash: newGame.seed_hash()
            });
        });
    };

    Game.checkLock = function(gameId, cb) {
        logger.debug('Game.checkLock');
        Game.find(gameId, function(err, gameData) {
            if (err) return cb(new HTTPError(500, err.message));
            if (!gameData) return cb(new HTTPError(404, 'game not found'));
            if (gameData.lock()) return cb(new HTTPError(423, 'game is already in progress'));
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
