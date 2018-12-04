'use strict';

require('bitcoin-math');
var async = require('async');
var ObjectId = require('mongoskin').ObjectID;
var DataDefinitions = require('./data-definitions');

var QueryGenerator = function(mongo) {
    var dataDefinitions = new DataDefinitions();
    var generator = this;

    generator.resolveAggregateQueue = function(dataQueries) {
        var aggregateQueue = [];
        dataQueries.forEach(function(query) {
            aggregateQueue.push(generator.resolveAggregateTask(query));
        });
        return aggregateQueue;
    };

    generator.resolveDataDefinitionDependency = function(query){
        query.datapoints.forEach(function(datapoint){
            var dataDefinition = dataDefinitions.getDataDefinition(datapoint.name);
            if(!dataDefinition.postProject){
                return;
            }
            if(dataDefinition.field instanceof Array){
                dataDefinition.field.forEach(function(dataName){
                    generator.addDataDefinitinDependency(dataName, query);
                });
            }else{
                generator.addDataDefinitinDependency(dataDefinition.field, query);
            }
        });
    };

    generator.addDataDefinitinDependency = function(dataName, query){
        var exist = false;
        query.datapoints.forEach(function(existingDataName){
            if(existingDataName === dataName){
                exist = true;
                return;
            }
        });
        if(!exist){
            query.datapoints.push({name: dataName});
        }
    };

    generator.resolveAggregateTask = function(query) {
        var pipeline = [];
        var project = {}, postProject;
        var match, prematch, group;
        generator.resolveDataDefinitionDependency(query);
        query.datapoints.forEach(function(datapoint) {
            var DataDefinition = dataDefinitions.getDataDefinition(datapoint.name);
            if (!DataDefinition) {
                throw Error("Data Definition not found for " + datapoint.name);
            }
            if(!DataDefinition.postProject){
                if(DataDefinition.format && !DataDefinition.groupBy){
                    project[DataDefinition.name] = DataDefinition.format;
                }else project[DataDefinition.field] = 1;
            }else{
                postProject = postProject || {};
                postProject[DataDefinition.name] = DataDefinition.format;
            }

            if (DataDefinition.groupBy) {
                try{
                    var groupbyDataDefinition = dataDefinitions.getDataDefinition(DataDefinition.groupBy);
                    project[DataDefinition.groupBy] = groupbyDataDefinition.format;
                }catch(ex){
                    project[DataDefinition.groupBy] = 1;
                }

                var existingDataDefinition = dataDefinitions.getDataDefinition(DataDefinition.field);
                if (existingDataDefinition){
                    project[DataDefinition.field] = existingDataDefinition.format;
                }
                group = group || {};
                group._id = '$' + DataDefinition.groupBy;
                if (DataDefinition.format) {
                    group[DataDefinition.name] = DataDefinition.format;
                }
            }
            if (datapoint.lookup) {
                match = match || {};
                generator.fillMatchCriteria(datapoint, DataDefinition, match);
            }
            if (datapoint.pre_match) {
                prematch = prematch || {};
                generator.fillMatchCriteria({name: datapoint.name, lookup: datapoint.pre_match}, DataDefinition, prematch);
            }
            if(DataDefinition.collection === 'transactions'){
                prematch = prematch || {};
                prematch['meta.status'] = {$ne: 'aborted'};
            }
        });
        pipeline.push({
            $project: project
        });
        if (prematch) {
            pipeline.push({
                $match: prematch
            });
        }
        if (group) {
            pipeline.push({
                $group: group
            });
        }
        if (postProject){
            if(group){
                Object.keys(group).forEach(function(prop){
                    postProject[prop] = 1;
                });
            }else{
                Object.keys(project).forEach(function(prop){
                    postProject[prop] = 1;
                });
            }
            pipeline.push({
                $project: postProject
            });
        }
        if (match) {
            pipeline.push({
                $match: match
            });
        }
        var countPipeline = pipeline.slice(0);
        countPipeline.push({
            $group:{
                _id: 'all',
                total:{
                    $sum: 1
                }
            }
        });
        if (query.sort) {
            if (!query.sort.datapoint || !query.sort.order) {
                throw Error('The data point to sort and the order shoud be specified.');
            }
            var sortDataDefinition;
            for (var i in query.datapoints) {
                if (query.datapoints[i].name === query.sort.datapoint) {
                    sortDataDefinition = dataDefinitions.getDataDefinition(query.sort.datapoint);
                    break;
                }
            }
            if (!sortDataDefinition) throw Error('The data point to sort must be one of the valid data points in the query');
            var sort = {};
            if(sortDataDefinition.format){
                sort[sortDataDefinition.name] = query.sort.order;
            }else
                sort[sortDataDefinition.field] = query.sort.order;
            pipeline.push({
                $sort: sort
            });
        }
        if (query.page) {
            var size = query.size || 20,
                page = query.page || 1;
            var skip = (page - 1) * size;
            pipeline.push({
                $skip: skip
            });
            pipeline.push({
                $limit: size
            });
        }
        var resolvedCollectionNames = dataDefinitions.getCollectionNames(query.datapoints);
        if(resolvedCollectionNames.length !== 1) throw Error('Not allow data points coming from more than one collection');
        return {collection: resolvedCollectionNames[0], pipeline:pipeline, countPipeline: countPipeline, dataQuery: query};
    };

    generator.fillMatchCriteria = function(datapoint, DataDefinition, match){
        var fieldName;
        if((DataDefinition.groupBy)||DataDefinition.format){
            fieldName = DataDefinition.name;
        }else fieldName = DataDefinition.field;

        var val = datapoint.lookup.value;
        if(DataDefinition.type === 'btc')
            val = parseFloat(datapoint.lookup.value).toSatoshi();
        if(DataDefinition.type === 'date'){
            val = new Date(datapoint.lookup.value);
        }
        if(DataDefinition.type === 'objectid'){
            if(datapoint.lookup.value instanceof Array){
                var ids = [];
                datapoint.lookup.value.forEach(function(id){
                    ids.push(new ObjectId(id));
                });
                val = ids;
            }else{
                val = new ObjectId(datapoint.lookup.value);
            }
        }
        if(DataDefinition.type === 'boolean'){
            if(datapoint.lookup.value === 'true')
                val = true;
            if(datapoint.lookup.value === 'false')
                val = false;
        }

        match[fieldName] = match[fieldName] || {};
        if (datapoint.lookup.operator === 'eq') {
            match[fieldName] = val;
        } else if (datapoint.lookup.operator === 'contains'){
            match[fieldName].$regex = '.*' + val + '.*';
        } else if (datapoint.lookup.operator === 'startwith'){
            match[fieldName].$regex = '^' + val + '.*';
        } else if (datapoint.lookup.operator === 'endwith'){
            match[fieldName].$regex = '.*' + val + '$';
        } else {
            match[fieldName]['$' + datapoint.lookup.operator] = val;
        }
    };

    generator.createResultMatchCriteria = function(aggregateTask, dataQueue) {
        var match;
        aggregateTask.dataQuery.datapoints.forEach(function(datapoint){
            if(datapoint.result_match && dataQueue.length > 0){
                var matchValues = [];
                dataQueue[dataQueue.length - 1].results.forEach(function(result){
                    var resultVal = result[datapoint.result_match.value];
                    if(resultVal){
                        matchValues.push(resultVal);
                    }
                });
                if(matchValues.length === 0) {
                    return;
                }
                match = match || {};
                generator.fillMatchCriteria({
                    lookup:{
                        operator: 'in',
                        value: matchValues
                    }
                }, dataDefinitions.getDataDefinition(datapoint.name), match);
            }
        });
        if(match){
            match = {$match: match};
        }
        return match;
    };

    generator.processPipeline = function(aggregateQueue, callback) {
        var db = mongo.getDb('userdb');
        db.bind('transaction');
        db.bind('user');
        var dataQueue = [];
        async.eachSeries(aggregateQueue, function(aggregateTask, cb){
            var match = generator.createResultMatchCriteria(aggregateTask, dataQueue);
            async.waterfall([
                function countTotal(_cb){
                    if(match){
                        aggregateTask.countPipeline.splice(1, 0, match);
                    }
                    db[aggregateTask.collection].aggregate(aggregateTask.countPipeline, function(err, _results){
                        if(err) return cb(err);
                        if(!_results[0]){
                            _results[0] = {total: 0};
                        }
                        _cb(err, _results[0].total);
                    });
                },
                function pagedResults(total, _cb){
                    if(match){
                        aggregateTask.pipeline.splice(1, 0, match);
                    }
                    db[aggregateTask.collection].aggregate(aggregateTask.pipeline, function(err, _results){
                        _results.forEach(function(result){
                            if(typeof result.email_verified === 'object'){
                                result.email_verified = true;
                            }
                            Object.keys(result).forEach(function(key){
                                var dataDefinition = dataDefinitions.getDataDefinition(key);
                                if(dataDefinition && dataDefinition.postProcess){
                                    result[key] = dataDefinition.postProcess(result[key]);
                                }
                            });
                        });
                        _cb(err, {results: _results, total: total});
                    });
                }
            ], function(err, data){
                dataQueue.push(data);
                cb(err);
            });
        }, function(err){
            callback(err, dataQueue.pop());
        });
    };
    return generator;
};

module.exports = QueryGenerator;
