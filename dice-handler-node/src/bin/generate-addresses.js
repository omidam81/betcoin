'use strict';

var mongo = require('mongowrap').getConnection();
var bitcoind = require('bitcoin-wallet');

var gameTemplates = [
    { "_id" : 1,     "house_edge" : 0.01838, "maxBet" : 5580000,     "minBet" : 100000, "target" : "1",     "title" : "1"     },
    { "_id" : 2,     "house_edge" : 0.0188,  "maxBet" : 10880000,    "minBet" : 100000, "target" : "2",     "title" : "2"     },
    { "_id" : 4,     "house_edge" : 0.0188,  "maxBet" : 12880000,    "minBet" : 100000, "target" : "4",     "title" : "4"     },
    { "_id" : 8,     "house_edge" : 0.0188,  "maxBet" : 15880000,    "minBet" : 100000, "target" : "8",     "title" : "8"     },
    { "_id" : 16,    "house_edge" : 0.0188,  "maxBet" : 18880000,    "minBet" : 100000, "target" : "16",    "title" : "16"    },
    { "_id" : 32,    "house_edge" : 0.0188,  "maxBet" : 38000000,    "minBet" : 100000, "target" : "32",    "title" : "32"    },
    { "_id" : 64,    "house_edge" : 0.0188,  "maxBet" : 88000000,    "minBet" : 100000, "target" : "64",    "title" : "64"    },
    { "_id" : 128,   "house_edge" : 0.0188,  "maxBet" : 180000000,   "minBet" : 100000, "target" : "128",   "title" : "128"   },
    { "_id" : 256,   "house_edge" : 0.0188,  "maxBet" : 388000000,   "minBet" : 100000, "target" : "256",   "title" : "256"   },
    { "_id" : 512,   "house_edge" : 0.0188,  "maxBet" : 600000000,   "minBet" : 100000, "target" : "512",   "title" : "512"   },
    { "_id" : 1000,  "house_edge" : 0.0188,  "maxBet" : 880000000,   "minBet" : 100000, "target" : "1000",  "title" : "1k"    },
    { "_id" : 1500,  "house_edge" : 0.0188,  "maxBet" : 1800000000,  "minBet" : 100000, "target" : "1500",  "title" : "1.5k"  },
    { "_id" : 2000,  "house_edge" : 0.0188,  "maxBet" : 3800000000,  "minBet" : 100000, "target" : "2000",  "title" : "2k"    },
    { "_id" : 3000,  "house_edge" : 0.0188,  "maxBet" : 4800000000,  "minBet" : 100000, "target" : "3000",  "title" : "3k"    },
    { "_id" : 4000,  "house_edge" : 0.0188,  "maxBet" : 5800000000,  "minBet" : 100000, "target" : "4000",  "title" : "4k"    },
    { "_id" : 6000,  "house_edge" : 0.0188,  "maxBet" : 6800000000,  "minBet" : 100000, "target" : "6000",  "title" : "6k"    },
    { "_id" : 8000,  "house_edge" : 0.0188,  "maxBet" : 8800000000,  "minBet" : 100000, "target" : "8000",  "title" : "8k"    },
    { "_id" : 12000, "house_edge" : 0.0188,  "maxBet" : 12800000000, "minBet" : 100000, "target" : "12000", "title" : "12k"   },
    { "_id" : 16000, "house_edge" : 0.0188,  "maxBet" : 13800000000, "minBet" : 100000, "target" : "16000", "title" : "16k"   },
    { "_id" : 24000, "house_edge" : 0.0188,  "maxBet" : 23800000000, "minBet" : 100000, "target" : "24000", "title" : "24k"   },
    { "_id" : 32000, "house_edge" : 0.0188,  "maxBet" : 28800000000, "minBet" : 100000, "target" : "32000", "title" : "32k"   },
    { "_id" : 32768, "house_edge" : 0.0188,  "maxBet" : 35800000000, "minBet" : 100000, "target" : "32768", "title" : "50/50" },
    { "_id" : 48000, "house_edge" : 0.0188,  "maxBet" : 38800000000, "minBet" : 100000, "target" : "48000", "title" : "48k"   },
    { "_id" : 52000, "house_edge" : 0.0188,  "maxBet" : 40800000000, "minBet" : 100000, "target" : "52000", "title" : "52k"   },
    { "_id" : 56000, "house_edge" : 0.0188,  "maxBet" : 48800000000, "minBet" : 100000, "target" : "56000", "title" : "56k"   },
    { "_id" : 60000, "house_edge" : 0.0188,  "maxBet" : 68800000000, "minBet" : 100000, "target" : "60000", "title" : "60k"   },
    { "_id" : 64000, "house_edge" : 0.0188,  "maxBet" : 88800000000, "minBet" : 100000, "target" : "64000", "title" : "64k"   }
];

var games = [];
var looper = function() {
    var game = gameTemplates.shift();
    if(game) {
        bitcoind.getNewAddress("dice", function(err, address) {
            console.log("%d %s - %s", game._id, game.title, address);
            game.address = address;
            games.push(game);
            looper();
        });
    } else {
        mongo.getCollection("casinoadmin", "dice_game_data", function(err, confCollection) {
            if (err) throw err;
            confCollection.insert(games, function(err) {
                if (err) throw err;
                bitcoind.getNewAddress("change", function(err, changeaddress) {
                    if (err) throw err;
                    console.log('change address %s', changeaddress);
                    process.exit();
                });
            });
        });
    }
};

looper();
