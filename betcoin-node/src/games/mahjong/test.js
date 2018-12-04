'use strict';

var assert = require('assert');
var util = require('./src/util');
var mahjong = require('./src/mahjong');
var provable = require('../../lib/provably-fair');
var HTTPError = require('../../lib/http-error');
var GameLogic = require('./src/gamelogic.js')(provable, HTTPError);
/* global describe */
/* global it */

describe('Mahjong game logics', function () {
    var gameLogic = new GameLogic();

    /*describe('init hand', function () {
        it('should deal 13 tiles for each player', function (done) {
            var seats = {
                east: 'Wayne',
                south: 'player',
                west: 'Katat',
                north: 'Ming'
            };
            var res = gameLogic.initHands('cards', seats, 11, 'north');
            assert.equal(13, res.allHands.east.unmeldedTiles.length);
            assert.equal(0, res.allHands.east.bonusTiles.length);
            assert.equal(13, res.allHands.south.unmeldedTiles.length);
            assert.equal(1, res.allHands.south.bonusTiles.length);
            assert.equal(13, res.allHands.west.unmeldedTiles.length);
            assert.equal(0, res.allHands.west.bonusTiles.length);
            assert.equal(13, res.allHands.north.unmeldedTiles.length);
            assert.equal(0, res.allHands.north.bonusTiles.length);
            assert.equal(144, res.allTiles.length);
            assert.equal(91, res.remainingTiles.length);
            assert.equal('player', res.seats.east);
            done();
        });
        it('should deal 13 tiles for each player with dice rolling', function (done) {
            var seats;
            var res = gameLogic.initHands('cards4', seats);
            assert.equal(13, res.allHands.east.unmeldedTiles.length);
            assert.equal(1, res.allHands.east.bonusTiles.length);
            assert.equal(13, res.allHands.north.unmeldedTiles.length);
            assert.equal(1, res.allHands.north.bonusTiles.length);
            assert.equal(13, res.allHands.south.unmeldedTiles.length);
            assert.equal(1, res.allHands.south.bonusTiles.length);
            assert.equal(13, res.allHands.west.unmeldedTiles.length);
            assert.equal(1, res.allHands.west.bonusTiles.length);
            assert.equal(144, res.allTiles.length);
            assert.equal(88, res.remainingTiles.length);
            assert.equal('AI1', res.seats.east);
            assert.equal('player', res.seats.north);
            assert.deepEqual([3, 6, 3], res.dices);
            done();
        });
    });
    describe('dealNewTile', function() {
        it('should deal new non-bonus tile for the player', function (done) {
            var res = gameLogic.initHands('cards1');
            var res1 = gameLogic.dealNewTile(res.allHands,res.remainingTiles, 'east');
            assert.deepEqual(util.index("windwest"), res1.allHands.east.newTile);
            done();
        });
    });
    describe('removeTile', function() {
        it('should remove the tile from the player hand', function (done) {
            var res = gameLogic.initHands('cards1');
            var res1 = gameLogic.dealNewTile(res.allHands, res.remainingTiles, 'east');
            assert.deepEqual(util.index("windwest"), res1.allHands.east.newTile);
            var allHands = gameLogic.removeTile(res1.allHands, 'east', util.index("windwest"));
            assert.equal(null, allHands.east.newTile);
            assert.equal(13, allHands.east.unmeldedTiles.length);
            done();
        });
    });
    describe('getResult', function() {
        it('should play', function(done) {
            var seats;
            var res = gameLogic.initHands('cards1', seats);
            var res1 = gameLogic.getResult(res.allHands, res.remainingTiles, res.seats, res.activeSeat);
            assert.equal(89, res1.remainingTiles.length);
            assert.deepEqual(res.remainingTiles.pop(), res1.allHands.east.newTile);
            assert.deepEqual(res1.availActions, [{type: -10}]);
            var res2 = gameLogic.getResult(res1.allHands, res1.remainingTiles, res.seats, res1.activeSeat, {type: -10}, util.index("character9"), res1.availActions);
            assert.deepEqual(util.index("character9"), res2.allHands.east.removedTiles[0].val);
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: -10}, util.index("bamboo6"));
            assert.deepEqual(util.index("bamboo6"), res2.allHands[res2.activeSeat].removedTiles[0].val);
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat);
            assert.deepEqual(res2.availActions.length, 2); //pong, skip
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: 20, tiles: [util.index("bamboo6"), util.index("bamboo6"), util.index("bamboo6")]}, {}, res2.availActions);
            assert.deepEqual(res2.availActions, [{type: -10}]); //should remove one tile
            assert.equal(res2.allHands.east.melds.length, 1);
            assert.equal(res2.allHands.east.unmeldedTiles.length, 11);
            assert.deepEqual(res2.allHands.south.removedTiles[0], {val: util.index("bamboo6"), stolen: true});
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: -10}, util.index("bamboo4"), res2.availActions);
            assert.deepEqual(res2.allHands.east.removedTiles[1].val, util.index("bamboo4"));
            assert.equal(res2.activeSeat, 'east');
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: -10}, 32);
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: -10}, 1);
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat);
            assert.equal(res2.availActions.length, 2);
            assert.deepEqual(res2.availActions[1], {type: 20, tiles: [util.index("character2"), util.index("character2"), util.index("character2")]});
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: 20, tiles: [util.index("character2"), util.index("character2"), util.index("character2")]}, {}, res2.availActions);
            assert.equal(res2.allHands.east.melds.length, 2);
            assert.equal(res2.allHands.east.unmeldedTiles.length, 8);
            assert.equal(res2.allHands.east.melds[1].type, 20);
            assert.deepEqual(res2.allHands.west.removedTiles[0], {val: util.index("character2"), stolen: true});
            assert.equal(res2.allHands.east.newTile, null);
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: -10}, util.index("circle6"), res2.availActions);
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: -10}, util.index("bamboo5"));
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: -10}, util.index("bamboo9"));
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: -10}, util.index("circle4"));
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat);
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: 10, tiles: [10, 11, 12]}, {}, res2.availActions);
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: -10}, 7, res2.availActions);
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: -10}, 29);
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat);

//            assert.deepEqual(res2.availActions, [{type: 0}, {type: 40, tiles: [1, 'south']}]);
//            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: 40, tiles: [1, 'south']}, {}, res2.availActions);
//            assert.equal(res2.status, 'finished');
//            assert.deepEqual(res2.allHands.south.removedTiles[3], {val:util.index("windwest"), stolen:true});
//            assert.equal(res2.allHands.east.melds.length, 5);
//            assert.equal(res2.allHands.east.unmeldedTiles.length, 0);
//            assert.deepEqual(res2.payout, {winnings: 1, is_win: true, is_push: false, winner: "east", fan: 1, payouts: {east:0, south: 0, west: 0, north: 0}});

            done();
        });
        it('should skip', function(done) {
            var seats;
            var res = gameLogic.initHands('cards1', seats);
            var res1 = gameLogic.getResult(res.allHands, res.remainingTiles, res.seats, res.activeSeat);
            assert.equal(89, res1.remainingTiles.length);
            assert.deepEqual(res.remainingTiles.pop(), res1.allHands.east.newTile);
            assert.deepEqual(res1.availActions, [{type: -10}]);
            var res2 = gameLogic.getResult(res1.allHands, res1.remainingTiles, res.seats, res1.activeSeat, {type: -10}, util.index("character2"), res1.availActions);
            assert.deepEqual(util.index("character2"), res2.allHands.east.removedTiles[0].val);
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: -10}, util.index("bamboo6"));
            assert.deepEqual(util.index("bamboo6"), res2.allHands[res2.activeSeat].removedTiles[0].val);
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat);
            assert.deepEqual(res2.availActions.length, 2); //pong, skip
            res2 = gameLogic.getResult(res2.allHands, res2.remainingTiles, res.seats, res2.activeSeat, {type: 0}, {}, res2.availActions);
            assert.equal(res2.availActions, undefined);
            assert.equal(res2.activeSeat, 'west');

            done();
        });
        it('should throw an exception', function(done) {
            var seats;
            var res = gameLogic.initHands('cards1', seats);
            var res1 = gameLogic.getResult(res.allHands, res.remainingTiles, res.seats, res.activeSeat);
            assert.equal(89, res1.remainingTiles.length);
            assert.deepEqual(res.remainingTiles.pop(), res1.allHands.east.newTile);
            try {
                res1 = gameLogic.getResult(res1.allHands, res1.remainingTiles, res1.seats, res1.activeSeat);
            } catch(e) {
                assert.ok(e);
            }

            done();
        });
    });
    describe('getpayout', function() {
        it('should pay', function (done) {
            var seats;
            var res = gameLogic.initHands('cards1', seats);
            var payout = gameLogic.getPayout(res.seats, 'east', 6, [3]);
            assert.equal(payout.winnings, 12.879999999999999);
            done();
        });
    });
    describe('isWinningHand', function() {
        it ('should true', function(done) {
            var allHands = {
                west: {
                    removedTiles: [{val: util.index('character2')}]
                },
                north: {
                    melds: [
                        {type: 20, tiles: [util.index('dragongreen'), util.index('dragongreen'), util.index('dragongreen')]},
                        {type: 20, tiles: [util.index('windeast'), util.index('windeast'), util.index('windeast')]},
                        {type: 20, tiles: [util.index('dragonred'), util.index('dragonred'), util.index('dragonred')]},
                        {type: 20, tiles: [util.index('character5'), util.index('character5'), util.index('character5')]},
                    ],
                    unmeldedTiles: [util.index('character2')]
                }
            };
            var result = gameLogic.isWinningHand(allHands, 'north', 'west', util.index('character2'), [], 'east', false);
            assert.equal(result.result, true);
            assert.equal(result.fan, 9);
            done();
        });
        it ('should false', function(done) {
            var allHands = {
                west: {
                    removedTiles: [{val: util.index('circle8')}]
                },
                north: {
                    melds: [
                        {type: 20, tiles: [util.index('bamboo6'), util.index('bamboo6'), util.index('bamboo6')]},
                        {type: 20, tiles: [util.index('bamboo5'), util.index('bamboo5'), util.index('bamboo5')]}
                    ],
                    unmeldedTiles: [
                        util.index('circle3'),
                        util.index('circle3'),
                        util.index('circle8'),
                        util.index('circle8'),
                        util.index('circle8'),
                        util.index('dragonred'),
                        util.index('dragonred')]
                }
            };
            var result = gameLogic.isWinningHand(allHands, 'north', 'west', util.index('circle8'), [], 'south', false);
            assert.equal(result.result, false);
            done();
        });
        it ('should false', function(done) {
            var allHands = {
                north: {
                    removedTiles: [{val: util.index('bamboo7')}]
                },
                east: {
                    melds: [
                        {type: 10, tiles: [util.index('character3'), util.index('character4'), util.index('character5')]},
                        {type: 10, tiles: [util.index('circle6'), util.index('circle7'), util.index('circle8')]},
                        {type: 30, tiles: [util.index('windnorth'), util.index('windnorth'), util.index('windnorth'), util.index('windnorth')]},
                        {type: 20, tiles: [util.index('character2'), util.index('character2'), util.index('character2')]}
                    ],
                    unmeldedTiles: [
                        util.index('bamboo7')]
                }
            };
            var result = gameLogic.isWinningHand(allHands, 'east', 'north', util.index('bamboo7'), [], 'east', false);
            assert.equal(result.result, false);
            done();
        });
    });*/

    describe('house edge', function() {
         it ('play one million games', function(done) {
             var counts = {
                 'east': 0,
                 'south': 0,
                 'west': 0,
                 'north': 0,
                 'push': 0
             };

             var client_seed = "1796114150";
             var previousSeats, prevHandNumber, prevWinner;
             for (var i = 0; i < 10; i++) {
                 var server_seed = provable.getRandomSeed();
                 //var server_seed = 'c4a74a4e725a5fabd5a1c04087240b51';
                 console.log(client_seed + server_seed);
                 var result = gameLogic.initHands(client_seed + server_seed, previousSeats, prevHandNumber, prevWinner);
                 var handNumber = result.handNumber;
                 //result.seats[result.playerSeat] = 'AI5';
                 var seats = result.seats;
                 var playerSeat = result.playerSeat;
                 while(result.status !== 'finished') {
                     if (result.availActions && result.availActions.length > 0) {
                         var j = result.availActions.length - 1;
                         var actionTiles;
                         if (result.availActions[j].type === -10) {
                             actionTiles = result.allHands[playerSeat].unmeldedTiles[0];
                         } else if (result.availActions[j].tiles) {
                             actionTiles = result.availActions[j].tiles;
                         }
                         result = gameLogic.getResult(result.allHands, result.remainingTiles, seats, result.activeSeat, result.availActions[j], actionTiles, result.availActions, handNumber);
                     } else {
                         result = gameLogic.getResult(result.allHands, result.remainingTiles, seats, result.activeSeat, undefined, undefined, undefined, handNumber);
                     }
                 }
                 if (result.payout.winner) {
                     counts[result.payout.winner]++;
                 } else {
                     counts.push++;
                 }
                 console.log(playerSeat);
                 console.log(counts);
             }
             //{ east: 748, south: 718, west: 674, north: 640, push: 422 }
             //0.21705 = 695 / 3202
             done();
         });
    });
});

describe('mahjong ai', function () {
    var gameLogic = new GameLogic();
    describe('getDiscard', function() {
        it('shoudl return recommended discard', function(done) {
            var res = gameLogic.initHands('cards1');
            var res1 = gameLogic.getResult(res.allHands, res.remainingTiles, res.seats, res.activeSeat);
            assert.equal(89, res1.remainingTiles.length);
            assert.deepEqual(res.remainingTiles.pop(), res1.allHands.east.newTile);

            var result = mahjong.getDiscard(util.hist(gameLogic.getHandTiles(res1.allHands.east)), gameLogic.getRemovedTiles(res1.allHands.east));
            assert.equal(result.recommended.discard, 29);
            done();
        });
    });
});
