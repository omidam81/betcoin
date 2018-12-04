'use strict';

module.exports = function(BaseModel, HTTPError, logger, gameModelStore, CURRENCY_REGEXP, Autobet) {

    return function(modelName, options) {
        if (!options) options = {};
        var Game = BaseModel(modelName)
            .attr('server_seed', {required: true, format: /[a-f0-9]{32}/}) // server_seed is always 16 bytes of hex
            .attr('seed_hash', {required: true, format: /[a-f0-9]+/}) // seed_hash is a hex encoded sha256
            .attr('init_time', {required: true, type: 'number'}) // init_time is the unix timestamp of the game init
            .attr('player_id', {type: gameModelStore.ObjectId, filtered: true})
            .attr('player_alias')
            .attr('actionsTaken', {type: 'number', defaultValue: 0})
            .attr('currency', {type: 'string'})
            .attr('wager', {type: 'number'})
            .attr('client_seed')
            .attr('winnings', {type: 'number'})
            .attr('ip', {format: /([0-9]{1,3}\.){3}[0-9]{1,3}/, filtered: true})
            .attr('locale', {filtered: true})
            .attr('lock')
            .attr('autobet', {type: 'boolean', filtered: true})
            .attr('bonus', {type: 'boolean', defaultValue: false, filtered: true})
            .attr('createdAt'); // createdAt is the Date object of when the game was actually played

        Game.use(gameModelStore);

        Game.validate(function(game) {
            if (game.played && !CURRENCY_REGEXP.test(game.currency())) {
                game.error("currency", "is invalid");
            }
        });

        Object.defineProperty(Game.prototype, 'locked', {
            get: function() { return this.lock() === true; }
        });

        var playedFinished = {
            get: function() {
                if (this.attrs.status) {
                    // for multipart games
                    return this.client_seed() && this.player_id() && this.status() === 'finished';
                } else {
                    return this.client_seed() && this.player_id();
                }
            }
        };
        Object.defineProperty(Game.prototype, 'played', playedFinished);
        Object.defineProperty(Game.prototype, 'finished', playedFinished);

        Game.checkLock = function(gameId, cb) {
            Game.find(gameId, function(err, gameData) {
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

        Game.unlock = function(gameId, cb) {
            Game.find(gameId, function(err, gameData) {
                if (err) return cb(new HTTPError(500, err.message));
                if (!gameData) return cb(new HTTPError(404, 'game not found'));
                gameData.unset('lock');
                gameData.save(function(err) {
                    if (err) return cb(new HTTPError(500, err.message));
                    cb(undefined, gameData);
                });
            });
        };

        var saveTmp = Game.prototype.save;
        Game.prototype.save = function(cb) {
            var self = this;
            var robotIds = {};
            if(this.player_id() && this.autobet() === undefined){
                var player_id = this.player_id().toHexString();
                Autobet.all(function(err, autobets){
                    if(err) return saveTmp.call(self, cb);
                    autobets.forEach(function(autobet){
                        var games = autobet.games()||[];
                        games.forEach(function(gameConfig){
                            robotIds[gameConfig.player_id] = true;
                        });
                    });
                    if(robotIds[player_id]){
                        self.autobet(true);
                    }else{
                        self.autobet(false);
                    }
                    saveTmp.call(self, cb);
                });
            }else{
                saveTmp.call(self, cb);
            }
        };

        var LOGGER_NAME = options.loggerName || modelName;

        var log = function() {
            if (!logger[LOGGER_NAME]) {
                logger.warn('Cannot find logger %s');
                return logger.info.apply(logger, Array.prototype.slice.call(arguments));
            }
            logger[LOGGER_NAME].apply(logger, Array.prototype.slice.call(arguments));
        };

        Game.log = log;
        Game.prototype.log = log;

        return Game;

    };
};
