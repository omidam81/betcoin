'use strict';

var util = require('util');
var async = require('async');
// millisecond minimun between spins, usually relates to front end
// animation times
var LAST_GAME_MIN_TIME = 1000;

module.exports = function(Game, GameLogic, logger, io, HTTPError, BaseGameController) {
    var CrapsController = function() {
        BaseGameController.call(this, Game, LAST_GAME_MIN_TIME);
    };

    util.inherits(CrapsController, BaseGameController);

    CrapsController.prototype.readGameParams = function(req) {
        var gameParams = {
            lastGameId: req.body.last_game_id
        };

        try {
            gameParams.bets = JSON.parse(req.body.bets);
            gameParams.win_bets_up = req.body.win_bets_up;
        } catch(e) {
            throw new HTTPError(400, "Invalid bets");
        }
        gameParams.wager = 0;
        for(var x in gameParams.bets) {
            if(gameParams.bets.hasOwnProperty(x)) {
                if(gameParams.bets[x] >= 0) {
                    gameParams.wager += gameParams.bets[x];
                } else {
                    throw new HTTPError(400, "invalid wager in play request");
                }
            }
        }
        if (isNaN(gameParams.wager)) {
            throw new HTTPError(400, "invalid wager in play request");
        }
        return gameParams;
    };

    // override to send a socket.io broadcast when a game is finished
    CrapsController.prototype.playFinished = function(game, cb) {
        var gameJson = game.filter();
        io.playerEmit(game.player_id(),'player craps added', gameJson);
        io.playerBroadcast(game.player_id(), 'craps added', gameJson);
        return cb(undefined, gameJson);
    };

    CrapsController.prototype.returnBets = function(req, res, next) {
        var gameParams = {
            gameId: req.body.game_id,
            lastGameId: req.body.last_game_id,
            user: req.user,
            wallet: req.wallet,
            ip: req.ip,
            client_seed: req.body.client_seed
        };
        var wallet = gameParams.wallet;
        try {
            gameParams.return_bets = JSON.parse(req.body.return_bets);
        } catch(e) {
            throw new HTTPError(400, "Invalid return bets param");
        }
        async.waterfall([
            function(done){
                Game.checkLock(gameParams.gameId, function(err, game){
                    done(err, game);
                });
            },
            function(game, done){
                game.returnBets(gameParams, function(err, gameModel){
                    done(err, gameModel);
                });
            },
            function(gameModel, done){
                wallet.credit({
                    amount: gameModel.winnings(),
                    refId: "winnings:" + gameParams.gameId,
                    type: Game.modelName + ":winnings"
                }, function(err){
                    done(err, gameModel);
                });
            }
        ], function(err, gameModel){
            if(err){
                return next(new HTTPError(err.code || 500, err.message));
            } 
            var gameJson = gameModel.toJSON();
            gameJson.balance = wallet.balance();
            res.json(gameJson);
        });
    };

    CrapsController.prototype.getHouseEdge = function(gameParams/*, gameModel*/) {
        if (gameParams.bets) {
            return GameLogic.getHouseEdge(gameParams.bets);
        } else {
            return BaseGameController.DEFAULT_HOUSE_EDGE;
        }
    };

    return CrapsController;
};
