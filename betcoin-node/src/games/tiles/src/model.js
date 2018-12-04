'use strict';

module.exports = function(BaseGameModel, GameLogic, logger, HTTPError, provable) {

    var Game = BaseGameModel('tiles')
            .attr('final_array')
            .attr('payouts')
            .attr('payout_multiplier')
            .attr('dealer_hand')
            .attr('player_hand')
            .attr('is_win')
            .attr('is_push')
            .attr('status', {type: 'string'})
            .attr('startedAt'); // startedAt is the Date object of when the first game action was taken

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

        var player = params.user;
        var player_id = player.primary();
        var ip = params.ip;
        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));

        // logger.tiles("playing seed: ",client_seed);
        var hands = GameLogic.initHands(client_seed + self.server_seed());

        // logger.tiles('##### playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
        // logger.tiles('result');


        // assign the new values to the self
        self.set({
            player_id: player_id,
            player_alias: player.username(),
            wager: wager,
            client_seed: client_seed,
            winnings: 0,
            final_array: hands.allTiles,
            dealer_hand: hands.dealerHand,
            player_hand: hands.playerHand,
            status: 'began',
            ip: ip,
            lock: false,
            startedAt: new Date(),
            createdAt: new Date()
        });
        logger.tiles('##### done playing game %s for %s (%s) ##### %s', self.primary(), player.username(), player_id, client_seed);
        // save the game data
        self.save(function(err) {
            if (err) return cb(new HTTPError(500, "error saving game data after game start: " + err.message));
            // credit the user their winnings, if any
            return cb(undefined, self);
        });
    };

    Game.prototype.nextAction = function(params, cb) {
        logger.tiles('Game.nextAction');
        var self = this;
        var split = params.split;
        var houseWay = params.house_way;

        var playerHand = self.player_hand();
        var dealerHand = self.dealer_hand();

    var result;
        result = GameLogic.getResult({
            playerHand: playerHand,
            dealerHand: dealerHand,
            split: split,
            wager: self.wager(),
            houseWay: houseWay
        });
        playerHand = result.playerHand;
        dealerHand = result.dealerHand;

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
        // logger.tiles('Game.init');

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
