'use strict';

var provable = require('../../../lib/provably-fair');

var g_rankOrder = {
    pair: {rank : 1},
    wong: {rank : 2},
    gong: {rank : 3},
    nothing: {rank : 4}
};

var unshuffledTiles = [
    // Wong
    {red: 2, white: 0, rank: 2},
    {red: 2, white: 0, rank: 2},
    {red: 1, white: 3, rank: 4},
    {red: 1, white: 3, rank: 4},
    {red: 0, white: 4, rank: 7},
    {red: 0, white: 4, rank: 7},
    {red: 1, white: 5, rank: 11},
    {red: 1, white: 5, rank: 11},
    {red: 1, white: 6, rank: 10},
    {red: 1, white: 6, rank: 10},
    {red: 8, white: 0, rank: 3},
    {red: 8, white: 0, rank: 3},
    {red: 0, white: 6, rank: 6},
    {red: 0, white: 6, rank: 6},
    {red: 4, white: 6, rank: 9},
    {red: 4, white: 6, rank: 9},
    {red: 0, white: 10, rank: 5},
    {red: 0, white: 10, rank: 5},
    {red: 0, white: 11, rank: 8},
    {red: 0, white: 11, rank: 8},
    {red: 6, white: 6, rank: 1},
    {red: 6, white: 6, rank: 1},
    // Gong
    {red: 4, white: 5, rank: 12},
    {red: 0, white: 9, rank: 12},
    {red: 0, white: 8, other: true, rank: 13}, // XXX: actually, it's white 8, 3 + 5
    {red: 0, white: 8, rank: 13}, // XXX: actually, it's another kind of white 8, 2 + 6
    {red: 4, white: 3, rank: 14},
    {red: 0, white: 7, rank: 14},
    {red: 5, white: 0, rank: 15},
    {red: 0, white: 5, rank: 15},
    // Gee Joon
    {red: 4, white: 2, rank: 16}, //Lowest individual rank, highest in pair rank
    {red: 1, white: 2, rank: 16}
];

var equal = function(tile1, tile2) {
    if (tile1.red===tile2.red && tile1.white===tile2.white) {
        return true;
    }
    return false;
};

var Tile = function(obj) {
    var tileSelf = this;
    this.red = obj.red;
    this.white = obj.white;
    if (obj.other) {
        this.other = obj.other;
    }
    this.rank = function() {
        for (var i = 0; i < unshuffledTiles.length; i++) {
            if (equal(tileSelf, unshuffledTiles[i])) {
                return unshuffledTiles[i].rank;
            }
        }
        return 0;
    };
    this.point = function() {
        return tileSelf.red + tileSelf.white;
    };
};

var Group = function(tiles) {
    this.hasTile = function(tile) {
        return this.indexOf(tile) >= 0;
    };
    this.indexOf = function(tile) {
        for(var t = 0; t < this.tiles.length; t++) {
            if(equal(tile, this.tiles[t])) {
                return t;
            }
        }
        return -1;
    };
    this.lastIndexOf = function(tile) {
        for(var t = this.tiles.length - 1; t >= 0; t--) {
            if(equal(tile, this.tiles[t])) {
                return t;
            }
        }
        return -1;
    };
    this.count = function(tile) {
        var cnt = 0;
        for(var t = 0; t < this.tiles.length; t++) {
            if(equal(tile, this.tiles[t])) {
                cnt += 1;
            }
        }
        return cnt;
    };
    this.hasPoint = function(point) {
        return this.countPoint(point) > 0;
    };
    this.countPoint = function(point) {
        var cnt = 0;
        for(var t = 0; t < this.tiles.length; t++) {
            if(this.tiles[t].point() === point) {
                cnt += 1;
            }
        }
        return cnt;
    };

    this.point = function() {
        var point = 0, option = 0;
        for(var i = 0; i < tiles.length; i++) {
            point += tiles[i].point();
        }
        if (this.hasTile({red:1, white: 2})) {
            option = point + 3;
        }
        if (this.hasTile({red:4, white: 2})) {
            option = point - 3;
        }

        point = point % 10;
        option = option % 10;

        return point>option?point:option;
    };

    this.analyzePair = function() {
        if (this.hasTile({red:1, white:2}) && this.hasTile({red:4, white:2})) {
            return 1;
        } else if (this.countPoint(12) === 2) {
            return 2;
        } else if (this.countPoint(2) === 2) {
            return 3;
        } else if (this.count({red:8, white:0}) === 2) {
            return 4;
        } else if (this.count({red:1, white:3}) === 2) {
            return 5;
        } else if (this.count({red:0, white:10}) === 2) {
            return 6;
        } else if (this.count({red:0, white:6}) === 2) {
            return 7;
        } else if (this.count({red:0, white:4}) === 2) {
            return 8;
        } else if (this.countPoint(11) === 2) {
            return 9;
        } else if (this.count({red:4, white:6}) === 2) {
            return 10;
        } else if (this.count({red:1, white:6}) === 2) {
            return 11;
        } else if (this.count({red:1, white:5}) === 2) {
            return 12;
        } else if (this.hasTile({red:4, white:5}) && this.hasTile({red:0, white:9})) {
            return 13;
        } else if (this.countPoint(8) === 2 && !this.hasTile({red:8, white:0})) {
            return 14;
        } else if (this.hasTile({red:4, white:3}) && this.hasTile({red:0, white:7})) {
            return 15;
        } else if (this.hasTile({red:5, white:0}) && this.hasTile({red:0, white:5})) {
            return 16;
        }
        return 0; //no pair
    };

    /**
     * Analyze tiles group and calculate rank
     * rank | g_rankOrder
     */
    this.analyze = function() {
        var pairValue = this.analyzePair();
        if (pairValue > 0) { //pair
            this.rank = g_rankOrder.pair.rank;
            this.subRank = pairValue;
        } else if (this.hasPoint(12) && this.hasPoint(9)) {
            this.rank = g_rankOrder.wong.rank; //Wong
        } else if (this.hasPoint(2) && this.hasPoint(9)) {
            this.rank = g_rankOrder.wong.rank; //Wong
        } else if (this.hasPoint(12) && this.hasPoint(8)) {
            this.rank = g_rankOrder.gong.rank; //Gong
        } else if (this.hasPoint(2) && this.hasPoint(8)) {
            this.rank = g_rankOrder.gong.rank; //Gong
        } else if (this.hasPoint(12) && this.hasPoint(7)) {
            this.rank = g_rankOrder.nothing.rank;
        } else if (this.hasPoint(2) && this.hasPoint(7)) {
            this.rank = g_rankOrder.nothing.rank;
        } else {
            this.rank = g_rankOrder.nothing.rank;
        }
        this.points = this.point();
    };

    /**
     * Checks if this obj wins param hand
     * @param hand
     * @returns {number} | 1 : Win, 0: Push, -1 : Lose
     */
    this.compare = function(hand) {
        this.analyze();
        hand.analyze();

        var selfHighest, otherHighest;
        if (this.rank < hand.rank) {
            return 1;
        } else if (this.rank === hand.rank && this.rank === g_rankOrder.pair.rank) {
            if (this.subRank < hand.subRank) {
                return 1;
            } else {
                return -1;
            }
        } else if (this.rank === hand.rank && this.rank !== g_rankOrder.nothing.rank) {
            selfHighest = this.highest();
            otherHighest = hand.highest();
            if (selfHighest.rank() < otherHighest.rank()) {
                return 1;
            } else if (selfHighest.rank() === otherHighest.rank()) {
                return 0;
            }
            else {
                return -1;
            }
        } else if (this.rank === hand.rank && this.rank === g_rankOrder.nothing.rank) {
            if (this.point() > hand.point()) {
                return 1;
            } else if (this.point() === hand.point() && this.point() === 0) {
                return 0;
            } else if (this.point() === hand.point() && this.point() !== 0) {
                selfHighest = this.highest();
                otherHighest = hand.highest();
                if (selfHighest.rank() < otherHighest.rank()) {
                    return 1;
                } else if (selfHighest.rank() === otherHighest.rank()) {
                    return 0;
                }
                else {
                    return -1;
                }
            } else {
                return -1;
            }
        }
        return -1;
    };
    this.highest = function() {
        var tIndex = -1, highestRank = 20;
        for(var t = 0; t < this.tiles.length; t++) {
            if (this.tiles[t].rank() < highestRank) {
                highestRank = this.tiles[t].rank;
                tIndex = t;
            }
        }
        return new Tile(this.tiles[tIndex]);
    };

    this.tiles = tiles;
};
var Hand = function(objs) {
    var tiles = [];
    for(var i = 0; i < objs.length; i++) {
        tiles.push(new Tile(objs[i]));
    }
    this.tiles = tiles;
    // record points
    for(i = 0; i < tiles.length; i++) {
        if (this['point' + tiles[i].point()]) {
            this['point' + tiles[i].point()] += 1;
        } else {
            this['point' + tiles[i].point()] = 1;
        }
    }

    this.count = function(tile) {
        var cnt = 0;
        for(var t = 0; t < this.tiles.length; t++) {
            if(equal(tile, this.tiles[t])) {
                cnt += 1;
            }
        }
        return cnt;
    };
    this.indexOf = function(tile) {
        for(var t = 0; t < this.tiles.length; t++) {
            if(equal(tile, this.tiles[t])) {
                return t;
            }
        }
        return -1;
    };
    this.lastIndexOf = function(tile) {
        for(var t = this.tiles.length - 1; t >= 0; t--) {
            if(equal(tile, this.tiles[t])) {
                return t;
            }
        }
        return -1;
    };
    this.countPoint = function(point) {
        var cnt = 0;
        for(var t = 0; t < this.tiles.length; t++) {
            if(this.tiles[t].point() === point) {
                cnt += 1;
            }
        }
        return cnt;
    };
    this.getPoint = function(point, notThis) {
        if (notThis >= 0) {
            notThis = notThis;
        } else {
            notThis = -1;
        }
        for(var t = 0; t < this.tiles.length; t++) {
            if (notThis !== t) {
                if (this.tiles[t].point() === point) {
                    return t;
                }
            }
        }
        return -1;
    };
    this.filterPoints = function(arr) {
        var tiles = [];
        var self1 = this;
        for(var i = 0; i < this.tiles.length; i++) {
            if (arr.indexOf(this.tiles[i].point()) === -1) {
                tiles.push(i);
            }
        }
        // sort by point, asc
        tiles.sort(function(x, y) {
            if (self1.tiles[x].point() > self1.tiles[y].point()) {
                return 1;
            }
            return -1;
        });
        return tiles;
    };
    this.hasTile = function(tile) {
        return this.indexOf(tile) >= 0;
    };

    this.houseWay = function() {
        // rules reference: http://wizardofodds.com/games/pai-gow-tiles/house-way/taj-mahal/
        var remainTiles;
        var tile1, tile2;

        // Pair
        // a
        var pairtiles = [new Tile({red:1, white:3}), new Tile({red:0, white:4}), new Tile({red:1, white:5}),
            new Tile({red:0, white:10}), new Tile({red:4, white:6}), new Tile({red:0, white:6}),
            new Tile({red:0, white:11})];
        for(var i = 0; i < pairtiles.length; i++) {
            tile1 = this.indexOf(pairtiles[i]);
            tile2 = this.lastIndexOf(pairtiles[i]);
            if (tile1 !== -1 && tile2 !== -1 && tile1 !== tile2) {
                this.split([tile1, tile2]);
                return;
            }
        }
        var red5 = new Tile({red:5, white:0});
        var white5 = new Tile({red:0, white:5});

        tile1 = this.indexOf(red5);
        tile2 = this.indexOf(white5);
        if (tile1 !== -1 && tile2 !== -1) {
            this.split([tile1, tile2]);
            return;
        }

        //b
        var geeJoon3 = new Tile({red:1, white:2});
        var geeJoon6 = new Tile({red:4, white:2});
        var count3 = this.count(geeJoon3);
        tile1 = this.indexOf(geeJoon6);
        if (count3 > 0 && tile1 >= 0) {
            if (this.point6 === 3 || (this.point6 ===2 && // 2 * 6 + geeJoon6, 1 * 6 + geeJoon6
                (this.point4 === 1 || this.point5 === 1))) {
                tile2 = this.getPoint(6, tile1);
                if (tile2 !== -1) {
                    this.split([tile1, tile2]);
                    return;
                }
            }
        }

        //c
        var count9 = this.countPoint(9);
        var count11 = this.countPoint(11);
        var count12 = this.countPoint(12);
        var count2 = this.countPoint(2);
        if (count2 === 2 || count12 === 2) {

            //Unwritten Rule
            tile1 = this.indexOf({red: 1, white: 3});
            tile2 = this.indexOf({red: 2, white: 4});
            if (count12 === 2 && tile1 >= 0 && tile2 >= 0) {
                this.split([tile1, tile2]);
                return;
            }
            if (count9 === 1 && count11 === 1) {
                this.split([this.getPoint(2) !== -1?this.getPoint(2):this.getPoint(12), this.getPoint(9)]);
                return;
            }
            tile1 = this.indexOf({red: 0, white: 4});
            tile2 = this.indexOf({red: 1, white: 5});
            if (count2 === 2 && tile1 >= 0 && tile2 >= 0) {
                this.split([tile1, tile2]);
                return;
            }
            tile1 = this.indexOf({red: 1, white: 3});
            tile2 = this.indexOf({red: 0, white: 6});
            if (count12 === 2 && tile1 >= 0 && tile2 >= 0) {
                this.split([tile1, tile2]);
                return;
            }
        }

        //d
        var count10 = this.countPoint(10);
        if (count9 === 2 &&  count10 + count2 + count12 === 2) {
            remainTiles = this.filterPoints([9]);
            tile1 = this.indexOf({red:4, white:5});
            if (count10 && count2) {
                this.split([tile1, remainTiles[0]]); // 10 and 2, item 0 is smaller one, is point 2
                return;
            }
            if (count10 === 2) {
                tile2 = this.indexOf({red: 0, white: 10});
                this.split([tile1, tile2]);
                return;
            }
            this.split([tile1, remainTiles[1]]); // bigger one in highhand
            return;
        }

        //e
        var count8 = this.countPoint(8);
        if(count8 === 2) {
            remainTiles = this.filterPoints([8]);
            if (count9 === 1 && count11 === 1) {
                this.split([this.getPoint(8), remainTiles[1]]); // item 1 is point 11
                return;
            }
            if (count2 + count10 + count11 + count12 === 2) {
                if (count2 > 0) {
                    this.split([this.getPoint(8), remainTiles[0]]); // item 0 is point 2
                    return;
                }
                this.split([this.getPoint(8), remainTiles[1]]); // item 1 is bigger one
                return;
            }
        }

        //f
        var count7 = this.countPoint(7);
        if (count7 === 2 && count2 + count12 > 0) {
            if (count2 + count10 + count11 + count12 === 2) {
                this.split([this.getPoint(7), this.getPoint(12) >= 0?this.getPoint(12):this.getPoint(2)]);
                return;
            }
        }

        // XXX: may be it's the implict default rule if no matched exception rule above
        // default rule of  pair
        // pure
        pairtiles = [
            {red:6, white:6},
            {red:2, white:0},
            {red:8, white:0},
            {red:1, white:6},
            {red:0, white:8}
        ];
        for(i = 0; i < pairtiles.length; i++) {
            tile1 = this.indexOf(pairtiles[i]);
            tile2 = this.lastIndexOf(pairtiles[i]);
            if (tile1 >= 0 && tile2 >= 0 && tile1 !== tile2) {
                this.split([tile1, tile2]);
                return;
            }
        }
        // mixed
        tile1 = this.indexOf({red:1, white:2});
        tile2 = this.indexOf({red:2, white:4});
        if (tile1 >= 0 && tile2 >= 0) {
            this.split([tile1, tile2]);
            return;
        }
        // 9
        tile1 = this.indexOf({red:4, white:5});
        tile2 = this.indexOf({red:0, white:9});
        if (tile1 >= 0 && tile2 >= 0) {
            this.split([tile1, tile2]);
            return;
        }
        // 7
        tile1 = this.indexOf({red:4, white:3});
        tile2 = this.indexOf({red:0, white:7});
        if (tile1 >= 0 && tile2 >= 0) {
            this.split([tile1, tile2]);
            return;
        }

        // Wong, Gong, and High Nine Rules
        // exception of exception
        if (count8 > 0 && count9 > 0 && this.hasTile({red:0, white:4}) && count2 + count12 > 0) {
            this.split([this.getPoint(8), this.getPoint(12) >= 0?this.getPoint(12):this.getPoint(2)]);
            return;
        }

        // high nine
        tile1 = this.indexOf({red:0, white:7});
        if (count2 + count12 > 0 && tile1 >= 0) {
            this.split([tile1, this.getPoint(12) >= 0?this.getPoint(12):this.getPoint(2)]);
            return;
        }
        tile1 = this.indexOf({red:1, white:6});
        if (count2 + count12 > 0 && tile1 >= 0) {
            this.split([tile1, this.getPoint(12) >= 0?this.getPoint(12):this.getPoint(2)]);
            return;
        }
        tile1 = this.indexOf({red:4, white:3});
        if (count2 + count12 > 0 && tile1 >= 0) {
            this.split([tile1, this.getPoint(12) >= 0?this.getPoint(12):this.getPoint(2)]);
            return;
        }
        // gong
        if (count2 + count12 > 0 && count8 > 0) {
            this.split([this.getPoint(8), this.getPoint(12) >= 0?this.getPoint(12):this.getPoint(2)]);
            return;
        }
        // wong
        if (count2 + count12 > 0 && count9 > 0) {
            this.split([this.getPoint(9), this.getPoint(12) >= 0?this.getPoint(12):this.getPoint(2)]);
            return;
        }

        // Two Small Tiles Rule
        var count4 = this.countPoint(4);
        var count5 = this.countPoint(5);
        var count6 = this.countPoint(6);

        // exception a
        if (count2 > 0 && count12 > 0 && (count3 + count4 + count5 + count6 > 0) && (count11 + count10 > 0 )) {
            if (count4 > 0) {
                if (count10 > 0) {
                    this.split([this.getPoint(12), this.getPoint(2)]);
                    return;
                }
                if (count11 > 0) {
                    this.split([this.getPoint(4), this.getPoint(11)]);
                    return;
                }
            }
            if (count5 > 0 && count10) {
                this.split([this.getPoint(5), this.getPoint(10)]);
                return;
            }
            if (count3 && count10 + count11 > 0) {
                this.split([this.getPoint(3), this.getPoint(10) >= 0?this.getPoint(10):this.getPoint(11)]);
                return;
            }
            if (count6 > 0 && count10 + count11 > 0) {
                this.split([this.getPoint(6), this.getPoint(10) >= 0?this.getPoint(10):this.getPoint(11)]);
                return;
            }
        }
        // exception b
        if (count2 + count12 > 0 && count4 > 0 && count5 > 0 && count11 > 0) {
            this.split([this.getPoint(4), this.getPoint(2) >= 0?this.getPoint(2):this.getPoint(12)]);
            return;
        }
        // exception c
        if (count2 > 0 && count12 > 0) {
            if (count4 > 0 && count5) {
                this.split([this.getPoint(2), this.getPoint(5)]);
                return;
            }
            if (count4 > 0 && (count6 > 0 || count3)) {
                this.split([this.getPoint(2), this.getPoint(6) >= 0?this.getPoint(6):this.getPoint(3)]);
                return;
            }
            if (count10 > 0 && count11 > 0) {
                this.split([this.getPoint(2), this.getPoint(11)]);
                return;
            }
        }

        // regular rule of Two Small Tiles Rule
        if (count3 + count4 + count5 + count6 >= 2) {
            if (count4 + count5 >= 2) {
                tile1 = this.getPoint(4);
                tile2 = this.getPoint(5);
                if (count4 >= 2) {
                    this.split([tile1, this.getPoint(4, tile1)]);
                } else if (count5 >= 2) {
                    this.split([tile2, this.getPoint(5, tile1)]);
                } else {
                    this.split([tile1, tile2]);
                }
                return;
            }
            tile1 = this.indexOf({red:1, white:2});
            if (tile1 < 0) {
                tile1 = this.indexOf({red: 4, white: 2});
            }
            if (tile1 >= 0) {
                tile2 = this.getPoint(4);
                if (tile2 >= 0) {
                    this.split([tile1, tile2]);
                    return;
                }
                tile2 = this.getPoint(5);
                if (tile2 >= 0) {
                    this.split([tile1, tile2]);
                    return;
                }
            }
        }

        // Balancing Rule
        // exception a
        if (count3 === 1 && count5 === 1 && this.count4 === 2) {
            this.split([this.getPoint(4), this.getPoint(5)]);
            return;
        }
        // exception b
        if (count9 === 1 && count5 === 1 && this.count4 === 2) {
            this.split([this.getPoint(4), this.getPoint(5)]);
            return;
        }
        // exception c
        if ((count6 + count7 === 1 || this.hasTile({red:0, white:8})) && count5 === 1 && this.count4 === 2) {
            this.split([this.getPoint(4), this.getPoint(5)]);
            return;
        }
        // exception d
        if (count4 + count5 > 0 && count3 === 1 && this.count6 === 2) {
            this.split([this.getPoint(3), this.getPoint(6)]);
            return;
        }
        // exception e
        if (count4 + count5 + count3 > 0 && count11 === 1 && this.count6 === 2) {
            this.split([this.getPoint(6), this.getPoint(11) >= 0?this.getPoint(11):this.getPoint(3)]);
            return;
        }
        // exception f
        if (count2 + count12 > 0 && count4 + count5 > 0 && count11 === 1 && this.count6 === 2) {
            this.split([this.getPoint(6), this.getPoint(12) >= 0?this.getPoint(12):this.getPoint(2)]);
            return;
        }
        // exception g
        tile1 = this.indexOf({red:8, white:0});
        if (this.hasTile({red:1, white:3}) && this.count8 === 2 && tile1 >= 0) {
            this.split([tile1, this.filterPoints([8, 4])[0]]);
            return;
        }
        // exception h
        if (this.hasTile({red:0, white:6}) && this.count8 === 2 && count7 > 0 &&
            tile1 >= 0) {
            this.split([tile1, this.getPoint(7)]);
            return;
        }
        // exception i
        if (count11 > 0 && this.count10 === 2 && count6 + count7 + count8 + count9 > 0) {
            this.split([this.getPoint(11), this.filterPoints([10, 11])[0]]);
            return;
        }
        // exception j
        tile1 = this.indexOf({red:0, white:10});
        if (this.hasTile({red:0, white:6}) > 0 && this.count10 === 2 &&
            (count7 + count9 > 0 || this.hasTile({red:0, white:8}))) {
            this.split([tile1, this.filterPoints([10, 6])[0]]);
            return;
        }
        // exception k
        if (this.count10 === 2 && count9 > 0 && this.hasTile({red:0, white:8})) {
            this.split([tile1, this.getPoint(9)]);
            return;
        }
        // exception l
        tile1 = this.indexOf({red:1, white:5});
        if (count7 > 0 && count3 > 0 && tile1 >= 0) {
            this.split([tile1, this.getPoint(3)]);
            return;
        }
        // exception m
        tile1 = this.indexOf({red:8, white:0});
        if (count11 > 0 && tile1 >= 0 &&
            this.hasTile({red:0, white:10}) &&
            (count6 + count7 > 0 || tile1 >= 0)) {
            this.split([tile1, this.getPoint(11)]);
            return;
        }
        // exception n
        if (count11 > 0 && tile1 >= 0 &&
            this.hasTile({red:4, white:6}) &&
            (count7 > 0 || this.hasTile({red:0, white:8}))) {
            this.split([tile1, this.getPoint(11)]);
            return;
        }
        // regular rule of Balancing Rule
        this.houseWayBalance();
    };
    this.houseWayBalance = function() {
        var g = 0, diff = 7, total = 0, biggest = 0, g_other = 0, biggest_other = 0;

        for(var i = 0; i < this.tiles.length - 1; i++) {
            for(var j = i + 1; j < this.tiles.length; j++) {
                var temp = this.tiles.slice();
                temp.splice(j, 1);
                temp.splice(i, 1);
                var g1 = new Group([this.tiles[i], this.tiles[j]]);
                var g2 = new Group(temp);

                if (biggest === 0 ) {
                    biggest = g1;
                    biggest_other = g2;
                }
                if (g1.point() > biggest.point()) {
                    biggest = g1;
                    biggest_other = g2;
                }
                if (g2.point() > biggest.point()) {
                    biggest = g2;
                    biggest_other = g1;
                }
                // exception
                if (g1.point() + g2.point() > total && (g1.point() > 6 || g2.point() > 6)) {
                    total = g1.point() + g2.point();
                    if (g1.point() > g2.point()) {
                        g = g1;
                        g_other = g2;
                        diff = g1.point() - g2.point();
                    } else {
                        g = g2;
                        g_other = g1;
                        diff = g2.point() - g1.point();
                    }
                    continue;
                }
                // balancing
                if (g1.point() > g2.point() && g1.point() - g2.point() < diff && g1.point() + g2.point() >= total) {
                    g = g1;
                    g_other = g2;
                    diff = g1.point() - g2.point();
                    total = g1.point() + g2.point();
                }
                if (g1.point() <= g2.point() && g2.point() - g1.point() < diff && g1.point() + g2.point() >= total) {
                    g = g2;
                    g_other = g1;
                    diff = g2.point() - g1.point();
                    total = g1.point() + g2.point();
                }
            }
        }

        var tile1, tile2, g_tile1, g_tile2;
        tile1 = this.indexOf(biggest.tiles[0]);
        tile2 = this.lastIndexOf(biggest.tiles[1]);
        g_tile1 = this.indexOf(g.tiles[0]);
        g_tile2 = this.lastIndexOf(g.tiles[1]);

        if (g && g.point() > 4) {
            if (biggest.point() > g.point() && biggest_other.point() > g_other.point()) {
                g_tile1 = tile1;
                g_tile2 = tile2;
            }
            this.split([g_tile1, g_tile2]);
        } else {
            this.split([tile1, tile2]);
        }
    };
    this.split = function(arr) {
        var highhand = [];
        var lowhand = [];
        var tiles = this.tiles.slice();
        for(var i = 0; i < tiles.length; i++) {
            if (arr.indexOf(i) !== -1) {
                highhand.push(tiles[i]);
            } else {
                lowhand.push(tiles[i]);
            }
        }
        this.highhand = new Group(highhand);
        this.lowhand = new Group(lowhand);
        if (this.highhand.compare(this.lowhand) < 0) {
            //Swap
            lowhand = this.highhand;
            this.highhand = this.lowhand;
            this.lowhand = lowhand;
        }
    };
    this.compare = function(hand, selfIsDealer) {
        var highhandres = this.highhand.compare(hand.highhand);
        var lowhandres = this.lowhand.compare(hand.lowhand);

        //If the high tile does not break the tie then the win will go to the banker.
        //A 0-0 tie always goes to the banker.
        if (selfIsDealer) {
            if (highhandres === 0) {
                highhandres = 1;
            }
            if (lowhandres === 0) {
                lowhandres = 1;
            }
        } else {
            if (highhandres === 0) {
                highhandres = -1;
            }
            if (lowhandres === 0) {
                lowhandres = -1;
            }
        }
        if (highhandres > 0) {
            this.highhand.is_win = true;
            this.highhand.is_push = false;
        } else {
            this.highhand.is_win = false;
            this.highhand.is_push = false;
        }
        if (lowhandres > 0) {
            this.lowhand.is_win = true;
            this.lowhand.is_push = false;
        } else {
            this.lowhand.is_win = false;
            this.lowhand.is_push = false;
        }
        switch(highhandres + lowhandres) {
            case 2: // win, win
                return 1;
            case 0: // win, lose
                return 0;
            case -2: // lose, lose
                return -1;
        }
        return 0;
    };
};

var GameLogic = function() {
};

GameLogic.prototype.getShuffledTiles = function(seed, tiles) {
    return provable.seededShuffle(seed, tiles);
};

GameLogic.prototype.initHands = function(seed) {
    var self = this;
    var tiles = self.getShuffledTiles(seed, unshuffledTiles);
    var allTiles = tiles.slice();
    var playerTiles = [];
    var dealerTiles = [];
    //deal 4 tiles
    for(var i=0;i<4;i++){
        playerTiles.push(tiles.pop());
        dealerTiles.push(tiles.pop());
    }
    return {
        playerHand: new Hand(playerTiles),
        dealerHand: new Hand(dealerTiles),
        allTiles: allTiles
    };
};

/**
 * Returns payout
 * @param wager
 * @param result | compare result
 * @returns {number}
 */
GameLogic.prototype.getPayout = function(wager, result) {
    var payout = 0;
    if(result === 1){
        payout = 2 * wager - wager * 0.05; //commission = 5%
    } else if(result === 0){
        payout = wager;
    }
    return payout;
};

GameLogic.prototype.getResult = function(params) {
    var playerHand = new Hand(params.playerHand.tiles);
    var dealerHand = new Hand(params.dealerHand.tiles);
    var wager = params.wager;

    var houseWay = params.houseWay;
    if (houseWay) {
        playerHand.houseWay();
        dealerHand.houseWay();
    } else {
        playerHand.split(params.split);
        dealerHand.houseWay();
    }

    var result = playerHand.compare(dealerHand);
    var payout = this.getPayout(wager, result);

    return {
        playerHand: playerHand,
        dealerHand: dealerHand,
        payout: payout,
        isWin: result === 1,
        isPush: result === 0
    };
};
// for unit test
GameLogic.prototype.getHand = function(objs) {
    return new Hand(objs);
};
GameLogic.prototype.getTile = function(obj) {
    return new Tile(obj);
};
GameLogic.prototype.getGroup = function(objs) {
    var tiles = [];
    for(var i = 0; i < objs.length; i++) {
        tiles.push(new Tile(objs[i]));
    }
    return new Group(tiles);
};

module.exports = GameLogic;
