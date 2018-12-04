'use strict';

module.exports = function(BaseGameModel, GameLogic, logger, HTTPError, provable) {

    var Game = BaseGameModel('hilo')
            .attr('final_array')
            .attr('status')
            .attr('next_action')
            .attr('payout_multiplier')
            .attr('result')
            .attr('dealer_stack')
            .attr('player_stack')
            .attr('current_payout', {type: 'number'})
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
        var wager = 0;
        var bet = params.bet;
        var player = params.user;
        var player_id = player.primary();
        var ip = params.ip;
        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));
        wager = 0;

        var mixseed = client_seed + self.server_seed();
        var cards = GameLogic.getShuffledCards(mixseed);
        var finalArray = cards.slice();
        var result;
        try {
            result = GameLogic.getResult(cards, bet, wager);
        } catch (ex) {
            return cb(new HTTPError(ex));
        }

        var winnings = 0;
        var status = 'began';

        logger.hilo('##### playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
        logger.hilo('result');

        logger.hilo('wager %d winnings %d player profit %d',
                    wager.toBitcoin(),
                    winnings.toBitcoin(),
                    (winnings - wager).toBitcoin());
        // assign the new values to the self
        self.set({
            player_id: player_id,
            player_alias: player.username(),
            wager: wager,
            client_seed: client_seed,
            winnings: winnings,
            status: status,
            final_array: finalArray,
            dealer_stack: result.remainingCards,
            player_stack: result.previousCards,
            payout_multiplier: 0,
            result: result,
            ip: ip,
            lock: false,
            startedAt: new Date(),
            createdAt: new Date(),
        });
        logger.hilo('##### done playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
        // save the game data
        self.save(function(err) {
            if (err) return cb(new HTTPError(500, "error saving game data after spin!: " + err.message));
            return cb(undefined, self);
        });
    };

    Game.prototype.nextAction = function(params, cb) {
        var self = this;
        var bet = params.bet;
        var wager = parseInt(params.wager,10);
        var remainingCards = self.dealer_stack();
        var previousCards = self.player_stack();
        var result = self.result();
        var payout = 0;
        var status;
        var gameOdds;

        if (GameLogic.possibleBets.indexOf(bet[0]) < 0) {
            return cb(new HTTPError(418, "Stop that"));
        }

        //if player wants to finish the game and get the payout so far
        if(bet[0] === 'finish'){
            status = 'finished';
            // payout = self.winnings();
        }else{
            try{
                result = GameLogic.getResult(remainingCards, bet, wager, previousCards);
                gameOdds = result.payoutGameOdds[bet[0]];
            }catch(e){
                return cb(e);
            }
            remainingCards = result.remainingCards;
            previousCards = result.previousCards;
            payout = result.payout;
            logger.hilo('##### current payout %s total payouts %s #####', payout, payout + self.winnings());
            status = result.finished?'finished':'gaming';
        }

        self.set({
            winnings: payout + self.winnings(),
            status: status,
            dealer_stack: remainingCards,
            player_stack: previousCards,
            result: result,
            lock: false,
            createdAt: new Date(),
            current_payout: payout
        });
        // add to the wager only if we are finishing
        if (bet[0] !== "finish") self.wager(self.wager() + wager);
        self.save(function(err){
            if (err) return cb(new HTTPError(500, "error saving game data after spin!: " + err.message));
            // if(self.status() !== 'finished'){
            //     return done(undefined, self);
            // }
            // credit the user their winnings, if any
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
        // logger.hilo('Game.init');

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
