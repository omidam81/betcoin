'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var dependable = require('dependable');
var DataDefinitionService = require('../src/lib/data-definitions-service');
var QueryGenerator = require('../src/lib/query-generator');

describe('mongo query generation', function() {
    var dataDefinitionService = new DataDefinitionService();
    var queryGenerator = new QueryGenerator();
    var container;
    beforeEach(function (done) {
        container = dependable.container();
        done();
    });
    it('should generate query for one data point', function(done) {
        var dataQueries = [{
            datapoints: [{
                name: 'email'
            }]
        }];
        var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
        expect(aggregateQueue.length).to.be(1);
        expect(aggregateQueue[0].pipeline[0].$project.email).to.be('$email');
        expect(aggregateQueue[0].countPipeline[aggregateQueue[0].countPipeline.length - 1]).to.be.ok();
        done();
    });
    it('should generate query for more than one data points for one collection', function(done) {
        var dataDefinitions = dataDefinitionService.getAllDataDefinitions();
        var datapoints = [];
        dataDefinitions.forEach(function(dataDefinition) {
            if (dataDefinition.collection !== 'users')
                return;
            datapoints.push({
                name: dataDefinition.name
            });
        });
        var dataQueries = [{
            datapoints: datapoints
        }];
        var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
        var $projectNames = [];
        aggregateQueue.forEach(function(aggregateTask) {
            // console.log(pipeline);
            for (var name in aggregateTask.pipeline[0].$project) {
                $projectNames.push(name);
            }
        });
        // console.log(JSON.stringify(pipelines));
        expect(datapoints.length).to.be($projectNames.length);
        done();
    });
    it('should generate query with $match', function(done) {
        var dataQueries = [{
            datapoints: [{
                name: 'username',
                lookup: {
                    operator: 'eq',
                    value: 'test'
                }
            }]
        }];
        var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
        expect(aggregateQueue[0].pipeline[1].$match.username).to.be('test');

        var dataQueries = [{
            datapoints: [{
                name: 'balance_btc',
                lookup: {
                    operator: 'eq',
                    value: 1
                }
            }]
        }];
        var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
        expect(aggregateQueue[0].pipeline[1].$match['balance_btc']).to.be(100000000);

        var dataQueries = [{
            datapoints: [{
                name: 'balance_btc',
                lookup: {
                    operator: 'lte',
                    value: 0.005
                }
            }]
        }];
        var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
        expect(aggregateQueue[0].pipeline[1].$match['balance_btc'].$lte).to.be(500000);

        var dataQueries = [{
            datapoints: [{
                name: 'email_verified',
                lookup: {
                    operator: 'eq',
                    value: true
                }
            }]
        }];
        var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);

        var dataQueries = [{
            datapoints: [{
                name: 'withdraw_address',
                lookup: {
                    operator: 'exists',
                    value: true
                }
            }, {
                name: 'email',
                lookup: {
                    operator: 'exists',
                    value: false
                }
            }]
        }];
        var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
        // expect(aggregateQueue[0].pipeline[0].$project.withdraw_a.$ifNull).to.be.ok();
        done();
    });
    it('should generate query with page and size', function(done) {
        var dataQueries = [{
            datapoints: [{
                name: 'username'
            }],
            size: 20,
            page: 1
        }];
        var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
        expect(aggregateQueue[0].pipeline[1].$skip).to.be(0);
        expect(aggregateQueue[0].pipeline[2].$limit).to.be(20);
        done();
    });
    it('should generate query with order by', function(done) {
        var datapoint = {
            name: 'username'
        };
        var sort = {
            datapoint: 'username',
            order: 1
        };
        var dataQueries = [{
            datapoints: [datapoint],
            sort: sort
        }];
        var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
        expect(aggregateQueue[0].pipeline[1].$sort.username).to.be(1);

        sort.order = -1;
        var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
        expect(aggregateQueue[0].pipeline[1].$sort.username).to.be(-1);
        done();
    });
    it('should generate query combined with filter/rank', function(done) {
        var datapoints = [{
            name: 'username'
        }, {
            name: 'email'
        }, {
            name: 'balance_btc',
            lookup:{
                operator: 'gte',
                value: 1
            }
        }];
        var sort = {
            datapoint: 'balance_btc',
            order: 1
        };
        var dataQueries = [{
            datapoints: datapoints,
            sort: sort,
            page: 1,
            size: 20
        }];
        var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
        // expect(aggregateQueue[0].pipeline[1].$sort.username).to.be(1);

        // sort.order = -1;
        // var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
        // expect(aggregateQueue[0].pipeline[1].$sort.username).to.be(-1);
        done();
    });
    it('should generate query with group function', function(done) {
        var dataQueries = [{
            datapoints: [{
                name: 'last_deposited',
                lookup: {
                    operator: 'gte',
                    value: new Date()
                }
            }, {
                name: 'transaction_deposited_total'
            }]
        }];
        var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
        expect(aggregateQueue[0].pipeline[0].$project.date).to.be.ok();
        expect(aggregateQueue[0].pipeline[0].$project.userId).to.be.ok();
        expect(aggregateQueue[0].pipeline[0].$project.transaction_deposited.$cond).to.be.ok();
        expect(aggregateQueue[0].pipeline[1].$match['meta.status']).to.be.ok();
        expect(aggregateQueue[0].pipeline[2].$group._id).to.be('$userId');
        expect(aggregateQueue[0].pipeline[2].$group.last_deposited.$max).to.be('$date');
        expect(aggregateQueue[0].pipeline[2].$group.transaction_deposited_total.$sum).to.be.ok();
        expect(aggregateQueue[0].pipeline[3].$match.last_deposited.$gte).to.be.ok();
        done();
    });
    it('should auto determine the data point dependency', function(done) {
        var dataQueries = [{
            datapoints: [{
                name: 'transaction_deposited_total'
            }, {
                name: 'NGR'
            }]
        }];
        var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
        expect(aggregateQueue[0].pipeline[0].$project.transaction_game_won).to.be.ok();
        expect(aggregateQueue[0].pipeline[0].$project.transaction_game_wager).to.be.ok();
        expect(aggregateQueue[0].pipeline[0].$project.transaction_bonus).to.be.ok();
        expect(aggregateQueue[0].pipeline[1].$match['meta.status']).to.be.ok();
        expect(aggregateQueue[0].pipeline[2].$group.transaction_game_won_total).to.be.ok();
        expect(aggregateQueue[0].pipeline[2].$group.transaction_game_wager_total).to.be.ok();
        expect(aggregateQueue[0].pipeline[2].$group.transaction_bonus_total).to.be.ok();
        expect(aggregateQueue[0].pipeline[3].$project.transaction_game_won_total).to.be.ok();
        expect(aggregateQueue[0].pipeline[3].$project.transaction_game_wager_total).to.be.ok();
        expect(aggregateQueue[0].pipeline[3].$project.transaction_bonus_total).to.be.ok();
        expect(aggregateQueue[0].pipeline[3].$project.NGR).to.be.ok();
        done();
    });
    
    describe('process multiple data queries', function () {
        it('should generate query for multiple data queries and chain data from different queries', function(done) {
            var dataQueries = [{
                datapoints: [{
                    name: 'last_deposited',
                    lookup: {
                        operator: 'gte',
                        value: new Date()
                    }
                }]
            }, {
                datapoints: [{
                    name: 'username'
                }, {
                    name: 'email'
                }]
            }];
            var aggregateQueue = queryGenerator.resolveAggregateQueue(dataQueries);
            expect(aggregateQueue[0].pipeline[0].$project.date).to.be.ok();
            expect(aggregateQueue[0].pipeline[0].$project.userId).to.be.ok();
            expect(aggregateQueue[0].pipeline[1].$match['meta.status']).to.be.ok();
            expect(aggregateQueue[0].pipeline[2].$group._id).to.be('$userId');
            expect(aggregateQueue[0].pipeline[2].$group.last_deposited.$max).to.be('$date');
            expect(aggregateQueue[0].pipeline[3].$match.last_deposited.$gte).to.be.ok();
            expect(aggregateQueue[1].pipeline[0].$project.username).to.be('$alias');
            expect(aggregateQueue[1].pipeline[0].$project.email).to.be('$email');
            done();
        });
        it('should aggregate total count and return query results', function(done){
            var datapoints = [{
                name: 'username'
            }, {
                name: 'email'
            }, {
                name: 'balance_btc',
                lookup:{
                    operator: 'gte',
                    value: 1
                }
            }];
            var sort = {
                datapoint: 'balance_btc',
                order: 1
            };
            var dataQueries = [{
                datapoints: datapoints,
                sort: sort,
                page: 1,
                size: 20
            }];
            container.register('queryGenerator', QueryGenerator);
            container.resolve({mongo: new function(){
                this.getDb = function(){
                    this.bind = function(){};
                    this.users = {aggregate: function(pipeline, callback){
                        var lastPipeline = pipeline.pop();
                        if(lastPipeline.$group && lastPipeline.$group._id === 'all' && lastPipeline.$group.total){
                            return callback(undefined, [{total: 2}]);
                        }

                        callback(undefined, [{
                            username: 'n1', email: 'e1', balance_btc: 1
                        }, {
                            username: 'n2', email: 'e2', balance_btc: 2
                        }]);
                    }};
                    this.transactions = {aggregate: function(pipeline, callback){
                        callback(undefined, [{}]);
                    }};
                    return this;
                };
            }}, function(queryGenerator){
                queryGenerator.processPipeline(queryGenerator.resolveAggregateQueue(dataQueries), function(err, data){
                    expect(data.total).to.be(2);
                    expect(data.results.length).to.be(2);
                    done();
                });
            });
        });
        it('should pass previous result as match criteria to the next data query', function(done){
            var datapoints = [{
                name: 'userid'
            }, {
                name: 'user_status',
                lookup:{
                    operator: 'eq',
                    value: 'verified'
                }
            }];
            var dataQueries = [{
                datapoints: [{
                    name: 'userid'
                }, {
                    name: 'user_status',
                    lookup:{
                        operator: 'eq',
                        value: 'verified'
                    }
                }]
            }, {
                datapoints: [{
                    name: 'transaction_userid',
                    result_match: {
                        operator: 'in',
                        value: 'userid'
                    }
                }, {
                    name: 'transaction_date',
                    pre_match: {
                        operator: 'gte',
                        value: '2014-04-01'
                    }
                }]
            }];
            container.register('queryGenerator', QueryGenerator);
            container.resolve({mongo: new function(){
                this.getDb = function(){
                    this.bind = function(){};
                    this.users = {aggregate: function(pipeline, callback){
                        var lastPipeline = pipeline.pop();
                        if(lastPipeline.$group && lastPipeline.$group._id === 'all' && lastPipeline.$group.total){
                            return callback(undefined, [{total: 3}]);
                        }
                        callback(undefined, [{
                            userid: '5398fc2627f92b9b88cb2ec1', user_status: 'v1'
                        }, {
                            userid: '5398fc2627f92b9b88cb2ec2', user_status: 'v2'
                        }, {
                            userid: '5398fc2627f92b9b88cb2ec3', user_status: 'v3'
                        }]);
                    }};
                    this.transactions = {aggregate: function(pipeline, callback){
                        expect(pipeline[0].$project.transaction_userid).to.be.ok();
                        expect(pipeline[1].$match.transaction_userid.$in.length).to.be(3);
                        expect(pipeline[2].$match.transaction_date.$gte).to.be.ok();
                        callback(undefined, [{}]);
                    }};
                    return this;
                };
            }}, function(queryGenerator){
                queryGenerator.processPipeline(queryGenerator.resolveAggregateQueue(dataQueries), function(err, data){
                    done();
                });
            });
        })
    });
});