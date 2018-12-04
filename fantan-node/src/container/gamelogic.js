'use strict';

var HTTPError = require('httperror-npm');

module.exports = function() {
    var self = this;

    this.betmap = {
        //Fan: A bet on a single number
        "[\"fan\",1]": 2.85,
        "[\"fan\",2]": 2.85,
        "[\"fan\",3]": 2.85,
        "[\"fan\",4]": 2.85,
        //Nim: A bet on two numbers, one of which is indicated as a push (second number: push)
        "[\"nim\",1,2]": 1.9,
        "[\"nim\",1,3]": 1.9,
        "[\"nim\",1,4]": 1.9,
        "[\"nim\",2,1]": 1.9,
        "[\"nim\",2,3]": 1.9,
        "[\"nim\",2,4]": 1.9,
        "[\"nim\",3,1]": 1.9,
        "[\"nim\",3,2]": 1.9,
        "[\"nim\",3,4]": 1.9,
        "[\"nim\",4,1]": 1.9,
        "[\"nim\",4,2]": 1.9,
        "[\"nim\",4,3]": 1.9,
        //Kwok: A bet on two numbers, both of which win
        "[\"kwok\",1,2]": 0.95,
        "[\"kwok\",1,3]": 0.95,
        "[\"kwok\",1,4]": 0.95,
        "[\"kwok\",2,3]": 0.95,
        "[\"kwok\",2,4]": 0.95,
        "[\"kwok\",3,4]": 0.95,
        //Nga: A bet on three numbers, one of which indicated as a push (first number: except, second number: push)
        "[\"nga\",1,2]": 0.475, //except 1, 2 push
        "[\"nga\",1,3]": 0.475,
        "[\"nga\",1,4]": 0.475,
        "[\"nga\",2,1]": 0.475,
        "[\"nga\",2,3]": 0.475,
        "[\"nga\",2,4]": 0.475,
        "[\"nga\",3,1]": 0.475,
        "[\"nga\",3,2]": 0.475,
        "[\"nga\",3,4]": 0.475,
        "[\"nga\",4,1]": 0.475,
        "[\"nga\",4,2]": 0.475,
        "[\"nga\",4,3]": 0.475,
        //Ssh: A bet on three numbers, all of which win
        "[\"ssh\",1]": 0.95 / 3, //except 1
        "[\"ssh\",2]": 0.95 / 3,
        "[\"ssh\",3]": 0.95 / 3,
        "[\"ssh\",4]": 0.95 / 3
    };
    this.getHouseEdge = function(bets) {
        var houseEdges = [];
        for(var betType in bets){
            if(bets.hasOwnProperty(betType)){
                betType = decodeURIComponent(betType);
                if(!self.betmap[betType]){
                    continue;
                }
                var type = JSON.parse(betType);
                if(type[0] === 'fan'){
                    houseEdges.push(3.75);
                }
                if(type[0] === 'nim'){
                    houseEdges.push(2.5);
                }
                if(type[0] === 'kwok'){
                    houseEdges.push(2.5);
                }
                if(type[0] === 'nga'){
                    houseEdges.push(1.25);
                }
                if(type[0] === 'ssh'){
                    houseEdges.push(1.25);
                }
            }
        }
        var totalHouseEdge = 0;
        for(var i=0;i<houseEdges.length;i++){
            totalHouseEdge += houseEdges[i];
        }
        var averageHouseEdge = totalHouseEdge/houseEdges.length;
        return averageHouseEdge;
    };
    this.getPayouts = function(game) {
        var bets = game.bets;
        var result = 0;
        for(var i = 0; i < game.dices.length; i++) {
            result += game.dices[i];
        }
        result = result % 4;
        if (result === 0) {
            result = 4;
        }
        var betPayouts = {};
        var betMultipliers = {};
        var payoutSum = 0;
        for(var betType in bets){
            if(bets.hasOwnProperty(betType)){
                var wager = bets[betType];
                betType = decodeURIComponent(betType);
                //validate the bet type
                if(!self.betmap[betType]){
                    throw new HTTPError(400, 'Invalid bet type');
                }
                var thispayout = 0;
                var type = JSON.parse(betType);
                if(type[0] === 'fan'){
                    thispayout = self.getFanPayout(type[1], self.betmap[betType], result);
                }
                if(type[0] === 'nim'){
                    thispayout = self.getNimPayout(type.slice(1), self.betmap[betType], result);
                }
                if(type[0] === 'kwok'){
                    thispayout = self.getKwokPayout(type.slice(1), self.betmap[betType], result);
                }
                if(type[0] === 'nga'){
                    thispayout = self.getNgaPayout(type.slice(1), self.betmap[betType], result);
                }
                if(type[0] === 'ssh'){
                    thispayout = self.getSshPayout(type[1], self.betmap[betType], result);
                }
                if (thispayout >= 0) {
                    betPayouts[betType] = thispayout*wager + wager;
                } else { //lose
                    betPayouts[betType] = 0;
                }

                if(thispayout >= 0){
                    betMultipliers[betType] = Math.round((thispayout + 1) * 100) / 100;
                }else{
                    betMultipliers[betType] = 0;
                }
            }
        }
        for(var k in betPayouts){
            if(betPayouts.hasOwnProperty(k)){
                payoutSum += betPayouts[k];
            }
        }
        return {betPayouts: betMultipliers, sum: payoutSum, houseEdge: self.getHouseEdge(game.bets), winningNumber: result};
    };

    this.getFanPayout = function(number, multiplier, result) {
        var totalPayout = -1;
        if(number === result){
            totalPayout = multiplier;
        }
        return totalPayout;
    };

    //TODO: NimPayout
    /**
     * Return payout multiplier for nim bets
     * @param numbers
     * @param multiplier
     * @param result
     * @returns {number} | payout multiplier, >0: win, ===0: lose, <0: push
     */
    this.getNimPayout = function(numbers, multiplier, result) {
        var totalPayout = -1;
        if(numbers[0] === result){
            totalPayout = multiplier;
        } else if (numbers[1] === result){
            totalPayout = 0; //tie
        }
        return totalPayout;
    };
    this.getKwokPayout = function(numbers, multiplier, result) {
        var totalPayout = -1;
        if(numbers.indexOf(result) !== -1){
            totalPayout = multiplier;
        }
        return totalPayout;
    };

    //TODO: NgaPayout
    /**
     * Return payout multiplier for nga bets
     * @param numbers
     * @param multiplier
     * @param result
     * @returns {number} | payout multiplier, >0: win, ===0: lose, <0: push
     */
    this.getNgaPayout = function(numbers, multiplier, result) {
        var totalPayout = -1;
        if(numbers[1] === result){
            totalPayout = 0; //tie
        } else if (numbers[0] !== result){
            totalPayout = multiplier;
        }
        return totalPayout;
    };
    this.getSshPayout = function(number, multiplier, result) {
        var totalPayout = -1;
        if(number !== result){
            totalPayout = multiplier;
        }
        return totalPayout;
    };
    return this;
};