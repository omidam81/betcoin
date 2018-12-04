'use strict';
var assert = require('assert');
var GameLogic = require('../src/container/gamelogic');

describe('Pai Gow Tiles game logics', function () {
    var gameLogic = new GameLogic();

    var equal = function(tile1, tile2) {
        if (tile1.red===tile2.red && tile1.white===tile2.white) {
            return true;
        }
        return false;
    };
    describe('Hand:', function () {
        describe('split', function () {
            var res = gameLogic.initHands('cards');
            it('should split to 2 groups(highhand, lowhand)', function (done) {
                res.playerHand.split([0, 1]);
                assert.equal(2, res.playerHand.highhand.tiles.length);
                assert.equal(true, equal(res.playerHand.lowhand.tiles[0], res.playerHand.tiles[0]));
                assert.equal(true, equal(res.playerHand.lowhand.tiles[1], res.playerHand.tiles[1]));
                assert.equal(2, res.playerHand.lowhand.tiles.length);
                assert.equal(true, equal(res.playerHand.highhand.tiles[0],res.playerHand.tiles[2]));
                assert.equal(true, equal(res.playerHand.highhand.tiles[1], res.playerHand.tiles[3]));
                done();
            });
        });
        describe('count', function () {
            var objs = [{red:2, white:0},{red:6, white:6}, {red:6, white:6}, {red:2, white:0}];
            var hand = gameLogic.getHand(objs);
            it('should split to 2 groups(highhand, lowhand)', function (done) {
                assert.equal(2, hand.count(gameLogic.getTile({red:2, white:0})));
                assert.equal(2, hand.count(gameLogic.getTile({red:6, white:6})));
                done();
            });
        });
        describe('countPoint', function () {
            var objs = [{red:2, white:0}, {red:6, white:6}, {red:6, white:6}, {red:2, white:0}];
            var hand = gameLogic.getHand(objs);
            it('should split to 2 groups(highhand, lowhand)', function (done) {
                assert.equal(2, hand.countPoint(2));
                assert.equal(2, hand.countPoint(2));
                done();
            });
        });
        describe('filterPoint', function () {
            var objs = [{red:2, white:0}, {red:0, white:11}, {red:6, white:6}, {red:4, white:2}];
            var hand = gameLogic.getHand(objs);
            var res = hand.filterPoints([2, 12]);

            it('should filter tiles with specified point out, and return a sorted array', function (done) {
                assert.equal(3, res[0]);
                assert.equal(1, res[1]);
                done();
            });
        });
        describe('houseWayBalance', function () {
            it('should split to 8/8', function (done) {
                var objs = [{red:1, white:2}, {red:0, white:4}, {red:1, white:3}, {red:5, white:0}];
                var hand = gameLogic.getHand(objs);
                hand.houseWayBalance();
                assert.equal(8, hand.highhand.point());
                assert.equal(8, hand.lowhand.point());
                done();
            });
            it('should split to 5+6/4+5', function (done) {
                var objs = [{red:1, white:3}, {red:1, white:5}, {red:0, white:5}, {red:5, white:0}];
                var hand = gameLogic.getHand(objs);
                hand.houseWayBalance();
                assert.equal(9, hand.highhand.point());
                assert.equal(1, hand.lowhand.point());
                done();
            });
            it('should split to 5+6/7+8', function (done) {
                var objs = [{red:0, white:6}, {red:0, white:5}, {red:1, white:6}, {red:0, white:8}];
                var hand = gameLogic.getHand(objs);
                hand.houseWayBalance();
                assert.equal(5, hand.highhand.point());
                assert.equal(1, hand.lowhand.point());
                done();
            });
        });
        it('should record points', function (done) {
            var objs = [{red:2, white:0}, {red:6, white:6}, {red:6, white:6}, {red:2, white:0}];
            var hand = gameLogic.getHand(objs);
                assert.equal(2, hand.point2);
                assert.equal(2, hand.point12);
            done();
        });
        describe('compare matching or no-matching pairs', function () {
            it('should be able to compare pair based on paigow tiles pair rank order', function(done){
                //the pairs are ranked in this order, it is not ordered by the sum score.
                var pairs = [
                    [{red:1, white:2}, {red:4, white:2}],
                    [{red:6, white:6}, {red:6, white:6}],
                    [{red:2, white:0}, {red:2, white:0}],
                    [{red:8, white:0}, {red:8, white:0}],
                    [{red:1, white:3}, {red:1, white:3}],
                    [{red:0, white:10}, {red:0, white:10}],
                    [{red:0, white:6}, {red:0, white:6}],
                    [{red:0, white:4}, {red:0, white:4}],
                    [{red:0, white:11}, {red:0, white:11}],
                    [{red:4, white:6}, {red:4, white:6}],
                    [{red:1, white:6}, {red:1, white:6}],
                    [{red:1, white:5}, {red:1, white:5}],
                    [{red:4, white:5}, {red:0, white:9}],
                    [{red:0, white:8}, {red:0, white:8}],
                    [{red:4, white:3}, {red:0, white:7}],
                    [{red:0, white:5}, {red:5, white:0}]
                ];
                for(var i=0; i<pairs.length-1; i++){
                    var groupOne = gameLogic.getGroup(pairs[i]);
                    var groupTwo = gameLogic.getGroup(pairs[i+1]);
                    groupOne.analyze();
                    groupTwo.analyze();
                    assert.equal(1, groupOne.compare(groupTwo));
                }
                done();
            });
        });
        describe('houseWay', function () {
            describe('rule a', function () {
                it('should split by 1/3 1/3 pairs ', function (done) {
                    var hand = gameLogic.getHand([{red:1, white:3}, {red:1, white:3},
                                                  {red:6, white:6}, {red:0, white:6}]);
                    hand.houseWay();
                    assert.equal(2, hand.highhand.tiles.length);
                    assert.equal(true, equal(hand.highhand.tiles[0], gameLogic.getTile({red:1, white:3})));
                    assert.equal(true, equal(hand.highhand.tiles[1], gameLogic.getTile({red:1, white:3})));
                    assert.equal(2, hand.lowhand.tiles.length);
                    assert.equal(true, equal(hand.lowhand.tiles[0], gameLogic.getTile({red:6, white:6})));
                    assert.equal(true, equal(hand.lowhand.tiles[1], gameLogic.getTile({red:0, white:6})));
                    done();
                });
                it('should split by 0/4 0/4 pairs ', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:4}, {red:0, white:4},
                                                  {red:6, white:6}, {red:0, white:6}]);
                    hand.houseWay();
                    assert.equal(2, hand.highhand.tiles.length);
                    assert.equal(true, equal(hand.highhand.tiles[0], gameLogic.getTile({red:0, white:4})));
                    assert.equal(true, equal(hand.highhand.tiles[1], gameLogic.getTile({red:0, white:4})));
                    assert.equal(2, hand.lowhand.tiles.length);
                    assert.equal(true, equal(hand.lowhand.tiles[0], gameLogic.getTile({red:6, white:6})));
                    assert.equal(true, equal(hand.lowhand.tiles[1], gameLogic.getTile({red:0, white:6})));
                    done();
                });
                it('should split by 0/6 0/6 pairs ', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:6}, {red:0, white:6},
                                                  {red:6, white:6}, {red:2, white:0}]);
                    hand.houseWay();
                    assert.equal(2, hand.highhand.tiles.length);
                    assert.equal(true, equal(hand.highhand.tiles[0], gameLogic.getTile({red:0, white:6})));
                    assert.equal(true, equal(hand.highhand.tiles[1], gameLogic.getTile({red:0, white:6})));
                    assert.equal(2, hand.lowhand.tiles.length);
                    assert.equal(true, equal(hand.lowhand.tiles[0], gameLogic.getTile({red:6, white:6})));
                    assert.equal(true, equal(hand.lowhand.tiles[1], gameLogic.getTile({red:2, white:0})));
                    done();
                });
                it('should split by 1/5 1/5 pairs ', function (done) {
                    var hand = gameLogic.getHand([{red:1, white:5}, {red:1, white:5},
                                                  {red:6, white:6}, {red:2, white:0}]);
                    hand.houseWay();
                    assert.equal(2, hand.highhand.tiles.length);
                    assert.equal(true, equal(hand.highhand.tiles[0], gameLogic.getTile({red:1, white:5})));
                    assert.equal(true, equal(hand.highhand.tiles[1], gameLogic.getTile({red:1, white:5})));
                    assert.equal(2, hand.lowhand.tiles.length);
                    assert.equal(true, equal(hand.lowhand.tiles[0], gameLogic.getTile({red:6, white:6})));
                    assert.equal(true, equal(hand.lowhand.tiles[1], gameLogic.getTile({red:2, white:0})));
                    done();
                });
                it('should split by 0/10 0/10 pairs ', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:10}, {red:0, white:10},
                                                  {red:6, white:6}, {red:2, white:0}]);
                    hand.houseWay();
                    assert.equal(2, hand.highhand.tiles.length);
                    assert.equal(true, equal(hand.highhand.tiles[0], gameLogic.getTile({red:0, white:10})));
                    assert.equal(true, equal(hand.highhand.tiles[1], gameLogic.getTile({red:0, white:10})));
                    assert.equal(2, hand.lowhand.tiles.length);
                    assert.equal(true, equal(hand.lowhand.tiles[0], gameLogic.getTile({red:6, white:6})));
                    assert.equal(true, equal(hand.lowhand.tiles[1], gameLogic.getTile({red:2, white:0})));
                    done();
                });
                it('should split by 4/6 4/6 pairs ', function (done) {
                    var hand = gameLogic.getHand([{red:4, white:6}, {red:4, white:6},
                                                  {red:6, white:6}, {red:2, white:0}]);
                    hand.houseWay();
                    assert.equal(2, hand.highhand.tiles.length);
                    assert.equal(true, equal(hand.highhand.tiles[0], gameLogic.getTile({red:4, white:6})));
                    assert.equal(true, equal(hand.highhand.tiles[1], gameLogic.getTile({red:4, white:6})));
                    assert.equal(2, hand.lowhand.tiles.length);
                    assert.equal(true, equal(hand.lowhand.tiles[0], gameLogic.getTile({red:6, white:6})));
                    assert.equal(true, equal(hand.lowhand.tiles[1], gameLogic.getTile({red:2, white:0})));
                    done();
                });
                it('should split by 0/11 0/11 pairs ', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:11}, {red:0, white:11},
                                                  {red:6, white:6}, {red:2, white:0}]);
                    hand.houseWay();
                    assert.equal(2, hand.highhand.tiles.length);
                    assert.equal(true, equal(hand.highhand.tiles[0], gameLogic.getTile({red:0, white:11})));
                    assert.equal(true, equal(hand.highhand.tiles[1], gameLogic.getTile({red:0, white:11})));
                    assert.equal(2, hand.lowhand.tiles.length);
                    assert.equal(true, equal(hand.lowhand.tiles[0], gameLogic.getTile({red:6, white:6})));
                    assert.equal(true, equal(hand.lowhand.tiles[1], gameLogic.getTile({red:2, white:0})));
                    done();
                });
                it('should split by 5/0 0/5 pairs ', function (done) {
                    var hand = gameLogic.getHand([{red:5, white:0}, {red:0, white:5},
                                                  {red:6, white:6}, {red:2, white:0}]);
                    hand.houseWay();
                    assert.equal(2, hand.highhand.tiles.length);
                    assert.equal(true, equal(hand.highhand.tiles[0], gameLogic.getTile({red:5, white:0})));
                    assert.equal(true, equal(hand.highhand.tiles[1], gameLogic.getTile({red:0, white:5})));
                    assert.equal(2, hand.lowhand.tiles.length);
                    assert.equal(true, equal(hand.lowhand.tiles[0], gameLogic.getTile({red:6, white:6})));
                    assert.equal(true, equal(hand.lowhand.tiles[1], gameLogic.getTile({red:2, white:0})));
                    done();
                });
            });
            describe('rule b', function () {
                it('should split Gee Joon and 4(0/4)/6(1/5) by rule b', function (done) {
                    var hand = gameLogic.getHand([{red:1, white:5}, {red:0, white:4},
                                                  {red:1, white:2}, {red:4, white:2}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:1, white:5}));
                    assert.equal(true, hand.highhand.hasTile({red:4, white:2}));
                    assert.equal(true, hand.lowhand.hasTile({red:1, white:2}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:4}));
                    done();
                });
                it('should split Gee Joon and 4(0/4)/6(0/6) by rule b', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:6}, {red:0, white:4},
                                                  {red:1, white:2}, {red:4, white:2}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:0, white:6}));
                    assert.equal(true, hand.highhand.hasTile({red:4, white:2}));
                    assert.equal(true, hand.lowhand.hasTile({red:1, white:2}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:4}));
                    done();
                });
                it('should split Gee Joon and 4(1/3)/6(1/5) by rule b', function (done) {
                    var hand = gameLogic.getHand([{red:1, white:5}, {red:1, white:3},
                                                  {red:1, white:2}, {red:4, white:2}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:1, white:5}));
                    assert.equal(true, hand.highhand.hasTile({red:4, white:2}));
                    assert.equal(true, hand.lowhand.hasTile({red:1, white:2}));
                    assert.equal(true, hand.lowhand.hasTile({red:1, white:3}));
                    done();
                });
                it('should split Gee Joon and 4(1/3)/6(0/6) by rule b', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:6}, {red:1, white:3},
                                                  {red:1, white:2}, {red:4, white:2}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:0, white:6}));
                    assert.equal(true, hand.highhand.hasTile({red:4, white:2}));
                    assert.equal(true, hand.lowhand.hasTile({red:1, white:2}));
                    assert.equal(true, hand.lowhand.hasTile({red:1, white:3}));
                    done();
                });
                it('should split Gee Joon and 5(5/0)/6(1/5) by rule b', function (done) {
                    var hand = gameLogic.getHand([{red:1, white:5}, {red:5, white:0},
                                                  {red:1, white:2}, {red:4, white:2}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:1, white:5}));
                    assert.equal(true, hand.highhand.hasTile({red:4, white:2}));
                    assert.equal(true, hand.lowhand.hasTile({red:1, white:2}));
                    assert.equal(true, hand.lowhand.hasTile({red:5, white:0}));
                    done();
                });
                it('should split Gee Joon and 5(5/0)/6(0/6) by rule b', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:6}, {red:5, white:0},
                                                  {red:1, white:2}, {red:4, white:2}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:0, white:6}));
                    assert.equal(true, hand.highhand.hasTile({red:4, white:2}));
                    assert.equal(true, hand.lowhand.hasTile({red:1, white:2}));
                    assert.equal(true, hand.lowhand.hasTile({red:5, white:0}));
                    done();
                });
                it('should split Gee Joon and 6(0/6)/6(1/5) by rule b', function (done) {
                    var hand = gameLogic.getHand([{red:1, white:5}, {red:0, white:6},
                                                  {red:1, white:2}, {red:4, white:2}]);
                    hand.houseWay();
                    assert.equal(true, hand.lowhand.hasTile({red:1, white:5}));
                    assert.equal(true, hand.lowhand.hasTile({red:4, white:2}));
                    assert.equal(true, hand.highhand.hasTile({red:1, white:2}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:6}));
                    done();
                });
            });
            describe('rule c', function () {
                it('should split 2s and 4(0/4)/6(1/5) by rule c', function (done) {
                    var hand = gameLogic.getHand([{red:1, white:5}, {red:2, white:0},
                                                  {red:2, white:0}, {red:0, white:4}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:1, white:5}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:4}));
                    done();
                });
                it('should split 2s and 9(0/9)/11(0/11) by rule c', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:9}, {red:2, white:0},
                                                  {red:2, white:0}, {red:0, white:11}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:0, white:9}));
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:11}));
                    done();
                });
                it('should split 12s and 4(1/3)/6(0/6) by rule c', function (done) {
                    var hand = gameLogic.getHand([{red:1, white:3}, {red:6, white:6},
                                                  {red:6, white:6}, {red:0, white:6}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:1, white:3}));
                    done();
                });
                it('should split 12s and 9(0/9)/11(0/11) by rule c', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:9}, {red:6, white:6},
                                                  {red:6, white:6}, {red:0, white:11}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:9}));
                    assert.equal(true, hand.lowhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:11}));
                    done();
                });
            });
            describe('rule d', function () {
                it('should split 9s and 10(4/6)/10(0/10) by rule d', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:9}, {red:4, white:6},
                                                  {red:4, white:5}, {red:0, white:10}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(9));
                    assert.equal(true, hand.highhand.hasPoint(10));
                    assert.equal(true, hand.lowhand.hasPoint(10));
                    assert.equal(true, hand.lowhand.hasPoint(9));
                    done();
                });
                it('should split 9s and 2(2/0)/10(4/6) by rule d', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:9}, {red:4, white:6},
                                                  {red:4, white:5}, {red:2, white:0}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(9));
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:4, white:6}));
                    assert.equal(true, hand.lowhand.hasPoint(9));
                    done();
                });
                it('should split 9s and 2(2/0)/10(0/10) by rule d', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:9}, {red:0, white:10},
                                                  {red:4, white:5}, {red:2, white:0}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(9));
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:10}));
                    assert.equal(true, hand.lowhand.hasPoint(9));
                    done();
                });
                it('should split 9s and 12(6/6)/10(4/6) by rule d', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:9}, {red:4, white:6},
                                                  {red:4, white:5}, {red:6, white:6}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(9));
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:4, white:6}));
                    assert.equal(true, hand.lowhand.hasPoint(9));
                    done();
                });
                it('should split 9s and 12(6/6)/10(0/10) by rule d', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:9}, {red:0, white:10},
                                                  {red:4, white:5}, {red:6, white:6}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(9));
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:10}));
                    assert.equal(true, hand.lowhand.hasPoint(9));
                    done();
                });
                it('should split 9s and 12(6/6)/2(2/0) by rule d', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:9}, {red:2, white:0},
                                                  {red:4, white:5}, {red:6, white:6}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(9));
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasPoint(9));
                    done();
                });
            });
            describe('rule e', function () {
                it('should split 8s and 9(0/9)/11(0/11) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:8}, {red:0, white:9},
                                                  {red:0, white:8}, {red:0, white:11}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:11}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:9}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    done();
                });
                it('should split 8s and 10(0/10)/10(4/6) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:8}, {red:0, white:10},
                                                  {red:0, white:8}, {red:4, white:6}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(8));
                    assert.equal(true, hand.highhand.hasPoint(10));
                    assert.equal(true, hand.lowhand.hasPoint(10));
                    assert.equal(true, hand.lowhand.hasPoint(8));
                    done();
                });
                it('should split 8s and 10(4/6)/11(0/11) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:8}, {red:4, white:6},
                                                  {red:0, white:8}, {red:0, white:11}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:11}));
                    assert.equal(true, hand.lowhand.hasTile({red:4, white:6}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    done();
                });
                it('should split 8s and 10(0/10)/11(0/11) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:8}, {red:0, white:10},
                                                  {red:0, white:8}, {red:0, white:11}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:11}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:10}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    done();
                });
                it('should split 8s and 2(2/0)/10(4/6) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:8}, {red:4, white:6},
                                                  {red:0, white:8}, {red:2, white:0}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:4, white:6}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    done();
                });
                it('should split 8s and 2(2/0)/10(0/10) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:8}, {red:0, white:10},
                                                  {red:0, white:8}, {red:2, white:0}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:10}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    done();
                });
                it('should split 8s and 12(6/6)/10(0/10) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:8}, {red:0, white:10},
                                                  {red:0, white:8}, {red:6, white:6}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:10}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    done();
                });
                it('should split 8s and 2(2/0)/10(4/6) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:8}, {red:4, white:6},
                                                  {red:0, white:8}, {red:6, white:6}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:4, white:6}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    done();
                });
                it('should split 8s and 2(2/0)/11(0/11) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:8}, {red:2, white:0},
                                                  {red:0, white:8}, {red:0, white:11}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:11}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    done();
                });
                it('should split 8s and 12(6/6)/11(0/11) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:8}, {red:6, white:6},
                                                  {red:0, white:8}, {red:0, white:11}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:11}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:8}));
                    done();
                });

                it('should split red 8s and 9(0/9)/11(0/11) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:8, white:0}, {red:0, white:9},
                                                  {red:8, white:0}, {red:0, white:11}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:11}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:9}));
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    done();
                });
                it('should split red 8s and 10(0/10)/10(4/6) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:8, white:0}, {red:0, white:10},
                                                  {red:8, white:0}, {red:4, white:6}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    assert.equal(true, hand.highhand.hasPoint(10));
                    assert.equal(true, hand.lowhand.hasPoint(10));
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    done();
                });
                it('should split red 8s and 10(4/6)/11(0/11) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:8, white:0}, {red:4, white:6},
                                                  {red:8, white:0}, {red:0, white:11}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:11}));
                    assert.equal(true, hand.lowhand.hasTile({red:4, white:6}));
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    done();
                });
                it('should split red 8s and 10(0/10)/11(0/11) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:8, white:0}, {red:0, white:10},
                                                  {red:8, white:0}, {red:0, white:11}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    assert.equal(true, hand.highhand.hasTile({red:0, white:11}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:10}));
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    done();
                });
                it('should split red 8s and 2(2/0)/10(4/6) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:8, white:0}, {red:4, white:6},
                                                  {red:8, white:0}, {red:2, white:0}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:4, white:6}));
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    done();
                });
                it('should split red 8s and 2(2/0)/10(0/10) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:8, white:0}, {red:0, white:10},
                                                  {red:8, white:0}, {red:2, white:0}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:10}));
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    done();
                });
                it('should split red 8s and 12(6/6)/10(0/10) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:8, white:0}, {red:0, white:10},
                                                  {red:8, white:0}, {red:6, white:6}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:10}));
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    done();
                });
                it('should split red 8s and 2(2/0)/10(4/6) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:8, white:0}, {red:4, white:6},
                                                  {red:8, white:0}, {red:6, white:6}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:4, white:6}));
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    done();
                });
                it('should split red 8s and 2(2/0)/11(0/11) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:8, white:0}, {red:2, white:0},
                                                  {red:8, white:0}, {red:0, white:11}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:11}));
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    done();
                });
                it('should split red 8s and 12(6/6)/11(0/11) by rule e', function (done) {
                    var hand = gameLogic.getHand([{red:8, white:0}, {red:6, white:6},
                                                  {red:8, white:0}, {red:0, white:11}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:11}));
                    assert.equal(true, hand.highhand.hasTile({red:8, white:0}));
                    done();
                });


            });
            describe('rule f', function () {
                it('should split 7s and 2(2/0)/10(4/6) by rule f', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:7}, {red:2, white:0},
                                                  {red:4, white:3}, {red:4, white:6}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(7));
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:4, white:6}));
                    assert.equal(true, hand.lowhand.hasPoint(7));
                    done();
                });
                it('should split 7s and 2(2/0)/10(0/10) by rule f', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:7}, {red:2, white:0},
                                                  {red:4, white:3}, {red:0, white:10}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(7));
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:10}));
                    assert.equal(true, hand.lowhand.hasPoint(7));
                    done();
                });
                it('should split 7s and 2(2/0)/11(0/11) by rule f', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:7}, {red:2, white:0},
                                                  {red:4, white:3}, {red:0, white:11}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(7));
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:11}));
                    assert.equal(true, hand.lowhand.hasPoint(7));
                    done();
                });
                it('should split 7s and 12(6/6)/10(0/10) by rule f', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:7}, {red:6, white:6},
                                                  {red:4, white:3}, {red:0, white:10}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(7));
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:10}));
                    assert.equal(true, hand.lowhand.hasPoint(7));
                    done();
                });
                it('should split 7s and 12(6/6)/10(4/6) by rule f', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:7}, {red:6, white:6},
                                                  {red:4, white:3}, {red:4, white:6}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(7));
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:4, white:6}));
                    assert.equal(true, hand.lowhand.hasPoint(7));
                    done();
                });
                it('should split 7s and 12(6/6)/11(0/11) by rule f', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:7}, {red:6, white:6},
                                                  {red:4, white:3}, {red:0, white:11}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(7));
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    assert.equal(true, hand.lowhand.hasTile({red:0, white:11}));
                    assert.equal(true, hand.lowhand.hasPoint(7));
                    done();
                });
                it('should split 7s and 12(6/6)/2(2/0) by rule f', function (done) {
                    var hand = gameLogic.getHand([{red:0, white:7}, {red:6, white:6},
                                                  {red:4, white:3}, {red:2, white:0}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(7));
                    assert.equal(true, hand.highhand.hasTile({red:6, white:6}));
                    // assert.equal(true, hand.lowhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasPoint(7));
                    done();
                });
                it('should split 7s(1/6) and 2(2/0)/10(4/6) by rule f', function (done) {
                    var hand = gameLogic.getHand([{red:1, white:6}, {red:2, white:0},
                                                  {red:1, white:6}, {red:4, white:6}]);
                    hand.houseWay();
                    assert.equal(true, hand.highhand.hasPoint(7));
                    assert.equal(true, hand.highhand.hasTile({red:2, white:0}));
                    assert.equal(true, hand.lowhand.hasTile({red:4, white:6}));
                    assert.equal(true, hand.lowhand.hasPoint(7));
                    done();
                });
            });
        });
    });
    describe('Gamelogic:', function () {
        describe('init hand', function () {
            var res = gameLogic.initHands('cards');
            it('should deal 4 cards for each player', function (done) {
                assert.equal(4, res.playerHand.tiles.length);
                assert.equal(4, res.dealerHand.tiles.length);
                done();
            });
        });
    });
    describe('getResult', function () {
        it('should return game result', function(done) {
            var hands = gameLogic.initHands('cards');
            var result = gameLogic.getResult({
                playerHand: hands.playerHand,
                dealerHand: hands.dealerHand,
                split: [1,2],
                wager: 0,
                houseWay: false
            });
            //assert.equal(true, result);
            done();
        });
        it('should return houseway result', function(done) {
            var playerHand = {
                tiles: [
                    {red: 8, white: 0, point: 8},
                    {red: 0, white: 5, point: 5},
                    {red: 2, white: 0, point: 2},
                    {red: 4, white: 6, point: 10}
                ]
            };
            var dealerHand = {
                tiles: [
                    {red: 1, white: 3, point: 4},
                    {red: 1, white: 5, point: 6},
                    {red: 0, white: 11, point: 11},
                    {red: 1, white: 3, point: 4}
                ]
            };

            var result = gameLogic.getResult({
                playerHand: playerHand,
                dealerHand: dealerHand,
                split: [],
                wager: 0,
                houseWay: true
            });
            assert.equal(2, result.playerHand.highhand.tiles.length);
            assert.equal(2, result.playerHand.lowhand.tiles.length);
            assert.equal(2, result.dealerHand.lowhand.tiles.length);
            assert.equal(2, result.dealerHand.lowhand.tiles.length);
            done();
        });
        it('should return houseway result', function(done) {
            var playerHand = {
                tiles: [
                    {red: 4, white: 2},
                    {red: 0, white: 10},
                    {red: 4, white: 5},
                    {red: 4, white: 6}
                ]
            };
            var dealerHand = {
                tiles: [
                    {red: 0, white: 4},
                    {red: 4, white: 6},
                    {red: 6, white: 6},
                    {red: 0, white: 7}
                ]
            };

            var result = gameLogic.getResult({
                playerHand: playerHand,
                dealerHand: dealerHand,
                split: [],
                wager: 0,
                houseWay: true
            });

            done();
        });
        it('should return houseway result', function(done) {
            var playerHand = {
                tiles: [
                    {red: 5, white: 0},
                    {red: 0, white: 11},
                    {red: 0, white: 9},
                    {red: 0, white: 8}
                ]
            };
            var dealerHand = {
                tiles: [
                    {red: 0, white: 4},
                    {red: 0, white: 10},
                    {red: 1, white: 2},
                    {red: 2, white: 0}
                ]
            };

            var result = gameLogic.getResult({
                playerHand: playerHand,
                dealerHand: dealerHand,
                split: [0,1],
                wager: 0,
                houseWay: false
            });
            assert.equal(true,result.playerHand.highhand.hasTile({red:0, white:9}));
            assert.equal(true,result.playerHand.highhand.hasTile({red:0, white:8}));
            assert.equal(false, result.isWin);
            assert.equal(true, result.isPush);

            done();
        });
        it('should return split result', function(done) {
            var playerHand = {
                tiles: [
                    {red: 4, white: 2},
                    {red: 1, white: 3},
                    {red: 6, white: 6},
                    {red: 8, white: 0}
                ]
            };
            var dealerHand = {
                tiles: [
                    {red: 0, white: 11},
                    {red: 2, white: 0},
                    {red: 0, white: 8},
                    {red: 0, white: 8}
                ]
            };

            var result = gameLogic.getResult({
                playerHand: playerHand,
                dealerHand: dealerHand,
                split: [0,1],
                wager: 0,
                houseWay: false
            });

            assert.equal(true,result.playerHand.lowhand.hasTile({red:4, white:2}));
            assert.equal(true,result.playerHand.lowhand.hasTile({red:1, white:3}));
            assert.equal(7, result.playerHand.lowhand.point());

            done();
        });
        it('should return houseway result', function(done) {
            var playerHand = {
                tiles: [
                    {red: 1, white: 3},
                    {red: 0, white: 6},
                    {red: 0, white: 10},
                    {red: 0, white: 4}
                ]
            };
            var dealerHand = {
                tiles: [
                    {red: 4, white: 6},
                    {red: 0, white: 11},
                    {red: 0, white: 11},
                    {red: 6, white: 6}
                ]
            };

            var result = gameLogic.getResult({
                playerHand: playerHand,
                dealerHand: dealerHand,
                split: [],
                wager: 0,
                houseWay: true
            });
            assert.equal(2, result.playerHand.highhand.tiles.length);
            assert.equal(2, result.playerHand.lowhand.tiles.length);
            assert.equal(2, result.dealerHand.highhand.tiles.length);
            assert.equal(2, result.dealerHand.lowhand.tiles.length);
            done();
        });
        it('should return houseway result', function(done) {
            var playerHand = {
                tiles: [
                    {red: 0, white: 6},
                    {red: 0, white: 8},
                    {red: 8, white: 0},
                    {red: 8, white: 0}
                ]
            };
            var dealerHand = {
                tiles: [
                    {red: 1, white: 5},
                    {red: 4, white: 2},
                    {red: 0, white: 5},
                    {red: 4, white: 3}
                ]
            };

            var result = gameLogic.getResult({
                playerHand: playerHand,
                dealerHand: dealerHand,
                split: [],
                wager: 0,
                houseWay: true
            });
            assert.equal(2, result.playerHand.highhand.tiles.length);
            assert.equal(2, result.playerHand.lowhand.tiles.length);
            assert.equal(2, result.dealerHand.highhand.tiles.length);
            assert.equal(2, result.dealerHand.lowhand.tiles.length);
            done();
        });
        it('should return houseway result', function(done) {
            var playerHand = {
                tiles: [
                    {red: 4, white: 3},
                    {red: 8, white: 0},
                    {red: 4, white: 5},
                    {red: 0, white: 7}
                ]
            };
            var dealerHand = {
                tiles: [
                    {red: 0, white: 11},
                    {red: 0, white: 5},
                    {red: 8, white: 0},
                    {red: 0, white: 8}
                ]
            };

            var result = gameLogic.getResult({
                playerHand: playerHand,
                dealerHand: dealerHand,
                split: [],
                wager: 0,
                houseWay: true
            });
            assert.equal(true, result.isWin);
            assert.equal(2, result.playerHand.highhand.tiles.length);
            assert.equal(2, result.playerHand.lowhand.tiles.length);
            assert.equal(2, result.dealerHand.highhand.tiles.length);
            assert.equal(2, result.dealerHand.lowhand.tiles.length);
            done();
        });
        it('should return houseway result', function(done) {
            var playerHand = gameLogic.getHand([
                    {red: 0, white: 5},
                    {red: 1, white: 5},
                    {red: 4, white: 2},
                    {red: 0, white: 4}
                ]);
            playerHand.houseWay();

            assert.equal(true, playerHand.highhand.hasTile({red:4, white:2}));
            assert.equal(true, playerHand.highhand.hasTile({red:1, white:5}));
            assert.equal(true, playerHand.lowhand.hasTile({red:0, white:5}));
            assert.equal(true, playerHand.lowhand.hasTile({red:0, white:4}));

            done();
        });
    });
});
