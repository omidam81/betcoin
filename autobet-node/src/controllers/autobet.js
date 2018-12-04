'use strict';

var HTTPError = require('httperror-npm');

module.exports = function(Autobet, WorkflowExecutor, logger, PlayerInterface, DefaultAutobets) {
    var AutobetController = function() {
        var controller = this;
        var checkPlayerToken = function(player_id, token, cb) {
            PlayerInterface.verifyToken(player_id, token, function(err, isValid) {
                if (err) return cb(new HTTPError(500, err.message));
                if (!isValid) return cb(new HTTPError(418, "You cannot play for another player, you jerk"));
                // return the gameId in the callback, the next stage in
                // the waterfall is Baccarat.checkLock which consumes a
                // gameId string
                return cb();
            });
        };
        var extend = function(prototype){
            controller[prototype] = function(req, res) {
                var player_id = req.params.player_id||req.body.player_id||req.query.player_id;
                var token = req.token;
                checkPlayerToken(player_id, token, function(err){
                    if(err) return err.send(res);
                    AutobetController.prototype[prototype].call(controller, req, res);
                });
            };
        };
        for(var prototype in AutobetController.prototype){
            if(AutobetController.prototype[prototype]){
                extend(prototype);
            }
        }
        controller.getGames = function(req, res) {
            var autobets = [];
            Object.keys(DefaultAutobets).forEach(function(game){
                autobets.push(game);
            });
            res.json(autobets);
        };
    };


    AutobetController.prototype.read = function(req, res) {
        var self = this;
        logger.debug('AutobetController#read');
        Autobet.getConfigByUser(req.params.player_id, function(err, robotPlayer) {
            if (err) return err.send(res);
            if (!robotPlayer) {
                return self.addNewUser(req, res);
            }
            return res.json(robotPlayer.filter());
        });
    };

    AutobetController.prototype.addNewUser = function(req, res) {
        logger.debug('AutobetController#addNewUser');
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

    AutobetController.prototype.addNewGameAutobet = function(req, res) {
        logger.debug('AutobetController#addNewGameAutobet');
        var params = req.body;
        Autobet.getConfigByUser(req.params.player_id, function(err, robotConfig){
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
            params = {
                _id: params._id,
                name: params.name,
                type: params.type,
                enabled: params.enabled,
                frequency: params.frequency,
                wager: params.wager,
                actions: params.type === 'custom'?params.actions:null
            };
            robotConfig.updateGameAutobet(params, function(err, updatedGame){
                return callback(err, updatedGame, robotConfig.filter());
            });
        });
    };

    AutobetController.prototype.updateGameAutobet = function(req, res) {
        logger.debug('AutobetController#updateGameAutobet');
        var params = req.body;
        params._id = req.params.gameId;
        updateGameAutobet(req.params.player_id, params, function(err, updatedGame, robot){
            if(err) return err.send(res);
            if(updatedGame.enabled){
                updatedGame.password = robot.password;
                var params = {
                    player: robot,
                    game: updatedGame
                };
                WorkflowExecutor.startAutobet(params);
                res.json(updatedGame);
            }else{
                WorkflowExecutor.stopAutobet(req.params.gameId, function(err){
                    if(err) return err.send(res);
                    res.json(updatedGame);
                });
            }
        });
    };

    AutobetController.prototype.removeGameAutobet = function(req, res) {
        logger.debug('AutobetController#removeGameAutobet');
        Autobet.getConfigByUser(req.params.player_id, function(err, robotConfig){
            robotConfig.removeGameAutobet(req.params.gameId, function(err){
                if(err) return err.send(res);
                res.send(204);
            });
        });
    };

    return new AutobetController();
};
