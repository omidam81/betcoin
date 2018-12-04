'use strict';

module.exports = function(HTTPError) {
    var GameLogic = function() {
        this.betmap = {
            "[\"small\"]": 1,
            "[\"big\"]": 1,
            "[\"single_dice\",1]": 1,
            "[\"single_dice\",2]": 1,
            "[\"single_dice\",3]": 1,
            "[\"single_dice\",4]": 1,
            "[\"single_dice\",5]": 1,
            "[\"single_dice\",6]": 1,
            "[\"two_dice\",1,2]": 6,
            "[\"two_dice\",1,3]": 6,
            "[\"two_dice\",1,4]": 6,
            "[\"two_dice\",1,5]": 6,
            "[\"two_dice\",1,6]": 6,
            "[\"two_dice\",2,3]": 6,
            "[\"two_dice\",2,4]": 6,
            "[\"two_dice\",2,5]": 6,
            "[\"two_dice\",2,6]": 6,
            "[\"two_dice\",3,4]": 6,
            "[\"two_dice\",3,5]": 6,
            "[\"two_dice\",3,6]": 6,
            "[\"two_dice\",4,5]": 6,
            "[\"two_dice\",4,6]": 6,
            "[\"two_dice\",5,6]": 6,
            "[\"total\",4]": 60,
            "[\"total\",5]": 20,
            "[\"total\",6]": 18,
            "[\"total\",7]": 12,
            "[\"total\",8]": 8,
            "[\"total\",9]": 6,
            "[\"total\",10]": 6,
            "[\"total\",11]": 6,
            "[\"total\",12]": 6,
            "[\"total\",13]": 9,
            "[\"total\",14]": 12,
            "[\"total\",15]": 18,
            "[\"total\",16]": 20,
            "[\"total\",17]": 60,
            "[\"double\",1]": 11,
            "[\"double\",2]": 11,
            "[\"double\",3]": 11,
            "[\"double\",4]": 11,
            "[\"double\",5]": 11,
            "[\"double\",6]": 11,
            "[\"any_triple\"]": 30,
            "[\"triple\",1]": 180,
            "[\"triple\",2]": 180,
            "[\"triple\",3]": 180,
            "[\"triple\",4]": 180,
            "[\"triple\",5]": 180,
            "[\"triple\",6]": 180
        };
    };

    GameLogic.prototype.getHouseEdge = function(bets) {
        var self = this;
        var houseEdges = [];
        for(var betType in bets){
            if(bets.hasOwnProperty(betType)){
                betType = decodeURIComponent(betType);
                if(!self.betmap[betType]){
                    continue;
                }
                var type = JSON.parse(betType);
                if(type[0] === 'small' || type[0] === 'big'){
                    houseEdges.push(0.028);
                }
                if(type[0] === 'triple'){
                    houseEdges.push(0.301);
                }
                if(type[0] === 'any_triple'){
                    houseEdges.push(0.306);
                }
                if(type[0] === 'double'){
                    houseEdges.push(0.333);
                }
                if(type[0] === 'total' && (type[1] === 4 || type[1] === 17)){
                    houseEdges.push(0.292);
                }
                if(type[0] === 'total' && (type[1] === 5 || type[1] === 16)){
                    houseEdges.push(0.472);
                }
                if(type[0] === 'total' && (type[1] === 6 || type[1] === 15)){
                    houseEdges.push(0.306);
                }
                if(type[0] === 'total' && (type[1] === 7 || type[1] === 14)){
                    houseEdges.push(0.097);
                }
                if(type[0] === 'total' && (type[1] === 8 || type[1] === 13)){
                    houseEdges.push(0.125);
                }
                if(type[0] === 'total' && (type[1] === 9 || type[1] === 12)){
                    houseEdges.push(0.19);
                }
                if(type[0] === 'total' && (type[1] === 10 || type[1] === 11)){
                    houseEdges.push(0.125);
                }
                if(type[0] === 'two_dice'){
                    houseEdges.push(0.167);
                }
                if(type[0] === 'single_dice'){
                    houseEdges.push(0.079);
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
    GameLogic.prototype.getPayouts = function(game) {
        var self = this;
        var bets = game.bets;
        var result = game.result;
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
                if(type[0] === 'single_dice'){
                    thispayout = self.getSingleDicePayout(type[1], wager, self.betmap[betType], result);
                }
                if(type[0] === 'two_dice'){
                    thispayout = self.getTwoDicePayout(type.slice(1), wager, self.betmap[betType], result);
                }
                if(type[0] === 'total'){
                    thispayout = self.getTotalScorePayout(type[1], wager, self.betmap[betType], result);
                }
                if(type[0] === 'any_triple'){
                    thispayout = self.getAnyTriplePayout(wager, self.betmap[betType], result);
                }
                if(type[0] === 'triple'){
                    thispayout = self.getSpecificTriplePayout(type[1], wager, self.betmap[betType], result);
                }
                if(type[0] === 'double'){
                    thispayout = self.getDoublePayout(type[1], wager, self.betmap[betType], result);
                }
                if(type[0] === 'small'){
                    thispayout = self.getSmallPayout(wager, self.betmap[betType], result);
                }
                if(type[0] === 'big'){
                    thispayout = self.getBigPayout(wager, self.betmap[betType], result);
                }
                betPayouts[betType] = thispayout>0?(thispayout*wager + wager):0;
                if(thispayout !== 0){
                    betMultipliers[betType] = thispayout + 1;
                }else{
                    betMultipliers[betType] = 0;
                }
            }
        }
        for(var i in betPayouts){
            if(betPayouts.hasOwnProperty(i)){
                payoutSum += betPayouts[i];
            }
        }
        return {betPayouts: betMultipliers, sum: payoutSum, houseEdge: self.getHouseEdge(game.bets), gameOdds: self.getGameOdds(result)};
    };

    GameLogic.prototype.getGameOdds = function(result) {
        //two dice 15
        //double dice 6
        //total score 14
        //big smaller 2
        //triple 6
        var two_dices = [[1,2],[1,3],[1,4],[1,5],[1,6],[2,3],[2,4],[2,5],[2,6],[3,4],[3,5],[3,6],[4,5],[4,6],[5,6]];
        var possible = 0;
        for(var i=0;i<two_dices.length;i++){
            if(result.indexOf(two_dices[i][0]) && result.indexOf(two_dices[i][1])){
                possible ++;
            }
        }
        for(var j=0;j<6;j++){
            var count = 0;
            for(var k=0;k<result.length;k++){
                if(result.indexOf(j+1)){
                    count++;
                }
            }
            //double
            if(count >= 2){
                possible++;
            }
            //triple
            if(count === 3){
                possible++;
            }
        }
        //total score and big or small
        var totalScore = result[0]+result[1]+result[2];
        if(totalScore >= 4 && totalScore <= 17){
            possible+=2;
        }
        return possible/43;
    };

    GameLogic.prototype.getSingleDicePayout = function(number, wager, multiplier, result) {
        var totalPayout = 0;
        for(var i=0; i < result.length; i++){
            if(number === result[i]){
                totalPayout += multiplier;
            }
        }
        return totalPayout;
    };
    GameLogic.prototype.getTwoDicePayout = function(numbers, wager, multiplier, result) {
        var totalPayout = 0;
        if(result.indexOf(numbers[0]) === -1 || result.indexOf(numbers[1]) === -1){
            return 0;
        }
        totalPayout += multiplier;
        return totalPayout;
    };
    GameLogic.prototype.getTotalScorePayout = function(score, wager, multiplier, result) {
        var totalPayout = 0;
        var totalScore = result[0] + result[1] + result[2];
        if(score !== totalScore){
            return 0;
        }
        totalPayout += multiplier;
        return totalPayout;
    };
    GameLogic.prototype.getAnyTriplePayout = function(wager, multiplier, result) {
        var totalPayout = 0;
        if(result[0] !== result[1] || result[0] !== result[2]){
            return 0;
        }
        totalPayout += multiplier;
        return totalPayout;
    };
    GameLogic.prototype.getSpecificTriplePayout = function(number, wager, multiplier, result) {
        var totalPayout = 0;
        if(number !== result[0] || number !== result[1] || number !== result[2]){
            return 0;
        }
        totalPayout += multiplier;
        return totalPayout;
    };
    GameLogic.prototype.getDoublePayout = function(number, wager, multiplier, result) {
        var totalPayout = 0;
        var matchTimes = 0;
        for(var i=0; i<result.length; i++){
            if(result[i] === number){
                matchTimes++;
            }
        }
        if(matchTimes < 2){
            return 0;
        }
        totalPayout += multiplier;
        return totalPayout;
    };
    GameLogic.prototype.getSmallPayout = function(wager, multiplier, result) {
        var totalPayout = 0;
        var score = result[0]+result[1]+result[2];
        if(score >= 4 && score <= 10){
            return totalPayout += multiplier;
        }
        return 0;
    };
    GameLogic.prototype.getBigPayout = function(wager, multiplier, result) {
        var totalPayout = 0;
        var score = result[0]+result[1]+result[2];
        if(score >= 11 && score <= 17){
            return totalPayout += multiplier;
        }
        return 0;
    };


    return GameLogic;
};
