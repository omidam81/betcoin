'use strict';

var request = require('request');
var url = require('url');

module.exports = function() {
    var CircleWorkflow = function(){};
    var CIRCLE_SERVER;

    var parseUrl = function(playerUrl) {
        CIRCLE_SERVER = url.parse(playerUrl);

        if (CIRCLE_SERVER.hostname === null) throw "Malformed CIRCLE_SERVER_PORT variable: " + playerUrl;
        if (CIRCLE_SERVER.port === null) throw "Malformed CIRCLE_SERVER_PORT variable: " + playerUrl;
        CIRCLE_SERVER.port = parseInt(CIRCLE_SERVER.port, 10);
    };
    parseUrl(process.env.CIRCLE_SERVER_PORT);

    CircleWorkflow.prototype.initGame = function (params, cb) {
        var options = {
            url: 'http://' + CIRCLE_SERVER.hostname + ':' + CIRCLE_SERVER.port + '/circle/next?game=' + params.game,
            headers:{Authorization: 'Bearer ' + params.credential.token}
        };
        request(options, function(error, response){
            if(error) return cb(error);
            var result = JSON.parse(response.body);
            if(response.statusCode !== 200){
                return cb(result);
            }
            params.initGame = {};
            for(var i in result){
                if(result.hasOwnProperty(i)){
                    params.initGame[i] = result[i];
                }
            }
            
            cb(undefined, params);
        });
    };

    CircleWorkflow.prototype.setOptions = function (params, cb) {
        params.game_id = params.initGame.nextGameId;
        params.player_id = params.credential.player_id;
        return cb(undefined, params);
    };

    CircleWorkflow.prototype.playGame = function (params, cb) {
        var options = {
            url: 'http://' + CIRCLE_SERVER.hostname + ':' + CIRCLE_SERVER.port + '/circle',
            form: params,
            headers:{Authorization: 'Bearer ' + params.credential.token}
        };

        request.post(options, function(error, response){
            if(error) return cb(error);
            var result = JSON.parse(response.body);
            if(response.statusCode !== 200){
                return cb(result);
            }
            cb(undefined, result);
        });
    };

    //execute in order, and pass the params as waterfall
    CircleWorkflow.prototype.workflows = function(){
        return ['initGame', 'setOptions', 'playGame'];
    };
    return new CircleWorkflow();
};
