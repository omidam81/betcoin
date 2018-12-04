'use strict';

Application.Services.factory('DataQuery', [
    function() {
        var DataQuery = {};
        DataQuery.generate = function(datapoints, page, sort, size) {
            var updatedDatapoints = [];
            Object.keys(datapoints).forEach(function(key) {
                var datapoint = {
                    name: key
                };
                updatedDatapoints.push(datapoint);
                datapoint.display = datapoints[key].display;
                if(datapoints[key].pre_match){
                    datapoint.pre_match = datapoints[key].pre_match;
                }
                if(datapoints[key].result_match){
                    datapoint.result_match = datapoints[key].result_match;
                }
                if(datapoints[key].lookup && datapoints[key].lookupTransform){
                    datapoint.lookup = datapoints[key].lookup;
                    datapoints[key].lookupTransform(datapoint);
                    return;
                }
                if (!datapoints[key].lookup || datapoints[key].lookup.value === '' || datapoints[key].lookup.value === undefined || datapoints[key].lookup.value === 'any') {
                    return;
                }
                if (datapoints[key].value !== 'any' && datapoints[key].lookupTransform === undefined) {
                    datapoint.lookup = datapoints[key].lookup;
                    if (!datapoints[key].lookup.operator) {
                        datapoint.lookup.operator = 'eq';
                    }
                    return;
                }
            });
            var query = [{
                'datapoints': updatedDatapoints,
                'sort': sort
            }];
            if(page !== -1){
                query[0].page = page || 1;
            }
            if(size !== -1){
                query[0].size = size || 500;
            }
            return query;
        };
        return DataQuery;
    }
]);
