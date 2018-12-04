'use strict';

var crypto = require('crypto');
var timestamps = require('modella-timestamps');

module.exports = function(BaseModel, userModelStore, logger, HTTPError) {
    var Config = BaseModel('autobet_config')
            .attr('_id')
            .attr('userid')
            .attr('token')
            .attr('games')
            .attr('createdAt');

    Config.use(userModelStore);
    Config.use(timestamps);

    Config.getConfigByUser = function (userid, cb) {
        Config.find({userid: userid}, function(err, config){
            if(err) return cb(new HTTPError(500, err.message));
            cb(undefined, config);
        });
    };

    Config.getAllRobotUsers = function(cb) {
        Config.all({userid:{$exists: true}}, function(err, configs){
            if(err) return cb(new HTTPError(500, err.message));
            cb(undefined, configs);
        });
    };

    Config.addNewUser = function (params, cb) {
        logger.info('Add new robot user %s', params.player_id);
        var config = new Config({
            userid: params.player_id,
            createdAt: new Date()
        });
        config.save(function(err){
            if(err) return cb(new HTTPError(500, err.message || err));
            cb(undefined, config);
        });
    };

    Config.prototype.updateUser = function (params, cb) {
        var self = this;
        logger.info('update robot user %s', params.player_id);
        self.set({
            userid: params.player_id,
            token: params.token
        });
        self.save(function(err){
            if(err) return cb(new HTTPError(500, err.message || err));
            cb(undefined, self);
        });
    };

    Config.prototype.addNewGameAutobet = function (params, cb) {
        var self = this;
        logger.info('Add new game config %s to robot %s', params.name, self.userid());
        var games = self.games() || [];
        var current_date = (new Date()).valueOf().toString();
        var random = Math.random().toString();
        var hash = crypto.createHash('sha1').update(current_date + random).digest('hex');
        params._id = hash;
        if(!params.frequency||params.frequency<10){
            return cb(new HTTPError(400, 'frequency should be equal or greater than 10 seconds.'));
        }
        games.push(params);
        self.set({games: games});
        self.save(function(err){
            if(err) return cb(new HTTPError(500, err.message || err));
            cb(undefined, params);
        });
    };

    Config.prototype.updateGameAutobet = function (params, cb) {
        var self = this;
        var games = self.games() || [];
        var updatedGame;
        if(!params.frequency||params.frequency<10){
            return cb(new HTTPError(400, 'frequency should be equal or greater than 10 seconds.'));
        }
        games.forEach(function(game){
            if(game._id === params._id){
                params = {
                    _id: params._id,
                    player_id: params.player_id,
                    name: params.name,
                    type: params.type,
                    enabled: game.type==='custom'?false:(params.enabled || false),
                    frequency: params.frequency || game.frequency,
                    max_runs: params.max_runs,
                    restart_after_hours: params.restart_after_hours,
                    restart_after_mins: params.restart_after_mins,
                    wager: params.wager,
                    wager_max: params.wager_max,
                    currency: params.currency||'bitcoin',
                    actions: params.type === 'custom'?params.actions:null,
                    totals: params.totals
                };
                for(var i in params){
                    if(params.hasOwnProperty(i)){
                        game[i] = params[i];
                    }
                }
                updatedGame = game;
            }
        });
        self.set({games: games});
        self.save(function(err){
            if(err) return cb(new HTTPError(500, err.message || err));
            cb(undefined, updatedGame);
        });
    };
    Config.prototype.removeGameAutobet = function (gameId, cb) {
        var self = this;
        var games = self.games();
        var indexToRemove;
        var index = 0;
        games.forEach(function(game){
            if(game._id === gameId){
                indexToRemove = index;
            }
            index++;
        });
        games.splice(indexToRemove, 1);
        self.set({games: games});
        self.save(function(err){
            if(err) return cb(new HTTPError(500, err.message || err));
            cb();
        });
    };

    return Config;
};
