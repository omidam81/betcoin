'use strict';

module.exports = {
    dice: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/dicenew/dice/next?game=0"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/dicenew/dice",
        "body": "{\n    \"game_id\":\"{{game_id}}\",\n    \"bet\":\"{\\\"sides\\\":[0]}\",\n    \"gameTarget\": 32888,\n    \"client_seed\":\"robot\",\n    \"game\":0,\n    \"wager\": {{wager}}\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
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
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    reels: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/reels/reel/next?game=0"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/reels/reel",
        "body": "{\n    \"game_id\":\"{{game_id}}\",\n    \"wager\":{{wager}},\n    \"game\":0,\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    coinflip: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/coinflip/coinflip/next?game=0"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/coinflip/coinflip",
        "body": "{\n    \"game_id\":\"{{game_id}}\",\n    \"bet\":\"{\\\"sides\\\":[0]}\",\n    \"wager\":{{wager}},\n    \"game\":0,\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
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
    }],
    tiles: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/tiles/tiles/next?game=0"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/tiles/tiles",
        "body": "{\n    \"game_id\":\"{{game_id}}\",\n    \"wager\":{{wager}},\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/tiles/tiles",
        "body": "{\n    \"game_id\":\"{{game_id}}\",\n    \"house_way\": true,\n    \"split\":\"[]\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    paigow: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/paigow/paigow/next?game=0"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/paigow/paigow",
        "body": "{\n    \"game_id\":\"{{game_id}}\",\n    \"wager\":{{wager}},\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/paigow/paigow",
        "body": "{\n    \"game_id\":\"{{game_id}}\",\n    \"house_way\": true,\n    \"split\":\"[]\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    roulette: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/roulette/roulette/next?game=0"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/roulette/roulette",
        "body": "{\n    \"game_id\":\"{{game_id}}\",\n    \n    \"client_seed\":\"robot\",\n    \"bets\":\"{\\\"[1,2,3]\\\":{{wager}}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    sicbo: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/sicbo/sicbo/next?game=0"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/sicbo/sicbo",
        "body": "{\n    \"game_id\":\"{{game_id}}\",\n    \"client_seed\":\"robot\",\n    \"bets\":\"{\\\"[\\\\\\\"total\\\\\\\",17]\\\":{{wager}}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    fortune: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/fortune/fortune/next?game=0"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/fortune/fortune",
        "body": "{\n    \"game_id\":\"{{game_id}}\",\n    \"client_seed\":\"robot\",\n    \"bets\":\"{\\\"10\\\":{{wager}}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    blackjack: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/bj/bj/next?game=0"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/bj/bj",
        "body": "{\n    \"game_id\":\"{{game_id}}\",\n    \"wager\":{{wager}},\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "js",
        "body": "if(game.previousResponse.status==='finished'){\n    return done('recursive_5');\n}\ndone();"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/bj/bj",
        "body": "{\n    \"_id\":\"{{game_id}}\",\n    \"bet\":\"stand\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    baccarat: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/baccarat/baccarat/next?game=0"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/baccarat/baccarat",
        "body": "{\n    \"game_id\":\"{{game_id}}\",\n    \"client_seed\":\"robot\",\n    \"bets\":\"{\\\"player\\\":{{wager}}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    craps: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/craps/craps/next"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "js",
        "body": "game.convertedParams.last_game_id = game.convertedParams.last_game_id||\"\";\nif(game.convertedParams.tablebets && Object.keys(game.convertedParams.tablebets).length>0){\n    game.convertedParams.bets = \"{}\";\n}else if(!game.convertedParams.tablebets){\n    game.convertedParams.bets = \"{\\\\\\\"pass\\\\\\\":\"+game.convertedParams.wager+\"}\";\n}\ndone();\n"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/craps/craps",
        "body": "{\n    \"game_id\":\"{{game_id}}\",\n    \"bets\":\"{{bets}}\",\n    \"last_game_id\":\"{{last_game_id}}\",\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "js",
        "body": "game.convertedParams.last_game_id = game.previousResponse._id;\ngame.convertedParams.tablebets = game.previousResponse.table.bets;\ngame.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\nif(game.convertedParams.tablebets && Object.keys(game.convertedParams.tablebets).length===0){\n    delete game.convertedParams.tablebets;\n    delete game.convertedParams.last_game_id;\n}\ndone();"
    }]
};