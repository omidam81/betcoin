'use strict';

var util = require('util');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 1000;

module.exports = function(Game, GameLogic, logger, io, HTTPError, BaseMultipartGameController) {
    var MahjongController = function() {
        BaseMultipartGameController.call(this, Game, LAST_GAME_MIN_TIME);
    };

    util.inherits(MahjongController, BaseMultipartGameController);

    MahjongController.prototype.readGameParams = function(req) {
        var gameParams = {
            lastGameId: req.body.last_game_id,
            unfinishedGameId: req.body.unfinished_game_id
        };
        var wager = parseInt(req.body.wager, 10);
        if (gameParams.unfinishedGameId) {
            wager = 0;
            req.body.wager = 0;
            delete(gameParams.lastGameId);
        }
        if (req.wallet.balance() < wager * 64) {
            throw new HTTPError(412, "Limited Balance");
        }
        return gameParams;
    };

    // override to send a socket.io broadcast when a game is finished
    MahjongController.prototype.playFinished = function(game, cb) {
        var gameJson = game.filter();
        gameJson.remaining_length = gameJson.remaining_array.length;
        delete gameJson.server_seed;
        delete gameJson.final_array;
        delete gameJson.remaining_array;
        if (game.status() === 'finished') {
            io.playerEmit(game.player_id(),'player mahjong added', gameJson);
            io.playerBroadcast(game.player_id(), 'mahjong added', gameJson);
        } else {
            for (var seat in gameJson.all_hands) {
                if (gameJson.all_hands.hasOwnProperty(seat)) {
                    if (gameJson.player_seat !== seat) {
                        for (var i = 0; i < gameJson.all_hands[seat].unmeldedTiles.length; i++) {
                            gameJson.all_hands[seat].unmeldedTiles[i] = null;
                        }
                    }
                }
            }
        }
        return cb(undefined, gameJson);
    };

    // we are doing the exact same transforming here, so just assign
    // the function again
    MahjongController.prototype.nextActionFinished = MahjongController.prototype.playFinished;

    // read the params for next action, similar to readGameParams, but
    // omits client_seed and wager
    MahjongController.prototype.readNextActionParams = function(req) {
        var gameParams = {};
        try {
            if (req.body.action) {
                gameParams.action = JSON.parse(req.body.action);
            }
            if (req.body.tile) {
                gameParams.tile = JSON.parse(req.body.tile);
            }
        } catch(e) {
            throw new HTTPError(400, "invalid action json string");
        }
        return gameParams;
    };

    MahjongController.prototype.nextActionDebit = function(wallet, gameParams, gameModel, cb) {
        var winnings = gameModel.winnings();
        if (winnings < 0) {
            wallet.debit({
                // we already debited the wager, so debit the wager
                amount: -winnings,
                refId: "wager:" + gameParams.gameId + ":lose",
                type: this.Game.modelName + ":wager:lose",
                meta: {
                    locale: gameParams.locale
                }
            }, function(err, transaction) {
                if (err) return cb(err);
                // set the wager on the game model to 3x it's original value
                gameModel.wager(gameModel.wager() + (-winnings));
                gameModel.winnings(0);
                return cb(undefined, transaction);
            });
        } else {
            return cb();
        }
    };

    MahjongController.prototype.next = function(req, res, next) {
        this.Game.init(req.user, function(err, initData) {
            if (err) return next(err);
            Game.find({player_id: req.user.primary(), status: 'drawn', currency: req.wallet.currency()}, function(err, unfinishedGame){
                if(!err) {
                    if(unfinishedGame) {
                        initData.unfinishedGameId = unfinishedGame.attrs._id;
                    }
                }
                res.json(initData);
            });
        });
    };

    return MahjongController;
};
