'use strict';

module.exports = function(HTTPError) {

    var betmap = {
        '1': {
            numbers: [0,2,4,6,9,11,13,15,17,19,21,24,26,28,30,32,35,37,39,41,43,45,47,50],
            payout: 2
        },
        '3': {
            numbers: [1,5,8,14,16,22,27,31,36,40,44,49],
            payout: 4
        },
        '5': {
            numbers: [3,10,18,23,29,34,42,46],
            payout: 6
        },
        '10': {
            numbers: [7,20,33,48],
            payout: 11
        },
        '20': {
            numbers: [12,38],
            payout: 21
        },
        '45': {
            numbers: [25,51],
            payout: 46
        }
    };
    var GameLogic = function() {

    };

    GameLogic.prototype.getHouseEdge = function(bets){
        var totalCount = 52;
        var houseEdges = [];
        for(var luckyNumber in bets){
            if(bets.hasOwnProperty(luckyNumber)){
                var winCount = betmap[luckyNumber].numbers.length;
                var loseCount = totalCount - winCount;
                var winChance = (betmap[luckyNumber].payout-1)*(winCount/totalCount);
                var loseChance = (-1)*(loseCount/totalCount);
                var houseEdge = winChance + loseChance;
                houseEdges.push(-houseEdge);
            }
        }
        var total = 0;
        for(var i=0; i<houseEdges.length; i++){
            total += houseEdges[i];
        }
        var averageHouseEdge = total / houseEdges.length;
        return averageHouseEdge;
    };
    GameLogic.prototype.getPayouts = function(game) {
        var payoutsum = 0;
        var betpayouts = {};
        var possible = [];
        for (var i in game.bets) {
            if(game.bets.hasOwnProperty(i)) {
                if(!betmap[i]){
                    throw new HTTPError(400, 'Invalid bet type');
                }
                var numbers = betmap[i].numbers;
                var thispayout = betmap[i].payout;
                for(var x = 0; x < numbers.length; x++) {
                    var number = numbers[x];
                    if(game.result === number) {
                        possible = numbers;
                        betpayouts[i] = thispayout;
                        payoutsum += thispayout*game.bets[i];
                    }
                }
            }
        }
        var result = {
            sum: payoutsum,
            betpayouts: betpayouts,
            gameOdds: possible.length / 52,
            houseEdge: this.getHouseEdge(game.bets)
        };
        return result;
    };
    GameLogic.prototype.getLuckyNumberByResult = function(result) {
        var luckyNumber;
        Object.keys(betmap).forEach(function(key){
            if(betmap[key].numbers.indexOf(result) >= 0){
                luckyNumber = key;
            }
        });
        return luckyNumber;
    };

    return GameLogic;
};
