'use strict';

var Wiki = function () {

    var mongoose = require('mongoose');
    var WikiModel = require('./../models/wiki').Wiki;
    var wikiModel = new WikiModel(mongoose);

    // handle the incoming request of creating a document
    this.create = function (req, res){
        wikiModel.create(req.body, function(err, doc){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send({result: true, id: doc._id});
            }
        });
    };

    this.read = function (req, res){
        var id = req.params.wikiId;
        wikiModel.read(id, function(err, doc){
            if(err instanceof Error){
                res.send(500, {result: false});
            } else if (!doc) {
                res.send(404, {result: false});
            } else {

                res.send({result: true, doc: doc});
            }
        });
    };

    this.reads = function (req, res){
        wikiModel.reads(function(err, doc){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send([{result: true, docs: doc}]);
            }
        });
    };

    this.update = function (req, res){
        var id = req.params.wikiId;
        wikiModel.update(id, req.body, function(err, doc){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send({result: true, id: doc._id});
            }
        });
    };  

    this.delete = function (req, res){
        var id = req.params.wikiId;
        wikiModel.delete(id, function(err, doc){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send({result: true, id: doc._id});
            }
        });
    };
};

exports.Wiki = new Wiki();
