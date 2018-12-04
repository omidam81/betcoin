'use strict';

var crypto = require('crypto');

module.exports = function(BaseGameModel, games, logger, HTTPError, provable) {

    var Circle = BaseGameModel('circle')
        .attr('init_array', {required: true, type: 'string', format: /[0-9,]+/}) // comma separated number list
        .attr('game', {required: true, type: 'number'})
        .attr('result', {type: 'number'})
        .attr('payout_multiplier', {type: 'number'});

    Circle.prototype.play = function(params, cb) {
        if (this.has('client_seed')) {
            logger.warn('someone tried to play a game twice! - %s', this.player_id(), {});
            return cb(new HTTPError(400, "this game has already been played"));
        }
        var self = this;
        // get params from object
        var client_seed = params.client_seed;
        var game = parseInt(params.game, 10);
        var wager = parseInt(params.wager, 10);
        var player = params.user;
        var ip = params.ip;
        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));
        if (isNaN(game)) return cb(new HTTPError(400, "Invalid game"));
        // this prevents manipulating odds on the 25x wheel
        if (self.game() !== game) return cb(new HTTPError(400, "Game to play does not match game init"));
        var winnings = 0;
        var payout_multiplier = 0;
        if (!game || !games[game]) {
            return cb(new HTTPError(400, "No game specified or game not found."));
        }
        // ordered slots for the circle, 0 @ top, counted clockwise
        // e.g. [3, 0, 1.5, 0.25, 2, 0.25, 1.5, 0.25, 1.5, 0, 1.2, 0.25, 1.25, 2, 0.25, 1.5, 0]
        var slots = games[game].slots;
        var initArray = self.init_array().split(',');
        // shuffle the init array with the server seed
        var serverArray = provable.seededShuffle(self.server_seed(), initArray);
        //shuffle the server array with the client seed
        var finalArray = provable.seededShuffle(client_seed, serverArray);
        // result is the first number of the final array
        var spin = finalArray[0];
        if (spin > slots.length - 1) {
            return cb(new HTTPError(500, 'computation error'));
        } else {
            // the payout from the slots index
            payout_multiplier = slots[spin];
        }
        winnings = Math.floor(wager * payout_multiplier);
        // assign the new values to the self
        self.set({
            player_id: player.primary(),
            player_alias: player.username(),
            currency: params.currency,
            wager: wager,
            result: parseInt(spin, 10),
            client_seed: client_seed,
            winnings: winnings,
            game: game,
            payout_multiplier: payout_multiplier,
            ip: ip,
            final_array: finalArray.join(','),
            createdAt: new Date(),
            lock: false
        });
        // save the game data
        self.save(function(err) {
            if (err) return cb(new HTTPError(500, "error saving game data after spin!: " + err.message));
            if (err) return cb(new HTTPError(500, "error crediting player!: " + err.message));
            return cb(undefined, self);
        });

    };

    Circle.init = function(gameNumber, user, cb) {
        var server_seed = crypto.randomBytes(16).toString('hex');
        var createTime = new Date().getTime();
        var initSeed = crypto.randomBytes(16).toString('hex');
        // get random init array, which is shared with the user
        var unshuffled = [];
        var game = games[gameNumber];
        if (game) {
            for (var i = 0, max = game.slots.length; i < max; i++) {
                unshuffled.push(i);
            }
            var initArray = provable.seededShuffle(initSeed, unshuffled);
            // hash the init array (comma separated string) with the server seed
            var initArraySha = crypto.createHash('sha256');
            initArraySha.update(JSON.stringify({
                initialArray: initArray.join(','),
                serverSeed: server_seed
            }));
            var initArrayHash = initArraySha.digest('hex');
            var newCircle = new Circle({
                player_id: user.primary(),
                player_alias: user.username(),
                server_seed: server_seed,
                init_array: initArray.join(','),
                seed_hash: initArrayHash,
                init_time: createTime,
                lock: false,
                game: gameNumber
            });
            newCircle.save(function(err) {
                if (err) {
                    return cb(new HTTPError(500, err.message || err));
                }
                cb(undefined, {
                    nextGameId: newCircle.primary(),
                    sha256: newCircle.seed_hash(),
                    game: newCircle.game()
                });
            });
        } else {
            return cb(new HTTPError(404, "game not found"));
        }
    };

    return Circle;
};
