'use strict';

var mongo = require('mongowrap').getConnection();
var wallet = require('bitcoin-wallet');
var crypto = require('crypto');
require('./loggers');
var logger = require('winston').loggers.get('main');
var leagues = require('../config/leagues');

var MONGO_DB_NAME = 'casinodb';
var DICE_COLLECTION = 'dice';
var PLAYER_COLLECTION = 'dice_players';
var MAX_ROLL = parseInt('ffff', 16);
var LOSE_PAYOUT = 0.005;
var TXFEE = (0.0001).toSatoshi();
var MINIMUM_WINNINGS = 5460;
var MIN_LOSSES_TO_SEND = parseInt(process.env.MIN_LOSSES_TO_SEND, 10) || 150;

var balance = 0;

var wagerRewardLevels = [1, 5, 10, 50, 100];

var getBalance = function() {
    wallet.getAccountBalance('change', function(err, purse) {
        if (err) {
            logger.log('error', 'error updating bitcoin balance');
        } else {
            balance = purse;
            logger.log('silly', '%d in change', balance.toBitcoin());
        }
    });
};

getBalance();

setInterval(getBalance, 60000);
var changeAddress;

wallet.getChangeAddress(function(err, addr) {
    changeAddress = addr;
});

var checkExistingGame = function(txin, vout, cb) {
    mongo.getCollection('casinodb', 'dice', function(err, collection) {
        collection.find({
            _id: txin + ":" + vout
        }).nextObject(function(err, dice) {
            if (err) {
                throw err;
            } else if (dice) {
                cb(undefined, dice, collection);
            } else {
                // sails.log.info("missed this one the first time around, playing now");
                cb('not found', undefined, collection);
            }
        });
    });
};

var getGameConfig = module.exports.getGameConfig = function(game, cb) {
    if (cb === undefined && typeof game === 'function') {
        cb = game;
        game = 0;
    }
    mongo.getCollection('casinoadmin', 'dice_game_data', function(err, diceGameData) {
        if (err) return cb(err);
        if (game && parseInt(game, 10)) {
            diceGameData.find({
                _id: game
            }).nextObject(function(err, gameData) {
                if (err) return cb(err);
                cb(undefined, gameData);
            });
        } else {
            diceGameData.find().toArray(function(err, gameData) {
                if (err) return cb(err);
                cb(undefined, gameData);
            });
        }
    });
};

var getCalculatedOdds = function(game) {
    var target = game.target;
    var odds = 1 - ((MAX_ROLL + 1 - target) / (MAX_ROLL + 1));
    return odds;
};

var getPayout = function(game) {
    var odds;
    odds = getCalculatedOdds(game);
    var loseOdds = 1 - odds;
    var payout = 1 + (((game.house_edge * -1) - (LOSE_PAYOUT - 1) * loseOdds) / (odds));
    return payout;
};

var sendWinnings = function(txData, rollData, cb) {
    wallet.prepare(txData, function(err, txid, rawTx) {
        if (err) return err;
        rollData.status = 'prepared';
        if (txData.err) {
            rollData.tx_out_err = txid;
            rollData.error = txData.err;
        } else {
            rollData.tx_out = txid;
        }
        mongo.getCollection(MONGO_DB_NAME, DICE_COLLECTION, function(err, collection) {
            collection.save(rollData, function(err) {
                if (err) {
                    cb(err);
                } else {
                    logger.log('info', 'prepared and saved %s', txid);
                    setTimeout(function(rawTx) {
                        logger.log('info', 'sending %s', JSON.stringify(rawTx.signedTx, null, 2));
                        wallet.send(rawTx.signedTx, function(err, txid) {
                            if (err) {
                                return logger.log('error', 'error sending winnings %s', txid);
                            }
                            rollData.status = 'sent';
                            collection.save(rollData, function(err) {
                                if (err) {
                                    return logger.log('error', 'error saving winnings data %s', txid);
                                } else {
                                    logger.log('info', 'sent and saved %s', txid);
                                }
                            });
                        });
                    }, (20 * 1000), rawTx);
                    cb(undefined, rollData);
                }
            });
        });
    });
};

var getRefDate = function() {
    var date = new Date();
    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date;
};

var getDiceHash = function(cb) {
    mongo.getCollection('casinohashes', 'dicehash', function(err, DiceHash) {
        if (err) {
            cb(err);
        } else {
            var refDate = getRefDate();
            DiceHash.find({
                date: refDate
            }).nextObject(function(err, hash) {
                if (err) {
                    cb(err);
                } else if (hash) {
                    cb(undefined, hash.secret, hash.hash);
                } else {
                    cb(new Error("no hash found for date " + refDate.toISOString()));
                }
            });
        }
    });
};

module.exports.checkUnconfirmed = function(cb) {
    mongo.getCollection(MONGO_DB_NAME, DICE_COLLECTION, function(err, dice) {
        if (err) return cb(err);
        var now = new Date();
        var refDate = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));
        dice.find({
            createdAt: {$gt: refDate},
            $or: [{confirmed: {$exists: false}}, {confirmed: 0}]
        }).toArray(function(err, unconfirmed) {
            if (err) return cb(err);
            // sync loop and update if confirmed
            logger.log('debug', 'checking %d txs since %s for confirmations', unconfirmed.length, refDate.toISOString());
            var updated = 0;
            var syncUpdate = function() {
                var game = unconfirmed.shift();
                if (game !== undefined && game.tx_in !== undefined) {
                    wallet.findTransaction(game.tx_in, function(err, tx) {
                        if (err) return cb(err);
                        if (tx.confirmations) {
                            dice.update({_id: game._id}, {$set: {confirmed: 1}}, function(err) {
                                if (err) return cb(err);
                                updated ++;
                                syncUpdate();
                            });
                        } else {
                            syncUpdate();
                        }
                    });
                } else {
                    return cb(undefined, updated);
                }
            };
            syncUpdate();
        });
    });
};

var returnInvalidBet = function(gameData, cb) {
    var inputs = [{txid:gameData.tx_in, vout: gameData.output_number, amount: gameData.wager}];
    var amount = gameData.wager - TXFEE;
    var outputs = {};
    outputs[gameData.player_id] = amount;
    var newDiceData = {
        _id: gameData.tx_in + ":" + gameData.output_number,
        player_id: gameData.player_id,
        wager: 0,
        addr_in: gameData.address,
        result: 999999,
        winnings: 0,
        game: "invalid",
        tx_in: gameData.tx_in,
        error: "the wager was too low, returned",
        payout_multiplier: "invalid",
        hmachash: "invalid",
        secret_hash: "invalid",
        output_number: gameData.output_number,
        createdAt: new Date()
    };
    if (amount > MINIMUM_WINNINGS) {
        var txData = {
            inputs: inputs,
            outputs: outputs,
            txfee: TXFEE,
            err: 'invalid bet'
        };
        mongo.getCollection(MONGO_DB_NAME, DICE_COLLECTION, function(err, collection) {
            if (err) return cb(err);
            collection.save(newDiceData, function(err) {
                if (err) return cb(err);
                sendWinnings(txData, newDiceData, cb);
            });
        });
    } else {
        logger.log('info', 'adding dust to loss pool');
        suspendLoss(newDiceData, function(err) {
            if (err) return console.error('error suspending dust %s', err.message);
        });
    }
};

var generateTxData = function(rollData) {
    if (rollData.winnings > -1) {
        var outputs = {};
        // use the original wager tx output as the reference
        var inputs = [{txid:rollData.tx_in, vout: rollData.output_number, amount: rollData.wager}];
        // POST a /send to the bitcoin server
        var txData = {
            inputs: inputs,
            txfee: TXFEE
        };
        var profit = rollData.winnings - rollData.wager;
        if (profit < (balance / 2)) {
            balance = balance - rollData.winnings;
            if (rollData.winnings - TXFEE < MINIMUM_WINNINGS) {
                outputs[changeAddress] = rollData.wager - TXFEE;
            } else {
                outputs[rollData.player_id] = rollData.winnings - TXFEE;
            }
            txData.outputs = outputs;
        } else {
            logger.log('warn', 'returning bet %s due to low house balance', rollData._id);
            outputs[rollData.player_id] = rollData.wager - TXFEE;
            txData.outputs = outputs;
            txData.err = 'exceeds win limit';
        }
        return txData;
    }
};

var suspendLoss = function(rollData, cb) {
    // make a bitcoind compatable input from the rolldata
    var input = {gameId: rollData._id, txid: rollData.tx_in, vout: rollData.output_number, amount: rollData.wager};
    // lock the output
    wallet.lockUnspent('lock', [input], function(err) {
        if (err) return cb(err);
        mongo.getCollection(MONGO_DB_NAME, 'suspended_losses', function(err, suspendedLosses) {
            if (err) return cb(err);
            mongo.getCollection(MONGO_DB_NAME, DICE_COLLECTION, function(err, Dice) {
                if (err) return cb(err);
                // add to list of pending loss spends
                input._id = input.txid + ":" + input.vout;
                suspendedLosses.insert(input, function(err) {
                    if (err) {
                        if (err.code === 11000) {
                            return cb(new Error("a loss was trying to suspend even though it already has been suspended"));
                        } else {
                            return cb(err);
                        }
                    }
                    //set the tx to *something* so the socket will broadcast it to the client
                    rollData.tx_out = 'pending';
                    // set the game record to a pending tx_out and return the data to the cb
                    Dice.update({_id: rollData._id}, {$set: {tx_out: 'pending'}}, function(err) {
                        if (err) return cb(err);
                        cb(undefined, rollData);
                    });
                });
            });
        });
    });
};

var relockLosses = function(inputs, err, cb) {
    wallet.lockUnspent('lock', inputs, function(lockErr) {
        if (lockErr) return cb(lockErr);
        cb(err);
    });
};

module.exports.getSuspendedLoss = function(txid, vout, cb) {
    if (cb === undefined && 'function' === typeof vout) {
        cb = vout;
        var parts = txid.split(":");
        txid = parts[0];
        vout = parseInt(parts[1], 10);
    }
    mongo.getCollection('casinodb', 'suspended_losses', function(err, suspendedLosses) {
        if (err) return cb(err);
        // get all suspended games
        suspendedLosses.findOne({txid: txid, vout: vout}, function(err, loss) {
            if (err) return cb(err);
            return cb(undefined, loss);
        });
    });
};

var getSuspendedLosses = module.exports.getSuspendedLosses = function(cb) {
    mongo.getCollection('casinodb', 'suspended_losses', function(err, suspendedLosses) {
        if (err) return cb(err);
        // get all suspended games
        suspendedLosses.find().toArray(function(err, allInputs) {
            if (err) return cb(err);
            logger.debug('%d suspended losses', allInputs.length);
            return cb(undefined, allInputs);
        });
    });
};

module.exports.sendSuspended = function(cb) {
    getSuspendedLosses(function(err, allInputs) {
        if (err) return cb(err);
        logger.debug('%d suspended losses', allInputs.length);
        // just go back if there are not enough
        if (allInputs.length < MIN_LOSSES_TO_SEND) return cb(undefined, 0);
        var txids = [];
        var inputCount = allInputs.length;
        // unlock the outputs
        var looper = function() {
            var inputs = allInputs.splice(0, MIN_LOSSES_TO_SEND);
            logger.debug('attempting to send %d losses', inputs.length);
            logger.debug('%d losses left', allInputs.length);
            if (inputs.length) {
                wallet.lockUnspent('unlock', inputs, function(err) {
                    if (err) return cb(err);
                    // create tx data
                    var txdata = {
                        inputs: inputs,
                        txfee: TXFEE
                    };
                    var outputs = {};
                    // send to change
                    outputs[changeAddress] = 0;
                    var gameIds = [];
                    inputs.forEach(function(input) {
                        if (gameIds.indexOf(input.gameId) < 0) {
                            gameIds.push(input.gameId);
                        }
                        outputs[changeAddress] += input.amount;
                    });
                    txdata.outputs = outputs;
                    // send it
                    wallet.send(txdata, function(err, txid) {
                        // if this fails, lock the outputs again so they do not get picked up by the block sweeper
                        if (err) {
                            return relockLosses(inputs, err, function(err) {
                                if (err) logger.error('error sending suspended losses: %s, trying next chunk', err.message);
                                return looper();
                            });
                        }
                        mongo.getCollection('casinodb', 'suspended_losses', function(err, suspendedLosses) {
                            if (err) return cb(err);
                            // remove them from the db
                            suspendedLosses.remove({gameId: {$in: gameIds}}, {mutli: true}, function(err) {
                                if (err) return cb(err);
                                mongo.getCollection(MONGO_DB_NAME, DICE_COLLECTION, function(err, Dice) {
                                    if (err) return cb(err);
                                    // update the games with the new txid for the grouped tx
                                    Dice.update({_id: {$in: gameIds}}, {$set: {tx_out: txid}}, {multi: true}, function(err) {
                                        if (err) return cb(err);
                                        txids.push(txid);
                                        looper();
                                    });
                                });
                            });
                        });
                    });
                });
            } else {
                cb(undefined, inputCount, txids);
            }
        };
        looper();
    });
};

var processBet = function(gameData, cb) {
    var tx_in = gameData.tx_in;
    var outputNumber = gameData.output_number;
    var game = parseInt(gameData.game, 10);
    var wager = parseInt(gameData.wager, 10);
    var player_id = gameData.player_id;
    getDiceHash(function(err, server_secret, secret_hash) {
        if (err) return cb(err);
        getGameConfig(game, function(err, gameConfig) {
            if (err) return cb(err);
            if (!gameConfig) return cb(new Error('no game config found for game ' + game));
            /**
             * Dice Game Logic
             */
            var hmac = crypto.createHmac('sha512', server_secret);
            hmac.update(tx_in + ":" + outputNumber);
            var hmachash = hmac.digest('hex');
            var partial = hmachash.substring(0, 4);
            var result = parseInt(partial, 16);
            if (result > MAX_ROLL) {
                throw {
                    message: "Server computation error."
                };
            }
            // get the target for this game an determine if the play was a win
            var target = gameConfig.target;
            var win = result < target;
            var winnings = 0;
            var payout = getPayout(gameConfig);
            if (win) {
                winnings = Math.floor(wager * payout);
            } else {
                winnings = Math.floor(wager * LOSE_PAYOUT);
                if (winnings - TXFEE < MINIMUM_WINNINGS) {
                    winnings = 0;
                }
            }
            // end game logic
            var rollData = {
                _id: tx_in + ":" + outputNumber,
                player_id: player_id,
                wager: wager,
                addr_in: gameConfig.address,
                result: result,
                winnings: winnings,
                game: game,
                tx_in: tx_in,
                payout_multiplier: payout,
                hmachash: hmachash,
                secret_hash: secret_hash,
                output_number: outputNumber,
                confirmed: gameData.confirmed,
                createdAt: new Date()
            };
            mongo.getCollection('casinodb', 'dice', function(err, collection) {
                collection.save(rollData, function(err) {
                    if (err) {
                        cb(err);
                    } else {
                        processLeagueStandings(rollData);
                        if (rollData.winnings - TXFEE > MINIMUM_WINNINGS) {
                            sendWinnings(generateTxData(rollData), rollData, cb);
                        } else {
                            logger.info('suspending loss %s', rollData._id);
                            suspendLoss(rollData, cb);
                        }
                    }
                });
            });
        });
    });
};

var processLeagueStandings = function(rollData) {
    rollData.pointsAwarded = 1;
    mongo.getCollection(MONGO_DB_NAME, PLAYER_COLLECTION, function(err, players) {
        if (err) return logger.log('error', err.message || err);
        players.findOne({_id: rollData.player_id}, function(err, player) {
            if (err) return logger.log('error', err.message || err);
            if (!player) {
                var sha = crypto.createHash('sha256');
                sha.update(rollData.player_id);
                var alias = sha.digest('hex');
                player = {
                    _id: rollData.player_id,
                    alias: alias,
                    games: {
                        all: {
                            wagered: 0,
                            won: 0,
                            points: 0
                        }
                    }
                };
                player.games.dice = {
                    totalWagered: 0,
                    totalWon: 0,
                    totalBets: 0,
                    currentLeague: 'bronze',
                    streak: 0,
                    nextRewardLevel: 1,
                    leagues: {
                        bronze: {
                            points: 0,
                            joined: new Date(),
                            wagered: 0
                        },
                        silver: {
                            points: 0
                        },
                        gold: {
                            points: 0
                        },
                        platinum: {
                            points: 0
                        },
                        diamond: {
                            points: 0
                        }
                    }
                };
            }
            player.games.dice.totalBets += 1;
            var currentLeague = player.games.dice.currentLeague;
            var playerLeagues = player.games.dice.leagues;
            // if the player is currently in a league lower than diamond, see of this allows them to move up
            var newWageredAmount = playerLeagues[currentLeague].wagered + rollData.wager;
            if (currentLeague !== 'diamond') {
                if (newWageredAmount > leagues[currentLeague].maxWagered) {
                    for (var leagueName in leagues) {
                        if (newWageredAmount > leagues[leagueName].minWagered && newWageredAmount < leagues[leagueName].maxWagered) {
                            playerLeagues[currentLeague].points = 0;
                            playerLeagues[currentLeague].wagered = 0;
                            playerLeagues[currentLeague].left = rollData.createdAt;
                            currentLeague = leagueName;
                            playerLeagues[currentLeague].wagered = rollData.wager;
                            playerLeagues[currentLeague].points = 0;
                            playerLeagues[currentLeague].joined = rollData.createdAt;
                            player.games.dice.currentLeague = leagueName;
                            player.games.dice.nextRewardLevel = 1;
                        }
                    }
                } else {
                    playerLeagues[currentLeague].wagered = newWageredAmount;
                }
            } else {
                playerLeagues[currentLeague].wagered = newWageredAmount;
            }
            // evaluate sequence of wagers for more points
            var newTotalWagered = player.games.dice.totalWagered + rollData.wager;
            var currentPlayerLevel = player.games.dice.nextRewardLevel;
            if (newTotalWagered >= currentPlayerLevel.toSatoshi()) {
                var nextLevel = wagerRewardLevels[wagerRewardLevels.indexOf(currentPlayerLevel) + 1];
                if (!nextLevel) {
                    nextLevel = 1;
                    newTotalWagered = 0;
                }
                playerLeagues[currentLeague].points += (currentPlayerLevel * 10);
                rollData.pointsAwarded += (currentPlayerLevel * 10);
                player.games.dice.nextRewardLevel = nextLevel;
            }
            player.games.dice.totalWagered = newTotalWagered;
            // one point in the current league for a roll
            playerLeagues[currentLeague].points += 1;
            // give points based on win/lose streak
            // negative numbers are use for losing, positive for winning
            if (rollData.winnings > rollData.wager) {
                // give points based on win
                var odds = getCalculatedOdds({target: rollData.game});
                playerLeagues[currentLeague].points += (100 - parseInt((odds * 100), 10));
                if (player.games.dice.streak < 0) {
                    player.games.dice.streak = 1;
                } else {
                    player.games.dice.streak += 1;
                }
            } else {
                if (player.games.dice.streak > 0) {
                    player.games.dice.streak = -1;
                } else {
                    player.games.dice.streak -= 1;
                }
            }
            if (Math.abs(player.games.dice.streak) % 5 === 0) {
                playerLeagues[currentLeague].points += 5;
                rollData.pointsAwarded += 5;
            }
            player.games.dice.currentPoints = playerLeagues[currentLeague].points;
            player.games.dice.totalWon += rollData.winnings;
            player.games.all.wagered += rollData.wager;
            player.games.all.won += rollData.winnings;
            player.games.all.points += rollData.pointsAwarded;
            players.save(player, function(err) {
                if (err) return logger.error(err.message || err);
            });
        });
    });
};

module.exports.play = function(gameData, cb) {
    checkExistingGame(gameData.tx_in, gameData.output_number, function(err, existingGame) {
        if (err && existingGame === undefined) {
            // determine if this is a vaid bet
            if (gameData.wager > gameData.maxBet || gameData.wager < gameData.minBet) {
                returnInvalidBet(gameData, cb);
            } else {
                logger.log('info', 'playing game %s:%d', gameData.tx_in, gameData.output_number);
                processBet(gameData, cb);
            }
        } else if(existingGame.status === 'prepared') {
            logger.log('warn', 'game prepared but never sent %s:%d', gameData.tx_in, gameData.output_number);
            sendWinnings(generateTxData(existingGame), existingGame, cb);
        } else if(!existingGame.tx_out && !existingGame.tx_out_err) {
            logger.log('warn', 'game played but never prepared %s:%d', gameData.tx_in, gameData.output_number);
            sendWinnings(generateTxData(existingGame), existingGame, cb);
        } else {
            if (gameData.confirmed && !existingGame.confirmed) {
                mongo.getCollection(MONGO_DB_NAME, DICE_COLLECTION, function(err, collection) {
                    existingGame.confirmed = 1;
                    collection.save(existingGame, function(err) {
                        if (err) return cb(err);
                        if (existingGame.tx_out === undefined && existingGame.tx_out_err === undefined) {
                            sendWinnings(generateTxData(existingGame), existingGame, cb);
                        } else {
                            cb(undefined, existingGame);
                        }
                    });
                });
            } else {
                cb(undefined, existingGame);
            }
        }
    });
};
