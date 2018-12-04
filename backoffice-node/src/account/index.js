'use strict';
require('bitcoin-math');
var bitcoind = require('bitcoin-wallet');
var ObjectId = require('mongoskin').ObjectID;
var async = require('async');
var csv = require('csv');

var ensureObjectId = function(thing) {
    if (thing instanceof ObjectId) return thing;
    try {
        thing = new ObjectId(thing);
        return thing;
    } catch (ex) {
        return null;
    }
};

module.exports = function(app, container, configs, logger) {

    var mongo = container.get('mongo');

    var db = mongo.getDb('playerdb');
    db.bind('transactions');
    db.bind('users');

    app.param('userId', function(req, res, next, userId) {
        userId = ensureObjectId(userId);
        if (userId === null) return res.json(400, {message:"invalid user id"});
        db.users.findOne({_id: userId}, function(err, user) {
            if (err) return res.json(500, err);
            if (!user) return res.json(404, {message:"user not found"});
            delete user.password;
            req.user = user;
            next();
        });
    });

    app.get('/house/balance', function(req, res) {
        bitcoind.getBalance(function(err, balance) {
            if (err) return res.json(500, err);
            res.json({balance: balance});
        });
    });

    app.param('transactionId', function(req, res, next, transactionId) {
        transactionId = ensureObjectId(transactionId);
        if (transactionId === null) return res.json(400, {message:"invalid transaction id"});
        db.transaction.findOne({_id: transactionId}, function(err, transaction) {
            if (err) return res.json(500, err);
            if (!transaction) return res.json(404, {message:"transaction not found"});
            req.transaction = transaction;
            next();
        });
    });

    app.get('/account/active', function(req, res) {
        db.users.find({socket: {$ne: false}}).toArray(function(err, users) {
            if (err) return res.json(500, err);
            res.json(users);
        });
    });

    // app.get('/account/unpaid', function(req, res) {
    //     db.transactions.find({'meta.status': 'prepared'}).toArray(function(err, unpaid) {
    //         if (err) return res.json(500, err);
    //         res.json(unpaid);
    //     });
    // });

    // app.post('/account/sendunpaid/:transactionId', function(req, res) {
    //     bitcoind.send(req.transaction.meta.hex, function(err, txid) {
    //         if (err) return res.json(500, err);
    //         res.json({txid: txid});
    //     });
    // });

    app.post('/account/notification', function(req, res){
        container.resolve(function(PlayerInterface, queryGenerator){
            var dataQueries = req.body.dataQueries;
            var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
            queryGenerator.processPipeline(aggregateQueue, function(err, data){
                if(err) return res.json(500, err);
                if(data.results instanceof Array){
                    var userIds = [];
                    data.results.forEach(function(user){
                        userIds.push(user._id);
                    });
                    PlayerInterface.sendNotifications({
                        userIds: userIds,
                        subject: req.body.subject,
                        message: req.body.message,
                        sendEmail: req.body.sendEmail === true? 'backoffice_email': null
                    }, function(err, data){
                        if(err) res.json(500, err);
                        res.json(201, data);
                    });
                }
            });
        });
    });

    app.post('/account/bonus', function(req, res){
        container.resolve(function(PlayerInterface, queryGenerator){
            var dataQueries = req.body.dataQueries;
            var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
            queryGenerator.processPipeline(aggregateQueue, function(err, data){
                if(err) return res.json(500, err);
                if(data.results instanceof Array){
                    var userIds = [];
                    data.results.forEach(function(user){
                        userIds.push(user._id);
                    });
                    PlayerInterface.giveBonuses({
                        userIds: userIds,
                        bonusName: req.body.bonusName,
                        initial: req.body.initial,
                        max: req.body.max,
                    }, function(err, data){
                        if(err) return res.json(500, err);
                        res.json(201, data);
                    });
                }
            });
        });
    });

    app.get('/account/search', function(req, res){
        container.resolve(function(queryGenerator){
            var dataQueries = JSON.parse(req.query.q);
            var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
            queryGenerator.processPipeline(aggregateQueue, function(err, results){
                if(err) return res.json(500, err);
                res.json(results);
            });
        });
    });

    app.get('/account/search/transaction', function(req, res){
        var page = req.query.page || 1;
        var size = req.query.size || 20;
        var lifetimeExpr = {
            field : req.query.lifetimeField,
            compare : req.query.lifetimeCompare,
            value : (parseInt(req.query.lifetimeValue)).toSatoshi()||0
        };
        var rangeExpr = {
            field : req.query.rangeField,
            compare : req.query.rangeCompare,
            value : (parseInt(req.query.rangeValue)).toSatoshi()||0,
            since : new Date(req.param('since')),
            until : new Date(req.param('until'))
        };
        var lifetimePipeline = [
            {
                $project:{
                    userId: 1, 
                    amtOut: 1, 
                    amtIn: 1, 
                    type: 1,
                    date: 1,
                }
            },
            {
                $group:{
                    _id:'$userId', 
                    deposited:{$sum:{$cond:[{$eq: ['$type', 'deposit']}, '$amtIn', 0]}}, 
                    withdrawn: {$sum:{$cond:[{$eq: ['$type', 'withdraw']}, '$amtOut', 0]}},
                    won: {$sum:{$cond:[{$and: [{$ne:['$type','deposit']}, {$ne:['$type','withdraw']}, {$ne:['$type','email confirmation']}]}, '$amtIn', 0]}},
                    wager: {$sum:{$cond:[{$and: [{$ne:['$type','deposit']}, {$ne:['$type','withdraw']}]}, '$amtOut', 0]}},
                    NGR: {$sum:{$cond:[{$eq:['$type', 'email confirmation']}, '$amtIn', 0]}}
                }
            },
            {
                $project:{
                    deposited: 1,
                    withdrawn: 1,
                    won: 1,
                    wager: 1,
                    NGR: 1,
                    GGR: {$subtract: ['$won', '$wager']}
                }
            }
        ];
        var rangePipeline = lifetimePipeline.slice(0);
        var lifetimeMatch = {$match:{}};
        lifetimeMatch.$match[lifetimeExpr.field] = {};
        lifetimeMatch.$match[lifetimeExpr.field]['$'+lifetimeExpr.compare] = lifetimeExpr.value;
        lifetimePipeline.push(lifetimeMatch);
        var lifetimeResults, lifetimeResultMap={}, rangeResults, total, pageRangePipeline, userIds = [];
        async.series([
            function lifetimeSearch(cb){
                db.transactions.aggregate(lifetimePipeline, function(err, result){
                    if(err) return cb(err);
                    lifetimeResults = result;
                    if(lifetimeResults.length === 0)
                        return cb({code: 404, message:'No matched results for lifetime criteria'});
                    cb();
                });
            },
            function rangeSearchCount(cb){
                lifetimeResults.forEach(function(userStats){
                    lifetimeResultMap[userStats._id] = userStats;
                    userIds.push(userStats._id);
                });
                var countRangePipeline = rangePipeline.slice(0);
                countRangePipeline.unshift({
                    $match:{
                        userId: {
                            $in: userIds
                        },
                        date: {
                            $gte: rangeExpr.since,
                            $lte: rangeExpr.until
                        }
                    }
                });
                var rangeMatch = {$match:{}};
                rangeMatch.$match[rangeExpr.field] = {};
                rangeMatch.$match[rangeExpr.field]['$'+rangeExpr.compare] = rangeExpr.value;
                countRangePipeline.push(rangeMatch);
                pageRangePipeline = countRangePipeline.slice(0);
                countRangePipeline.push({
                    $group:{
                        _id:'all',
                        count:{
                            $sum: 1
                        }
                    }
                });
                db.transactions.aggregate(countRangePipeline, function(err, result){
                    if(err) return cb(err);
                    if(!result[0]) return cb({code: 404, message:'No matched results for range criteria'});
                    total = result[0].count;
                    cb();
                });
            },
            function paginateResult(cb){
                pageRangePipeline.push({$skip: (page - 1) * size});
                pageRangePipeline.push({$limit: size});
                db.transactions.aggregate(pageRangePipeline, function(err, result){
                    if(err) return cb(err);
                    rangeResults = result;
                    rangeResults.forEach(function(rangeStats){
                        var stats = lifetimeResultMap[rangeStats._id];
                        rangeStats.lifetimeDeposited = stats.deposited;
                        rangeStats.lifetimeWithdrawn = stats.withdrawn;
                        rangeStats.lifetimeWon = stats.won;
                        rangeStats.lifetimeWager = stats.wager;
                        rangeStats.lifetimeNGR = stats.NGR;
                        rangeStats.lifetimeGGR = stats.GGR;
                    });
                    cb();
                });
            }
        ], function(err){
            if(err) return res.json(err.code||500, err);
            res.json({total: total, users: rangeResults});
        });
    });

    app.get('/account/totals/:type', function(req, res) {
        var type = req.params.type || 'registered';
        var matchQueries = {
            registered: {
                'withdraw.btc.address':{
                    $exists:true
                },
                email:{
                    $exists:true
                }
            },
            anonymous: {
                'withdraw.btc.address':{
                    $exists:true
                },
                email:{
                    $exists:false
                }
            },
            notverified: {
                'withdraw.btc.address':{
                    $exists:false
                },
                email:{
                    $exists:true
                }
            },
            amount: {
                email:{
                    $exists:true
                } 
            },
            online: {
                socket:{
                    $ne: false
                },
                omitted:{
                    $ne: true
                }
            }
        };
        var pipeline = [];
        pipeline.push({
            $match: matchQueries[type]
        });
        if(type === 'amount'){
            pipeline.push({
                $group: { 
                    _id: "all", 
                    total: { 
                        $sum: "$availableBalance.btc"
                    } 
                }
            });
            pipeline.push({
                $sort: {
                    total: -1 
                }
            });
        }else{
            pipeline.push({
                $group:{
                    _id:'all',
                    count: {$sum:1}
                }
            });
        }
        db.users.aggregate(pipeline, function(err, data){
            if(err) return res.json(500, err);
            res.json(data[0]);
        });
    });

    app.post('/account/export', function(req, res) {
        var dataQueries;
        try{
            dataQueries = JSON.parse(req.body.q);
        }catch(ex){
            return res.json(500, {message:'invalid data query json string'});
        }
        container.resolve(function(queryGenerator, DataDefinition){
            var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
            queryGenerator.processPipeline(aggregateQueue, function(err, results){
                if(err) return res.json(500, err);
                var fields = [];
                dataQueries[0].datapoints.forEach(function(datapoint){
                    if(datapoint.display){
                        fields.push(datapoint.name);
                    }
                });
                csv().from(results.results).to.string(function(data){
                    res.json({csv: data});
                }, {columns: fields, quoted: true, header:true}).transform(function(row){
                    Object.keys(row).forEach(function(field){
                        var dataDefinition = DataDefinition.getDataDefinition(field);
                        if(!dataDefinition){
                            return;
                        }
                        if(dataDefinition.type === 'date'){
                            row[field] = row[field].toISOString();
                        }
                        if(dataDefinition.type === 'btc'){
                            row[field] = row[field].toBitcoin();
                        }
                    });
                    return row;
                });
            });
        });
    });

    app.get('/account/totals', function(req, res) {
        var until = new Date(req.param('until'));
        var since = new Date(req.param('since'));
        var pipeline = [
            {
                $match:{
                    date:{
                        $gte: since,
                        $lte: until
                    }
                }
            },
            {
                $project:{
                    userId:1, 
                    amtOut:1, 
                    amtIn:1, 
                    type:1
                }
            },
            {
                $group:{
                    _id:'all', 
                    amountIn:{$sum:'$amtIn'}, 
                    amountOut: {$sum:'$amtOut'}
                }
            }
        ];
        var deposited = 0;
        var withdrawn = 0;
        var gamewon = 0;
        var gameloss = 0;
        async.series([
            function(done){
                pipeline[0].$match.type = /(deposit|withdraw)$/;
                db.transactions.aggregate(pipeline, function(err, data){
                    if(err) return done(err);
                    if(data.length === 0) return done();
                    deposited = data[0].amountIn;
                    withdrawn = data[0].amountOut;
                    done();
                });
            },
            function(done){
                pipeline[0].$match.type = /(wager|winnings)$/;
                db.transactions.aggregate(pipeline, function(err, data){
                    if(err) return done(err);
                    if(data.length === 0) return done();
                    gamewon = data[0].amountIn;
                    gameloss = data[0].amountOut;
                    done();
                });
            }
            ], function(err){
                if(err) {
                    return res.json(err.code || 500, err);
                }
                res.json({
                    total:{
                        deposited: deposited,
                        withdrawn: withdrawn,
                        gamewon: gamewon,
                        gameloss: gameloss
                    }
                });
            });
    });

    app.get('/bonus/totals', function(req, res) {
        var since = new Date(req.param('since'));
        var until = new Date(req.param('until'));
        
        var offeredBonusesCount = 0;
        var acceptedBonusesCount = 0;
        var activatedBonusesCount = 0;
        var unlockedBonusesCount = 0;
        var exhaustedBonusesCount = 0;
        var activatingPlayersCount = 0;

        function incrementOfferedBonusesCount (bonusesInCurrency){
            Object.keys(bonusesInCurrency).forEach(function(bonusId){
                if(bonusesInCurrency[bonusId].offered >= since && bonusesInCurrency[bonusId].offered <= until){
                    offeredBonusesCount++;
                }
            });
        }
        function incrementAcceptedBonusesCount (bonusesInCurrency){
            Object.keys(bonusesInCurrency).forEach(function(bonusId){
                if(bonusesInCurrency[bonusId].accepted >= since && bonusesInCurrency[bonusId].accepted <= until){
                    acceptedBonusesCount++;
                }
            });
            
        }
        function incrementActivatedBonusesCount (bonusesInCurrency){
            Object.keys(bonusesInCurrency).forEach(function(bonusId){
                if(bonusesInCurrency[bonusId].started >= since && bonusesInCurrency[bonusId].started <= until){
                    activatedBonusesCount++;
                }
            });
        }
        function incrementUnlockedBonusesCount (bonusesInCurrency){
            Object.keys(bonusesInCurrency).forEach(function(bonusId){
                if(bonusesInCurrency[bonusId].unlocked >= since && bonusesInCurrency[bonusId].unlocked <= until){
                    unlockedBonusesCount++;
                }
            });
        }
        function incrementExhaustedBonusesCount (bonusesInCurrency){
            Object.keys(bonusesInCurrency).forEach(function(bonusId){
                if(bonusesInCurrency[bonusId].exhausted >= since && bonusesInCurrency[bonusId].exhausted <= until){
                    exhaustedBonusesCount++;
                }
            });
        }
        
        async.waterfall([
            function getBonusAmountTotals(done) {
                var pipeline = [
                    {
                        $match: {
                            date: {
                                $gte: since,
                                $lte: until
                            },
                            $or: [{
                                type : 'match-bonus'
                            }, {
                                type : 'straight-bonus'
                            }, {
                                type : 'welcome-bonus'
                            }]
                        }
                    }, {
                        $group: {
                            _id: 'all',
                            totalBonus: {$sum: '$amtIn'}
                        }
                    }
                ];
                db.transactions.aggregate(pipeline, function(err, totals){
                    if(totals.length === 0) return done({code: 404, message: 'no totals found'});
                    done(err, totals[0].totalBonus);
                });
            },
            function getBonusCounts(amountTotal, done) {
                var pipeline = [
                    {
                        $match: {
                            bonusOffers: {
                                $exists: true
                            }
                        }
                    }, {
                        $project: {
                            bonusOffers: 1,
                            activeBonuses: 1,
                            unlockedBonuses: 1,
                            exhaustedBonuses: 1
                        }
                    }
                ];
                db.users.aggregate(pipeline, function(err, users) {
                    if(err) return done(err);
                    if(users.length === 0) return done({code: 404, message:'no users found'});
                    users.forEach(function(user) {
                        var activatingPlayer = false;
                        if (user.bonusOffers && user.bonusOffers.btc){
                            incrementOfferedBonusesCount(user.bonusOffers.btc);
                        }
                        if (user.activeBonuses && user.activeBonuses.btc){
                            incrementOfferedBonusesCount(user.activeBonuses.btc);
                            incrementAcceptedBonusesCount(user.activeBonuses.btc);
                            incrementActivatedBonusesCount(user.activeBonuses.btc);
                        }
                        if (user.unlockedBonuses && user.unlockedBonuses.btc){
                            incrementOfferedBonusesCount(user.unlockedBonuses.btc);
                            incrementAcceptedBonusesCount(user.unlockedBonuses.btc);
                            incrementActivatedBonusesCount(user.unlockedBonuses.btc);
                            incrementUnlockedBonusesCount(user.unlockedBonuses.btc);
                            Object.keys(user.unlockedBonuses.btc).forEach(function(bonus){
                                if(bonus.offered && bonus.accepted && bonus.started && bonus.unlocked && bonus.exhausted){
                                    activatingPlayer = true;
                                }
                            });
                        }
                        if (user.exhaustedBonuses && user.exhaustedBonuses.btc){
                            incrementOfferedBonusesCount(user.exhaustedBonuses.btc);
                            incrementAcceptedBonusesCount(user.exhaustedBonuses.btc);
                            incrementActivatedBonusesCount(user.exhaustedBonuses.btc);
                            incrementUnlockedBonusesCount(user.exhaustedBonuses.btc);
                            incrementExhaustedBonusesCount(user.exhaustedBonuses.btc);
                            Object.keys(user.exhaustedBonuses.btc).forEach(function(bonus){
                                if(bonus.offered && bonus.accepted && bonus.started && bonus.unlocked && bonus.exhausted){
                                    activatingPlayer = true;
                                }
                            });
                        }
                        if(activatingPlayer){
                            activatingPlayersCount++;
                        }
                    });
                    done(undefined, amountTotal, {
                        offeredBonusesCount : offeredBonusesCount,
                        acceptedBonusesCount : acceptedBonusesCount,
                        activatedBonusesCount : activatedBonusesCount,
                        unlockedBonusesCount : unlockedBonusesCount,
                        exhaustedBonusesCount : exhaustedBonusesCount,
                        activatingPlayersCount : activatingPlayersCount
                    });
                });
            }
            ], function(err, amountTotal, counts){
                if(err) return res.json(500, err);
                res.json({amountTotal: amountTotal, counts: counts});
            });
    });

    app.get('/account/daterange/totals', function(req, res){
        var until = new Date(req.param('until'));
        var since = new Date(req.param('since'));
        container.resolve(function(UserController){
            UserController.getOmittedUserIds(function(err, omittedUserIds){
                var pipeline = [
                    {
                        $match:{
                            date:{
                                $gte: since,
                                $lte: until
                            },
                            'meta.status': {$ne: 'aborted'},
                            userId:{
                                $nin:omittedUserIds
                            }
                        }
                    },
                    {
                        $project:{
                            userId:1, 
                            amtOut:1, 
                            amtIn:1, 
                            type:1
                        }
                    },
                    {
                        $group:{
                            _id:'$userId', 
                            deposited:{$sum:{$cond:[{$eq: ['$type', 'deposit']}, '$amtIn', 0]}}, 
                            withdrawn: {$sum:{$cond:[{$eq: ['$type', 'withdraw']}, '$amtOut', 0]}},
                            gamewon: {$sum:{$cond:[{$and: [{$ne:['$type','deposit']}, {$ne:['$type','withdraw']}, {$ne:['$type','match-bonus']}, {$ne:['$type','straight-bonus']}, {$ne:['$type','welcome-bonus']}]}, '$amtIn', 0]}},
                            wagered: {$sum:{$cond:[{$and: [{$ne:['$type','deposit']}, {$ne:['$type','withdraw']}]}, '$amtOut', 0]}},
                            bonus: {$sum:{$cond:[{$or: [{$eq:['$type','match-bonus']}, {$eq:['$type','straight-bonus']}, {$eq:['$type','welcome-bonus']}]}, '$amtIn', 0]}}
                        }
                    }
                ];
                db.transactions.aggregate(pipeline, function(err, data){
                    if(err) return res.json(500, err);
                    res.json(data);
                });
            });
        });
    });

    app.get('/account/affiliates/totals', function(req, res){
        var until = new Date(req.param('until'));
        var since = new Date(req.param('since'));

        container.resolve(function(UserController){
            UserController.getOmittedUserIds(function(err, omittedUserIds){
                var pipeline = [
                    {
                        $match:{
                            date:{
                                $gte: since,
                                $lte: until
                            },
                            'meta.status': {$ne: 'aborted'},
                            userId:{
                                $nin:omittedUserIds
                            },
                            type: 'affiliate:credit'
                        }
                    },
                    {
                        $project:{
                            userId:1, 
                            amtOut:1, 
                            amtIn:1, 
                            type:1
                        }
                    },
                    {
                        $group:{
                            _id:{
                                userId: '$userId', 
                                associateId: '$meta.associate'
                            }, 
                            earnings:{$sum:'$amtIn'}
                        }
                    },
                    {
                        $group:{
                            _id: '$_id.userId',
                            associatesCount: {$sum: 1},
                            earnings:{$sum: '$earnings'}
                        }
                    }
                ];
                db.transactions.aggregate(pipeline, function(err, data){
                    if(err) return res.json(500, err);
                    res.json(data);
                });
            });
        });
    });

    app.get('/account/affiliate/:affiliateId/associates', function(req, res){
        var affiliateId =ensureObjectId(req.param('affiliateId'));
        async.waterfall([
            function getAssociateIds(done){
                db.users.aggregate([
                    {
                        $match:{
                            affiliate: affiliateId
                        }
                    },{
                        $project:{
                            _id: 1
                        }
                    }
                    ], function(err, associateIds){
                        var ids = [];
                        associateIds.forEach(function(id){
                            ids.push(id._id);
                        });
                        done(err, ids);
                    });
            },
            function getAssociateTotalList(associateIds, done){
                var pipeline = [
                    {
                        $match:{
                            'meta.status': {$ne: 'aborted'},
                            'meta.associate': {$in: associateIds},
                            type: 'affiliate:credit'
                        }
                    },
                    {
                        $project:{
                            userId:1, 
                            amtOut:1, 
                            amtIn:1, 
                            type:1,
                            associateId: '$meta.associate'
                        }
                    },
                    {
                        $group:{
                            _id:{
                                userId: '$userId', 
                                associateId: '$associateId'
                            }, 
                            earnings:{$sum:'$amtIn'}
                        }
                    }
                ];
                db.transactions.aggregate(pipeline, function(err, data){
                    done(err, data, associateIds);
                });
            }
            ], function(err, result, allAossciateIds){
                if(err) return res.json(500, err);
                var finalResult = [];
                allAossciateIds.forEach(function(associateId){
                    var total  = {
                        _id: associateId
                    };
                    result.forEach(function(associateTotal){
                        if(associateTotal._id.associateId.toString() === associateId.toString()){
                            total.earnings = associateTotal.earnings;
                        }
                    });
                    finalResult.push(total);
                });

                res.json(200, finalResult);
            });
    });

    app.get('/account/:userId/:game/stats', function(req, res) {
        var game = req.params.game;
        var pipeline = [{
            $match:{
                type:{
                    $regex:'.*'+game+'.*'
                },
                userId: req.user._id
            }
        },{
            $group:{
                _id:{
                    userId:'$userId',currency:'$currency'
                }, 
                winningAmountTotal:{
                    $sum: '$amtIn'
                },
                lossAmountTotal:{
                    $sum: '$amtOut'
                }
            }
        }];
        db.transactions.aggregate(pipeline, function(err, result){
            if(err) return res.json(500, err);
            res.json(result);
        });
    });

    app.get('/account/:type/:currency/:period', function(req, res) {
        var type = req.params.type;
        var period = req.params.period;
        var since;
        if(req.params.since){
            since = new Date(req.query.since);
        }
        var pipeline;
        var periods = {
            month: {
                month: '$month',
                year: '$year',
                currency: '$currency'
            },
            day: {
                day: '$day',
                month: '$month',
                year: '$year',
                currency: '$currency'
            }
        };
        var project = {
            amtOut: 1, 
            amtIn: 1, 
            type: 1,
            currency: 1,
            day: {
                $dayOfMonth: '$date'
            },
            month: {
                $month: '$date'
            },
            year: {
                $year: '$date'
            }
        };
        container.resolve(function(UserController){
            UserController.getOmittedUserIds(function(err, userIds){
                if(type === 'game'){
                    var gameTypeCriteria = {
                        $and: [{
                            $ne:['$type','deposit']
                        }, {
                            $ne:['$type','withdraw']
                        }]
                    };
                    var tmpCriteria = JSON.parse(JSON.stringify(gameTypeCriteria));
                    tmpCriteria.$and.push({$eq:['$amtIn', 0]});
                    var wagerTypeCriteria = tmpCriteria;
                    tmpCriteria = JSON.parse(JSON.stringify(gameTypeCriteria));
                    tmpCriteria.$and = tmpCriteria.$and.concat([{$ne:['$type','email confirmation']}, {$gt:['$amtIn', 0]}]);
                    var winTypeCriteria = tmpCriteria;
                    pipeline = [
                        {
                            $match: {
                                userId:{
                                    $nin: userIds
                                }
                            }
                        },
                        {
                            $project: project
                        },
                        {
                            $group: {
                                _id: periods[period],
                                winAmountTotal: {$sum:{$cond:[winTypeCriteria, '$amtIn', 0]}},
                                wagerAmountTotal: {$sum:{$cond:[wagerTypeCriteria, '$amtOut', 0]}},
                                wagerCount: {$sum:{$cond:[wagerTypeCriteria, 1, 0]}},
                                winCount: {$sum:{$cond:[winTypeCriteria, 1, 0]}},
                            }
                        },
                        {
                            $sort: {
                                '_id.year': -1,
                                '_id.month': -1,
                                '_id.day': -1
                            }
                        }
                    ];
                } else if (type === 'cashing'){
                    pipeline = [
                        {
                            $match: {'meta.status': {$ne: "aborted"}}
                        },
                        {
                            $project: project
                        },
                        {
                            $group: {
                                _id: periods[period],
                                depositCount:{$sum:{$cond:[{$eq: ['$type', 'deposit']}, 1, 0]}},
                                withdrawCount:{$sum:{$cond:[{$eq: ['$type', 'withdraw']}, 1, 0]}},
                                depositAmountTotal:{$sum:{$cond:[{$eq: ['$type', 'deposit']}, '$amtIn', 0]}},
                                withdrawAmountTotal: {$sum:{$cond:[{$eq: ['$type', 'withdraw']}, '$amtOut', 0]}}
                            }
                        },
                        {
                            $sort: {
                                '_id.year': -1,
                                '_id.month': -1
                            }
                        }
                    ];
                } else {
                    return res.json(400, {message: 'Invalid type path parameter'});
                }
                if(since){
                    if(pipeline[0].$match){
                        pipeline[0].$match.date = {
                            $gte: since
                        };
                    }else{
                        pipeline.unshift({
                            $match: {
                                date: {
                                    $gte: since
                                }
                            }
                        });
                    }
                }
                db.transactions.aggregate(pipeline, function(err, results){
                    if(err) return res.json(500, err);
                    res.json(results);
                });
            });
        });
    });

    app.get('/account/:userId', function(req, res) {
        db.transactions.aggregate([
            {
                $match:{userId: req.user._id}
            },
            {
                $project:{
                    userId:1, 
                    amtOut:1, 
                    amtIn:1, 
                    type:1
                }
            },
            {
                $group:{
                    _id:'$userId', 
                    deposits:{$sum:{$cond:[{$eq: ['$type', 'deposit']}, 1, 0]}},
                    withdraws:{$sum:{$cond:[{$eq: ['$type', 'withdraw']}, 1, 0]}},
                    deposited:{$sum:{$cond:[{$eq: ['$type', 'deposit']}, '$amtIn', 0]}}, 
                    withdrawn: {$sum:{$cond:[{$eq: ['$type', 'withdraw']}, '$amtOut', 0]}}
                }
            }
        ], function(err, data){
            if(err) return res.json(500, err);
            var aggregation = data[0];
            if(aggregation){
                req.user.deposits = aggregation.deposits;
                req.user.withdraws = aggregation.withdraws;
                req.user.deposited = aggregation.deposited;
                req.user.withdrawn = aggregation.withdrawn;
                req.user.profit = aggregation.withdrawn - aggregation.deposited + req.user.balance.btc;
            }
            res.json(req.user);
        });
    });

    app.get('/account/:userId/transactions', function(req, res) {
        var page = req.query.page || 1;
        var size = req.query.size || 100;
        var transactions, total;
        var pipeline = [
            {
                $match: {
                    userId: req.user._id,
                    $or:[{type:'withdraw'},{type:'deposit'}]
                }
            },
            {
                $project:{
                    type: 1,
                    refId: 1,
                    currency: 1,
                    meta: 1,
                    amtIn: 1,
                    amtOut: 1,
                    date: 1,
                }
            }
        ];
        async.series([
            function(cb){
                var pagedPipeline = pipeline.slice(0, pipeline.length);
                pagedPipeline.push({$sort: {date: -1}});
                pagedPipeline.push({$skip: (page - 1) * size});
                pagedPipeline.push({$limit: size});
                db.transactions.aggregate(pagedPipeline, function(err, data){
                    transactions = data;
                    cb(err);
                });
            },
            function(cb){
                pipeline.push({
                    $group:{
                        '_id':'all',
                        count:{
                            $sum: 1
                        }
                    }
                });
                db.transactions.aggregate(pipeline, function(err, data){
                    if(!data[0]){
                        total = 0;
                        return cb(err);
                    }
                    total = data[0].count;
                    cb(err);
                });
            }
        ], function(err){
            if(err) res.json(500, err);
            res.json({transactions: transactions, total: total});
        });
    });

    app.get('/account/:userId/gamehistory', function(req, res) {
        var page = req.query.page || 1;
        var size = req.query.size || 100;
        var transactions, total;
        var pipeline = [
            {
                $match: {
                    userId: req.user._id,
                    type: {$nin:['withdraw', 'deposit']}
                }
            },
            {
                $project:{
                    type: 1,
                    refId: 1,
                    currency: 1,
                    meta: 1,
                    amtIn: 1,
                    amtOut: 1,
                    date: 1,
                }
            },
            {$sort: {date: -1}},
        ];
        async.series([
            function(cb){
                var pagedPipeline = pipeline.slice(0, pipeline.length);
                pagedPipeline.push({$skip: (page - 1) * size});
                pagedPipeline.push({$limit: size});
                db.transactions.aggregate(pagedPipeline, function(err, data){
                    transactions = data;
                    cb(err);
                });
            },
            function(cb){
                pipeline.push({
                    $group:{
                        '_id':'all',
                        count:{
                            $sum: 1
                        }
                    }
                });
                db.transactions.aggregate(pipeline, function(err, data){
                    total = data[0].count;
                    cb(err);
                });
            }
        ], function(err){
            if(err) res.json(500, err);
            res.json({transactions: transactions, total: total});
        });
    });

    app.get('/account/:userId/messages', function(req, res) {
        res.json(req.user.notifications);
    });

    var getGameDb = function(game){
        var gamedb = game + 'db';
        var db = mongo.getDb(gamedb);
        db.bind(game);
        return db;
    };

    app.get('/account/:userId/ips', function(req, res){
        var gamesData = {};
        async.eachSeries(configs.games, function(game, done){
            var gameDb = getGameDb(game);
            var query = {
                player_id: req.param('userId')
            };
            gameDb[game].find(query).sort({$natural:-1}).toArray(function(err, data){
                if(err) {
                    logger.error('#account/userId/ips game:%s', game, err);
                    return done();
                }
                if(!data) {
                    logger.error('#account/userId/ips not data found for game %s', game);
                    return done();
                }
                gamesData[game] = {};
                data.forEach(function(gameData){
                    if(!gamesData[game][gameData.ip]){
                        gamesData[game][gameData.ip] = (new Date(gameData.init_time)).toISOString();
                    }
                });
                done();
            });
        }, function(){
            res.json(gamesData);
        });
    });

    app.get('/account/:ip/users', function(req, res){
        var ip = req.param('ip');
        var gamesData = {};
        async.eachSeries(configs.games, function(game, done){
            var gameDb = getGameDb(game);
            var query = {
                ip: ip
            };

            gameDb[game].find(query).sort({$init_time:-1}).toArray(function(err, data){
                if(err) {
                    logger.error('#account/ip/users %s', err);
                    return done();
                }
                gamesData[game] = {};
                data.forEach(function(gameData){
                    if(!gamesData[game][gameData.player_id]){
                        gamesData[game][gameData.player_id] = new Date(gameData.init_time);
                    }
                });
                done();
            });
        }, function(){
            res.json(gamesData);
        });
    });

    app.put('/account/:userId/:action', function(req, res) {
        var action = req.params.action;
        container.resolve(function(PlayerInterface){
            PlayerInterface[action+'User']({userId: req.params.userId}, function(err){
                if(err) return res.json(500, err);
                res.send(201);
            });
        });
    });

    app.post('/account/:userId/bonus', function(req, res) {
        var bonusName = req.body.bonusName;
        var currency = req.body.currency || 'btc';
        var bonusConf;
        var userId = req.params.userId;
        if (bonusName) {
            bonusConf = {
                bonusName: bonusName
            };
        } else {
            var type = req.body.type;
            if (["straight", "match"].types.indexOf(type) < 0) return res.send(400, "invalid type");
            var autostart = req.body.autostart ? true : false;
            bonusConf = {
                currency: currency,
                type: type,
                autostart: autostart,
            };
            var unlockMultiplier = parseFloat(req.body.unlockMultiplier);
            if (isNaN(unlockMultiplier)) return res.send(400, "invalid unlock multiplier");
            bonusConf.unlockMultiplier = unlockMultiplier;
            if (type === "match") {
                var max = parseInt(req.body.max, 10);
                if (isNaN(max)) return res.send(400, "invalid max match");
                if (max > (10).toSatoshi()) return res.send(418, "max value too big");
                bonusConf.max = max;
            }
        }
        if (bonusConf.type === "straight") {
            // straight bonus always autostarts
            bonusConf.autostart = true;
            // get initial value
            var initial = parseInt(req.body.initial, 10);
            if (bonusName) {
                // if a valid initial value was provided
                // otherwise use the default 1.8
                if (!isNaN(initial)) {
                    if (initial > (10).toSatoshi()) return res.send(418, "initial value too big, contact the dev to raise the limit");
                    bonusConf.initial = initial;
                }
            } else {
                if (isNaN(initial)) return res.send(400, "invalid initial value");
                if (initial > (10).toSatoshi()) return res.send(418, "that's too big, contact the dev to raise the limit");
                bonusConf.initial = initial;
            }
        }
        // save the app name that created this
        bonusConf.app = "backoffice";
        container.resolve(function(PlayerInterface){
            PlayerInterface.giveBonus(userId, bonusConf, function(err, resData) {
                if (err) return res.json(err.code, err);
                res.json(resData);
            });
        });
    });
};
