'use strict';

var async = require('async');

module.exports = function(app, mongo, UserController, configs, logger) {
    var getGameDb = function(game){
        var gamedb = game + 'db';
        var db = mongo.getDb(gamedb);
        db.bind(game);
        return db;
    };
    app.get('/unplayed/totals', function(req, res) {
        var until = new Date(req.param('until'));
        var since = new Date(req.param('since'));

        var gameCounts = {};
        async.eachSeries(configs.games, function(game, done){
            var gameDb = getGameDb(game);
            var query = {
                init_time: {$gte: since.getTime(), $lte: until.getTime()},
                createdAt: {$exists: false}
            };
            gameDb[game].find(query).count(function(err, count){
                if(err){
                    logger.error('#/unplayed/totals %s', err);
                    return done();
                }
                gameCounts[game] = count;
                done();
            });
        }, function(){
            res.json(gameCounts);
        });
    });

    app.get('/games/:game/unplayed/players', function(req, res) {
        var game = req.param('game');
        var gameDb = getGameDb(game);
        gameDb[game].aggregate([{
            $match: {
                createdAt: {$exists: false},
                player_id: {$exists: true}
            }
        }, {
            $group: {
                _id: '$player_id',
                count: {$sum: 1}
            }
        }], function(err, result){
            res.json(result);
        });
    });

    app.get('/games/unplayed/:userid', function(req, res){
        var userid = req.param('userid');

        var gameCounts = {};
        var games = ['hilo','bj','war','paigow'];
        async.eachSeries(games, function(game, done){
            var gameDb = getGameDb(game);
            var query = {
                player_id: userid,
                createdAt: {$exists: false}
            };
            gameDb[game].find(query).count(function(err, count){
                if(err){
                    logger.error('#games/unplayed/count %s', err);
                    return done();
                }
                gameCounts[game] = count;
                done();
            });
        }, function(){
            res.json(gameCounts);
        });
    });
};
