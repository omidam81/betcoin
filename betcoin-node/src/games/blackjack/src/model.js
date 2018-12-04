'use strict';

module.exports = function(BaseGameModel, GameLogic, logger, HTTPError, provable) {

    var Game = BaseGameModel('blackjack')
        .attr('final_array')
        .attr('status')
        .attr('player_hands')
        .attr('dealer_hand')
        .attr('remainingcards')
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
        var wallet = params.wallet;
        var player_id = player.primary();
        var ip = params.ip;
        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));
        var winnings = 0;

        var status = 'began';
        // this.log("init hands for %s, wallet balance %d", player_id, wallet.balance().toBitcoin());
        var initVars = GameLogic.initHands(client_seed + self.server_seed(), wager, wallet);
        initVars.playerHands[0].wager = wager;
        // this.log("getting results for %s, wallet balance %d", player_id, wallet.balance().toBitcoin());
        var result = GameLogic.getResult({
            playerHands: initVars.playerHands,
            dealerHand: initVars.dealerHand,
            remainingCards: initVars.remainingCards,
            wallet: wallet,
            wager: wager
        });
        winnings = result.totalPayout || winnings;

        // logger.blackjack('##### playing game %s for %s (%s) #####', self.primary(), player.username(), player_id, {});
        // logger.blackjack('result');

        // logger.blackjack('wager %d winnings %d player profit %d',
        //                  wager.toBitcoin(),
        //                  winnings.toBitcoin(),
        //                  (winnings - wager).toBitcoin());
        // assign the new values to the self
        this.set({
            player_id: player.primary(),
            player_alias: player.username(),
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
        logger.blackjack('##### done playing game %s for %s (%s) #####', this.primary(), player.username(), player_id, {});
        // save the game data
        this.save(function(err) {
            if (err) return cb(new HTTPError(500, "error saving game data after game start: " + err.message));

            //hide dealer card's hold card
            // if(!result.allFinished){
            //     result.dealerHand.cards.splice(result.dealerHand.cards.length - 1, 1);
            //     self.set({dealer_hand: result.dealerHand});
            // }
            return cb(undefined, self);
        });
    };

    Game.prototype.nextAction = function(params, cb) {
        var self = this;
        var betType = params.bet;
        var wager = this.wager();
        if (betType === 'double' || betType === 'split') wager *= 2;
        var wallet = params.wallet;
        var playerHands = this.player_hands();
        var dealerHand = this.dealer_hand();
        var remainingCards = this.remainingcards();
        if (betType === 'double') {
            playerHands[0].wager = wager;
        }
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
                wallet: wallet,
                wager: wager,
                betType: betType
            });
            playerHands = result.playerHands;
            dealerHand = result.dealerHand;
            remainingCards = result.remainingCards;
        }catch(e){
            return cb(e);
        }

        this.set({
            wager: wager,
            winnings: result.totalPayout,
            status: result.allFinished?'finished':'gaming',
            player_hands: playerHands,
            dealer_hand: dealerHand,
            remainingcards: remainingCards,
            lock: false,
            createdAt: new Date()
        });
        this.save(function(err){
            if (err) return cb(new HTTPError(500, "error saving game data after spin!: " + err.message));
            //hide dealer card's hold card
            // if(!result.allFinished){
            //     result.dealerHand.cards.splice(result.dealerHand.cards.length - 1, 1);
            //     self.set({dealer_hand: result.dealerHand});
            // }
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
        logger.blackjack('Game.init');

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
