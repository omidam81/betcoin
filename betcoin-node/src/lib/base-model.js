'use strict';

var modella = require('modella');
var validators = require('modella-validators');
var filter = require('modella-filter');


var ID_REGEXP = /[a-zA-Z_]+[Ii]d$/;
var OBJECTID_REGEXP = /^[a-z0-9]{24}$/;
module.exports = function(logger, mongo, HTTPError) {

    return function(modelName) {
        var Model = modella(modelName)
            .attr('_id');

        Model.use(validators);
        Model.use(filter);

        var __oldSave = Model.prototype.save;

        Model.on('initializing', function(instance, attrs) {
            var idAttrs = Object.keys(attrs).filter(function(key) {
                return ID_REGEXP.test(key) && OBJECTID_REGEXP.test(attrs[key]);
            });
            idAttrs.forEach(function(idKey) {
                attrs[idKey] = new mongo.ObjectId(attrs[idKey]);
            });
        });

        Model.prototype.save = function(cb) {
            var self = this;
            __oldSave.call(this, function(err) {
                if (err) {
                    var errors = self.errors.map(function(error) {
                        return error.attr + ' ' + error.message;
                    });
                    if (err.code === 11000) {
                        return cb(new HTTPError(409, errors.join(", ")));
                    } else if (err.message === 'validation failed') {
                        logger.error("%s validation failed, %s", self.model.modelName, errors.join(", "));
                        return cb(new HTTPError(400, "Validation failed: %s", err.message, errors.join(", ")));
                    } else {
                        return cb(new HTTPError(400, "%s: %s", err.message, errors.join(", ")));
                    }
                } else {
                    return cb(undefined, self);
                }
            });
        };

        return Model;

    };
};
