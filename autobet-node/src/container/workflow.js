'use strict';

var Agenda = require('agenda');
var scheduler = new Agenda();
var request = require('request');
var async = require('async');
var url = require('url');
var HTTPError = require('httperror-npm');
var request = require('request');

/* jslint evil: true */

module.exports = function(mongo, appDbName, Autobet, logger, DefaultAutobets, Config, PlayerInterface, io) {
    var scheduleDb = mongo.getDb({dbname: appDbName});
    scheduler.mongo(scheduleDb.collection('scheduler'));

    var self = this;
    var PLAYER_SERVER;
    var parseUrl = function(playerUrl) {
        PLAYER_SERVER = url.parse(playerUrl);

        if (PLAYER_SERVER.hostname === null) throw "Malformed PLAYER_SERVER_PORT variable: " + playerUrl;
        if (PLAYER_SERVER.port === null) throw "Malformed PLAYER_SERVER_PORT variable: " + playerUrl;
        PLAYER_SERVER.port = parseInt(PLAYER_SERVER.port, 10);
    };
    parseUrl(process.env.PLAYER_SERVER_PORT);

    self.getRobotPlayerToken = function (userId, callback) {
        logger.info('get API token for robot user');
        PlayerInterface.getToken(userId, function(err, token, user){
            callback(err, user);
        });
    };
    self.executeWorkflows = function (params, callback) {
        self.getRobotPlayerToken(params.player.userid, function(error, player){
            if(error) return callback(error);
            params.player.token = player.token;
            params.player.data = player;
            self.executeWorkflowQueue(params.game.actions, params.game, params.player, callback);
        });
    };
    self.executeWorkflowQueue = function(actionsToRun, game, player, callback) {
        game.totals.runCounts = game.totals.runCounts||0;
        game.totals.runCounts ++;
        game.waitToRun = false;
        var actionIndex = 0;
        async.eachSeries(actionsToRun, function(action, done){
            actionIndex ++;
            if(action.type === 'convert'){
                self.convertAction(game, action, done);
            }else if(action.type === 'js'){
                var customLogic = new Function(['game', 'action', 'player', 'done'], action.body);
                customLogic(game, action, player, done);
                self.updateGameTotals(game, action, player);
            }else {
                if(action.httpType === 'get'){
                    self.getAction(game, action, player, done);
                }
                if(action.httpType === 'post'){
                    self.postAction(game, action, player, done);
                }
                if(action.httpType === 'put'){
                    self.putAction(game, action, player, done);
                }
            }
        }, function(err){
            if(!err && game.enabled){
                callback();
            }else if(err){
                if(!err.action_type){
                    self.updateGameResults(game, err, actionsToRun[actionIndex - 1], player);
                    game.enabled = false;
                    delete player.data;
                    // delete player.token;
                    // Autobet.updateUser(player);
                    logger.error('executing action %s game %s player %s', actionIndex, game.name, player.userid);
                    callback(err);
                }else{
                    if(err.action_type.indexOf('recursive') !== -1){
                        self.recursive(game, player, err.action_type.split('_')[1] - 1, callback);
                    }
                }
            }
        });
    };
    self.recursive = function(game, player, actionIndex, callback) {
        var slicedActions = game.actions.slice(actionIndex);
        self.executeWorkflowQueue(slicedActions, game, player, callback);
    };
    self.convertAction = function(game, action, callback) {
        try{
            var convertFormula = JSON.parse(action.body);
            for(var i in convertFormula){
                if(convertFormula.hasOwnProperty(i)){
                    game.convertedParams[convertFormula[i]] = game.previousResponse[i];
                }
            }
        }catch(ex){
            return callback(ex);
        }
        callback();
    };
    self.getAction = function(game, action, player, callback) {
        var config = {
            url: Config.server_url + action.endpoint,
            headers: {
                Authorization: 'Bearer ' + player.data.token
            }
        };
        request.get(config, function(error, data){
            if(error) return callback(new HTTPError(500, error.message));
            var json;
            try{
                json = JSON.parse(data.body);
            }catch(ex){
                return callback(new HTTPError(500, 'response is not a json'));
            }
            if(json.err || json.code){
                return callback(new HTTPError(500, json.message));
            }
            game.previousResponse = json;
            self.updateGameResults(game, json, action, player);
            callback(error);
        });
    };
    self.postAction = function(game, action, player, callback) {
        var params = {};
        var config = {
            headers: {
                Authorization: 'Bearer ' + player.data.token
            }
        };
        if(action.body){
            var jsonbody = self.resolveJsonBody(action, game);
            try{
                params = JSON.parse(jsonbody);
            }catch(ex){
                return callback(new HTTPError(500, 'response is not a json'));
            }
        }
        params.player_id = player.data._id;
        params.token = player.data.token;
        var endpoint = self.resolveEndpointUrl(action, game);
        config.url = Config.server_url + endpoint;
        config.form = params;
        request.post(config, function(error, data){
            var json;
            try{
                json = JSON.parse(data.body);
            }catch(ex){
                return callback(new HTTPError(500, 'response is not a json'));
            }
            if(error) return callback(new HTTPError(500, error.message));
            if(data.statusCode !== 200 || json.code){
                return callback(new HTTPError(500, json.message));
            }
            game.previousResponse = json;
            self.updateGameResults(game, json, action, player);
            callback();
        });
    };
    self.putAction = function(game, action, player, callback) {
        var params = {};
        var config = {
            headers: {
                Authorization: 'Bearer ' + player.data.token
            }
        };
        if(action.body){
            var jsonbody = self.resolveJsonBody(action, game);
            try{
                params = JSON.parse(jsonbody);
            }catch(ex){
                return callback(ex);
            }
        }
        var endpoint = self.resolveEndpointUrl(action, game);
        params.player_id = player.data._id;
        params.token = player.data.token;
        params.wager = params.wager.toSatoshi();
        config.url = Config.server_url + endpoint;
        config.form = params;
        request.put(config, function(error, data){
            var json;
            try{
                json = JSON.parse(data.body);
            }catch(ex){
                return callback(new HTTPError(500, 'response is not a json'));
            }
            if(error) return callback(new HTTPError(500, error.message));
            if(data.statusCode !== 200 || json.code){
                return callback(new HTTPError(500, json.message));
            }
            game.previousResponse = json;
            self.updateGameResults(game, json, action, player);
            callback();
        });
    };
    self.resolveEndpointUrl = function(action, game){
        if(!game.convertedParams || !action.endpoint){
            return;
        }
        var endpoint = action.endpoint;
        for(var i in game.convertedParams){
            if(game.convertedParams.hasOwnProperty(i)){
                if(endpoint.indexOf('{{'+ i +'}}') !== -1){
                    endpoint = endpoint.replace('{{'+ i +'}}', game.convertedParams[i]);
                }
            }
        }
        return endpoint;
    };
    self.resolveJsonBody = function(action, game){
        if(!game.convertedParams || !action.body){
            return;
        }
        var body = action.body;
        for(var i in game.convertedParams){
            if(game.convertedParams.hasOwnProperty(i)){
                if(body.indexOf('{{'+ i +'}}') !== -1){
                    body = body.replace('{{'+ i +'}}', game.convertedParams[i]);
                }
            }
        }
        return body;
    };
    self.updateGameResults = function(game, result, action, player){
        game.results = game.results || [];
        if(game.results.length >= 30){
            game.results.pop();
        }

        io.send(player.userid, 'new autobet action result', {game_id: game._id, action: action, result: result});
        result = JSON.stringify(result, null, "  ");
        
        game.results.unshift({text:result, action:action, time:new Date()});
    };
    self.updateGameTotals = function(game, action, player){
        io.send(player.userid, 'new autobet totals', {game_id: game._id, game_stats: game.totals});
    };
    self.stopAutobet = function (gameid, callback) {
        logger.info('stop autobet for game id %s', gameid);
        scheduler.cancel({name: gameid}, function(err){
            if(err){
                logger.error('remove auto bet scheduler %s', err.message);
                return callback(new HTTPError(500, err.message));
            }
            return callback();
        });
    };
    self.startAutobet = function (params) {
        params.game.actions = DefaultAutobets[params.game.type];
        if(!params.game.actions || params.game.actions.length === 0){
            return;
        }

        logger.info('restart autobet for game id %s', params.game._id);
        self.stopAutobet(params.game._id, function(){
            scheduler.define(params.game._id, function(job, done) {
                logger.info("auto betting %s game (%s)", params.player.userid, params.game.name);
                params.game.actions = DefaultAutobets[params.game.type] || params.game.actions;
                params.game.convertedParams = params.game.convertedParams || {wager: params.game.wager.toSatoshi()};
                params.game.totals = params.game.totals || {};
                self.executeWorkflows(params, function(err){
                    if(err){
                        logger.error('execute workflows error code: %d message: %s', err.code, err.message);
                        scheduler.cancel({name: params.game._id}, function(err){
                            if(err){
                                logger.error('remove schedule job error code:%d message:%s', err.code, err.message);
                            }
                            done();
                        });
                    }else{
                        done();
                    }
                });
            });
            scheduler.every(params.game.frequency * 1000, params.game._id);
        });
    };
    self.run = function () {
        async.series([
            function(cb){
                scheduler.purge(function(err, removed) {
                    if (err) throw err;
                    logger.info('%d old auto bet schedules removed', removed);
                    cb();
                });
            },
            function(cb){
                Autobet.all({}, function(err, autobets){
                    async.eachSeries(autobets, function(robot, doneRobot){
                        if(!robot.games()) return doneRobot();
                        async.eachSeries(robot.games(), function(game, doneGame){
                            if(!game.enabled) return doneGame();
                            var params = {
                                player: robot.filter(),
                                game: game
                            };
                            self.startAutobet(params);
                            doneGame();
                        }, function(err){
                            doneRobot(err);
                        });
                    }, function(err){
                        if(err) return cb(err);
                        scheduler.start();
                        cb();
                    });
                });
            }
            ], function(err){
                if(err) logger.error('workflow#run error %s %s', err.code, err.message);
            });
    };
    return self;
};
