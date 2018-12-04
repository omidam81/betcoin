'use strict';
var assert = require('assert');
var GameLogic = require('./src/gamelogic');

/* global describe */
/* global it */
/* global beforeEach */

function isEqual(a, b){
    return (a>b? (a-b) : (b-a)) < 1e-10;
}
describe('craps game logics', function () {
    var gameLogic = new GameLogic();
    describe('functional: instant bet ', function () {
        describe('should win when roll a fields point ', function () {
            it('should return 1x rate when roll a normal field point', function (done) {
                gameLogic.setParams({dices: [2, 1], table:{bets: {field: 2}}});
                assert.equal(1, gameLogic.checkInstantWins.field());
                done();
            });
            it('should return 2x rate when roll 2', function (done) {
                gameLogic.setParams({dices: [1, 1], table:{bets: {field: 2}}});
                assert.equal(2, gameLogic.checkInstantWins.field());
                done();
            });
            it('should return 3x rate when roll 12', function (done) {
                gameLogic.setParams({dices: [6, 6], table:{bets: {field: 2}}});
                assert.equal(3, gameLogic.checkInstantWins.field());
                done();
            });
        });
        describe('should lose when roll a non fields point ', function () {
            it('roll 5', function (done) {
                gameLogic.setParams({dices: [2, 3], table:{bets: {field: 2}}});
                assert.equal(undefined, gameLogic.checkInstantWins.field());
                done();
            });
            it('roll 6', function (done) {
                gameLogic.setParams({dices: [5, 1], table:{bets: {field: 2}}});
                assert.equal(undefined, gameLogic.checkInstantWins.field());
                done();
            });
            it('roll 7', function (done) {
                gameLogic.setParams({dices: [1, 6], table:{bets: {field: 2}}});
                assert.equal(undefined, gameLogic.checkInstantWins.field());
                done();
            });
            it('roll 8', function (done) {
                gameLogic.setParams({dices: [2, 6], table:{bets: {field: 2}}});
                assert.equal(undefined, gameLogic.checkInstantWins.field());
                done();
            });
        });
        describe('should win when roll any other instant bet', function () {
            it('two', function (done) {
                gameLogic.setParams({dices: [1, 1], table:{bets: {two: 1}}});
                assert.equal(30, gameLogic.checkInstantWins.two());
                done();
            });
            it('twelve', function (done) {
                gameLogic.setParams({dices: [6, 6], table:{bets: {twelve: 1}}});
                assert.equal(30, gameLogic.checkInstantWins.twelve());
                done();
            });
            it('eleven', function (done) {
                gameLogic.setParams({dices: [5, 6], table:{bets: {eleven: 1}}});
                assert.equal(15, gameLogic.checkInstantWins.eleven());
                done();
            });
            it('three', function (done) {
                gameLogic.setParams({dices: [1, 2], table:{bets: {three: 1}}});
                assert.equal(15, gameLogic.checkInstantWins.three());
                done();
            });
            it('seven', function (done) {
                gameLogic.setParams({dices: [5, 2], table:{bets: {seven: 1}}});
                assert.equal(4, gameLogic.checkInstantWins.seven());
                done();
            });
            it('any crasp: 2/3/12', function (done) {
                gameLogic.setParams({dices: [1, 2], table:{bets: {anycraps: 1}}});
                assert.equal(7, gameLogic.checkInstantWins.anycraps());
                gameLogic.setParams({dices: [1, 1], table:{bets: {anycraps: 1}}});
                assert.equal(7, gameLogic.checkInstantWins.anycraps());
                gameLogic.setParams({dices: [6, 6], table:{bets: {anycraps: 1}}});
                assert.equal(7, gameLogic.checkInstantWins.anycraps());
                done();
            });
        });
    });
    describe('functional: over time bet ', function () {
        describe('pass/dontpass', function () {
            it('should 7/11 win pass directly', function (done) {
                gameLogic.setParams({dices: [6, 1], table:{bets: {pass: 1}}});
                assert.equal(1, gameLogic.checkOverTimeWins.pass());
                gameLogic.setParams({dices: [6, 5], table:{bets: {pass: 1}}});
                assert.equal(1, gameLogic.checkOverTimeWins.pass());
                done();
            });
            it('should 2/3/12 lose pass directly', function (done) {
                gameLogic.setParams({dices: [1, 1], table:{bets: {pass: 1}}});
                assert.equal(-1, gameLogic.checkOverTimeWins.pass());
                gameLogic.setParams({dices: [2, 1], table:{bets: {pass: 1}}});
                assert.equal(-1, gameLogic.checkOverTimeWins.pass());
                gameLogic.setParams({dices: [6, 6], table:{bets: {pass: 1}}});
                assert.equal(-1, gameLogic.checkOverTimeWins.pass());
                done();
            });
            it('should 8 win pass when thepint=8', function (done) {
                gameLogic.setParams({dices: [6, 2], table:{bets: {pass: 1}, thepoint: 8}});
                assert.equal(1, gameLogic.checkOverTimeWins.pass());
                done();
            });
            it('should 9 pass pass when thepint=8', function (done) {
                gameLogic.setParams({dices: [6, 3], table:{bets: {pass: 1}, thepoint: 8}});
                assert.equal(0, gameLogic.checkOverTimeWins.pass());
                done();
            });
            it('should 7 lose pass', function (done) {
                gameLogic.setParams({dices: [6, 1], table:{bets: {pass: 1}, thepoint: 8}});
                assert.equal(-1, gameLogic.checkOverTimeWins.pass());
                done();
            });
            it('should 2/3/11/12 pass pass', function (done) {
                gameLogic.setParams({dices: [1, 1], table:{bets: {pass: 1}, thepoint: 8}});
                assert.equal(0, gameLogic.checkOverTimeWins.pass());
                gameLogic.setParams({dices: [2, 1], table:{bets: {pass: 1}, thepoint: 8}});
                assert.equal(0, gameLogic.checkOverTimeWins.pass());
                gameLogic.setParams({dices: [5, 6], table:{bets: {pass: 1}, thepoint: 8}});
                assert.equal(0, gameLogic.checkOverTimeWins.pass());
                gameLogic.setParams({dices: [6, 6], table:{bets: {pass: 1}, thepoint: 8}});
                assert.equal(0, gameLogic.checkOverTimeWins.pass());
                done();
            });
            it('should 7/11 lose dontpass', function (done) {
                gameLogic.setParams({dices: [6, 1], table:{bets: {dontpass: 1}}});
                assert.equal(-1, gameLogic.checkOverTimeWins.dontpass());
                gameLogic.setParams({dices: [6, 5], table:{bets: {dontpass: 1}}});
                assert.equal(-1, gameLogic.checkOverTimeWins.dontpass());
                done();
            });
            it('should 2/3/12 win dontpass', function (done) {
                gameLogic.setParams({dices: [1, 1], table:{bets: {dontpass: 1}}});
                assert.equal(1, gameLogic.checkOverTimeWins.dontpass());
                gameLogic.setParams({dices: [2, 1], table:{bets: {dontpass: 1}}});
                assert.equal(1, gameLogic.checkOverTimeWins.dontpass());
                gameLogic.setParams({dices: [6, 6], table:{bets: {dontpass: 1}}});
                assert.equal(1, gameLogic.checkOverTimeWins.dontpass());
                done();
            });
            it('should 8 lose dontpass when thepint=8', function (done) {
                gameLogic.setParams({dices: [6, 2], table:{bets: {dontpass: 1}, thepoint: 8}});
                assert.equal(-1, gameLogic.checkOverTimeWins.dontpass());
                done();
            });
            it('should 7 win dontpass', function (done) {
                gameLogic.setParams({dices: [6, 1], table:{bets: {dontpass: 1}, thepoint: 8}});
                assert.equal(1, gameLogic.checkOverTimeWins.dontpass());
                done();
            });
        });
        describe('hard 4/6/8/10', function () {
            describe('hard 4', function () {
                it('should 2+2 win hard4', function (done) {
                    gameLogic.setParams({dices: [2, 2], table:{bets: {hard4: 1}}, previous: {thepoint: 8}});
                    assert.equal(1, gameLogic.hard(4));
                    done();
                });
                it('should 7 lose hard4', function (done) {
                    gameLogic.setParams({dices: [2, 5], table:{bets: {hard4: 1}}, previous:{thepoint: 8}});
                    assert.equal(-1, gameLogic.hard(4));
                    done();
                });
                it('should hard4 lost for each 4', function (done) {
                    gameLogic.setParams({dices: [1, 3], table:{bets: {hard4: 1}}, previous:{thepoint: 8}});
                    assert.equal(-1, gameLogic.hard(4));
                    done();
                });
            });
            describe('hard 6', function () {
                it('should 3+3 win hard6', function (done) {
                    gameLogic.setParams({dices: [3, 3], table:{bets: {hard4: 1}}, previous:{thepoint: 8}});
                    assert.equal(1, gameLogic.hard(6));
                    done();
                });
                it('should 7 lose hard6', function (done) {
                    gameLogic.setParams({dices: [2, 5], table:{bets: {hard4: 1}}, previous:{thepoint: 8}});
                    assert.equal(-1, gameLogic.hard(6));
                    done();
                });
                it('should hard6 lost for hard6', function (done) {
                    gameLogic.setParams({dices: [2, 4], table:{bets: {hard4: 1}}, previous:{thepoint: 8}});
                    assert.equal(-1, gameLogic.hard(6));
                    done();
                });
            });
            describe('hard8', function () {
                it('should 4+4 win hard8', function (done) {
                    gameLogic.setParams({dices: [4, 4], table:{bets: {hard8: 1}}, previous:{thepoint: 8}});
                    assert.equal(1, gameLogic.hard(8));
                    done();
                });
                it('should 7 lose hard8', function (done) {
                    gameLogic.setParams({dices: [2, 5], table:{bets: {hard8: 1}}, previous:{thepoint: 8}});
                    assert.equal(-1, gameLogic.hard(8));
                    done();
                });
                it('should hard8 lost for easy 8', function (done) {
                    gameLogic.setParams({dices: [3, 5], table:{bets: {hard8: 1}}, previous:{thepoint: 8}});
                    assert.equal(-1, gameLogic.hard(8));
                    done();
                });
            });
            describe('hard10', function () {
                it('should 5+5 win hard4', function (done) {
                    gameLogic.setParams({dices: [5, 5], table:{bets: {hard10: 1}}, previous:{thepoint: 8}});
                    assert.equal(1, gameLogic.hard(10));
                    done();
                });
                it('should 7 lose hard10', function (done) {
                    gameLogic.setParams({dices: [2, 5], table:{bets: {hard10: 1}}, previous:{thepoint: 8}});
                    assert.equal(-1, gameLogic.hard(10));
                    done();
                });
                it('should hard10 lost for easy 10', function (done) {
                    gameLogic.setParams({dices: [6, 4], table:{bets: {}, thepoint: 8}});
                    assert.equal(-1, gameLogic.hard(10));
                    done();
                });

            });
            describe('payouts', function () {
                it('should payout for win', function (done) {
                    var result = gameLogic.getResults({dices: [5, 5], table: {bets: {hard10: 1}}, previous:{thepoint: 8}});
                    assert.equal(8, result.winnings);
                    result = gameLogic.getResults({dices: [2, 2], table: {bets: {hard4: 1}}, previous:{thepoint: 8}});
                    assert.equal(8, result.winnings);
                    result = gameLogic.getResults({dices: [3, 3], table: {bets: {hard6: 1}}, previous:{thepoint: 8}});
                    assert.equal(10, result.winnings);
                    result = gameLogic.getResults({dices: [4, 4], table: {bets: {hard8: 1}}, previous:{thepoint: 8}});
                    assert.equal(10, result.winnings);
                    done();
                });
                it('should lost for 7 roll', function (done) {
                    var result = gameLogic.getResults({dices: [4, 3], table: {bets: {hard10: 1}}, previous: {thepoint: 4}});
                    assert.equal(0, result.winnings);
                    assert.equal(undefined, result.table.bets.hard10);
                    done();
                });
                it('should lost for easy way', function (done) {
                    var result = gameLogic.getResults({dices: [4, 6], table: {bets: {hard10: 1}}, previous: {thepoint: 4}});
                    assert.equal(0, result.winnings);
                    assert.equal(undefined, result.table.bets.hard10);
                    done();
                });
                it('should not lost when it is off and there are hard ways', function (done) {
                    var result = gameLogic.getResults({dices: [5, 5], table: {bets: {}}, previous: {bets: {hard10:1}}});
                    assert.equal(0, result.winnings);
                    assert.equal(1, result.table.bets.hard10);
                    result = gameLogic.getResults({dices: [3, 4], table: {bets: {}}, previous: {bets: {hard10:1}}});
                    assert.equal(0, result.winnings);
                    assert.equal(1, result.table.bets.hard10);
                    done();
                });
                it('should leave the win bets up when chosen the options **leave win bets up**', function (done) {
                    var result = gameLogic.getResults({win_bets_up: true, dices: [3, 4], table: {bets: {pass: 1}}});
                    assert.equal(1, result.winnings);
                    assert.equal(1, result.table.bets.pass);

                    result = gameLogic.getResults({win_bets_up: true, dices: [6, 6], table: {bets: {pass: 1}}, previous: {bets: {twelve: 1}}});
                    assert.equal(30, result.winnings);
                    assert.equal(1, result.table.bets.twelve);
                    assert.equal(true, result.options.returnbets.twelve);
                    result = gameLogic.getResults({win_bets_up: true, dices: [3, 4], table: {bets: {pass: 1}}});
                    assert.equal(1, result.winnings);
                    assert.equal(1, result.table.bets.pass);
                    assert.equal(true, result.options.returnbets.pass);
                    done();
                });
            });
        });
        describe('come', function () {
            it('should 2/3/12 lose come', function (done) {
                gameLogic.setParams({dices: [1, 1], table:{bets: {come: 1}}, previous: {thepoint: 8}});
                assert.equal(-1, gameLogic.checkMoveWins.come());
                gameLogic.setParams({dices: [2, 1], table:{bets: {come: 1}}, previous: {thepoint: 8}});
                assert.equal(-1, gameLogic.checkMoveWins.come());
                gameLogic.setParams({dices: [6, 6], table:{bets: {come: 1}}, previous: {thepoint: 8}});
                assert.equal(-1, gameLogic.checkMoveWins.come());
                done();
            });
            it('should 7/11 win come', function (done) {
                gameLogic.setParams({dices: [6, 1], table:{bets: {come: 1}}, previous: {thepoint: 8}});
                assert.equal(1, gameLogic.checkMoveWins.come());
                gameLogic.setParams({dices: [6, 5], table:{bets: {come: 1}}, previous: {thepoint: 8}});
                assert.equal(1, gameLogic.checkMoveWins.come());
                done();
            });
            it('should move come to come9 when rolls 9', function (done) {
                var res = gameLogic.getResults({dices: [6, 3], table:{bets: {come: 1}}, previous: {thepoint: 8}});
                assert.equal(1, res.table.bets.come9);
                assert.equal(undefined, res.table.bets.come);
                done();
            });
            it('should 9 win come9', function (done) {
                var res = gameLogic.getResults({dices: [6, 3], table:{bets: {}}, previous: {bets: {come9: 1}, thepoint: 8}});
                assert.equal(undefined, res.table.bets.come9);
                assert.equal(2, res.winnings);
                done();
            });
            it('should 7 lose come9', function (done) {
                var res = gameLogic.getResults({dices: [4, 3], table:{bets: {}}, previous: {bets: {come9: 1}, thepoint: 8}});
                assert.equal(undefined, res.table.bets.come9);
                assert.equal(0, res.winnings);
                done();
            });
        });
        describe('dontcome', function () {
            it('should 2/3/12 win dontcome', function (done) {
                gameLogic.setParams({dices: [1, 1], table:{bets: {dontcome: 1}}, previous: {thepoint: 8}});
                assert.equal(1, gameLogic.checkMoveWins.dontcome());
                gameLogic.setParams({dices: [2, 1], table:{bets: {dontcome: 1}}, previous: {thepoint: 8}});
                assert.equal(1, gameLogic.checkMoveWins.dontcome());
                gameLogic.setParams({dices: [6, 6], table:{bets: {dontcome: 1}}, previous: {thepoint: 8}});
                assert.equal(1, gameLogic.checkMoveWins.dontcome());
                done();
            });
            it('should 7/11 lose dontcome', function (done) {
                gameLogic.setParams({dices: [6, 1], table:{bets: {dontcome: 1}}, previous: {thepoint: 8}});
                assert.equal(-1, gameLogic.checkMoveWins.dontcome());
                gameLogic.setParams({dices: [6, 5], table:{bets: {dontcome: 1}}, previous: {thepoint: 8}});
                assert.equal(-1, gameLogic.checkMoveWins.dontcome());
                done();
            });
            it('should move dontcome to come9 when rolls 9', function (done) {
                var res = gameLogic.getResults({dices: [6, 3], table:{bets: {dontcome: 1}}, previous: {thepoint: 8}});
                assert.equal(1, res.table.bets.dontcome9);
                done();
            });
            it('should 9 lose dontcome9', function (done) {
                var res = gameLogic.getResults({dices: [6, 3], table:{bets: {}}, previous: {bets: {dontcome9:1}, thepoint: 8}});
                assert.equal(undefined, res.table.bets.dontcome9);
                assert.equal(0, res.winnings);
                done();
            });
            it('should 7 win dontcome9', function (done) {
                var res = gameLogic.getResults({dices: [4, 3], table:{bets: {}}, previous: {bets: {dontcome9: 1}, thepoint: 8}});
                assert.equal(undefined, res.table.bets.dontcome9);
                assert.equal(2, res.winnings);
                done();
            });
        });
        describe('lay4/5/6/8/9/10', function () {
            it('should 4 lose lay4', function (done) {
                var res = gameLogic.getResults({dices: [1, 3], table:{bets: {lay4: 1}}});
                assert.equal(0, res.winnings);
                assert.equal(undefined, res.table.bets.lay4);
                done();
            });
            it('should 4 pass lay5', function (done) {
                var res = gameLogic.getResults({dices: [1, 3], table:{bets: {lay5: 1}}});
                assert.equal(0, res.winnings);
                assert.equal(1, res.table.bets.lay5);
                done();
            });
            it('should 7 win lay5', function (done) {
                var res = gameLogic.getResults({dices: [4, 3], table:{bets: {lay5: 1}}});
                assert.ok(isEqual(1.61, res.winnings));
                assert.equal(undefined, res.table.bets.lay5);
                done();
            });
        });
        describe('place 5/6/8/9', function () {
            it('should 8 win place8', function (done) {
                var res = gameLogic.getResults({dices: [5, 3], table:{bets: {place8: 1}}, previous: {thepoint: 5}});
                // rates.place8 == 2.16
                assert.ok(isEqual(2.16, res.winnings));
                assert.equal(undefined, res.table.bets.place8);
                done();
            });
            it('should 5 pass place8', function (done) {
                var res = gameLogic.getResults({dices: [2, 3], table:{bets: {place8: 1}}, previous: {thepoint: 5}});
                assert.equal(0, res.winnings);
                assert.equal(1, res.table.bets.place8);
                done();
            });
            it('should 7 lose place8', function (done) {
                var res = gameLogic.getResults({dices: [4, 3], table:{bets: {place8: 1}}, previous: {thepoint: 5}});
                assert.equal(0, res.winnings);
                assert.equal(undefined, res.table.bets.place8);
                done();
            });
            it('should 5 pass place5 when off(no the point)', function (done) {
                var res = gameLogic.getResults({dices: [2, 3], table: {bets:{}}, previous:{bets: {place5: 1}}});
                // rates.buy4 == 2.95
                assert.equal(0, res.winnings);
                assert.equal(1, res.table.bets.place5);
                done();
            });
            it('should 7 pass place5 when off(no the point)', function (done) {
                var res = gameLogic.getResults({dices: [4, 3], table: {bets:{}}, previous:{bets: {place5: 1}}});
                assert.equal(0, res.winnings);
                assert.equal(1, res.table.bets.place5);
                done();
            });
        });
        describe('buy 4/10', function () {
            it('should 4 win buy4', function (done) {
                var res = gameLogic.getResults({dices: [1, 3], table:{bets: {buy4: 1}}, previous:{thepoint: 5}});
                // rates.buy4 == 2.95
                assert.ok(isEqual(2.95, res.winnings));
                assert.equal(undefined, res.table.bets.buy4);
                done();
            });
            it('should 5 pass buy4', function (done) {
                var res = gameLogic.getResults({dices: [2, 3], table:{bets: {buy4: 1}}, previous:{thepoint: 5}});
                assert.equal(0, res.winnings);
                assert.equal(1, res.table.bets.buy4);
                done();
            });
            it('should 7 lose buy4', function (done) {
                var res = gameLogic.getResults({dices: [4, 3], table:{bets: {buy4: 1}}, previous:{thepoint: 5}});
                assert.equal(0, res.winnings);
                assert.equal(undefined, res.table.bets.buy4);
                done();
            });
            it('should 4 pass buy4 when off(no the point)', function (done) {
                var res = gameLogic.getResults({dices: [1, 3], table:{bets:{}}, previous:{bets: {buy4: 1}}});
                // rates.buy4 == 2.95
                assert.equal(0, res.winnings);
                assert.equal(1, res.table.bets.buy4);
                done();
            });
            it('should 7 pass buy4 when off(no the point)', function (done) {
                var res = gameLogic.getResults({dices: [4, 3], table:{bets:{}}, previous:{bets: {buy4: 1}}});
                assert.equal(0, res.winnings);
                assert.equal(1, res.table.bets.buy4);
                done();
            });
        });
        describe('take odds', function () {
            it('should 6 win take odds 6', function (done) {
                var res = gameLogic.getResults({
                    dices: [3, 3], 
                    table:{
                        bets: {
                        }
                    }, 
                    previous:{
                        bets: {
                            takeodds6: 1
                        },
                        thepoint: 3
                    }
                });
                assert.equal(2.2, res.winnings);
                assert.equal(undefined, res.table.bets.takeodds6);
                done();
            });
            it('should pass take odds 6 when off', function (done) {
                var res = gameLogic.getResults({
                    dices: [2, 1], 
                    table:{
                        bets: {
                        }
                    }, 
                    previous:{
                        bets: {
                            takeodds6: 1
                        },
                        thepoint: 3
                    }
                });
                assert.equal(0, res.winnings);
                assert.equal(1, res.table.bets.takeodds6);
                done();
            });
            it('should lost take odds 6 when 7 roll', function (done) {
                var res = gameLogic.getResults({
                    dices: [3, 4], 
                    table:{
                        bets: {
                        }
                    }, 
                    previous:{
                        bets: {
                            takeodds6: 1
                        },
                        thepoint: 3
                    }
                });
                assert.equal(0, res.winnings);
                assert.equal(undefined, res.table.bets.takeodds6);
                done();
            });
        });
        describe('lay odds', function () {
            it('should 7 win lay odds 6', function (done) {
                var res = gameLogic.getResults({
                    dices: [3, 4], 
                    table:{
                        bets: {
                        }
                    }, 
                    previous:{
                        bets: {
                            notodds6: 1
                        },
                        thepoint: 3
                    }
                });
                assert.equal(1.83, res.winnings);
                assert.equal(undefined, res.table.bets.takeodds6);
                done();
            });
            it('should pass lay odds 6 when off', function (done) {
                var res = gameLogic.getResults({
                    dices: [2, 1], 
                    table:{
                        bets: {
                        }
                    }, 
                    previous:{
                        bets: {
                            notodds6: 1
                        },
                        thepoint: 3
                    }
                });
                assert.equal(0, res.winnings);
                assert.equal(1, res.table.bets.notodds6);
                done();
            });
            it('should lost lay odds 6 when 6 roll', function (done) {
                var res = gameLogic.getResults({
                    dices: [3, 3], 
                    table:{
                        bets: {
                        }
                    }, 
                    previous:{
                        bets: {
                            notodds6: 1
                        },
                        thepoint: 3
                    }
                });
                assert.equal(0, res.winnings);
                assert.equal(undefined, res.table.bets.notodds6);
                done();
            });
        });
        describe('passodds', function () {
            it('should passodds lost 7 roll', function (done) {
                var res = gameLogic.getResults({
                    dices: [3, 4], 
                    table:{
                        bets: {
                            passodds: 1
                        }
                    }, 
                    previous:{
                        bets: {
                            pass: 1
                        },
                        thepoint: 4
                    }
                });
                assert.equal(0, res.winnings);
                assert.equal(undefined, res.table.bets.passodds);
                assert.equal(undefined, res.table.bets.pass);
                done();
            });
            it('should passodds win thepoint roll', function (done) {
                var res = gameLogic.getResults({
                    dices: [3, 2], 
                    table:{
                        bets: {
                            passodds: 1
                        }
                    }, 
                    previous:{
                        bets: {
                            pass: 1
                        },
                        thepoint: 5
                    }
                });
                assert.equal(4.5, res.winnings);
                assert.equal(undefined, res.table.bets.pass);
                assert.equal(undefined, res.table.bets.passodds);
                done();
            });
            it('should passodds pass non-thepoint roll', function (done) {
                var res = gameLogic.getResults({
                    dices: [3, 2], 
                    table:{
                        bets: {
                            passodds: 1
                        }
                    }, 
                    previous:{
                        bets: {
                            pass: 1
                        },
                        thepoint: 4
                    }
                });
                assert.equal(0, res.winnings);
                assert.equal(1, res.table.bets.pass);
                assert.equal(1, res.table.bets.passodds);
                done();
            });
        });
        describe('dontpassodds', function () {
            it('should dontpassodds win 7 roll', function (done) {
                var res = gameLogic.getResults({
                    dices: [3, 4], 
                    table:{
                        bets: {
                            dontpassodds: 1
                        }
                    }, 
                    previous:{
                        bets: {
                            dontpass: 1
                        },
                        thepoint: 4
                    }
                });
                assert.equal(3.5, res.winnings);
                assert.equal(undefined, res.table.bets.dontpass);
                assert.equal(undefined, res.table.bets.dontpassodds);
                assert.equal(2, res.affectedWager);
                done();
            });
            it('should dontpassodds lost thepoint roll', function (done) {
                var res = gameLogic.getResults({
                    dices: [3, 2], 
                    table:{
                        bets: {
                            dontpassodds: 1
                        }
                    }, 
                    previous:{
                        bets: {
                            dontpass: 2
                        },
                        thepoint: 5
                    }
                });
                assert.equal(0, res.winnings);
                assert.equal(undefined, res.table.bets.dontpass);
                assert.equal(undefined, res.table.bets.dontpassodds);
                assert.equal(3, res.affectedWager);
                done();
            });
            it('should passodds pass non-thepoint roll', function (done) {
                var res = gameLogic.getResults({
                    dices: [3, 2], 
                    table:{
                        bets: {
                            dontpassodds: 1
                        }
                    }, 
                    previous:{
                        bets: {
                            dontpass: 1
                        },
                        thepoint: 4
                    }
                });
                assert.equal(0, res.winnings);
                assert.equal(1, res.table.bets.dontpass);
                assert.equal(1, res.table.bets.dontpassodds);
                assert.equal(0, res.affectedWager);
                done();
            });
        });
    });
    describe('game flow:', function () {
        describe('flow 1:', function () {
            var res;
            beforeEach(function (done) {
                res = gameLogic.getResults({dices: [5, 3], table:{bets:{pass: 1, dontpass: 1, seven:1, anycraps: 1 }}});
                done();
            });
            var res1;
            it('should only pass/dontpass remain', function (done) {
                assert.equal(0, res.winnings);
                assert.equal(1, res.table.bets.pass);
                assert.equal(1, res.table.bets.dontpass);
                assert.equal(undefined, res.table.bets.seven);
                assert.equal(undefined, res.table.bets.anycraps);
                assert.equal(8, res.table.thepoint);
                done();
            });
            // it('should only pass/dontpass remain', function (done) {
            it('should win 7x for anycraps, 1x for dontcome when add bets to anycraps/come/dontcome', function (done) {
                res.previous = {bets: {pass: res.table.bets.pass, dontpass: res.table.bets.dontpass}, thepoint: 8};
                res.table.bets.anycraps = 1;
                res.table.bets.come = 1;
                res.table.bets.dontcome = 1;
                delete res.table.bets.pass;
                delete res.table.bets.dontpass;
                res.dices= [1, 2];
                res1 = gameLogic.getResults(res);
                assert.equal(1, res1.table.bets.pass);
                assert.equal(1, res.table.bets.dontpass);
                assert.equal(undefined, res.table.bets.dontcome);
                assert.equal(undefined, res.table.bets.come);
                assert.equal(undefined, res.table.bets.anycraps);
                assert.equal(7 + 1 + 1 + 1, res.winnings);
                done();
            });
            it('should thepoint still be 8', function (done) {
                assert.equal(8, res.table.thepoint);
                done();
            });
        });
        describe('flow 2', function () {
            it('should reset thepoint either by the 7 or thepoint roll', function (done) {
                var res = gameLogic.getResults({dices: [5, 3], table:{bets:{}}});
                assert.equal(8, res.table.thepoint);
                res = gameLogic.getResults({dices: [5, 5], table:{bets:{}}, previous:{thepoint: res.table.thepoint}});
                assert.equal(8, res.table.thepoint);
                res = gameLogic.getResults({dices: [3, 5], table:{bets:{}}, previous:{thepoint: res.table.thepoint}});
                assert.equal(undefined, res.table.thepoint);
                res = gameLogic.getResults({dices: [2, 2], table:{bets:{}}, previous:{thepoint: res.table.thepoint}});
                assert.equal(4, res.table.thepoint);
                res = gameLogic.getResults({dices: [1, 2], table:{bets:{}}, previous:{thepoint: res.table.thepoint}});
                assert.equal(4, res.table.thepoint);
                res = gameLogic.getResults({dices: [1, 3], table:{bets:{}}, previous:{thepoint: res.table.thepoint}});
                assert.equal(undefined, res.table.thepoint);
                res = gameLogic.getResults({dices: [6, 3], table:{bets:{}}, previous:{thepoint: res.table.thepoint}});
                assert.equal(9, res.table.thepoint);
                res = gameLogic.getResults({dices: [6, 3], table:{bets:{}}, previous:{thepoint: res.table.thepoint}});
                assert.equal(undefined, res.table.thepoint);
                res = gameLogic.getResults({dices: [6, 3], table:{bets:{}}, previous:{thepoint: res.table.thepoint}});
                assert.equal(9, res.table.thepoint);
                done();
            });
        });
    });
    
    describe('bet conditions', function () {
        describe('marker on', function () {
            var result;
            beforeEach(function (done) {
                var dices = [2,3];
                result = gameLogic.getResults({
                    dices : dices,
                    table : {
                        bets:{
                        }
                    }
                });
                done();
            });
            it('should turn on the marker', function (done) {
                assert.equal(5, result.table.thepoint);
                done();
            });
            it('should keep thepoint after non-7 roll', function (done) {
                var previous = result;
                result = gameLogic.getResults({
                    dices : [2,4],
                    table : {
                        bets:{
                        },
                        thepoint: previous.table.thepoint
                    }
                });
                assert(previous.table.thepoint, result.table.thepoint);
                done();
            });
            it('should reset to markder off after a thepoint roll', function (done) {
                var previous = result;
                result = gameLogic.getResults({
                    dices : [2,3],
                    table : {
                        bets:{
                        }
                    },
                    previous : {
                        bets:{},
                        thepoint: previous.table.thepoint
                    }
                });
                assert.equal(undefined, result.table.thepoint);
                done();
            });
            it('should keep the bets after a thepoint roll', function (done) {
                var previous = result;
                result = gameLogic.getResults({
                    dices : [2,3],
                    table : {
                        bets:{}
                    },
                    previous : {
                        bets:{
                            come5: 1,
                            come6: 1,
                            hard4: 1
                        },
                        thepoint: previous.table.thepoint
                    }
                });
                assert.equal(undefined, result.table.thepoint);
                assert.equal(undefined, result.table.bets.come5);
                assert.equal(1, result.table.bets.come6);
                assert.equal(1, result.table.bets.hard4);
                assert.equal(2, result.winnings);
                done();
            });
            it('should move come bet to come 5 even after the bets after a 5 thepoint roll', function (done) {
                var previous = result;
                result = gameLogic.getResults({
                    dices : [2,3],
                    table : {
                        bets:{
                            come: 1
                        }
                    },
                    previous : {
                        bets:{
                            come5: 1
                        },
                        thepoint: previous.table.thepoint
                    }
                });
                assert.equal(undefined, result.table.thepoint);
                assert.equal(1, result.table.bets.come5);
                assert.equal(2, result.winnings);
                done();
            });
            describe('verify bet options for next round', function () {
                it('analyze for the options without any existing bets', function (done) {
                    assert.equal(true, result.options.lay4);
                    assert.equal(true, result.options.lay5);
                    assert.equal(true, result.options.lay6);
                    assert.equal(true, result.options.lay8);
                    assert.equal(true, result.options.lay9);
                    assert.equal(true, result.options.lay10);
                    assert.equal(true, result.options.buy4);
                    assert.equal(true, result.options.buy10);
                    assert.equal(true, result.options.place5);
                    assert.equal(true, result.options.place6);
                    assert.equal(true, result.options.place8);
                    assert.equal(true, result.options.place9);
                    var comeOdds = ['come4','come5','come6','come8','come9','come10'];
                    for(var come=0; come<comeOdds.length; come++){
                        assert.equal(undefined, result.options[comeOdds[come]]);
                    }
                    var dontcomeOdds = ['dontcome4','dontcome5','dontcome6','dontcome8','dontcome9','dontcome10'];
                    for(var dontcome=0; dontcome<dontcomeOdds.length; dontcome++){
                        assert.equal(undefined, result.options[dontcomeOdds[dontcome]]);
                    }
                    assert.equal(true, result.options.come);
                    assert.equal(true, result.options.dontcome);
                    assert.equal(true, result.options.field);
                    assert.equal(false, result.options.pass);
                    assert.equal(false, result.options.dontpass);
                    assert.equal(false, result.options.passodds);
                    assert.equal(false, result.options.dontpassodds);
                    assert.equal(true, result.options.hard4);
                    assert.equal(true, result.options.hard6);
                    assert.equal(true, result.options.hard8);
                    assert.equal(true, result.options.hard10);
                    assert.equal(true, result.options.two);
                    assert.equal(true, result.options.three);
                    assert.equal(true, result.options.seven);
                    assert.equal(true, result.options.eleven);
                    assert.equal(true, result.options.twelve);
                    assert.equal(true, result.options.anycraps);
                    done();
                });
                it('should allow to add bets to the take/lay odds', function (done) {
                    var options = gameLogic.analyzeOptions({
                        bets: {
                            come4: 1,
                            come5: 1,
                            come6: 1,
                            come8: 1,
                            come9: 1,
                            come10: 1,
                            dontcome4: 1,
                            dontcome5: 1,
                            dontcome6: 1,
                            dontcome8: 1,
                            dontcome9: 1,
                            dontcome10: 1
                        },
                        thepoint: 4
                    });
                    assert.equal(true, options.takeodds4);
                    assert.equal(true, options.takeodds5);
                    assert.equal(true, options.takeodds6);
                    assert.equal(true, options.takeodds8);
                    assert.equal(true, options.takeodds9);
                    assert.equal(true, options.takeodds10);
                    assert.equal(true, options.notodds4);
                    assert.equal(true, options.notodds5);
                    assert.equal(true, options.notodds6);
                    assert.equal(true, options.notodds8);
                    assert.equal(true, options.notodds9);
                    assert.equal(true, options.notodds10);
                    done();
                });
            });
            describe('come/dont come', function () {
                beforeEach(function (done) {
                    var dices = [2,3];
                    result = gameLogic.getResults({
                        dices : dices,
                        table : {
                            bets:{
                                come: 1,
                                dontcome: 1
                            }
                        }, previous : {
                            bets: {pass: 1},
                            thepoint: 4
                        }
                    });
                    done();
                });
                describe('come', function () {
                    it('take odds 5', function (done) {
                        assert.equal(true, result.options.takeodds5);
                        done();
                    });
                });
                describe('dont come', function () {
                    it('lay come 5', function (done) {
                        assert.equal(true, result.options.notodds5);
                        done();
                    });
                });
            });
            describe('max bets', function () {
                it('3-4-5X', function (done) {
                    var table = {
                        bets: {
                            pass: 1,
                            dontpass: 2,
                            come4: 3,
                            dontcome4: 4
                        },
                        thepoint: 4
                    };
                    var options = gameLogic.analyzeOptions(table);
                    assert.equal(3, options.max.passodds);
                    assert.equal(6, options.max.dontpassodds);
                    assert.equal(9, options.max.takeodds4);
                    assert.equal(12, options.max.notodds4);

                    table = {
                        bets: {
                            pass: 1
                        },
                        thepoint: 5
                    };
                    options = gameLogic.analyzeOptions(table);
                    assert.equal(4, options.max.passodds);

                    table = {
                        bets: {
                            pass: 1
                        },
                        thepoint: 6
                    };
                    options = gameLogic.analyzeOptions(table);
                    assert.equal(5, options.max.passodds);
                    done();
                });
                it('should throw exceptions when bet exceed allowed amount', function (done) {
                    var table = {
                        bets: {
                            pass:1
                        },
                        thepoint: 4
                    };
                    var options;
                    try{
                        options = gameLogic.getResults({dices: [5,1], table: {bets: {passodds: 4}}, previous: table});
                    }catch(e){
                        done();
                    }
                });
            });
            describe('clear bets by player', function () {
                it('should be able to clear bets which are not pass/dont pass line, or come number bets', function (done) {
                    var table = {
                        bets: {
                            hard4: 1,
                            hard6: 1,
                            lay5: 1,
                            place8: 1,
                            takeodds9: 1,
                            notodds10: 1
                        },
                        thepoint: 3
                    };
                    var totalToReturn = gameLogic.returnBets({
                        hard4: true,
                        hard6: true,
                        lay5: true,
                        place8: true
                        // takeodds9: true,
                        // notodds10: true
                    }, table);
                    assert.equal(4, totalToReturn);
                    assert.equal(undefined, table.bets.hard4);
                    assert.equal(undefined, table.bets.hard6);
                    assert.equal(undefined, table.bets.lay5);
                    assert.equal(undefined, table.bets.place8);
                    assert.equal(1, table.bets.takeodds9);
                    assert.equal(1, table.bets.notodds10);
                    done();
                });
                it('should analyze the bet return options', function (done) {
                    var previous = {
                        bets: {
                            hard4: 1,
                            hard6: 1,
                            lay5: 1,
                            place8: 1,
                            takeodds9: 1,
                            notodds10: 1,
                            pass: 1,
                            passodds: 1,
                            dontpass: 1
                        },
                        thepoint: 3
                    };
                    var options = gameLogic.analyzeOptions(previous);
                    assert.equal(true, options.returnbets.hard4);
                    assert.equal(true, options.returnbets.hard6);
                    assert.equal(true, options.returnbets.lay5);
                    assert.equal(true, options.returnbets.place8);
                    assert.equal(true, options.returnbets.takeodds9);
                    assert.equal(true, options.returnbets.notodds10);
                    assert.equal(true, options.returnbets.passodds);
                    assert.equal(undefined, options.returnbets.pass);
                    assert.equal(undefined, options.returnbets.dontpass);
                    assert.equal(undefined, options.returnbets.notodds9);
                    assert.equal(undefined, options.returnbets.hard5);
                    done();
                });
                it('should throw exceptions when trying to return bets that is not allowed', function (done) {
                    try{
                        var totalToReturn = gameLogic.returnBets({
                            hard5: true
                        }, {
                            bets: {
                                hard4: 1,
                                hard6: 1,
                                lay5: 1,
                                place8: 1,
                                takeodds9: 1,
                                notodds10: 1
                            },
                            thepoint: 3
                        });
                        assert.equal(true, totalToReturn);
                    }catch(ex){
                        done();
                    }
                });
            });
        });
        describe('marker off', function () {
            var result;
            beforeEach(function (done) {
                var dices = [3,4];
                result = gameLogic.getResults({
                    dices : dices,
                    table : {
                        bets:{
                        }
                    }
                });
                done();
            });
            it('should turn off the marker', function (done) {
                assert.equal(undefined, result.table.thepoint);
                done();
            });
            it('should not allow buy or place', function (done) {
                assert.equal(false, result.options.buy4);
                assert.equal(false, result.options.buy10);
                assert.equal(false, result.options.place5);
                assert.equal(false, result.options.place6);
                assert.equal(false, result.options.place8);
                assert.equal(false, result.options.place9);
                done();
            });
            it('should allow lay odds', function (done) {
                assert.equal(true, result.options.lay4);
                assert.equal(true, result.options.lay5);
                assert.equal(true, result.options.lay6);
                assert.equal(true, result.options.lay8);
                assert.equal(true, result.options.lay9);
                assert.equal(true, result.options.lay10);
                done();
            });
            it('should allow easy points', function (done) {
                assert.equal(true, result.options.two);
                assert.equal(true, result.options.three);
                assert.equal(true, result.options.seven);
                assert.equal(true, result.options.eleven);
                assert.equal(true, result.options.twelve);
                assert.equal(true, result.options.anycraps);
                done();
            });
            it('pass/dont pass line', function (done) {
                assert.equal(true, result.options.pass);
                assert.equal(true, result.options.dontpass);
                done();
            });
            it('should not allow pass/dont pass odds and come number', function (done) {
                assert.equal(false, result.options.takeodds4);
                assert.equal(false, result.options.takeodds5);
                assert.equal(false, result.options.takeodds6);
                assert.equal(false, result.options.takeodds8);
                assert.equal(false, result.options.takeodds9);
                assert.equal(false, result.options.takeodds10);
                assert.equal(false, result.options.notodds4);
                assert.equal(false, result.options.notodds5);
                assert.equal(false, result.options.notodds6);
                assert.equal(false, result.options.notodds8);
                assert.equal(false, result.options.notodds9);
                assert.equal(false, result.options.notodds10);
                assert.equal(false, result.options.come);
                assert.equal(false, result.options.dontcome);
                done();
            });
            it('should not allow hardways', function (done) {
                assert.equal(false, result.options.hard4);
                assert.equal(false, result.options.hard6);
                assert.equal(false, result.options.hard8);
                assert.equal(false, result.options.hard10);
                done();
            });
            describe('bet with pass line', function () {
                beforeEach(function (done) {
                    var dices = [3,2];
                    result = gameLogic.getResults({
                        dices : dices,
                        table : {
                            bets:{
                                pass: 1
                            }
                        }
                    });
                    done();
                });
                it('should allow to bet on pass odds', function (done) {
                    assert.equal(5, result.table.thepoint);
                    assert.equal(true, result.options.passodds);
                    done();
                });
            });
            describe('bet with dont pass line', function () {
                beforeEach(function (done) {
                    var dices = [2,3];
                    result = gameLogic.getResults({
                        dices : dices,
                        table : {
                            bets:{
                                dontpass: 1
                            }
                        }
                    });
                    done();
                });
                it('should allow to bet on dont pass odds', function (done) {
                    assert.equal(5, result.table.thepoint);
                    assert.equal(true, result.options.dontpassodds);
                    done();
                });
            });
            describe('handle exceptions', function () {
                it('should throw exception when trying to bet on hardways', function (done) {
                    var previous = result;
                    try{
                        result = gameLogic.getResults({
                            table : {
                                bets: {
                                    hard4: 1
                                }
                            },
                            previous: previous.table
                        });
                    }catch(ex){
                        done();
                    }
                });
            });
            describe('bets with off marker', function () {
                describe('after 7 roll', function () {
                    it('should lost the come number and return take odds bets', function (done) {
                        var result = gameLogic.getResults({
                            dices : [4,3],
                            table : {
                                bets:{}
                            }, 
                            previous : {
                                bets:{
                                    come9: 1,
                                    takeodds9: 1
                                }
                            }
                        });
                        assert.equal(1, result.winnings);
                        assert.equal(undefined, result.table.bets.come9);
                        assert.equal(undefined, result.table.bets.takeodds9);
                        done();
                    });
                    it('should win the come number and return take odds bets', function (done) {
                        var result = gameLogic.getResults({
                            dices : [4,3],
                            table : {
                                bets:{}
                            }, 
                            previous : {
                                bets:{
                                    dontcome9: 1,
                                    notodds9: 1
                                }
                            }
                        });
                        assert.equal(3, result.winnings);
                        assert.equal(undefined, result.table.bets.dontcome9);
                        assert.equal(undefined, result.table.bets.notodds9);
                        done();
                    });
                });
                describe('after roll the number matched with the odds', function () {
                    it('should lost the come number and return take odds bets', function (done) {
                        var result = gameLogic.getResults({
                            dices : [4,5],
                            table : {
                                bets:{}
                            }, 
                            previous : {
                                bets:{
                                    dontcome9: 1,
                                    notodds9: 1
                                }
                            }
                        });
                        assert.equal(1, result.winnings);
                        assert.equal(undefined, result.table.bets.dontcome9);
                        assert.equal(undefined, result.table.bets.notodds9);
                        done();
                    });
                    it('should win the dont come number and return lay odds bets', function (done) {
                        var result = gameLogic.getResults({
                            dices : [4,5],
                            table : {
                                bets:{}
                            }, 
                            previous : {
                                bets:{
                                    come9: 1,
                                    takeodds9: 1
                                }
                            }
                        });
                        assert.equal(3, result.winnings);
                        assert.equal(undefined, result.table.bets.dontcome9);
                        assert.equal(undefined, result.table.bets.notodds9);
                        done();
                    });
                });
                describe('when roll with the come number or pass odds number', function () {
                    var result;
                    beforeEach(function (done) {
                        result = gameLogic.getResults({
                            dices : [4,5],
                            table : {
                                bets:{}
                            }, 
                            previous : {
                                bets:{
                                    come9: 1,
                                    takeodds9: 1
                                },
                                thepoint: 3
                            }
                        });
                        done();
                    });
                    it('should payout for both the come number and pass odds number bets', function (done) {
                        assert.equal(4.5, result.winnings);
                        assert.equal(undefined, result.table.bets.come9);
                        assert.equal(undefined, result.table.bets.takeodds9);
                        done();
                    });
                });
                it('should not allow to add bets to the off bets', function (done) {
                    var options = gameLogic.analyzeOptions({
                        bets: {
                            come4: 1,
                            come5: 1,
                            come6: 1,
                            come8: 1,
                            come9: 1,
                            come10: 1,
                            dontcome4: 1,
                            dontcome5: 1,
                            dontcome6: 1,
                            dontcome8: 1,
                            dontcome9: 1,
                            dontcome10: 1,
                            takeodds4: 1,
                            takeodds5: 1,
                            takeodds6: 1,
                            takeodds8: 1,
                            takeodds9: 1,
                            takeodds10: 1,
                            notodds4: 1,
                            notodds5: 1,
                            notodds6: 1,
                            notodds8: 1,
                            notodds9: 1,
                            notodds10: 1
                        }
                    });
                    assert.equal(false, options.takeodds4);
                    assert.equal(false, options.takeodds5);
                    assert.equal(false, options.takeodds6);
                    assert.equal(false, options.takeodds8);
                    assert.equal(false, options.takeodds9);
                    assert.equal(false, options.takeodds10);
                    assert.equal(true, options.notodds4);
                    assert.equal(true, options.notodds5);
                    assert.equal(true, options.notodds6);
                    assert.equal(true, options.notodds8);
                    assert.equal(true, options.notodds9);
                    assert.equal(true, options.notodds10);
                    done();
                });
            });
        });
    });
    describe('house edge calculation', function () {
        it('should calculate the average house edge based on the bet types and amounts', function (done) {
            var bets = {
                pass: 1,
                passodds: 1,//this should be ignore from the house calculation
                hard4: 1,
                two: 2
            };
            var avgHouseEdge = gameLogic.getHouseEdge(bets);
            assert.equal(0.10075, avgHouseEdge);
            done();
        });
    });
});
