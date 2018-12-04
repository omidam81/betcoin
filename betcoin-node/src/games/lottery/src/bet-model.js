'use strict';

module.exports = function(BaseGameModel, logger, HTTPError, provable) {


    var Bet = BaseGameModel('lottery_bet', {loggerName: 'lottery'})
        .attr('_id')
        .attr('lottery_id')
        .attr('lottery_interval')
        .attr('combined_seed');

    Bet.prototype.play = function(params, cb) {
        var client_seed = params.client_seed;
        var wager = parseInt(params.wager, 10);
        var ip = params.ip;
        var lotteryId = params.lottery.primary();
        var lotteryInterval = params.lottery.interval();
        var combined_seed = provable.sha512hmac(client_seed, this.server_seed());
        var user = params.user;
        this.set({
            player_id: user._id(),
            player_alias: user.username(),
            wager: wager,
            lottery_id: lotteryId,
            lottery_interval: lotteryInterval,
            combined_seed: combined_seed,
            client_seed: client_seed,
            ip: ip,
            createdAt: new Date()
        });
        var self = this;
        // save the game data
        this.save(function(err) {
            if (err) return cb(new HTTPError(500, "error saving game data after bet!: " + err.message));
            return cb(undefined, self);
        });
    };

    Bet.init = function(user, cb) {
        Bet.log('Bet.init');
        var server_seed = provable.getRandomSeed();
        var createTime = new Date().getTime();
        var newBet = new Bet({
            player_id: user.primary(),
            player_alias: user.username(),
            server_seed: server_seed,
            // hash using the provable library's hashing function
            seed_hash: provable.sha256sum(server_seed),
            init_time: createTime,
            winnings: 0,//make it works for the base class
            lock: false
        });
        newBet.save(function(err) {
            if (err) {
                return cb(new HTTPError(500, err.message || err));
            }
            // only return a hash of the server seed and any other init info
            cb(undefined, {
                nextGameId: newBet.primary(),
                sha256: newBet.seed_hash()
            });
        });
    };
    return Bet;
};
