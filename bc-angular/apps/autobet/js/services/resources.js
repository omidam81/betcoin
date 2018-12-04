'use strict';

var api = "https://<%= hostname %>:443";
var httpUrl = "https://<%= hostname %>:443";
var socket = "https://<%= hostname %>:443";

Application.Services.factory('Auth', ['$http', '$base64',
    function($http, $base64) {
        return function(username, password) {
            return $http.get(httpUrl + '/auth', {
                headers: {
                    Authorization: "Basic " + $base64.encode(username + ":" + password)
                }
            });
        };
    }
]);

Application.Services.factory('Autobet', ['$resource',
    function($resource) {
        return $resource(api + '/autobet/:command/:target/:query', {}, {
            getAllRobotPlayers: {
                method: 'GET',
                isArray: true
            },
            getPlayerConfig: {
                method: 'GET',
                params: {
                    command: '@player_id'
                }
            },
            saveRobotPlayer: {
                method: 'POST'
            },
            updateGameConfig: {
                method: 'PUT',
                params: {
                    target: 'game',
                    command: '@player_id',
                    query: '@_id'
                }
            },
            addGameConfig: {
                method: 'POST',
                params: {
                    target: 'game',
                    command: '@player_id'
                }
            },
            removeGameConfig: {
                method: 'DELETE',
                params: {
                    target: 'game',
                    command: '@player_id',
                    query: '@_id'
                }
            },
            getDefaultAutobets: {
                method: 'GET',
                params: {
                    command: 'games'
                },
                isArray: true
            }
        });
    }
]);

Application.Services.service('AutobetSocket', ['Socket',
    function(Socket) {
        return Socket.getConnection(socket);
    }
]);

Application.Services.constant('Api', {
    url: api,
    scheme: "https",
    hostname: "<%= hostname %>",
    port: 443,
    base: "autobet"
});

Application.Services.constant('GameConfigs', {
    circle: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/circle/circle/next?game=2"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/circle/circle",
        "body": "{\n    \"game_id\":\"{{game_id}}\",\n    \"wager\":{{wager}},\n    \"game\":2\n}"
    }],
    hilo: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/hilo/hilo/next"
    }, {
        "type": "convert",
        "body": "{\"nextGameId\":\"game_id\"}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/hilo/hilo/",
        "body": "{\"game_id\":\"{{game_id}}\",\"bet\":\"[1]\",\"client_seed\": \"robot\",\"wager\":0}"
    }, {
        "type": "js",
        "body": "game.convertedParams.game_id = game.previousResponse._id;\n\nfor(var i in game.previousResponse.result.gameOdds){\n    if(game.previousResponse.result.gameOdds[i]>0&&game.previousResponse.result.gameOdds[i]<1){\n        if(i==='bigger'||i==='smaller'||i==='black'||i==='red'){\n            game.convertedParams.bet=i;    \n        }\n        \n    }\n}\n\ndone();"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/hilo/hilo/{{game_id}}",
        "body": "{\n\"bet\":\"[\\\"{{bet}}\\\",1]\",\n\"wager\": {{wager}},\n\"_id\":\"{{game_id}}\"\n}"
    }, {
        "type": "js",
        "body": "if(game.previousResponse.status!=='finished'&&!game.previousResponse.lock){\n    done({action_type:'recursive_4'});\n}else{\n    game.totals.wager = game.totals.wager||0;\n    game.totals.wager += game.previousResponse.wager;\n    game.totals.winnings = game.totals.winnings||0;\n    game.totals.winnings += game.previousResponse.winnings;\n    done();\n}\n"
    }]
});