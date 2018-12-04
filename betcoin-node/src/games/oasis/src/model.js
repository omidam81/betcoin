'use strict';

module.exports = function(BaseGameModel, GameLogic, logger, HTTPError, provable) {
    var Game = BaseGameModel('oasis')
            .attr('final_array')
            .attr('payouts')
            .attr('payout_multiplier')
            .attr('dealer_hand')
            .attr('player_hand')
            .attr('is_win')
            .attr('is_push')
            .attr('is_fold')
            .attr('ante')
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

        logger.oasis("playing seed: ",client_seed);
        var hands = GameLogic.initHands(client_seed + self.server_seed());
        var finalArray = hands.allCards;
        var playerHand = {
            initCards : hands.playerCards,
            finalCards : hands.playerCards.slice(),
            rnk : hands.playerCardsRank,
            sub_rnk : hands.playerCardsSubRank
        };
        var dealerHand = {
            initCards : hands.dealerCards
        };

        logger.oasis('##### playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
        logger.oasis('result');

        // assign the new values to the self
        self.set({
            player_id: player_id,
            player_alias: player.username(),
            wager: wager,
            ante: wager,
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
        logger.oasis('##### done playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
        // save the game data
        self.save(function(err) {
            if (err) return cb(new HTTPError(500, "error saving game data after game start!: " + err.message));

            //hide dealer card's hold card
            dealerHand.initCards.splice(1, dealerHand.initCards.length - 1);
            self.set({dealer_hand: dealerHand});

            // credit the user their winnings, if any
            return cb(undefined, self);
        });
    };

    Game.prototype.switchAction = function(params, cb) {
        var self = this;
        var holds = params.holds;

        var playerHand = self.player_hand();

        playerHand = GameLogic.getPlayerFinalCards(playerHand, holds, self.final_array());

        self.set({
            status: 'drawn',
            player_hand: playerHand,
            lock: false,
            createdAt: new Date()
        });
        if (params.drawCount !== 5) {
            self.save(function(err){
                if (err) return cb(new HTTPError(500, "error saving game data after spin!: " + err.message));
                return cb(undefined, self);

            });
        }
    };

    Game.prototype.finishAction = function(params, cb) {
        var self = this;
        var playerHand = self.player_hand();
        var dealerHand = self.dealer_hand();
        var action = params.action;

        var result;
        logger.oasis(JSON.stringify(dealerHand), JSON.stringify(playerHand));
        result = GameLogic.getResult(dealerHand, playerHand, self.ante(), action === 'raise');
        logger.oasis(result);
        playerHand = result.playerHand;
        dealerHand = result.dealerHand;

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
            if (err) return cb(new HTTPError(500, "error saving game data after spin!: " + err.message));
            return cb(undefined, self);
        });
    };

    Game.prototype.nextAction = function(params, cb) {
        var self = this;
        var action = params.action;
        if (action === 'draw') {
            self.switchAction(params, cb);
            if (params.drawCount === 5) {
                params.action = 'raise';
                self.finishAction(params, cb);
            }
        } else {
            self.finishAction(params, cb);
        }
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
        // logger.oasis('Game.init');

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
