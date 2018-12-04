'use strict';

var Blog = function () {

    var mongoose = require('mongoose');
    var BlogModel = require('./../models/blog').Blog;
    var blogModel = new BlogModel(mongoose);

    // handle the incoming request of creating a document
    this.create = function (req, res){
        blogModel.create(req.body, function(err, doc){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send({result: true, id: doc._id});
            }
        });
    };

    this.read = function (req, res){
        var id = req.params.blogId;
        blogModel.read(id, function(err, doc){
            if(err instanceof Error){
                res.send(500, {result: false});
            } else if(!doc) {
                res.send(404, {result: false});
            } else {
                res.send({result: true, doc: doc});
            }
        });
    };

    this.reads = function (req, res){
        blogModel.reads(function(err, docs){
            if(err instanceof Error){
                res.send({result: false, docs:[]});
            } else {
                res.send([{result: true, docs: docs}]);
            }
        });
    };

    this.update = function (req, res){
        var id = req.params.blogId;
        blogModel.update(id, req.body, function(err, doc){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send({result: true, id: doc._id});
            }
        });
    };

    this.delete = function (req, res){
        var id = req.params.blogId;
        blogModel.delete(id, function(err, doc){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send({result: true, id: doc._id});
            }
        });
    };
};

exports.Blog = new Blog();
