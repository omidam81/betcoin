'use strict';

var BlogFactory = function (Restangular) {
    var BlogFactory = {},
    baseSupport = Restangular.all('blog');
    BlogFactory.previewBlog = {};
    // create a ticket 

    // get all the tickets with all status
    BlogFactory.reads = function (callback){
        baseSupport.getList().then(function(response){
            return callback(response[0].docs);
        });
    };

    // get ticket details by id
    BlogFactory.read = function (id, callback) {
        baseSupport.get(id).then(function(response){
            return callback(response.doc);
        });
    };


    return BlogFactory;
};

Application.Services.factory("BlogFactory", ['Restangular', BlogFactory]);
