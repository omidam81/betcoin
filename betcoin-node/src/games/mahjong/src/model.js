'use strict';
//var util = require('util');
module.exports = function(BaseGameModel, GameLogic, logger, HTTPError, provable) {

    var Game = BaseGameModel('mahjong')
            .attr('last_game_id')
            .attr('payouts')
            .attr('payout_multiplier')
            .attr('final_array')
            .attr('remaining_array')
            .attr('all_hands')
            .attr('seats')
            .attr('player_seat')
            .attr('active_seat')
            .attr('hand_number')
            .attr('available_actions')
            .attr('is_win')
            .attr('is_push')
            .attr('status', {type: 'string'})
            .attr('payouts')
            .attr('winner')
            .attr('fan')
            .attr('fan_items')
            .attr('startedAt'); // startedAt is the Date object of when the first game action was taken

    Game.checkLock = function(gameId, cb) {
        Game.find(gameId, function(err, gameData) {
            if (err) return cb(new HTTPError(500, err.message));
            if (!gameData) return cb(new HTTPError(404, 'game not found'));
            if (gameData.lock()) {
                if (gameData.status() === 'drawn') {
                    gameData.lock(false);
                } else {
                    return cb(new HTTPError(423, 'game is already in progress'));
                }
            }
            gameData.save(function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                cb(undefined, gameData);
            });
        });
    };

    Game.getLastGame = function(params, cb) {
        if(params.lastGameId){
            Game.find({last_game_id: params.lastGameId}, function(err, played){
                if(err) return cb(new HTTPError(500, 'internal error'));
                if(played) return cb(new HTTPError(419, 'the game has been played'));
                Game.find(params.lastGameId, function(err, lastGame){
                    if(err) return cb(new HTTPError(500, 'internal error'));
                    if(!lastGame){
                        return cb(new HTTPError(404, 'the last game not found'));
                    }
                    if(lastGame.player_id().toString() !== params.user.primary().toString()){
                        return cb(new HTTPError(418, 'You cannot play for another player'));
                    }
                    if(lastGame.currency() !== params.wallet.currency()){
                        return cb(new HTTPError(418, 'Nice try fucker'));
                    }
                    cb(undefined, lastGame);
                });
            });
            return;
        }else if(params.unfinishedGameId) {
            Game.find(params.unfinishedGameId, function(err, unfinishedGame) {
                if(err) return cb(new HTTPError(500, 'internal error'));
                if(!unfinishedGame) return cb(new HTTPError(404, 'unfinished game not found'));
                if(unfinishedGame.currency() !== params.wallet.currency()){
                    return cb(new HTTPError(418, 'Nice try fucker'));
                }
                if(unfinishedGame.player_id().toString() !== params.user.primary().toString()){
                    return cb(new HTTPError(418, 'You cannot play for another player'));
                }
                if(unfinishedGame.status() !== 'drawn'){
                    return cb(new HTTPError(418, 'You cannot play finished game.'));
                }
                cb(undefined, unfinishedGame);
            });
            return;
        }else{
            Game.find({player_id: params.user.primary(), status: 'drawn', currency: params.wallet.currency()}, function(err, unfinishedGame) {
                if(!err) {
                    if(unfinishedGame) {
                        return cb(undefined, true);
                    }
                }
                return cb();
            });
            return;
        }
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
        var lastGameId = params.lastGameId;
        // get params from object
        var client_seed = params.client_seed.toString();
        var wager = parseInt(params.wager, 10);
        var player = params.user;
        var player_id = player.primary();
        var ip = params.ip;

        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));

        Game.getLastGame(params, function(err, lastHistory){
            if(err){
                return cb(err);
            }
            var previousSeats;
            var prevHandNumber;
            var prevWinner;
            if(lastHistory){
                if (lastHistory === true) {
                    return cb(new HTTPError(400, "You have unfinished games."));
                }
                if (params.unfinishedGameId && lastHistory.status() === 'drawn') {
                    return cb(undefined, lastHistory);
                }
                previousSeats = lastHistory.seats();
                prevHandNumber = lastHistory.hand_number();
                prevWinner = lastHistory.winner();
            }

            // logger.mahjong("playing seed: ",client_seed);

            var result = GameLogic.initHands(client_seed + self.server_seed(), previousSeats, prevHandNumber, prevWinner);

            // logger.mahjong('##### playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
            // logger.mahjong('result');

            // assign the new values to the self
            self.set({
                player_id: player_id,
                player_alias: player.username(),
                last_game_id: lastGameId,
                wager: wager,
                client_seed: client_seed,
                winnings: 0,
                final_array: result.allTiles,
                remaining_array: result.remainingTiles,
                all_hands: result.allHands,
                seats: result.seats,
                player_seat: result.playerSeat,
                active_seat: result.activeSeat,
                available_actions: result.availActions,
                status: result.status,
                ip: ip,
                lock: false,
                startedAt: new Date(),
                createdAt: new Date(),
                hand_number: result.handNumber
            });
            logger.mahjong('##### done playing game %s for %s (%s) ##### %s', self.primary(), player.username(), player_id, client_seed);
            // save the game data
            self.save(function(err) {
                if (err) return cb(new HTTPError(500, "error saving game data after game start!: " + err.message));

                // credit the user their winnings, if any
                return cb(undefined, self);
            });
        });
    };

    Game.prototype.nextAction = function(params, cb) {
        var self = this;

        var result;
        try{
            result = GameLogic.getResult(self.all_hands(), self.remaining_array(), self.seats(), self.active_seat(), params.action, params.tile, self.available_actions(), self.hand_number());
            //console.log(util.inspect(result, {depth: 12}));
        }catch(e) {
            return cb(e);
        }

        if (result.status === 'finished') {
            self.set({
                winnings: result.payout.winnings * self.wager(),
                is_win: result.payout.is_win,
                is_push: result.payout.is_push,
                payouts: result.payout.payouts,
                winner: result.payout.winner,
                fan: result.payout.fan,
                fan_items: result.payout.fan_items
            });
        }

        self.set({
            available_actions: result.availActions,
            remaining_array: result.remainingTiles,
            all_hands: result.allHands,
            active_seat: result.activeSeat,
            status: result.status,
            lock: false
        });
        self.save(function(err){
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
        // logger.mahjong('Game.init');

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
