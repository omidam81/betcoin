'use strict';

var extend = require('util')._extend;

module.exports = function(BaseGameModel, logger, HTTPError, provable) {

    // check game config sanity
    var checkSpecialLine = function(line) {
        if (line.length !== this.field.width) {
            throw "special line configured with different width than game";
        }
        line.forEach(function(point) {
            if (point[0] > this.field.height - 1) {
                throw "misconfigured point in special line";
            }
            if (point[1] > this.field.width - 1) {
                throw "misconfigured point in special line";
            }
        }, this);
    };

    var checkReel = function(reel) {
        if (reel.length !== 32) {
            throw "reels must have 32 symbols!";
        }
    };

    var games = {
        0: {
            field: {
                width: 5,
                height: 3,
                symbols: 8
            },
            specialLines: [
                [[0,0], [1,1], [2,2], [1,3], [0,4]],
                [[2,0], [1,1], [0,2], [1,3], [2,4]]
            ],
            reels: [
                [3,6,2,4,1,2,5,5,7,6,4,5,5,4,6,3,3,6,6,3,2,1,6,6,4,5,6,0,5,5,4,6],
                [4,3,4,6,6,5,6,4,6,4,0,3,6,6,3,5,3,2,4,5,5,2,1,1,5,5,2,6,7,6,5,7],
                [7,6,4,5,1,2,5,6,4,4,6,3,5,5,5,3,3,4,7,3,4,0,5,2,6,5,6,1,6,2,6,6],
                [6,7,1,3,0,5,4,3,5,2,5,7,5,3,4,6,6,4,4,5,2,5,6,6,6,6,3,4,2,1,6,5],
                [1,5,0,2,2,3,5,4,5,5,3,4,5,3,3,6,4,6,2,5,5,6,6,4,6,4,7,1,6,6,7,6]
            ],
            // index of scatter tile
            scatter: 7,
            payouts: {
                0: {       3: 88, 4: 238, 5: 888 }, // seven (silver coin)
                1: { 2: 1, 3: 55, 4: 118,  5: 288  }, // melon (prize cup)
                2: { 2: 1, 3: 55, 4: 118,  5: 288  }, // grape (cherry)
                3: {       3: 18, 4: 88,  5: 128  }, // cherry (dice)
                4: {       3: 18, 4: 88,  5: 128  }, // plum (bell)
                5: {       3: 8,  4: 25,  5: 58   }, // orange (clover)
                6: {       3: 8,  4: 25,  5: 58   }, // lemon (gold coin)
                7: {       3: 8,  4: 25,  5: 58   }, // scatter (ruby)
            }
        }
    };

    for (var gameIndex in games) {
        if (games.hasOwnProperty(gameIndex)) {
            var gameConfig = games[gameIndex];
            // check special lines
            if (gameConfig.specialLines) {
                gameConfig.specialLines.forEach(checkSpecialLine, gameConfig);
            }
            // check reel strip config
            if (gameConfig.reels.length !== gameConfig.field.width) {
                throw "number of reels configured does not match field width";
            }
            gameConfig.reels.forEach(checkReel);
            // make sure number of rows is odd
            if (gameConfig.field.height % 2 !== 1) {
                throw "field height cannot be even";
            }
        }
    }

    var Reels = BaseGameModel('reels')
            .attr('game', {type: 'number'}) // the game played
            .attr('lines', {type: 'number'})
            .attr('result', {type: 'array'})
            .attr('scatter', {type: 'array'})
            .attr('wins', {type: 'array'});

    // row calc functions
    var makeRow = function(lineDef, matrix) {
        var result = [];
        lineDef.forEach(function(point) {
            var row = point[0];
            var column = point[1];
            result.push(matrix[row][column]);
        });
        return result;
    };

    var getPayout = function(index, count, payouts) {
        return (payouts[index][count] || 0);
    };

    var getScatterPositions = function(matrix, scatterIndex) {
        var scatterPositions = [];
        matrix.forEach(function(row, rowI) {
            row.forEach(function(value, columnI) {
                if (value === scatterIndex) {
                    scatterPositions.push([rowI, columnI]);
                }
            });
        });
        return scatterPositions;
    };

    var getRowWins = function(row, rowIndex, rowType, payouts) {
        logger.reels('testing row %s, index:%d type: %s', JSON.stringify(row), rowIndex, rowType);
        row = row.slice();
        var sprite = row.shift();
        var count = 1;
        for (var i = 0; i < row.length; i++) {
            var value = row[i];
            if (value === sprite) {
                count += 1;
            } else {
                // break the loop
                i = row.length;
            }
        }
        var wins = [];
        if (payouts.hasOwnProperty(sprite) && payouts[sprite].hasOwnProperty(count)) {
            wins.push({
                sprite: sprite,
                count: count,
                position: rowIndex,
                type: rowType,
                payout: payouts[sprite][count]
            });
        }
        return wins;
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

    Reels.prototype.play = function(params, cb) {
        // don't let a game be played twice!
        if (this.has('client_seed')) {
            logger.warn('someone tried to play a game twice! - %s', this.player_id());
            return cb(new HTTPError(400, "this game has already been played"));
        }
        var self = this;
        // get params from object
        var client_seed = params.client_seed;
        var wager = parseInt(params.wager, 10);
        var player = params.user;
        var player_id = player.primary();
        var ip = params.ip;
        var game = parseInt(params.game, 10);
        // check stuff
        if (isNaN(wager)) return cb(new HTTPError(400, "Invalid wager"));
        if (isNaN(game) || !games[game]) {
            return cb(new HTTPError(400, 'invalid game selection'));
        }
        var gameConfig = extend({}, games[game]);

        // combine server seed and client seed to generate matrix
        var matrixSeed = provable.sha512hmac(client_seed, self.server_seed());
        var centerMatrix = provable.seededMatrix(matrixSeed, {
            height: 1,
            width: gameConfig.field.width,
            min: 0,
            max: 31
        });
        var centerRow = centerMatrix[0];
        var reelMatrix = new Array(gameConfig.field.height);
        for(var i = 0; i < gameConfig.field.height; i++) {
            reelMatrix[i] = [];
        }
        var addedRows = Math.floor(gameConfig.field.height / 2);
        var centerRowIndex = addedRows;
        centerRow.forEach(function(centerIndex, reelIndex) {
            for (var above = addedRows; above > 0; above--) {
                // get top row
                var topIndex = centerIndex - above;
                // detect wrap
                if (topIndex < 0) {
                    topIndex += 32;
                }
                reelMatrix[centerRowIndex - above].push(gameConfig.reels[reelIndex][topIndex]);
            }
            reelMatrix[centerRowIndex].push(gameConfig.reels[reelIndex][centerIndex]);
            for (var below = 1; below < (addedRows + 1); below++) {
                // get bottom row
                var bottomIndex = centerIndex + below;
                // detect wrap
                if (bottomIndex > 31) {
                    bottomIndex -= 32;
                }
                reelMatrix[centerRowIndex + below].push(gameConfig.reels[reelIndex][bottomIndex]);
            }
        });
        // logger.reels('##### playing game %s for %s (%s) #####', self.primary(), player.username(), player_id);
        // logger.reels('center index : %s', centerRow.join(' '));
        reelMatrix.forEach(function(row, index) {
            logger.reels('row %d : %s', index + 1, row.join(' '));
        });
        // calculate payout
        var winnings = 0;
        var payouts = extend({}, gameConfig.payouts);
        // check if the game defines a "scatter" index
        var scatterPositions = [];
        if (gameConfig.scatter !== undefined && gameConfig.scatter !== false) {
            var scatterIndex = gameConfig.scatter;
            if (isNaN(scatterIndex)) throw "game " + game + " scatter is misconfigured: " + scatterIndex;
            // get scatter positions
            scatterPositions = getScatterPositions(reelMatrix, scatterIndex);
            // add to winnings for scatter
            var scatterPayout = getPayout(scatterIndex, scatterPositions.length, payouts);
            // logger.reels('scatter count %d payout: %d', scatterPositions.length, scatterPayout);
            winnings += wager * scatterPayout;
            // remove scatter index so it will not be considered
            // for the line check
            delete payouts[scatterIndex];
        }
        // set up wins array
        var wins = [];
        // get wins for each normal row
        reelMatrix.forEach(function(row, index) {
            wins = wins.concat(getRowWins(row, index, "line", payouts));
        });
        // get wins for special defined lines
        if (gameConfig.specialLines && gameConfig.specialLines.length) {
            gameConfig.specialLines.forEach(function(lineDef, index) {
                var row = makeRow(lineDef, reelMatrix);
                wins = wins.concat(getRowWins(row, index, "diagonal", payouts));
            });
        }
        // add them all up
        wins.forEach(function(win) {
            // logger.reels('win sprite: %d count: %d payout %d', win.sprite, win.count, win.payout);
            winnings += (wager / 5) * win.payout;
        });
        // logger.reels('wager %d winnings %d player profit %d',
        //              wager.toBitcoin(),
        //              winnings.toBitcoin(),
        //              (winnings - wager).toBitcoin());
        // assign the new values to the self
        self.set({
            player_id: player_id,
            player_alias: player.username(),
            wager: wager,
            result: reelMatrix,
            scatter: scatterPositions,
            wins: wins,
            client_seed: client_seed,
            winnings: winnings,
            ip: ip,
            lock: false,
            createdAt: new Date(),
        });
        logger.reels('##### done playing game %s for %s (%s) ##### %s', self.primary(), player.username(), player_id, client_seed);
        // save the game data
        self.save(function(err) {
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

    Reels.init = function(user, cb) {
        // logger.reels('Reels.init');
        var server_seed = provable.getRandomSeed();
        var createTime = new Date().getTime();
        var newReel = new Reels({
            player_id: user.primary(),
            player_alias: user.username(),
            server_seed: server_seed,
            // hash using the provable library's hashing function
            seed_hash: provable.sha256sum(server_seed),
            init_time: createTime,
            lock: false
        });
        newReel.save(function(err) {
            if (err) {
                return cb(new HTTPError(500, err.message || err));
            }
            // only return a hash of the server seed and any other init info
            cb(undefined, {
                nextGameId: newReel.primary(),
                sha256: newReel.seed_hash()
            });
        });
    };

    return Reels;
};
