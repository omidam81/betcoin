'use strict';

var assert = require('assert');
var GameLogic = require('../src/container/gamelogic');
var GameModel = require('../src/models/game');
require('bitcoin-math');

/* global describe */
/* global it */
/* global beforeEach */

describe('faro model test', function () {
    var PlayerInterface = function () {};
    PlayerInterface.prototype.verifyToken = function(player_id, token, callback) {
    	callback(false, true);
    };
    PlayerInterface.prototype.debit = function(player_id, token, ref, callback) {
    	callback(false, []);
    };
    var logger = function () {};
    logger.prototype.debug = function(debug_string, primary, player_alias, player_id) {
    	console.log('Debug: ' + debug_string);
    };
    var modelStore = function () {};

    var gameLogic = new GameLogic();
    var gameModel = new GameModel(modelStore, gameLogic, new PlayerInterface, new logger)

    describe('start new game', function () {
        var params, cb;
        beforeEach(function (done) {
		    gameModel.save = function () {
		    	return gameModel.done();
		    }
			done();
        });
        it('play game', function (done) {
        	params = {
				client_seed: "9582763052",
				game_id: "5425004e812c691000000010",
				player_id: "54185f8cd1e5d510001bdfe6",
				wager: 0
		    };
		    cb = function (error, gameResult) {
		    	var result = gameResult.attrs.result;
		    	assert.equal(result.previousCards.length, 1);
		    	assert.equal(result.remainingCards.length, 51);
		    };
		    gameModel.play(params, cb);
		    done();
        });
        it('next action', function (done) {
        	params = {
				game_status: 'gaming',
				client_seed: "9582763052",
				game_id: "5425004e812c691000000010",
				player_id: "54185f8cd1e5d510001bdfe6",
				all_bets: {
					flatBets : [{rank:'3', suit:'S', wager:0}],
		            splitBets : [{ranks: ['5', '6'], wager:0}, {ranks: ['8', '9'], wager:0}],
		            turnBets : [],
		            highBet : 1,
		            evenBet : 1,
		            oddBet : 1,
				},
				wager: 0
		    };
		    cb = function (error, gameResult) {
		    	var result = gameResult.attrs.result;
		    	assert.equal(result.previousCards.length,3);
		    	assert.equal(result.remainingCards.length, 49);
		    	assert.equal(result.highBet, 0);
		    	assert.equal(result.evenBet, 0);
		    	assert.equal(result.oddBet, 0);
		    };
		    gameModel.nextAction(params, cb);
		    done();
        });
        it('finish game', function (done) {
        	params = {
				game_status: 'finish',
				client_seed: "9582763052",
				game_id: "5425004e812c691000000010",
				player_id: "54185f8cd1e5d510001bdfe6",
				all_bets: {
					flatBets : [{rank:'3', suit:'S', wager:0}],
		            splitBets : [{ranks: ['5', '6'], wager:0}, {ranks: ['8', '9'], wager:0}],
		            turnBets : [],
		            highBet : 1,
		            evenBet : 1,
		            oddBet : 1,
				},
				wager: 0
		    };
		    cb = function (error, gameResult) {
		    	var result = gameResult.attrs;
		    	assert.equal(result.status, 'finished');
		    };
		    gameModel.nextAction(params, cb);
		    done();
        });
    });
});

