'use strict';

module.exports = {
    dice: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/dice/next?game=0"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/dice",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"gameTarget\": 32888,\n    \"client_seed\":\"robot\",\n    \"game\":0,\n    \"wager\": {{wager}}\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    circle: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/circle/next?game=2"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/circle/circle",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"wager\":{{wager}},\n    \"game\":2,\n    \"client_seed\":\"rotbot\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    reels: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/reels/next?game=0"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/reels/reel",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"wager\":{{wager}},\n    \"game\":0,\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    coinflip: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/coinflip/next?game=0"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/coinflip/coinflip",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"bet\":\"{\\\"sides\\\":[0]}\",\n    \"wager\":{{wager}},\n    \"game\":0,\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    keno: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/keno/next?game=0"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/keno/game",
        "body": "{\n    \"bets\":[1,2,3,4,5,6,7,8],\n    \"gameId\":\"{{game_id}}\",\n    \"wager\":{{wager}},\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    war: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/war/next"
    }, {
        "type": "convert",
        "body": "{\"nextGameId\":\"game_id\"}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/war",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"client_seed\":\"robot\",\n    \"wager\":{{wager}}\n}"
    }, {
        "type": "js",
        "body": "if(game.previousResponse.player_stack[0].rank !== game.previousResponse.dealer_stack[0].rank){\n    return done({action_type:'recursive_6'})\n}\ndone();"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/war",
        "body": "{\n    \"gotoWar\": true,\n    \"wager\": {{wager}},\n    \"_id\":\"{{game_id}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();\n"
    }],
    hilo: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/hilo/next"
    }, {
        "type": "convert",
        "body": "{\"nextGameId\":\"game_id\"}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/hilo/",
        "body": "{\"gameId\":\"{{game_id}}\",\"bet\":\"[1]\",\"client_seed\": \"robot\",\"wager\":0}"
    }, {
        "type": "js",
        "body": "game.convertedParams.game_id = game.previousResponse._id;\n\nfor(var i in game.previousResponse.result.gameOdds){\n    if(game.previousResponse.result.gameOdds[i]>0&&game.previousResponse.result.gameOdds[i]<1){\n        if(i==='bigger'||i==='smaller'||i==='black'||i==='red'){\n            game.convertedParams.bet=i;    \n        }\n        \n    }\n}\n\ndone();"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/hilo/{{game_id}}",
        "body": "{\n\"bet\":\"[\\\"{{bet}}\\\",1]\",\n\"wager\": {{wager}},\n\"gameId\":\"{{game_id}}\"\n}"
    }, {
        "type": "js",
        "body": "if(game.previousResponse.status!=='finished'&&!game.previousResponse.lock){\n    done({action_type:'recursive_4'});\n}else{\n    game.totals.wager = game.totals.wager||0;\n    game.totals.wager += game.previousResponse.wager;\n    game.totals.winnings = game.totals.winnings||0;\n    game.totals.winnings += game.previousResponse.winnings;\n    done();\n}\n"
    }],
    tiles: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/tiles/next"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/tiles",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"wager\":{{wager}},\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/tiles",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"house_way\": true,\n    \"split\":\"[]\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    paigow: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/paigow/next"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/paigow",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"wager\":{{wager}},\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/paigow",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"house_way\": true,\n    \"split\":\"[]\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    roulette: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/roulette/next"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/roulette",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"client_seed\":\"robot\",\n    \"bets\":\"{\\\"[1,2,3]\\\":{{wager}}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    sicbo: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/sicbo/next"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/sicbo",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"client_seed\":\"robot\",\n    \"bets\":\"{\\\"[\\\\\\\"total\\\\\\\",17]\\\":{{wager}}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    fortune: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/fortune/next"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/fortune",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"client_seed\":\"robot\",\n    \"bets\":\"{\\\"10\\\":{{wager}}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    blackjackb: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/blackjack/next"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/blackjack",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"wager\":{{wager}},\n    \"client_seed\":\"2349572323\"\n}"
    }, {
        "type": "js",
        "body": "if(game.previousResponse.status==='finished'){\n    return done('recursive_5');\n}\ndone();"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/blackjack",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"bet\":\"hit\"\n}"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/blackjack",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"bet\":\"hit\"\n}"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/blackjack",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"bet\":\"hit\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    blackjack: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/blackjack/next"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/blackjack",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"wager\":{{wager}},\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "js",
        "body": "if(game.previousResponse.status==='finished'){\n    return done('recursive_5');\n}\ndone();"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/blackjack",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"bet\":\"stand\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    blackjack_b: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/blackjack/next"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/blackjack",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"wager\":{{wager}},\n    \"client_seed\":\"3838734838\"\n}"
    }, {
        "type": "js",
        "body": "if(game.previousResponse.status==='finished'){\n    return done('recursive_5');\n}\ndone();"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/blackjack",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"bet\":\"hit\"\n}"
    }, {
        "type": "js",
        "body": "if(game.previousResponse.status==='finished'){\n    return done('recursive_5');\n}\ndone();"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/blackjack",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"bet\":\"hit\"\n}"
    }, {
        "type": "js",
        "body": "if(game.previousResponse.status==='finished'){\n    return done('recursive_5');\n}\ndone();"
    },  {
        "type": "http",
        "httpType": "put",
        "endpoint": "/blackjack",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"bet\":\"hit\"\n}"
    }, {
        "type": "js",
        "body": "if(game.previousResponse.status==='finished'){\n    return done('recursive_5');\n}\ndone();"
    },  {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],  
    baccarat: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/baccarat/next"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/baccarat",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"client_seed\":\"robot\",\n    \"bets\":\"{\\\"player\\\":{{wager}}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    baccpo: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/baccpo/next"
    }, {
        "type": "convert",
        "body": "{\"nextGameId\":\"game_id\"}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/baccpo",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"bets\":\"{\\\"win\\\":{{wager}}}\",\n    \"client_seed\": \"robot\"\n}"
    }, {
        "type": "js",
        "body": "if(game.previousResponse.status === 'finished'){\n    return done({action_type:'recursive_6'});\n}\ndone();"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/baccpo",
        "body": "{\n    \"action\":\"stand\",\n    \"gameId\":\"{{game_id}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();\n"
    }],
    tigerdragon: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/tigerdragon/next"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/tigerdragon",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"bets\":\"{\\\"banker\\\":{{wager}}}\",\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    '3card': [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/threecard/next"
    }, {
        "type": "convert",
        "body": "{\"nextGameId\":\"game_id\"}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/threecard",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"bets\":\"{\\\"ante\\\":{{wager}}}\",\n    \"client_seed\": \"robot\"\n}"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/threecard",
        "body": "{\n    \"action\":1,\n    \"gameId\":\"{{game_id}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();\n\n"
    }],
    '3cardb': [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/threecard/next"
    }, {
        "type": "convert",
        "body": "{\"nextGameId\":\"game_id\"}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/threecard",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"bets\":\"{\\\"ante\\\":{{wager}}}\",\n    \"client_seed\": \"9372038473\"\n}"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/threecard",
        "body": "{\n    \"action\":0,\n    \"gameId\":\"{{game_id}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();\n\n"
    }],    
    caribbean: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/caribbean/next"
    }, {
        "type": "convert",
        "body": "{\"nextGameId\":\"game_id\"}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/caribbean/",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"client_seed\": \"robot\",\n    \"wager\": \"{{wager}}\"\n}"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/caribbean",
        "body": "{\n    \"raise\":true,\n    \"gameId\":\"{{game_id}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();\n\n"
    }],
    videopoker: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/videopoker/next"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/videopoker/",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"wager\":{{wager}},\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "js",
        "body": "game.convertedParams.holds = JSON.stringify(game.previousResponse.player_hand.holds);\ndone();"
    }, {
        "type": "http",
        "httpType": "put",
        "endpoint": "/videopoker/",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"holds\": \"{{holds}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    craps: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/craps/next"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "js",
        "body": "game.convertedParams.last_game_id = game.convertedParams.last_game_id||\"\";\nif(game.convertedParams.tablebets && Object.keys(game.convertedParams.tablebets).length>0){\n    game.convertedParams.bets = \"{}\";\n}else if(!game.convertedParams.tablebets){\n    game.convertedParams.bets = \"{\\\\\\\"pass\\\\\\\":\"+game.convertedParams.wager+\"}\";\n}\ndone();\n"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/craps",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"bets\":\"{{bets}}\",\n    \"last_game_id\":\"{{last_game_id}}\",\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "js",
        "body": "game.convertedParams.last_game_id = game.previousResponse._id;\ngame.convertedParams.tablebets = game.previousResponse.table.bets;\ngame.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\nif(game.convertedParams.tablebets && Object.keys(game.convertedParams.tablebets).length===0){\n    delete game.convertedParams.tablebets;\n    delete game.convertedParams.last_game_id;\n}\ndone();"
    }],
    fantan: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/fantan/next"
    }, {
        "type": "convert",
        "body": "{\n    \"nextGameId\":\"game_id\"\n}"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/fantan",
        "body": "{\n    \"gameId\":\"{{game_id}}\",\n    \"bets\":\"{\\\"[\\\\\\\"fan\\\\\\\",1]\\\":{{wager}}}\",\n    \"client_seed\":\"robot\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ngame.totals.winnings = game.totals.winnings||0;\ngame.totals.winnings += game.previousResponse.winnings;\ndone();"
    }],
    lottery: [{
        "type": "http",
        "httpType": "get",
        "endpoint": "/lottery/bet/next?game=0"
    }, {
        "type": "js",
        "body": "game.convertedParams.game_id = game.previousResponse.nextGameId;\ndone();"
    }, {
        "type": "http",
        "httpType": "get",
        "endpoint": "/lottery/lottery/active"
    }, {
        "type": "js",
        "body": "game.previousResponse.forEach(function(lottery){\n    if(lottery.interval === '1m'){\n        game.convertedParams.lottery_id = lottery._id\n    }\n});\ndone();"
    }, {
        "type": "http",
        "httpType": "post",
        "endpoint": "/lottery/bet/{{game_id}}",
        "body": "{\n    \"client_seed\":\"robot\",\n    \"lottery_id\":\"{{lottery_id}}\",\n    \"game_id\":\"{{game_id}}\",\n    \"wager\":\"{{wager}}\"\n}"
    }, {
        "type": "js",
        "body": "game.totals.wager = game.totals.wager||0;\ngame.totals.wager += game.previousResponse.wager;\ndone();"
    }]
};