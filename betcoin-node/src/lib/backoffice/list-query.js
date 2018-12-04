'use strict';

var queryFilter = require('./queryfilter');
var url = require('url');

module.exports = function(mongo, logger, HTTPError) {

    var ListQuery = function(params) {
        this.total = 0;
        this.pages = 1;
        this.result = [];
        this.model = params.model || false;
        this.collection = params.collection;
        this.pageSize = parseInt(params.pageSize, 10) || 50;
        // the other end of this does it as 1
        this.page = Math.abs(parseInt(params.page, 10)- 1) || 0;
        this.qf = queryFilter(params.queryPrefix, params.sortPrefix);
        if (params.query) {
            this.query = params.query;
            this.sort = params.sort || [];
        } else {
            this.queryString = params.queryString || url.parse(params.url).query || "";
            this.query = this.qf.filter(this.queryString);
            Object.keys(this.query).forEach(function(queryKey) {
                if (/[Ii]d$/.test(queryKey) && !/txid/.test(queryKey)) {
                    // parse id fields
                    this.query[queryKey] = mongo.ensureObjectId(this.query[queryKey]);
                } else if (/At$/.test(queryKey) || queryKey === 'timestamp') {
                    // parse dates
                    var dateCondition = this.query[queryKey];
                    if ('string' === typeof dateCondition) {
                        this.query[queryKey] = new Date(dateCondition);
                    } else {
                        Object.keys(dateCondition).forEach(function(condKey) {
                            this.query[queryKey][condKey] = new Date(dateCondition[condKey]);
                        }, this);
                    }
                }
            }, this);
            if (this.query.$and) this.query.$and.forEach(function(condition, index) {
                Object.keys(condition).forEach(function(queryKey) {
                    if (/[Ii]d$/.test(queryKey) && !/txid/.test(queryKey)) {
                        // parse id fields
                        this.query.$and[index][queryKey] = mongo.ensureObjectId(this.query.$and[index][queryKey]);
                    } else if (/At$/.test(queryKey) || queryKey === 'timestamp') {
                        // parse dates
                        var dateCondition = this.query.$and[index][queryKey];
                        if ('string' === typeof dateCondition) {
                            this.query.$and[index][queryKey] = new Date(dateCondition);
                        } else {
                            Object.keys(dateCondition).forEach(function(condKey) {
                                this.query.$and[index][queryKey][condKey] = new Date(dateCondition[condKey]);
                            }, this);
                        }
                    }
                }, this);
            }, this);
            if (this.query.$or) this.query.$or.forEach(function(condition, index) {
                Object.keys(condition).forEach(function(queryKey) {
                    if (/[Ii]d$/.test(queryKey) && !/txid/.test(queryKey)) {
                        // parse id fields
                        this.query.$or[index][queryKey] = mongo.ensureObjectId(this.query.$or[index][queryKey]);
                    } else if (/At$/.test(queryKey) || queryKey === 'timestamp') {
                        // parse dates
                        var dateCondition = this.query.$or[index][queryKey];
                        if ('string' === typeof dateCondition) {
                            this.query.$or[index][queryKey] = new Date(dateCondition);
                        } else {
                            Object.keys(dateCondition).forEach(function(condKey) {
                                this.query.$or[index][queryKey][condKey] = new Date(dateCondition[condKey]);
                            }, this);
                        }
                    }
                }, this);
            }, this);
            this.sort = this.qf.sort(this.queryString);
        }
    };

    Object.defineProperty(ListQuery.prototype, 'hasQuery', {
        get: function() { return Object.keys(this.query).length; }
    });

    ListQuery.prototype.getPages = function(cb) {
        var self = this;
        this.collection.count(this.query, function(err, recordCount) {
            if (err) return cb(new HTTPError(err.code, err.message));
            self.total = recordCount;
            if (recordCount === 0) return cb();
            self.pages = Math.ceil(recordCount / self.pageSize);
            return cb();
        });
    };

    ListQuery.prototype.getList = function(cb) {
        // logger.debug("executing list query: %s sort: %s", JSON.stringify(this.query, null, 2), JSON.stringify(this.sort, null, 2));
        // logger.debug("executing list query", this.query, this.sort, {});
        var self = this;
        var cursor = this.collection.find(this.query);
        if (this.sort) {
            cursor.sort(this.sort);
        } else {
            // default to newest records first
            cursor.sort({_id: -1});
        }
        this.getPages(function(err) {
            if (err) return cb(err);
            cursor.limit(self.pageSize);
            cursor.skip(self.page * self.pageSize);
            cursor.toArray(function(err, items) {
                if (err) return cb(new HTTPError(err.code, err.message));
                self.result = items;
                if (self.model) {
                    self.originalResult = self.result.slice();
                    self.result = self.result.map(function(item) { return new self.model(item); });
                }
                return cb(undefined, self.result);
            });
        });
    };

    ListQuery.prototype.toJSON = function() {
        return {
            // increment so the client side can dig it
            page: this.page + 1,
            pageSize: this.pageSize,
            pages: this.pages,
            total: this.total,
            result: this.result
        };
    };

    return ListQuery;

};
