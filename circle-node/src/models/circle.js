'use strict';

var modella = require('modella');
var validators = require('modella-validators');
var crypto = require('crypto');
var HTTPError = require('../lib/httperror');

module.exports = function(modelStore, games, PlayerInterface, logger) {

    var Circle = modella('circle')
            .attr('_id')
            .attr('server_seed', {required: true, format: /[a-f0-9]{32}/}) // server_seed is always 16 bytes of hex
            .attr('init_array', {required: true, type: 'string', format: /[0-9,]+/}) // comma separated number list
            .attr('initial_hash', {required: true, format: /[a-f0-9]+/}) // initial_hash is a hex encoded sha256
            .attr('init_time', {required: true, type: 'number'})
            .attr('game', {required: true, type: 'number'})
            .attr('player_id')
            .attr('player_alias')
            .attr('wager', {type: 'number'})
            .attr('result', {type: 'number'})
            .attr('client_seed')
            .attr('winnings', {type: 'number'})
            .attr('payout_multiplier', {type: 'number'})
            .attr('ip', {format: /([0-9]{1,3}\.){3}[0-9]{1,3}/})
            .attr('final_array', {type: 'string', format: /[0-9,]+/}) // comma separated number list
            .attr('lock')
            .attr('createdAt', {type: 'date'});

    Circle.use(validators);
    Circle.use(modelStore);

    var unplayedCleanup = function() {
        var cutoff = new Date(new Date() - (60*60*1000)); // 1 hour old
        Circle.removeAll({
            init_time: {$lt: cutoff.getTime()},
            client_seed: {$exists: false}
        }, function(err, removed) {
            if (err) return logger.error(err.message);
            logger.info("removed %d old, unplayed records", removed);
            setTimeout(unplayedCleanup, (60 * 60 * 1000));
        });
    };
    unplayedCleanup();

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

    Circle.prototype.play = function(params, cb) {
        if (this.has('client_seed')) {
            logger.warn('someone tried to play a game twice! - %s', this.player_id());
            return cb(new HTTPError(400, "this game has already been played"));
        }
        var self = this;
        // get params from object
        var client_seed = params.client_seed;
        var game = parseInt(params.game, 10);
        var wager = parseInt(params.wager, 10);
        var player_id = params.player_id;
        var ip = params.ip;
        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));
        if (isNaN(game)) return cb(new HTTPError(400, "Invalid game"));
        // this prevents manipulating odds on the 25x wheel
        if (self.game() !== game) return cb(new HTTPError(400, "Game to play does not match game init"));
        // debit the player for the wager they made
        PlayerInterface.debit(player_id, wager, {
            type: "circle:wager",
            refId: "wager:" + self.primary(),
        }, function(err, player) {
            if (err) return cb(new HTTPError(500, "error debiting the player: " + err.message));
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
            var serverArray = seededShuffle(initArray, self.server_seed());
            //shuffle the server array with the client seed
            var finalArray = seededShuffle(serverArray, client_seed);
            // result is the first number of the final array
            var spin = finalArray[0];
            if (spin > slots.length - 1) {
                return cb(HTTPError(500, 'computation error'));
            } else {
                // the payout from the slots index
                payout_multiplier = slots[spin];
            }
            winnings = Math.floor(wager * payout_multiplier);
            // assign the new values to the self
            self.set({
                player_id: player._id,
                player_alias: player.alias,
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
                // credit the user their winnings, if any
                if (winnings > 0) {
                    PlayerInterface.credit(player._id, winnings, {
                        type: "circle:winnings",
                        refId: "winnings:" + self.primary()
                    }, function(err) {
                        if (err) return cb(new HTTPError(500, "error crediting player!: " + err.message));
                        return cb(undefined, self);
                    });
                } else {
                    return cb(undefined, self);
                }
            });
        });
    };

    Circle.init = function(gameNumber, cb) {
        logger.debug('Circle.init');
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
            var initArray = seededShuffle(unshuffled, initSeed);
            // hash the init array (comma separated string) with the server seed
            var initArraySha = crypto.createHash('sha256');
            initArraySha.update(JSON.stringify({
                initialArray: initArray.join(','),
                serverSeed: server_seed
            }));
            var initArrayHash = initArraySha.digest('hex');
            var newCircle = new Circle({
                server_seed: server_seed,
                init_array: initArray.join(','),
                initial_hash: initArrayHash,
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
                    sha256: newCircle.initial_hash(),
                    game: newCircle.game()
                });
            });
        } else {
            return cb(new HTTPError(404, "game not found"));
        }
    };

    Circle.checkLock = function(gameId, cb) {
        Circle.find(gameId, function(err, gameData) {
            if (err) return cb(new HTTPError(500, err.message));
            if (!gameData) return cb(new HTTPError(404, 'game not found'));
            if (gameData.lock()) return cb(new HTTPError(423, 'game is already in progress'));
            gameData.lock(true);
            gameData.save(function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                cb(undefined, gameData);
            });
        });
    };

    return Circle;
};
