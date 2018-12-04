'use strict';

var WikiFactory = function (Restangular) {
    var WikiFactory = {},
    baseSupport = Restangular.all('wiki');
    WikiFactory.previewWiki = {};


    // get all the tickets with all status
    WikiFactory.reads = function (callback){
        baseSupport.getList().then(function(response){
            return callback(response[0].docs);
        });
    };

    // get ticket details by id
    WikiFactory.read = function (id, callback) {
        baseSupport.get(id).then(function(response){
            return callback(response.doc);
        });
    };

    return WikiFactory;
};

Application.Services.factory("WikiFactory", ['Restangular', WikiFactory]);
