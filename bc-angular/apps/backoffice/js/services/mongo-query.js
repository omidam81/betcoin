'use strict';

var MongoQuery = function($resource, Api) {
    var qResource = $resource(Api.url + '/:type/:collection/:id', {
        type: 'query'
    }, {
        count: {
            method: 'GET',
            params: {
                type: 'count'
            }
        },
        aggregate: {
            method: 'GET',
            isArray: true,
            params: {
                type: 'aggregate'
            }
        },
        search: {
            method: 'GET',
            params: {
                type: 'query'
            }
        }
    });

    return qResource;
};

Application.Services.factory('MongoQuery', ['$resource', 'Api', MongoQuery]);
