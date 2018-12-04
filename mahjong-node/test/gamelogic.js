'use strict';
var assert = require('assert');
var GameLogic = require('../src/container/gamelogic');

describe('Mahjong game logics', function () {
    var gameLogic = new GameLogic();

    var equal = function(tile1, tile2) {
        return (tile1.suit === tile2.suit && tile1.rank ===tile2.rank);
    };
    describe('init hand', function () {
        it('should deal 13 tiles for each player', function (done) {
            var seats = {
                east: 'Ming',
                south: 'player',
                west: 'Katat',
                north: 'Vince'
            };
            var res = gameLogic.initHands('cards', seats);
            assert.equal(13, res.playersHand.east.unmeldedTiles.length);
            assert.equal(0, res.playersHand.east.bonusTiles.length);
            assert.equal(13, res.playersHand.south.unmeldedTiles.length);
            assert.equal(1, res.playersHand.south.bonusTiles.length);
            assert.equal(13, res.playersHand.west.unmeldedTiles.length);
            assert.equal(0, res.playersHand.west.bonusTiles.length);
            assert.equal(13, res.playersHand.north.unmeldedTiles.length);
            assert.equal(0, res.playersHand.north.bonusTiles.length);
            assert.equal(144, res.allTiles.length);
            assert.equal(91, res.remainingTiles.length);
            assert.equal('player', res.seats.east);
            done();
        });
        it('should deal 13 tiles for each player with dice rolling', function (done) {
            var seats;
            var res = gameLogic.initHands('cards1', seats);
            assert.equal(13, res.playersHand.east.unmeldedTiles.length);
            assert.equal(1, res.playersHand.east.bonusTiles.length);
            assert.equal(13, res.playersHand.north.unmeldedTiles.length);
            assert.equal(1, res.playersHand.north.bonusTiles.length);
            assert.equal(13, res.playersHand.south.unmeldedTiles.length);
            assert.equal(0, res.playersHand.south.bonusTiles.length);
            assert.equal(13, res.playersHand.west.unmeldedTiles.length);
            assert.equal(0, res.playersHand.west.bonusTiles.length);
            assert.equal(144, res.allTiles.length);
            assert.equal(90, res.remainingTiles.length);
            assert.equal('player', res.seats.east);
            assert.deepEqual([1, 2, 2], res.dices);
            done();
        });
    });
    describe('dealNewTile', function() {
        it('should deal new non-bonus tile for the player', function (done) {
            var res = gameLogic.initHands('cards1');
            var res1 = gameLogic.dealNewTile(res.playersHand,res.remainingTiles, 'east');
            assert.deepEqual({suit: "character", rank: 8}, res1.playersHand.east.newTile);
            done();
        });
    });
    describe('removeTile', function() {
        it('should remove the tile from the player hand', function (done) {
            var res = gameLogic.initHands('cards1');
            var res1 = gameLogic.dealNewTile(res.playersHand, res.remainingTiles, 'east');
            assert.deepEqual({suit: "character", rank: 8}, res1.playersHand.east.newTile);
            var playersHand = gameLogic.removeTile(res1.playersHand, 'east', {suit: 'bamboo', rank: 7});
            assert.equal(null, playersHand.east.newTile);
            assert.equal(13, playersHand.east.unmeldedTiles.length);
            done();
        });
    });


});
