'use strict';

var GameLogic = require('./src/gamelogic');
var provable = require('../../lib/provably-fair');

/* global describe */
/* global it */

describe('videopoker game logic', function () {
    var gameLogic = new GameLogic();
    describe('run one million test', function() {
        it('should not crash', function (done) {
            var client_seed = "1796114150";
            for (var i = 0; i < 100; i++) {
                var server_seed = provable.getRandomSeed();
                //var server_seed = "9044846a68f29e866c223643525f5af3";
                console.log(client_seed + server_seed);
                var hands = gameLogic.initHands(client_seed + server_seed);
                var playerHand = {
                    initCards : hands.playerCards,
                    holds : hands.holds,
                    rnk : hands.playerCardsRank,
                    sub_rnk : hands.playerCardsSubRank
                };
                var result = gameLogic.getResult(playerHand, 0.001, hands.holds, hands.allCards);
                console.log(result.payout);
            }
            done();
        });
    });
});
