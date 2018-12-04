'use strict';

var PressFactory = function (Restangular) {
    var PressFactory = {},
    baseSupport = Restangular.all('press');
    PressFactory.previewPress = {};
    // get all the tickets with all status
    PressFactory.reads = function (callback){
        baseSupport.getList().then(function(response){
            return callback(response[0].docs);
        });
    };

    // get ticket details by id
    PressFactory.read = function (id, callback) {
        baseSupport.get(id).then(function(response){
            return callback(response.doc);
        });
    };


    return PressFactory;
};

Application.Services.factory("PressFactory", ['Restangular', PressFactory]);
