'use strict';

module.exports = function(app, mongo, UserController) {
    var db = mongo.getDb('playerdb');
    db.bind('transactions');

    app.get('/sicbo/totals', function(req, res) {
        var until = new Date(req.param('until'));
        var since = new Date(req.param('since'));
        UserController.getOmittedUserIds(function(err, userIds){
            var pipeline = [
                {
                    $match:{
                        userId: {$nin: userIds},
                        date:{
                            $gte: since,
                            $lte: until
                        },
                        $or: [{amtIn: {$gt: 0}}, {amtOut: {$gt: 0}}],
                        type:{
                            $regex:'sicbo'
                        }
                    }
                },
                {
                    $project:{
                        amtOut:1,
                        amtIn:1,
                        type:1
                    }
                },
                {
                    $group:{
                        _id:'all',
                        bets: {$sum:1},
                        gamewon: {$sum:{$cond:[{$and: [{$ne:['$type','deposit']}, {$ne:['$type','withdraw']}]}, '$amtIn', 0]}},
                        wagered: {$sum:{$cond:[{$and: [{$ne:['$type','deposit']}, {$ne:['$type','withdraw']}]}, '$amtOut', 0]}}
                    }
                }
            ];
            db.transactions.aggregate(pipeline, function(err, data){
                if(err) return res.json(500, err);
                if(!data[0]){
                    return res.json(500, {message: 'No results returned'});
                }
                res.json({total:{
                    bets: data[0].bets,
                    gamewon: data[0].gamewon,
                    wagered: data[0].wagered
                }});
            });
        });
    });
};
