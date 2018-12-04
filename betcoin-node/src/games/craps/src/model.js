'use strict';

module.exports = function(BaseGameModel, GameLogic, logger, HTTPError, provable) {

    var Game = BaseGameModel('craps')
        .attr('last_game_id')
        .attr('losts')
        .attr('wins')
        .attr('pushes')
        .attr('options')
        .attr('table')
        .attr('dices')
        .attr('status')
        .attr('affected_wager')
        .attr('win_bets_up')
        .attr('return_bets')
        .attr('startedAt'); // startedAt is the Date object of when the first game action was taken

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
        }else{
            return cb();
        }
    };

    Game.prototype.play = function(params, cb) {
        var self = this;
        var lastGameId = params.lastGameId;
        var player = params.user;
        var player_id = player.primary();
        var ip = params.ip;
        var client_seed = params.client_seed;
        var table = {bets: params.bets};
        var dices = GameLogic.rolldice(client_seed, self.server_seed());
        var wager = getAllBets(table.bets);
        var win_bets_up = params.win_bets_up;
        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));

        Game.getLastGame(params, function(err, lastHistory){
            if(err){
                return cb(err);
            }
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
            logger.craps('wager %d winnings %d player profit %d current dice %d last thepoint %d',
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
                player_alias: player.username(),
                ip: ip,
                lock: false,
                createdAt: new Date(),
                status: 'finished'
            });
            self.save(function(err){
                if (err) return cb(new HTTPError(500, "error saving game data after spin!: " + err.message));
                self.set({options: GameLogic.analyzeOptions(result.table)});
                return cb(undefined, self);
            });
        });
    };

    Game.prototype.returnBets = function(params, cb) {
        var self = this;
        var returnBets = params.return_bets;
        var lastGameId = params.lastGameId;
        var client_seed = params.client_seed;

        Game.getLastGame(params, function(err, previousGame){
            if(previousGame){
                previousGame = previousGame.filter();
            }else{
                previousGame = {};
            }
            var totalReturnWager;
            try{
                totalReturnWager = GameLogic.returnBets(returnBets, previousGame.table);
            }catch(ex){
                return cb(ex);
            }

            self.set({
                client_seed: client_seed,
                currency: previousGame.currency,
                last_game_id: lastGameId,
                affected_wager: totalReturnWager,
                winnings: totalReturnWager,
                player_id: params.user.primary(),
                player_alias: params.user.username(),
                options: GameLogic.analyzeOptions(previousGame.table),
                table: previousGame.table,
                ip: params.ip,
                return_bets: true,
                lock: false,
                createdAt: new Date(),
                status: 'finished'
            });
            self.save(function(err){
                if (err) return cb(new HTTPError(500, "error saving game data after spin!: " + err.message));
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
    Game.init = function(user, cb) {
        logger.craps('Game.init');

        var server_seed = provable.getRandomSeed();
        var createTime = new Date().getTime();

        var newGame = new Game({
            player_id: user.primary(),
            player_alias: user.username(),
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
        logger.craps('Game.checkLock');
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
