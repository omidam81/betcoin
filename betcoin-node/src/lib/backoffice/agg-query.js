'use strict';

var queryFilter = require('./queryfilter');
var url = require('url');

module.exports = function(mongo, logger, HTTPError) {

    var AggregationQuery = function(params) {
        this.result = [];
        this.collection = params.collection;
        this.matchQf = queryFilter('m', params.sortPrefix);
        this.groupQf = queryFilter('g', params.sortPrefix);
        this.projectQf = queryFilter('p', params.sortPrefix);
        this.queryString = params.queryString || url.parse(params.url).query || "";
        this.match = this.matchQf.filter(this.queryString);
        this.group = this.groupQf.filter(this.queryString);
        this.project = this.projectQf.filter(this.queryString);
        Object.keys(this.match).forEach(function(queryKey) {
            if (/[Ii]d$/.test(queryKey)) {
                // parse id fields
                var val = this.match[queryKey];
                var tryOid = mongo.ensureObjectId(val);
                if (tryOid !== null) {
                    val = tryOid;
                } else if ('object' === typeof val && val.$in) {
                    val.$in.forEach(function(inVal, index) {
                        val.$in[index] = mongo.ensureObjectId(inVal);
                    });
                } if ('object' === typeof val && val.$nin) {
                    val.$nin.forEach(function(inVal, index) {
                        val.$in[index] = mongo.ensureObjectId(inVal);
                    });
                }
                this.match[queryKey] = val;
            } else if (/At$/.test(queryKey)) {
                // parse dates
                this.match[queryKey] = new Date(this.match[queryKey]);
            }
        }, this);
        if (this.match.$and) this.match.$and.forEach(function(condition, index) {
            Object.keys(condition).forEach(function(queryKey) {
                if (/[Ii]d$/.test(queryKey) && !/txid/.test(queryKey)) {
                    // parse id fields
                    var val = this.match.$and[index][queryKey];
                    var tryOid = mongo.ensureObjectId(val);
                    if (tryOid !== null) {
                        val = tryOid;
                    } else if ('object' === typeof val && val.$in) {
                        val.$in.forEach(function(inVal, index) {
                            val.$in[index] = mongo.ensureObjectId(inVal);
                        });
                    } if ('object' === typeof val && val.$nin) {
                        val.$nin.forEach(function(inVal, index) {
                            val.$in[index] = mongo.ensureObjectId(inVal);
                        });
                    }
                    this.match.$and[index][queryKey] = val;
                } else if (/At$/.test(queryKey) || queryKey === 'timestamp') {
                    // parse dates
                    var dateCondition = this.match.$and[index][queryKey];
                    if ('string' === typeof dateCondition) {
                        this.match.$and[index][queryKey] = new Date(dateCondition);
                    } else {
                        Object.keys(dateCondition).forEach(function(condKey) {
                            this.match.$and[index][queryKey][condKey] = new Date(dateCondition[condKey]);
                        }, this);
                    }
                }
            }, this);
        }, this);
        var idKeys = Object.keys(this.group).filter(function(k) { return /^_id_[a-zA-Z]+/.test(k); });
        if (idKeys.length > 1) {
            var groupId = {};
            idKeys.forEach(function(idKey) {
                var subKey = /^_id_([a-zA-Z]+)/.exec(idKey)[1];
                groupId[subKey] = this.group[idKey];
                delete this.group[idKey];
            }, this);
            this.group._id = groupId;
        }
    };

    Object.defineProperty(AggregationQuery.prototype, 'hasQuery', {
        get: function() { return Object.keys(this.match).length && Object.keys(this.group).length; }
    });

    AggregationQuery.prototype.getAggregation = function(cb) {
        var self = this;
        var pipeline = [];
        ['match', 'project', 'group'].forEach(function(aggOpp) {
            if (Object.keys(this[aggOpp]).length) {
                var aggObj = {};
                aggObj['$' + aggOpp] = this[aggOpp];
                pipeline.push(aggObj);
            }
        }, this);
        // logger.debug("performing aggregation");
        // logger.debug("match %s", JSON.stringify(pipeline, null, 2));
        this.collection.aggregate(pipeline, function(err, result) {
            if (err) return cb(new HTTPError(err.code, err.message));
            self.result = result;
            return cb(undefined, result);
        });
    };

    AggregationQuery.prototype.toJSON = function() {
        return this.result;
    };

    return AggregationQuery;

};
