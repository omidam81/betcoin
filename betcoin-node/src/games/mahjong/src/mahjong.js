'use strict';

var _ = require('underscore');
var util = require('./util');
var shanten = require('./shanten');
var vals = util.vals;

var actions = {
    'remove': -10,
    'skip': 0,
    'from_deck': 5,
    'pair' : 7,
    'chow'  :  10,
    'pong' :  20,
    'kong_stolen' :  21,
    'kong' :  30, //kong by stealing a discarded tile
    'kong_last_tile' :  35, //add a tile to melded pong
    'hidden_kong' :  36, //hidden kong
    'win'  :  40,
    'swin' :  50
};

var newMeld = function(type, tiles) {
    return {
        type: type,
        tiles: tiles.slice()
    };
};

var findHonors = function (hist) {
    hist = hist.slice(0);
    var sets = [];
    for (var i = vals.honor_beg; i <= vals.honor_end; i++) {
        if (hist[i] >= 3) {
            sets.push(newMeld(actions.pong, [i, i, i]));
            hist[i] -= 3;
        }
    }
    if (util.sum(hist.slice(vals.honor_beg, vals.honor_end + 1)) === 0) {
        return [[sets], true];
    }
    return [[sets], false];
};

var findRegularMahjongAcc = function (hist, beg, end) {
    var mjs = [],
        queue = [],
        valid = false;
    var process = function(hist, sets, index, beg, end) {
        var copy;
        if (util.sum(hist.slice(beg, end+1)) === 0) {
            mjs.push(sets);
            return true;
        }
        for (var i = beg; i <= end; i++) {
            if (util.sum(hist.slice(index, i)) > 0) {
                return false;
            }
            var count = hist[i];
            if (count > 0) {
                if (i + 2 <= end) {
                    if (hist[i+1] > 0 &&
                        hist[i+2] > 0) {
                        copy = hist.slice(0);
                        copy[i] -= 1;
                        copy[i+1] -= 1;
                        copy[i+2] -= 1;
                        var new_sets = sets.slice(0);
                        new_sets.push(newMeld(actions.chow, [i, i+1, i+2]));
                        queue.push([copy, new_sets, i, beg, end]);
                    }
                }
            }
            if (count >= 3) {
                copy = hist.slice(0);
                copy[i] -= 3;
                sets.push(newMeld(actions.pong, [i, i, i]));
                queue.push([copy, sets, i, beg, end]);
            }
        }
        return false;
    };
    queue.push([hist, [], beg, beg, end]);
    while (queue.length > 0) {
        var cur_item = queue[0],
            sets = cur_item[1],
            index = cur_item[2];
        hist = cur_item[0];
        beg = cur_item[3];
        end = cur_item[4];
        if (process(hist, sets, index, beg, end)) {
            valid = true;
        }
        queue.shift();
    }
    return [mjs, valid];
};
var findRegularMahjong = function (hist) {
    /*
     * try all pairs
     */
    for (var i = vals.id_min; i <= vals.id_max; i++) {
        if (hist[i] < 2) {
            continue;
        }
        var pair = i;
        hist[i] -= 2;
        var honor_result = findHonors(hist);
        var character_result = findRegularMahjongAcc(hist, vals.character_beg, vals.character_end);
        var circle_result = findRegularMahjongAcc(hist, vals.circle_beg, vals.circle_end);
        var bamboo_result = findRegularMahjongAcc(hist, vals.bamboo_beg, vals.bamboo_end);
        if (honor_result[1] && character_result[1] && circle_result[1] && bamboo_result[1]) {
            var hand = [];
            if (honor_result[0].length) {
                for (i=0; i<honor_result[0][0].length; i++) {
                    hand.push(honor_result[0][0][i]);
                }
            }
            if (character_result[0].length) {
                for (i=0; i<character_result[0][0].length; i++) {
                    hand.push(character_result[0][0][i]);
                }
            }
            if (circle_result[0].length) {
                for (i=0; i<circle_result[0][0].length; i++) {
                    hand.push(circle_result[0][0][i]);
                }
            }
            if (bamboo_result[0].length) {
                for (i=0; i<bamboo_result[0][0].length; i++) {
                    hand.push(bamboo_result[0][0][i]);
                }
            }

            hand.push(newMeld(actions.pair, [pair, pair]));
            return hand;
        }
        hist[i] += 2;
    }
    return false;
};
var checkRegularMahjongNoPairColor = function (init_hist, init_beg, init_end) {
    var queue = [],
        process = function (hist, index, beg, end) {
            if (util.sum(hist.slice(beg, end+1)) === 0) {
                return true;
            }
            for (var i = beg; i <= end; i++) {
                if (util.sum(hist.slice(index, i)) > 0) {
                    return false;
                }
                var count = hist[i],
                    copy;
                if (count > 0) {
                    if (i + 2 <= end) {
                        if (hist[i+1] > 0 && hist[i+2] > 0) {
                            copy = hist.slice(0);
                            copy[i] -= 1;
                            copy[i+1] -= 1;
                            copy[i+2] -= 1;
                            queue.push([copy, index, i, end]);
                        }
                    }
                }
                if (count >= 3) {
                    copy = hist.slice(0);
                    copy[i] -= 3;
                    queue.push([copy, index, i, end]);
                }
            }
            return false;
        };
    queue.push([init_hist, init_beg, init_beg, init_end]);
    while (queue.length > 0) {
        var cur_item = queue[0],
            hist = cur_item[0],
            index = cur_item[1],
            beg = cur_item[2],
            end = cur_item[3];
        var worked = process(hist, index, beg, end);
        if (worked) {
            return true;
        }
        queue.shift();
    }
    return false;
};
var checkRegularMahjongNoPairHonor = function (hist, beg, end) {
    // for honors, check triplets only
    for (var i = beg; i <= end; i++) {
        if ((hist[i] % 3) !== 0) {
            return false;
        }
    }
    return true;
};
var checkRegularMahjongNoPair = function (hist) {
    return checkRegularMahjongNoPairHonor(hist, util.vals.honor_beg, util.vals.honor_end) &&
        checkRegularMahjongNoPairColor(hist, vals.character_beg, vals.character_end) &&
        checkRegularMahjongNoPairColor(hist, vals.circle_beg, vals.circle_end) &&
        checkRegularMahjongNoPairColor(hist, vals.bamboo_beg, vals.bamboo_end);
};
var checkSevenPairs = function (hist) {
    for (var i = util.vals.id_min; i <= util.vals.id_max; i++) {
        if ((hist[i] % 2) !== 0) {
            return false;
        }
    }
    return true;
};
var checkRegularMahjong = function (hist) {
    if (util.sum(hist) !== 14) {
        throw ("Cannot check mahjong with " + util.sum(hist) + " tiles in hand.");
    }
    //TODO: special hands
    if (checkSevenPairs(hist)) {
        return true;
    }
    /*
     * enumerate through all possible pairs
     */
    for (var i = 0; i < vals.count; i++) {
        if (hist[i] >= 2) {
            hist[i] -= 2;
            var pass = checkRegularMahjongNoPair(hist);
            hist[i] += 2;

            if (pass) {
                return true;
            }
        }
    }
    return false;
};

var addStreetScore = function (score, hist, beg, end) {
    var i;
    for (i = beg; i <= end - 1; i++) {
        score[i] += hist[i + 1] * 100;
    }

    for (i = beg; i <= end - 2; i++) {
        score[i] += hist[i + 2] * 10;
    }

    for (i = beg; i <= end - 3; i++) {
        score[i] += hist[i + 3] * 5;
    }

    for (i = beg + 1; i <= end; i++) {
        score[i] += hist[i - 1] * 100;
    }

    for (i = beg + 2; i <= end; i++) {
        score[i] += hist[i - 2] * 10;
    }

    for (i = beg + 3; i <= end; i++) {
        score[i] += hist[i - 3] * 5;
    }

    return score;
};

var getWaits = function (hist) {
    var count = util.sum(hist),
        i,
        waits = [];
    if (count !== 13) {
        throw new Error("invalid tile count (" + count + ")");
    }
    for (i=vals.id_min; i<=vals.id_max; i++) {
        var hand = hist.slice(0);
        hand[i] += 1;
        if (checkRegularMahjong(hand)) {
            for (var j=0; j<(4 - hist[i]); j++) {
                waits.push(i);
            }
        }
    }
    return waits;
};

var findBestDiscard = function (hist, worst_tiles, roundWind, seatWind) {
    /*
     * score by combination with other tiles
     */
    var score = [
            0,1,2,3,4,3,2,1,0, // central tiles are more valuable
            0,1,2,3,4,3,2,1,0,
            0,1,2,3,4,3,2,1,0,
            -1,-1,-1,-1, // winds
            5,5,5 // honors are more valuable
            //0,0,0,0,0,0,0,0 //bonus
        ],
        i;
    var count = {
        total: 0,
        bamboo: 0,
        circle: 0,
        character: 0
    };

    for (i = vals.id_min; i <= vals.honor_end; i++) {
        count.total += hist[i];
        if (util.isColor(i)) {
            count[util.suit(i)] += hist[i];
        }
    }
    var max_count = count.bamboo;
    if (count.bamboo >= 2) {
        for (i = vals.bamboo_beg; i <= vals.bamboo_end; i++) {
            score[i] += count.bamboo;
        }
    }
    if (count.circle > max_count) max_count = count.circle;
    if (count.circle >= 2) {
        for (i = vals.circle_beg; i <= vals.circle_end; i++) {
            score[i] += count.circle;
        }
    }
    if (count.character > max_count) max_count = count.character;
    if (count.character >= 2) {
        for (i = vals.character_beg; i <= vals.character_end; i++) {
            score[i] += count.character;
        }
    }
    for (i = vals.honor_beg; i <= vals.honor_end; i++) {
        score[i] += count.total - max_count;
    }
    score[roundWind] = 5 + count.total - max_count; // round wind and seat wind are valuable
    score[seatWind] = 5 + count.total - max_count; // round wind and seat wind are valuable
    for (i = vals.id_min; i <= vals.honor_end; i++) {
        var add = 1000 * (hist[i] - 1);
        score[i] += add;
    }

    score = addStreetScore (score, hist, vals.character_beg, vals.character_end);
    score = addStreetScore (score, hist, vals.circle_beg, vals.circle_end);
    score = addStreetScore (score, hist, vals.bamboo_beg, vals.bamboo_end);
    if (worst_tiles) {
        for (i=0; i<worst_tiles.length; i++) {
            score[worst_tiles[i]] -= 1000;
        }
    }

    /*
     * select worst tile
     */
    var bestI = 0;
    var bestV = 1000000;
    for (i = vals.id_min; i <= vals.id_max; i++) {
        if (hist[i] > 0) {
            var v = score[i];
            if (v < bestV) {
                bestV = v;
                bestI = i;
            }
        }
    }
    return {
        discard: bestI,
        score: score
    };
};

var findBestDiscardWait = function (hist) {
    var waits = 0,
        i,
        discard = [];
    for (i=vals.id_min; i<=vals.id_max; i++) {
        if (hist[i] > 0) {
            var hand = hist.slice(0);
            hand[i] -= 1;
            var num_waits = getWaits(hand);
            if (num_waits.length === 0) {
                continue;
            }
            if (num_waits.length === waits) {
                discard.push(i);
            } else if (num_waits.length > waits) {
                waits = num_waits.length;
                discard = [];
                discard.push(i);
            }
        }
    }
    return discard;
};

var main = function (hist) {
    var return_str = '',
        i,
        discard = [],
        best = 10;
    if (util.sum(hist) !== 14) {
        return {
            msg: "must submit 14 tiles (there were " + util.sum(hist) + ")",
            discard: []
        };
        // throw new Error("not enough tiles");
    }

    for (i=vals.id_min; i<= vals.id_max; i++) {
        if (hist[i] > 0) {
            var new_hist = hist.slice(0);
            new_hist[i]--;
            var shanten_number = shanten.shantenGeneralized(new_hist);
            if (shanten_number < best) {
                best = shanten_number;
                discard = [i];
            } else if (shanten_number === best) {
                discard.push(i);
            }
        }
    }

    return {
        msg: return_str,
        discard: discard,
        shanten: best
    };
};

var getDiscard = function(hand, thrown, roundWind, seatWind) {
    var obj = main(hand.slice(0)),
        recommended = findBestDiscard(hand, _.union(thrown, obj.discard), roundWind, seatWind),
        i,
        inter,
        best_waits,
        test_hand,
        shanten_number;
    if (obj.shanten === 0) {
        best_waits = findBestDiscardWait(hand);
        if (best_waits.length > 0) {
            inter = _.intersection(best_waits, [recommended.discard]);
            if (inter.length === 0) {
                test_hand = hand.slice(0);
                test_hand[best_waits[0]] -= 1;
                shanten_number = shanten.shantenGeneralized(test_hand);
                if (shanten_number > 0) {
                    best_waits = [recommended.discard];
                }
            } else {
                best_waits = inter;
            }
        } else {
            best_waits = [recommended.discard];
        }
        //TODO: take the one with the lowest score
        recommended.discard = best_waits[0];
    } else if (obj.shanten === 1) {
        var best_discard = [],
            num_waits = 0;
        for (i=0; i<obj.discard.length; i++) {
            var throw_tile = obj.discard[i];
            var new_hand = hand.slice(0);
            var total_waits = 0;
            new_hand[throw_tile] -= 1;
            for (var j=util.vals.id_min; j<=util.vals.id_max; j++) {
                if (throw_tile === j) {
                    continue;
                }
                var new_full_hand = new_hand.slice(0);
                new_full_hand[j] += 1;
                best_waits = findBestDiscardWait(new_full_hand);
                total_waits += best_waits.length;
            }
            if (total_waits.length === num_waits) {
                if (_.indexOf(best_discard, throw_tile) === -1) {
                    best_discard.push(throw_tile);
                }
            } else if (total_waits.length > num_waits) {
                best_discard = [throw_tile];
                num_waits = total_waits.length;
            }
        }
        if (best_discard.length > 0) {
            inter = _.intersection(best_discard, [recommended.discard]);
            if (inter.length === 0) {
                test_hand = hand.slice(0);
                test_hand[best_discard[0]] -= 1;
                shanten_number = shanten.shantenGeneralized(test_hand);
                if (shanten_number > 1) {
                    best_discard = [recommended.discard];
                }
            }
        } else {
            best_discard = [recommended.discard];
        }
        //TODO: take the one with the lowest score
        recommended.discard = best_discard[0];
    }
    return {
        obj: obj,
        recommended: recommended
    };
};

var isChowAvailable = function(tile1, tile2, tile3) {
    if (tile1 + 1 === tile2 && tile2 + 1 === tile3 && util.suit(tile1) === util.suit(tile2) && util.suit(tile1) === util.suit(tile3) && util.isColor(tile1)) {
        return true;
    }
    return false;
};

var getAvailableMeldsWithRemovedTile = function(prevRemovedTile, hist, isNextSeat, melds, isAIPlayer) {
    var i;
    var newMelds = [];
    var suit = null;

    if (isAIPlayer && melds && melds.length) {
        for (var j = 0; j < melds.length; j++) {
            var t = melds[j].tiles[0];
            if (util.isColor(t)) {
                suit = util.suit(t);
                break;
            }
        }
    }
    var checkSuit = function(tile) {
        if (util.isWind(tile) || util.isDragon(tile)) return true;
        var iSuit = util.suit(tile);
        if (suit) {
            if (suit === iSuit) {
                return true;
            }
        } else if (isAIPlayer) {
            var suitCount = 0;
            var totalCount = 0;
            for(var k = 0; k < hist.length; k++) {
                if (util.isColor(k)) {
                    totalCount += hist[k];
                }
                if (util.suit(k) === iSuit) {
                    suitCount += hist[k];
                }
            }
            if (suitCount + 1 >= totalCount / 2) {
                return true;
            }
        } else {
            return true;
        }
        return false;
    };
    if (isNextSeat) {
        for(i = 0; i < hist.length - 1; i++) {
            var chow = null;
            if (hist[i] > 0 && hist[i + 1] > 0 && isChowAvailable(prevRemovedTile, i, i + 1)) {
                chow = newMeld(actions.chow, [prevRemovedTile, i, i + 1]);
            }
            if (i + 2 < hist.length && hist[i] > 0 && hist[i + 2] && isChowAvailable(i, prevRemovedTile, i + 2)) {
                chow = newMeld(actions.chow, [i, prevRemovedTile, i + 2]);
            }
            if (hist[i] > 0 && hist[i + 1] > 0 && isChowAvailable(i, i + 1, prevRemovedTile)) {
                chow = newMeld(actions.chow, [i, i + 1, prevRemovedTile]);
            }
            if (chow && checkSuit(i)) {
                newMelds.push(chow);
            }
        }
    }

    for (i = 0 ; i < hist.length; i++) {
        //TODO:  hidden Kong
        /*if (hist[i] === 4) {
            melds.push(newMeld(actions.kong, [i, i, i, i]));
        }*/
        var ong1 = null, ong2 = null;
        if (hist[i] >= 2 && i === prevRemovedTile) {
            if (hist[i] === 3) {
                ong1 = newMeld(actions.kong, [prevRemovedTile, prevRemovedTile, prevRemovedTile, prevRemovedTile]);
                ong2 = newMeld(actions.pong, [prevRemovedTile, prevRemovedTile, prevRemovedTile]);
            } else if (hist[i] === 2) {
                ong1 = newMeld(actions.pong, [prevRemovedTile, prevRemovedTile, prevRemovedTile]);
            }
            if(ong1 && checkSuit(i)) {
                newMelds.push(ong1);
                if (ong2) newMelds.push(ong2);
            }
            break;
        }
    }
    return newMelds;
};

var ai = function() {};
_.extend(ai, {
    actions: actions,
    findRegularMahjong: findRegularMahjong,
    getAvailableMeldsWithRemovedTile: getAvailableMeldsWithRemovedTile,
    getDiscard: getDiscard,
    newMeld: newMeld,
    checkSevenPairs: checkSevenPairs
});
module.exports = ai;