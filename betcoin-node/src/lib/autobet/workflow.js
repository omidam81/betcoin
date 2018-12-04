'use strict';

var Agenda = require('agenda');
var scheduler = new Agenda();
var moment = require('moment');
var request = require('request');
var async = require('async');

/* jslint evil: true */

var Config;
try {
    Config = require('./config/local');
}catch(ex){
    try {
        Config = require('./config/dev');
    }catch(ex){
        try{
            Config = require('./config/prod');
        }catch(ex){
        }
    }
}
module.exports = function(mongo, Autobet, DefaultAutobets, auth, User, io, HTTPError, logger) {
    var scheduleDb = mongo.getDb({dbname: 'userdb'});
    scheduler.mongo(scheduleDb.collection('autobet_scheduler'));

    var AutobetWorkflow = function(){};

    var generateClientSeed = function() {
        var clientSeedMax = 9999999999;
        var clientSeedMin = 1000000000;
        return Math.floor(Math.random() * (clientSeedMax - clientSeedMin + 1) + clientSeedMin);
    };

    AutobetWorkflow.prototype.getRobotPlayerToken = function (userId, callback) {
        logger.verbose('get API token for robot user id %s', userId);
        User.get({_id: userId}, function(err, user){
            if(err) return callback(new HTTPError(500, err.message));
            if(!user) return callback(new HTTPError(404, 'invalid user id'));
            if(!user.token()){
                user.token(auth.generateToken());
                user.save(function(err){
                    if (err) return callback(new HTTPError(500, err.message));
                    callback(undefined, user.filter());
                });
            }else{
                callback(undefined, user.filter());
            }
        });
    };
    AutobetWorkflow.prototype.executeWorkflows = function (params, callback) {
        var self = this;
        self.getRobotPlayerToken(params.game.player_id || params.player.userid, function(error, player){
            if(error) return callback(error);
            params.player.token = player.token;
            params.player.data = player;
            self.executeWorkflowQueue(params.game.actions, params.game, params.player, callback);
        });
    };
    AutobetWorkflow.prototype.executeWorkflowQueue = function(actionsToRun, game, player, callback) {
        var self = this;
        game.totals.runCounts = game.totals.runCounts||0;
        game.totals.runCounts ++;
        game.wagerCount = game.wagerCount||0;
        game.wagerCount ++;
        if(game.wagerCount > game.maxWagerCount||!game.maxWagerCount){
            game.wagerCount = 0;
            game.maxWagerCount = Math.random()*100/2;
            game.lastWager = game.wager.toSatoshi()+(Math.random()*(game.wager_max-game.wager).toSatoshi());
        }
        game.convertedParams = game.convertedParams||{};
        game.convertedParams.wager = game.lastWager;
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
            Autobet.getConfigByUser(player.userid, function(err, playerConfig){
                playerConfig.updateGameAutobet(game, function(){});
            });
            if(!err && game.enabled){
                //save run counts
                callback();
            }else if(err){
                if(!err.action_type){
                    self.updateGameResults(game, err, actionsToRun[actionIndex - 1], player);
                    game.enabled = false;
                    delete player.data;
                    logger.error('executing action %s game %s player %s', actionIndex, game.name, player.userid);
                    io.playerEmit(player.userid, 'autobet game error', {error:err, player_id: game.player_id || player.userid, config:game});
                    callback(err);
                }else{
                    if(err.action_type.indexOf('recursive') !== -1){
                        self.recursive(game, player, err.action_type.split('_')[1] - 1, callback);
                    }
                }
            }
        });
    };
    AutobetWorkflow.prototype.recursive = function(game, player, actionIndex, callback) {
        var slicedActions = game.actions.slice(actionIndex);
        this.executeWorkflowQueue(slicedActions, game, player, callback);
    };
    AutobetWorkflow.prototype.convertAction = function(game, action, callback) {
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
    var getRequestConfig = function(serverUrl, endpoint, token, game) {
        var config = {
            url: serverUrl + endpoint,
            headers: {
                Authorization: 'Bearer ' + token,
                'X-Currency': game.currency||'bitcoin'
            }
        };
        return config;
    };
    var getResponseJson = function(response) {
        var json;
        if(typeof response.body === 'object'){
            json = response.body;
        }else{
            json = JSON.parse(response.body);
        }
        return json;
    };
    AutobetWorkflow.prototype.getAction = function(game, action, player, callback) {
        var self = this;
        var config = getRequestConfig(Config.server_url, action.endpoint, player.data.token, game);
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
    AutobetWorkflow.prototype.postAction = function(game, action, player, callback) {
        var self = this;
        var params = {};
        var config = getRequestConfig(Config.server_url, action.endpoint, player.data.token, game);
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
        params.client_seed = generateClientSeed();
        var endpoint = self.resolveEndpointUrl(action, game);
        config.url = Config.server_url + endpoint;
        config.json = params;
        request.post(config, function(error, data){
            var json;
            try{
                json = getResponseJson(data);
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
    AutobetWorkflow.prototype.putAction = function(game, action, player, callback) {
        var self = this;
        var params = {};
        var config = getRequestConfig(Config.server_url, action.endpoint, player.data.token, game);
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
        config.url = Config.server_url + endpoint;
        config.json = params;
        request.put(config, function(error, data){
            var json;
            try{
                json = getResponseJson(data);
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
    AutobetWorkflow.prototype.resolveEndpointUrl = function(action, game){
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
    AutobetWorkflow.prototype.resolveJsonBody = function(action, game){
        if(!game.convertedParams || !action.body){
            return;
        }
        var body = action.body;
        for(var i in game.convertedParams){
            if(game.convertedParams.hasOwnProperty(i)){
                if(body.indexOf('{{'+ i +'}}') !== -1){
                    body = body.replace(new RegExp('{{'+ i +'}}','g'), game.convertedParams[i]);
                }
            }
        }
        return body;
    };
    AutobetWorkflow.prototype.updateGameResults = function(game, result, action, player){
        game.results = game.results || [];
        if(game.results.length >= 30){
            game.results.pop();
        }

        io.playerEmit(player.userid, 'new autobet action result', {player_id: game.player_id||player._id, game_id: game._id, action: action, result: result});
        result = JSON.stringify(result, null, "  ");

        game.results.unshift({text:result, action:action, time:new Date()});
    };
    AutobetWorkflow.prototype.updateGameTotals = function(game, action, player){
        io.playerEmit(player.userid, 'new autobet totals', {player_id: game.player_id||player._id, game_id: game._id, game_stats: game.totals});
    };
    AutobetWorkflow.prototype.stopAutobet = function (gameid, callback) {
        logger.verbose('stop autobet for game id %s', gameid);
        scheduler.cancel({name: gameid}, function(err){
            if(err){
                logger.error('remove auto bet scheduler %s', err.message);
                return callback(new HTTPError(500, err.message));
            }
            return callback();
        });
    };
    AutobetWorkflow.prototype.startAutobet = function (params) {
        var self = this;
        params.game.actions = DefaultAutobets[params.game.type];
        if(!params.game.actions || params.game.actions.length === 0){
            return;
        }
        params.game.totals = {};
        logger.verbose('restart autobet for game id %s', params.game._id);
        self.stopAutobet(params.game._id, function(){
            self.defineIntradayScheduler(params);
        });
    };
    AutobetWorkflow.prototype.defineIntradayScheduler = function (params) {
        var self = this;
        scheduler.define(params.game._id, function(job, done) {
            if(params.game.max_runs && params.game.totals && params.game.totals.runCounts && params.game.max_runs <= params.game.totals.runCounts){
                logger.verbose('autobet for game id %s exceed max run threshold, stopping it.', params.game._id);
                self.stopAutobet(params.game._id, done);
                self.defineRepeatScheduler(params);
                return;
            }
            logger.verbose("auto betting %s game (%s)", params.player.userid, params.game.name);
            params.game.actions = DefaultAutobets[params.game.type] || params.game.actions;
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
    };
    AutobetWorkflow.prototype.defineRepeatScheduler = function (params) {
        var self = this;
        var scheduleId = params.game._id + '_daily';
        scheduler.define(scheduleId, function(job, done) {
            if(!params.game.enabled){
                return done();
            }
            logger.verbose("start repeat scheduler for user %s game (%s)", params.player.userid, params.game.name);
            params.game.actions = DefaultAutobets[params.game.type] || params.game.actions;
            params.game.convertedParams = params.game.convertedParams || {wager: params.game.wager.toSatoshi()};
            params.game.totals = {};
            self.startAutobet(params);
            done();
        });
        var time = moment().add(params.game.restart_after_hours, 'hours').add(params.game.restart_after_mins, 'minutes');
        logger.verbose('restart autobet %s for user id %s at %s', params.game._id, params.player.userid, time.calendar());
        scheduler.schedule(time.calendar(), scheduleId);
    };
    AutobetWorkflow.prototype.run = function () {
        var self = this;
        async.series([
            function(cb){
                scheduler.purge(function(err, removed) {
                    if (err) throw err;
                    logger.verbose('%d old auto bet schedules removed', removed);
                    scheduler.start();
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
                            setTimeout(doneGame, Math.random() * 10000); // stagger startup
                        }, function(err){
                            doneRobot(err);
                        });
                    }, function(err){
                        if(err) return cb(err);
                        cb();
                    });
                });
            }
            ], function(err){
                if(err) logger.error('workflow#run error %s %s', err.code, err.message);
            });
    };
    function graceful() {
        scheduler.stop(function() {
            process.exit(0);
        });
    }

    process.on('SIGTERM', graceful);
    process.on('SIGINT' , graceful);
    return AutobetWorkflow;
};
