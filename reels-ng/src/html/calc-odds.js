'use strict';

var extend = require('util')._extend;

var runOddsSimulation = function(gameConfig) {
    var payouts = extend({}, gameConfig.payouts);
    delete payouts[gameConfig.scatter];
    var combos = {};
    var comboCounter = 0;
    var fs = require('fs');


    gameConfig.reels[0].forEach(function(v1, i1) {
        gameConfig.reels[1].forEach(function(v2, i2) {
            gameConfig.reels[2].forEach(function(v3, i3) {
                gameConfig.reels[3].forEach(function(v4, i4) {
                    gameConfig.reels[4].forEach(function(v5, i5) {
                        var row = [v1, v2, v3, v4, v5];

                        comboCounter++;
                        var centerIndexes = [i1, i2, i3, i4, i5];
                        var reelMatrix = new Array(gameConfig.field.height);
                        for(var i = 0; i < gameConfig.field.height; i++) {
                            reelMatrix[i] = [];
                        }
                        var addedRows = Math.floor(gameConfig.field.height / 2);
                        var centerRowIndex = addedRows;
                        centerIndexes.forEach(function(centerIndex, reelIndex) {
                            for (var above = addedRows; above > 0; above--) {
                                // get top row
                                var topIndex = centerIndex - above;
                                // detect wrap
                                if (topIndex < 0) {
                                    topIndex += 32;
                                }
                                reelMatrix[centerRowIndex - above].push(gameConfig.reels[reelIndex][topIndex]);
                            }
                            reelMatrix[centerRowIndex].push(gameConfig.reels[reelIndex][centerIndex]);
                            for (var below = 1; below < (addedRows + 1); below++) {
                                // get bottom row
                                var bottomIndex = centerIndex + below;
                                // detect wrap
                                if (bottomIndex > 31) {
                                    bottomIndex -= 32;
                                }
                                reelMatrix[centerRowIndex + below].push(gameConfig.reels[reelIndex][bottomIndex]);
                            }
                        });
                        var sprite = row.shift();
                        var count = 1;
                        for (var x = 0; x < row.length; x++) {
                            var value = row[x];
                            if (value === sprite) {
                                count += 1;
                            } else {
                                // break the loop
                                x = row.length;
                            }
                        }
                        if (payouts.hasOwnProperty(sprite) && payouts[sprite].hasOwnProperty(count)) {
                            if (combos[sprite] === undefined) {
                                combos[sprite] = {};
                            }
                            if (combos[sprite][count] === undefined) {
                                combos[sprite][count] = 0;
                            }

                            combos[sprite][count] += 1;
                        }
                        var scatterCount = 0;
                        reelMatrix.forEach(function(row) {
                            row.forEach(function(value) {
                                if (value === gameConfig.scatter) {
                                    scatterCount += 1;
                                }
                            });
                        });
                        if (gameConfig.payouts[gameConfig.scatter] && gameConfig.payouts[gameConfig.scatter][scatterCount]) {
                            if (combos[gameConfig.scatter] === undefined) {
                                combos[gameConfig.scatter] = {};
                            }
                            if (combos[gameConfig.scatter][scatterCount] === undefined) {
                                combos[gameConfig.scatter][scatterCount] = 0;
                            }
                            combos[gameConfig.scatter][scatterCount] += 1;
                        }
                        if(comboCounter % 1000000 === 0) {
                            console.log(comboCounter);
                        }
                    });
                });
            });
        });
    });
    var stream = fs.createWriteStream("odds.txt");
    stream.once('open', function(fd) {

        stream.write(JSON.stringify(combos));
        stream.end();
    });
    console.log("found %d combos", comboCounter);

    return(combos);
};
var baseReel = [
    0,
    1,1,
    2,2,2,
    3,3,3,3,
    7,
    4,4,4,4,4,
    5,5,5,5,5,5,5,
    6,6,6,6,6,6,6,6,6
];
var specialReel = [
    0,
    1,1,
    2,2,2,
    3,3,3,3,
    7,
    4,4,4,4,4,
    5,5,5,5,5,5,5,
    6,6,6,6,6,6,6,6,
    7
];
var games = {
    0: {
        field: {
            width: 5,
            height: 3,
            symbols: 8
        },
        specialLines: [
            [[0,0], [1,1], [2,2], [1,3], [0,4]],
            [[2,0], [1,1], [0,2], [1,3], [2,4]]
        ],
        reels: [
            [3,6,2,4,1,2,5,5,7,6,4,5,5,4,6,3,3,6,6,3,2,1,6,6,4,5,6,0,5,5,4,6],
            [4,3,4,6,6,5,6,4,6,4,0,3,6,6,3,5,3,2,4,5,5,2,1,1,5,5,2,6,7,6,5,7],
            [7,6,4,5,1,2,5,6,4,4,6,3,5,5,5,3,3,4,7,3,4,0,5,2,6,5,6,1,6,2,6,6],
            [6,7,1,3,0,5,4,3,5,2,5,7,5,3,4,6,6,4,4,5,2,5,6,6,6,6,3,4,2,1,6,5],
            [1,5,0,2,2,3,5,4,5,5,3,4,5,3,3,6,4,6,2,5,5,6,6,4,6,4,7,1,6,6,7,6]
        ],
        // index of scatter tile
        scatter: 7,
        payouts: {
            0: {       3: 88, 4: 238, 5: 888 }, // seven (silver coin)
            1: { 2: 1, 3: 55, 4: 118,  5: 288  }, // melon (prize cup)
            2: { 2: 1, 3: 55, 4: 118,  5: 288  }, // grape (cherry)
            3: {       3: 18, 4: 88,  5: 128  }, // cherry (dice)
            4: {       3: 18, 4: 88,  5: 128  }, // plum (bell)
            5: {       3: 8,  4: 25,  5: 58   }, // orange (clover)
            6: {       3: 8,  4: 25,  5: 58   }, // lemon (gold coin)
            7: {       3: 8,  4: 25,  5: 58   }, // scatter (ruby)
        }
    }
};

var printTable = function(data, printFunc) {
    var columns = "  |     ";
    var header = "  +" + Array(61).join("-");
    var rows = [];
    [1,2,3,4,5].forEach(function(count) {
        columns += count + Array(6).join(" ") + "|     ";
    });
    Object.keys(data).forEach(function(sprite) {
        var leader = sprite.toString();
        if (leader.length === 1) {
            leader += " ";
        }
        var str = leader + "| ";
        [1,2,3,4,5].forEach(function(count) {
            if (isNaN(data[sprite][count])) {
                str += Array(13).join(" ");
            } else {
                var val = printFunc(data[sprite][count]);
                var leftover = 12 - val.toString().length;
                val += Array(leftover + 1).join(" ");
                str +=  val;
            }
        });
        rows.push(str);
    });
    console.log(columns);
    console.log(header);
    console.log(rows.join("\n"));
};

Object.keys(games).forEach(function(gameIndex) {
    console.log('running simulation for game %d', gameIndex);
    var maxCombos = Math.pow(32, 5);
    console.log("max combos: %d", maxCombos);
    // var combos = runOddsSimulation(games[gameIndex]);
    var combos = {"0":{"3":992,"4":31,"5":1},"1":{"2":122880,"3":7680,"4":480,"5":32},"2":{"2":267264,"3":25056,"4":2349,"5":243},"3":{"3":57344,"4":7168,"5":1024},"4":{"3":108000,"4":16875,"5":3125},"5":{"3":274400,"4":60025,"5":16807},"6":{"3":442368,"4":110592,"5":36864},"7":{"3":1089504,"4":104976,"5":3888}};
    console.log("combinations");
    printTable(combos, function(val) { return val; });


    console.log("line pay probablilities");
    var odds = {};
    for(var sprite_odds in combos) {
        if (combos.hasOwnProperty(sprite_odds)) {
            for (var count in combos[sprite_odds]) {

                if (odds[sprite_odds] === undefined) {
                    odds[sprite_odds] = {};
                }
                odds[sprite_odds][count] = combos[sprite_odds][count] / maxCombos;
            }
        }
    }
    printTable(odds, function(val) {
        return val.toString().substr(0,9);
    });

    var payoutPerc = {};
    var totalWeight = 0;
    for(var sprite in combos) {
        for (var count in combos[sprite]) {
            if (payoutPerc[sprite] === undefined) {
                payoutPerc[sprite] = {};
            }
            var payoutWeight = odds[sprite][count] * (games[gameIndex].payouts[sprite][count]);
            if (sprite === games[gameIndex].scatter) {
                payoutWeight *= 5;
            }
            payoutPerc[sprite][count] = payoutWeight;
            totalWeight += payoutWeight;
        }
    }
    console.log("expected returns");
    printTable(payoutPerc, function(val) {
        return val.toString().substr(0,9);
    });
    console.log("expected return");
    console.log(totalWeight);
    console.log("house edge");
    console.log(1 - totalWeight);
});
