'use strict';

var crypto = require('crypto');

module.exports = function(BaseGameModel, GameLogic, logger, HTTPError, provable) {

    var Game = BaseGameModel('war')
            .attr('init_array', {required: true})
            .attr('initial_hash', {required: true, format: /[a-f0-9]+/}) // initial_hash is a hex encoded sha256
            .attr('final_array', {filtered: true})
            .attr('status')
            .attr('next_action')
            .attr('payout_multiplier')
            .attr('result')
            .attr('dealer_stack')
            .attr('player_stack')
            .attr('deck_stack', {filtered: true})
            .attr('is_tie_bet') // if it is a tie bet
            .attr('startedAt'); // startedAt is the Date object of when the first game action was taken

    // shuffles an array based on a seed value
    // the result will always be the same with identical seed and items input
    // the code for this function is published as part of the provably fair system
    var seededShuffle = function(items, seed) {
        var counter = items.length;
        var partialDivisor = (parseInt('ffff', 16) + 1);
        var spinMin = 0;
        var spinMax = items.length - 1;
        while (counter > 0) {
            var sha = crypto.createHash('sha256');
            var partial = sha.update("" + counter + seed).digest('hex').substring(0, 4);
            var rand = parseInt(partial, 16) / partialDivisor;
            var randIndex = Math.floor(rand * (spinMax - spinMin + 1) + spinMin);
            counter--;
            var tmp = items[counter];
            items[counter] = items[randIndex];
            items[randIndex] = tmp;
        }
        return items;
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
        // get params from object
        var client_seed = params.client_seed.toString();
        var wager = parseInt(params.wager, 10);
        var isTieBet = params.isTieBet;
        var player = params.user;
        var player_id = player.primary();
        var ip = params.ip;


        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));

        // logger.war("playing seed: ",client_seed," with tie bet:", isTieBet);
        var initArray = self.init_array();
        // shuffle the init array with the server seed
        var serverArray = seededShuffle(initArray, self.server_seed());
        //shuffle the server array with the client seed
        var finalArray = seededShuffle(serverArray, client_seed);

        var winnings = 0;

        var status = 'began';
        if(!GameLogic.isTie({finalArray: finalArray})){
            status = 'finished';
            winnings = GameLogic.getPayouts({wager: wager, isTieBet: isTieBet, finalArray: finalArray});
        }

        // logger.war('##### playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
        // logger.war('result');

        // logger.war('wager %d winnings %d player profit %d',
        //              wager.toBitcoin(),
        //              winnings.toBitcoin(),
        //              (winnings - wager).toBitcoin());
        // assign the new values to the self
        self.set({
            player_id: player_id,
            player_alias: player.username(),
            wager: wager,
            client_seed: client_seed,
            winnings: winnings,
            status: status,
            final_array: finalArray,
            dealer_stack: [finalArray[0]],
            player_stack: [finalArray[1]],
            deck_stack: finalArray.slice(2),
            is_tie_bet: isTieBet,
            payout_multiplier: 2,
            ip: ip,
            lock: false,
            startedAt: new Date(),
            createdAt: status === "finished" ? new Date() : undefined,
        });
        // logger.war('##### done playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
        // save the game data
        self.save(function(err) {
            if (err) return cb(new HTTPError(500, "error saving game data after spin!: " + err.message));
            return cb(undefined, self);
        });
    };

    Game.prototype.nextAction = function(params, cb) {
        var self = this;
        var gotoWar = params.gotoWar;

        var finalArray = self.final_array();
        var wager = self.wager();
        var isTieBet = self.is_tie_bet();
        if(gotoWar) {
            if(isTieBet) {
                wager += wager/2;
            } else {
                wager *= 2;
            }
        }
        var payouts = GameLogic.getPayouts({
            isTieBet: isTieBet,
            gotoWar: gotoWar,
            wager: wager,
            finalArray: finalArray
        });
        logger.war(finalArray.slice(7));
        self.set({
            wager: wager, //go to war should double wager
            winnings: payouts,
            next_action: gotoWar? 0: 1, // 0: goto war; 1: surrender
            status: 'finished',
            dealer_stack: gotoWar? self.dealer_stack().concat(finalArray[5]) : self.dealer_stack(),
            player_stack: gotoWar? self.player_stack().concat(finalArray[6]) : self.player_stack(),
            deck_stack: gotoWar? finalArray.slice(7) : self.deck_stack(),
            goto_war: gotoWar,
            lock: false,
            createdAt: new Date()
        });
        self.save(function(err){
            if (err) return cb(new HTTPError(500, "error saving game data after spin!: " + err.message));
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
        // logger.war('Game.init');

        var server_seed = provable.getRandomSeed();
        var createTime = new Date().getTime();
        var initSeed = crypto.randomBytes(16).toString('hex');

        var initArray = seededShuffle(getUnshuffledCards(), initSeed);
        // hash the init array (comma separated string) with the server seed
        var initArraySha = crypto.createHash('sha256');
        initArraySha.update(JSON.stringify({
            initialArray: initArray,
            serverSeed: server_seed
        }));
        var initArrayHash = initArraySha.digest('hex');

        var newGame = new Game({
            player_id: user.primary(),
            player_alias: user.username(),
            server_seed: server_seed,
            // hash using the provable library's hashing function
            seed_hash: provable.sha256sum(server_seed),
            init_time: createTime,
            init_array: initArray,
            initial_hash: initArrayHash,
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


    var getUnshuffledCards = function(){
        var cards = [];
        for(var cardNum = 1; cardNum <= 13; cardNum++){
            for(var type = 1; type <= 4; type++){
                var suit = "";
                switch(type) {
                case 1:
                    suit = "C";
                    break;
                case 2:
                    suit = "D";
                    break;
                case 3:
                    suit = "H";
                    break;
                case 4:
                    suit = "S";
                    break;
                }
                var rank = "";
                switch(cardNum) {
                case 1:
                    rank = "A";
                    break;
                case 2:
                    rank = "2";
                    break;
                case 3:
                    rank = "3";
                    break;
                case 4:
                    rank = "4";
                    break;
                case 5:
                    rank = "4";
                    break;
                case 6:
                    rank = "6";
                    break;
                case 7:
                    rank = "7";
                    break;
                case 8:
                    rank = "8";
                    break;
                case 9:
                    rank = "9";
                    break;
                case 10:
                    rank = "T";
                    break;
                case 11:
                    rank = "J";
                    break;
                case 12:
                    rank = "Q";
                    break;
                case 13:
                    rank = "K";
                    break;
                }
                var card = {suit:suit,rank:rank};
                cards.push(card);
            }
        }
        return cards;
    };

    return Game;
};
