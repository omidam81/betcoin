'use strict';

var async = require('async');
var ObjectId = require('mongoskin').ObjectID;

module.exports = function(Autobet, AutobetWorkflow, Wallet, logger, DefaultAutobets, HTTPError) {
    var AutobetController = function() {};
    var autobetWorkflow = new AutobetWorkflow();

    AutobetController.prototype.getGames = function(req, res) {
        var autobets = [];
        Object.keys(DefaultAutobets).forEach(function(game){
            autobets.push(game);
        });
        res.json(autobets);
    };

    AutobetController.prototype.read = function(req, res) {
        var self = this;
        logger.verbose('AutobetController#read');
        Autobet.getConfigByUser(req.user.primary().toHexString(), function(err, robotPlayer) {
            if (err) return err.send(res);
            if (!robotPlayer) {
                return self.addNewUser(req, res);
            }
            var robots = [];
            var wallets = {};
            var games = robotPlayer.games()||[];
            games.forEach(function(game){
                if(game.player_id && robots.indexOf(game.player_id) === -1){
                    robots.push(game.player_id);
                }
            });
            async.eachSeries(robots, function(player_id, done){
                Wallet.all({userId: new ObjectId(player_id)}, function(err, userWallets){
                    userWallets.forEach(function(wallet){
                        wallets[player_id] = wallets[player_id]||{};
                        wallets[player_id][wallet.currency()] = wallet.filter();
                    });
                    done();
                });
            }, function(){
                var result = robotPlayer.filter();
                result.wallets = wallets;
                return res.json(result);
            });
        });
    };

    AutobetController.prototype.addNewUser = function(req, res) {
        logger.verbose('AutobetController#addNewUser');
        var params = {
            player_id: req.params.player_id||req.query.player_id
        };
        // try{
        //     params.actions = JSON.parse(req.body.actions);
        // }catch(ex){
        //     logger.error('parse actions param error %s', ex);
        //     return new HTTPError(400, "invalid actions param in request", res);
        // }
        if(!params.player_id){
            return new HTTPError(400, "missing player_id in request", res);
        }
        Autobet.getConfigByUser(params.player_id, function(err, robotPlayer){
            if(robotPlayer){
                robotPlayer.updateUser(params, function(err, updatedPlayer){
                    if(err) return err.send(res);
                    res.json(updatedPlayer);
                });
            }else{
                Autobet.addNewUser(params, function(err, config){
                    if(err) return err.send(res);
                    res.json(config);
                });
            }
        });
    };

    AutobetController.prototype.addNewGameAutobet = function(req, res, next) {
        logger.verbose('AutobetController#addNewGameAutobet');
        var params = req.body;
        Autobet.getConfigByUser(req.user.primary().toHexString(), function(err, robotConfig){
            if(!robotConfig) return next(new HTTPError(404, 'robot not found'));
            robotConfig.addNewGameAutobet(params, function(err, gameConfig){
                if(err) return err.send(res);
                res.json(gameConfig);
            });
        });
    };

    var updateGameAutobet = function(userid, params, callback) {
        if(!params._id){
            return callback(new HTTPError(400, "missing game config id in request"));
        }
        Autobet.getConfigByUser(userid, function(err, robotConfig){
            robotConfig.updateGameAutobet(params, function(err, updatedGame){
                return callback(err, updatedGame, robotConfig.filter());
            });
        });
    };

    AutobetController.prototype.updateGameAutobet = function(req, res) {
        logger.verbose('AutobetController#updateGameAutobet');
        var params = req.body;
        params._id = req.params.gameId;
        updateGameAutobet(req.user.primary().toHexString(), params, function(err, updatedGame, robot){
            if(err) return err.send(res);
            if(!updatedGame) {
                logger.warn('not found game config %s to update', params._id);
                return res.json(404);
            }
            if(updatedGame.enabled){
                updatedGame.password = robot.password;
                params = {
                    player: robot,
                    game: updatedGame
                };
                autobetWorkflow.startAutobet(params);
                res.json(updatedGame);
            }else{
                autobetWorkflow.stopAutobet(req.params.gameId, function(err){
                    if(err) return err.send(res);
                    res.json(updatedGame);
                });
            }
        });
    };

    AutobetController.prototype.removeGameAutobet = function(req, res) {
        logger.verbose('AutobetController#removeGameAutobet');
        Autobet.getConfigByUser(req.params.player_id, function(err, robotConfig){
            robotConfig.removeGameAutobet(req.params.gameId, function(err){
                if(err) return err.send(res);
                res.send(204);
            });
        });
    };

    return AutobetController;
};
