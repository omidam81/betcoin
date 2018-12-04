'use strict';

var Press = function () {

    var mongoose = require('mongoose');
    var PressModel = require('./../models/press').Press;
    var pressModel = new PressModel(mongoose);

    // handle the incoming request of creating a document
    this.create = function (req, res){
        pressModel.create(req.body, function(err, doc){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send({result: true, id: doc._id});
            }
        });
    };

    this.read = function (req, res){
        var id = req.params.pressId;
        pressModel.read(id, function(err, doc){
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
        pressModel.reads(function(err, doc){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send([{result: true, docs: doc}]);
            }
        });
    };

    this.update = function (req, res){
        var id = req.params.pressId;
        pressModel.update(id, req.body, function(err, doc){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send({result: true, id: doc._id});
            }
        });
    };  

    this.delete = function (req, res){
        var id = req.params.pressId;
        pressModel.delete(id, function(err, doc){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send({result: true, id: doc._id});
            }
        });
    };
};

exports.Press = new Press();
