'use strict';

var queryFilter = require('mongo-queryfilter');
var ObjectId = require('mongoskin').ObjectID;

// set up extra operators
queryFilter.extendOperators({
    'startswith': {
        fn: function(value) {
            return new RegExp("^" + value + ".*$");
        },
        ns: '$regex'
    },
    'contains': {
        fn: function(value) {
            var newRe = new RegExp("^.*" + value + ".*$");
            return newRe;
        },
        ns: '$regex'
    },
    'sum': {
        fn: function(value) {
            return value;
        },
        ns: '$sum'
    },
    'first': {
        fn: function(value) {
            return value;
        },
        ns: '$first'
    },
    'min': {
        fn: function(value) {
            return value;
        },
        ns: '$min'
    },
    'max': {
        fn: function(value) {
            return value;
        },
        ns: '$max'
    },
    'cmp': {
        fn: function(value) {
            var parts = value.split('_to_');
            if (/^[0-9]+$/.test(parts[1])) parts[1] = parseInt(parts[1], 10);
            else if (/^[0-9.]+$/.test(parts[1])) parts[1] = parseFloat(parts[1]);
            return parts;
        }
    },
    'nin': {
        fn: function(value) {
            return value.split('||');
        }
    },
    'oid': {
        fn: function(value) {
            return new ObjectId(value);
        }
    }
});

// filter and sort all with our prefixes
module.exports = function(queryPrefix, sortPrefix) {
    var tryParseBool = function(val) {
        if (val === 'false') {
            return false;
        }
        if (val === 'true') {
            return true;
        }
        return val;
    };
    var tryParseOid = function(val) {
        if ('object' !== typeof val) return val;
        if (!val.$oid) return val;
        return val.$oid;
    };
    var parse = function(val) {
        val = tryParseBool(val);
        val = tryParseOid(val);
        return val;
    };
    return {
        filter: function(queryString) {
            var initialQuery = queryFilter.filter(queryString, {prefix: (queryPrefix || "q") + "_"});
            var orQuery = queryFilter.filter(queryString, {prefix: 'or_' + (queryPrefix || "q") + "_"});
            var initialKeys = Object.keys(initialQuery);
            var orKeys = Object.keys(orQuery);
            if (!initialKeys.length && !orKeys.length) return {};
            if (!initialKeys.length) initialQuery = {$and:[]};
            if (!initialQuery.$and) initialQuery = {$and:[initialQuery]};
            if (!orQuery.$and) orQuery = {$and:[orQuery]};
            if (orKeys.length) initialQuery.$and.push({$or: orQuery.$and});
            var keys = [];
            var query = {};
            // console.log(JSON.stringify(initialQuery));
            initialQuery.$and.forEach(function(condition) {
                var key = Object.keys(condition)[0];
                var keyIndex = keys.indexOf(key);
                if (condition[key].$or) {
                    if (!query.$or) query.$or = [];
                    condition[key].$or.forEach(function(orVal) {
                        var orDoc = {};
                        orDoc[key] = parse(orVal);
                        query.$or.push(orDoc);
                    });
                } else if (key === '$or') {
                    if (!query.$or) query.$or = [];
                    condition.$or.forEach(function(orVal) {
                        var orDoc = {};
                        var thisKey = Object.keys(orVal)[0];
                        orDoc[thisKey] = parse(orVal[thisKey]);
                        query.$or.push(orDoc);
                    });
                } else if (keyIndex >= 0) {
                    if (!query.$and) query.$and = [];
                    var lastFieldVal = query[key];
                    var newAnd = {};
                    newAnd[key] = parse(lastFieldVal);
                    query.$and.push(newAnd);
                    condition[key] = parse(condition[key]);
                    query.$and.push(condition);
                    delete query[key];
                } else {
                    keys.push(key);
                    query[key] = parse(condition[key]);
                }
            });
            // console.log(JSON.stringify(query));
            return query;

        },
        sort: function(queryString) {
            return queryFilter.sort(queryString, {prefix: (sortPrefix || "_") + "_"});
        }
    };
};
