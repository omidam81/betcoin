'use strict';
    
module.exports = function(HTTPError) {
    var provable = require('../../../lib/provably-fair');

    var GameLogic = function() {
        var self = this;
        this.checkInstantWins = {
            field: function() {
                if ([3, 4, 9, 10, 11].indexOf(self.totalpoint)!==-1) {
                    return 1;
                }
                if (self.totalpoint===2) {
                    return 2;
                }
                if (self.totalpoint===12) {
                    return 3;
                }
            },
            two: function() {
                if (self.dices[0]===1 && self.dices[1]===1) {
                    return rates.two;
                }
            },
            twelve: function() {
                if (self.dices[0]===6 && self.dices[1]===6) {
                    return rates.twelve;
                }
            },
            three: function() {
                if (self.dices.indexOf(1)!==-1 && self.dices.indexOf(2)!==-1) {
                    return rates.three;
                }
            },
            eleven: function() {
                if (self.dices.indexOf(5)!==-1 && self.dices.indexOf(6)!==-1) {
                    return rates.eleven;
                }
            },
            seven: function() {
                if (self.totalpoint===7) {
                    return rates.seven;
                }
            },
            anycraps: function() {
                if ( [2, 3, 12].indexOf(self.totalpoint)!==-1 ) {
                    return rates.anycraps;
                }
            },
        };
        this.checkOverTimeWins = {
            pass: function() {
                if ( !self.table.thepoint && [7,11].indexOf(self.totalpoint)!==-1) {
                    return 1;
                }
                if ( !self.table.thepoint && [2, 3, 12].indexOf(self.totalpoint)!==-1) {
                    return -1;
                }
                if (self.totalpoint===self.table.thepoint) {
                    return 1;
                }
                if (self.totalpoint===7) {
                    return -1;
                }
                return 0;
            },
            dontpass: function() {
                if ( !self.table.thepoint && [7,11].indexOf(self.totalpoint)!==-1) {
                    return -1;
                }
                if ( !self.table.thepoint && [2, 3, 12].indexOf(self.totalpoint)!==-1) {
                    return 1;
                }
                if (self.totalpoint===self.table.thepoint) {
                    return -1;
                }
                if (self.totalpoint===7) {
                    return 1;
                }
                return 0;
            },
        };
        this.checkMoveWins = {
            come: function() {
                if ([7,11].indexOf(self.totalpoint)!==-1) {
                    return 1;
                }
                if ([2, 3, 12].indexOf(self.totalpoint)!==-1) {
                    return -1;
                }
                return 0;
            },
            dontcome: function() {
                if ([7,11].indexOf(self.totalpoint)!==-1) {
                    return -1;
                }
                if ([2, 3, 12].indexOf(self.totalpoint)!==-1) {
                    return 1;
                }
                return 0;
            },
        };
    };
    
    //payout and house edges references from http://en.wikipedia.org/wiki/Craps
    var rates = {
        field: 1,
        two: 30,
        twelve: 30,
        three: 15,
        eleven: 15,
        seven: 4,
        anycraps: 7,
        pass: 1,
        dontpass: 1,
        come: 1,
        dontcome: 1,
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
        takeodds4: 2,
        takeodds5: 1.5,
        takeodds6: 1.2,
        takeodds8: 1.2,
        takeodds9: 1.5,
        takeodds10: 2,
        notodds4: 0.5,
        notodds5: 0.66,
        notodds6: 0.83,
        notodds8: 0.83,
        notodds9: 0.66,
        notodds10: 0.5,
        hard4: 7,
        hard10: 7,
        hard6: 9,
        hard8: 9,
        lay4: 0.46,
        lay5: 0.61,
        lay6: 0.76,
        lay8: 0.76,
        lay9: 0.61,
        lay10: 0.46,
        place5: 1.40,
        place6: 1.16,
        place8: 1.16,
        place9: 1.40,
        buy4: 1.95,
        buy10: 1.95
    };

    var houseEdges = {
        pass: 0.0141,
        come: 0.0141,
        dontpass:  0.0136,
        dontcome:  0.0136,
        eleven: 0.1111,
        three: 0.1111,
        two: 0.1389,
        twelve: 0.1389,
        anycraps: 0.1111,
        seven: 0.1667,
        field: 0.0278,
        hard4: 0.1111,
        hard10: 0.1111,
        hard6: 0.0909,
        hard8: 0.0909,
        place5: 0.04,
        place9: 0.04,
        place6: 0.0152,
        place8: 0.0152,
        lay4: 0.0244,
        lay10: 0.0244,
        lay5: 0.0323,
        lay9: 0.0323,
        lay6: 0.04,
        lay8: 0.04
    };

    GameLogic.prototype.rolldice = function(clientseed, serverseed) {
        var matrixSeed = provable.sha512hmac(clientseed, serverseed);
        var res = provable.seededMatrix(matrixSeed, {
            height: 1,
            width: 2,
            min: 1,
            max: 6
        });
        return res[0];
    };

    GameLogic.prototype.hard = function(totalpoint) {
        var self = this;
        totalpoint = parseInt(totalpoint);
        if (self.table.thepoint){
            if (self.dices[0]===self.dices[1] && self.totalpoint === totalpoint) {
                return 1;
            }
            if (self.totalpoint===7 || self.totalpoint === totalpoint) {
                return -1;
            }
        }
        return 0;
    };
    GameLogic.prototype.come = function(number) {
        var self = this;
        number = parseInt(number);
        if (self.totalpoint===7) {
            return -1;
        }
        if (self.totalpoint===number) {
            return 1;
        }
        return 0;
    };
    GameLogic.prototype.dontcome = function(number) {
        var self = this;
        number = parseInt(number);
        if (self.totalpoint===7) {
            return 1;
        }
        if (self.totalpoint===number) {
            return -1;
        }
        return 0;
    };
    GameLogic.prototype.lay = function(number) {
        var self = this;
        number = parseInt(number);
        if (self.totalpoint===number) {
            return -1;
        }
        if (self.totalpoint===7) {
            return 1;
        }
        return 0;
    };
    GameLogic.prototype.place = function(number) {
        var self = this;
        number = parseInt(number);
        // check thepoint to see if status = on
        if (self.table.thepoint && self.totalpoint===7) {
            return -1;
        }
        if (self.table.thepoint && self.totalpoint===number) {
            return 1;
        }
        return 0;
    };
    GameLogic.prototype.buy = function(number) {
        var self = this;
        return self.place(number);
    };
    GameLogic.prototype.takeodds = function(number) {
        var self = this;
        number = parseInt(number);
        if (self.table.thepoint && self.totalpoint === 7) {
            return -1;
        }
        if (self.table.thepoint && self.totalpoint === number){
            return 1;
        }
        if (!self.table.thepoint){
            if (self.totalpoint === 7) {
                return 2;
            }
            if (self.totalpoint === number) {
                return 2;
            }
        }
        return 0;
    };
    GameLogic.prototype.notodds = function(number) {
        var self = this;
        number = parseInt(number);
        if (self.table.thepoint && self.totalpoint === 7) {
            return 1;
        }
        if (self.table.thepoint && self.totalpoint === number){
            return -1;
        }
        if (!self.table.thepoint){
            if (self.totalpoint === 7) {
                return 2;
            }
            if (self.totalpoint === number) {
                return 2;
            }
        }
        return 0;
    };
    GameLogic.prototype.passodds = function() {
        var self = this;
        if (self.table.thepoint && self.totalpoint === 7) {
            return -1;
        }
        if (self.table.thepoint && self.totalpoint === self.table.thepoint){
            return 1;
        }
        return 0;
    };
    GameLogic.prototype.dontpassodds = function() {
        var self = this;
        if (self.table.thepoint && self.totalpoint === 7) {
            return 1;
        }
        if (self.table.thepoint && self.totalpoint === self.table.thepoint){
            return -1;
        }
        return 0;
    };

    GameLogic.prototype.validateBet = function(betType) {
        var self = this;
        if (!self.table.thepoint){
            if(['field', 'passline', 'dontpass', 'two', 'three', 'eleven', 'seven', 'twelve', 'anycraps',
                'come4', 'come5', 'come6', 'come8', 'come9', 'come10',
                'dontcome4', 'dontcome5', 'dontcome6', 'dontcome8', 'dontcome9', 'dontcome10',
                'lay4', 'lay5', 'lay6', 'lay8', 'lay9', 'lay10'].indexOf(betType)!==-1) {
                return true;
            } else {
                return false;
            }
        } else {
            if (['passline', 'dontpass'].indexOf(betType)!==-1) {
                return false;
            } else {
                return true;
            }
        }
    };

    GameLogic.prototype.setParams = function(params) {
        var self = this;
        var previous = params.previous || {};
        var dices = params.dices;
        var table = params.table;

        this.validateBetOptions(table, previous);
        if(previous.bets){
            for(var betType in previous.bets){
                if(previous.bets.hasOwnProperty(betType)){
                    if(table.bets[betType]){
                        table.bets[betType] += previous.bets[betType];
                    }else{
                        table.bets[betType] = previous.bets[betType];
                    }
                }
            }
        }
        if(previous.thepoint){
            table.thepoint = previous.thepoint;
        }
        self.dices = dices;
        self.table = params.table;
        self.totalpoint = self.dices[0] + self.dices[1];
    };
    GameLogic.prototype.getResults = function(params) {
        var self = this;
        var table = params.table;
        var win=0, rate, res, wins = {}, losts = {}, pushes = {};
        
        self.setParams(params);
        //copy bets
        var bets = JSON.parse(JSON.stringify(table.bets));
        for(var i in table.bets) {
            // if (self.validateBet(i)) {
            if (table.bets.hasOwnProperty(i)) {
                if(i in self.checkInstantWins){
                    rate = self.checkInstantWins[i]();
                    if(rate){
                        // return to user's credit
                        wins[i] = table.bets[i] * (rate + 1);
                    } else {
                        losts[i] = 1;
                    }
                    //clear bet
                    delete table.bets[i];
                    continue;
                }
                if(i in self.checkOverTimeWins){
                    res = self.checkOverTimeWins[i]();
                    switch(res) {
                    case 1: // win
                        wins[i] = table.bets[i] * (rates[i] + 1);
                        //clear bet
                        delete table.bets[i];
                        break;
                    case -1: // lose
                        delete table.bets[i];
                        losts[i] = 1;
                        break;
                    }
                    continue;
                }
                var betTypes = ['hard', 'lay', 'come', 'dontcome', 'buy', 'place', 'takeodds', 'notodds', 'passodds', 'dontpassodds']; 
                for(var j in betTypes) {
                    if (betTypes.hasOwnProperty(j)) {
                        res = i.indexOf(betTypes[j]);
                        if (res===0) {
                            var number = i.slice(betTypes[j].length, i.length);
                            res = self[betTypes[j]](number);
                            switch(res) {
                            case 1:
                                if(i === 'passodds'){
                                    wins[i] = table.bets[i] * (rates['takeodds'+self.table.thepoint] + 1);
                                } else if (i === 'dontpassodds'){
                                    wins[i] = table.bets[i] * (rates['notodds'+self.table.thepoint] + 1);
                                } else{
                                    wins[i] = table.bets[i] * (rates[i] + 1);
                                }
                                delete table.bets[i];
                                break;
                            case -1:
                                delete table.bets[i];
                                losts[i] = 1;
                                break;
                            //push
                            case 2:
                                win += table.bets[i];
                                delete table.bets[i];
                                pushes[i] = 1;
                            }
                        }    
                    }
                }
            }
        }
        // move bets
        if (table.bets && 'come' in table.bets) {
            res = self.checkMoveWins.come();
            switch(res) {
            case 1:
                wins.come = table.bets.come * (rates.come + 1);
                delete table.bets.come;
                break;
            case -1:
                delete table.bets.come;
                losts.come = 1;
                break;
            case 0:
                table.bets['come' + self.totalpoint] = table.bets.come;
                delete table.bets.come;
                break;
            }
        }
        if (table.bets && 'dontcome' in table.bets) {
            res = self.checkMoveWins.dontcome();
            switch(res) {
            case 1:
                wins.dontcome = table.bets.dontcome * (rates.dontcome + 1);
                delete table.bets.dontcome;
                break;
            case -1:
                delete table.bets.dontcome;
                losts.dontcome = 1;
                break;
            case 0:
                table.bets['dontcome' + self.totalpoint] = table.bets.dontcome;
                delete table.bets.dontcome;
                break;
            }
        }
        // mark thepoint
        if ([4,5,6,8,9,10].indexOf(self.totalpoint)!==-1 && !table.thepoint) {
            table.thepoint = self.totalpoint;
        }else if(self.totalpoint === 7 || table.thepoint === self.totalpoint){
            delete table.thepoint;
        }

        params.options = this.analyzeOptions(table);

        for(var w in wins){
            if(wins.hasOwnProperty(w)){
                win += wins[w];
                if(params.win_bets_up && params.options[w]){
                    win -= bets[w];
                    params.table.bets[w] = bets[w];
                }
            }
        }

        //analyse for the win up bets
        params.options = this.analyzeOptions(table);

        params.winnings = win;
        params.wins = wins;
        params.losts = losts;
        params.pushes = pushes;
        params.affectedWager = 0;
        var resultTypes = ['wins','losts','pushes'];
        for(i=0; i<3; i++){
            var collection = resultTypes[i];
            for(var betType in params[collection]){
                if(params[collection].hasOwnProperty(betType)){
                    params.affectedWager += bets[betType];
                }
            }
        }

        return params;
    };

    GameLogic.prototype.validateBetOptions = function(current, previous){
        var options = this.analyzeOptions(previous);
        for(var betType in current.bets){
            if(current.bets.hasOwnProperty(betType)){
                if(current.bets[betType] > 0){
                    if(!options[betType]){
                        throw new HTTPError(400, 'bet ' + betType +' is not allowed.');
                    }
                    if(options.max[betType] && current.bets[betType] > options.max[betType]){
                        throw new HTTPError(400, 'max allowed bet for ' + betType + ' is ' + options.max[betType]);
                    }
                }
            }
        }
    };

    GameLogic.prototype.returnBets = function(returnBets, previous){
        var options = this.analyzeOptions(previous);
        var total = 0;
        for(var returnBetType in returnBets){
            if(returnBets.hasOwnProperty(returnBetType)){
                if(returnBets[returnBetType]){
                    if(!options.returnbets[returnBetType]){
                        throw new HTTPError(400, 'not allow to return bets for ' + returnBetType);
                    }else{
                        total += previous.bets[returnBetType];
                        delete previous.bets[returnBetType];
                    }
                }
            }
        }
        return total;
    };

    GameLogic.prototype.analyzeOptions = function(table){
        var options = {
            field: true,
            pass: true,
            dontpass: true,
            passodds: false,
            dontpassodds: false,
            come: false,
            dontcome: false,
            lay4: true,
            lay5: true,
            lay6: true,
            lay8: true,
            lay9: true,
            lay10: true,
            buy4: false,
            buy10: false,
            place5: false,
            place6: false,
            place8: false,
            place9: false,
            takeodds4: false,
            takeodds5: false,
            takeodds6: false,
            takeodds8: false,
            takeodds9: false,
            takeodds10: false,
            notodds4: false,
            notodds5: false,
            notodds6: false,
            notodds8: false,
            notodds9: false,
            notodds10: false,
            two: true,
            three: true,
            seven: true,
            eleven: true,
            twelve: true,
            anycraps: true,
            hard4: false,
            hard6: false,
            hard8: false,
            hard10: false,
            returnbets: {},
            max: {}
        };
        var betType;
        table = table || {};
        if(table.thepoint){
            options.come = true;
            options.dontcome = true;
            options.hard4 = true;
            options.hard6 = true;
            options.hard8 = true;
            options.hard10 = true;
            options.buy4 = true;
            options.buy10 = true;
            options.place5 = true;
            options.place6 = true;
            options.place8 = true;
            options.place9 = true;
            options.pass = false;
            options.dontpass = false;
            var maxMultiplier = this.getMaxMultiplier(table.thepoint);
            if(table.bets){
                for(betType in table.bets){
                    if(table.bets.hasOwnProperty(betType)){
                        if(betType === 'come' || betType === 'dontcome'){
                            options[betType + table.thepoint] = true;
                        }                        
                        var matchComeBet = betType.match(/come+[0-9]/);
                        if(matchComeBet){
                            var number = betType.match(/[0-9]+/i)[0];
                            if(matchComeBet.index === 0){
                                options['takeodds' + number] = true;
                                options.max['takeodds' + number] = maxMultiplier * table.bets[betType];
                            }else{
                                options['notodds' + number] = true;
                                options.max['notodds' + number] = maxMultiplier * table.bets[betType];
                            }
                        }
                        if(betType.indexOf('takeodds') !== -1){
                            options[betType] = true;
                        }
                        if(betType.indexOf('notodds') !== -1){
                            options[betType] = true;
                        }
                        if(betType === 'pass'){
                            options.passodds = true;
                            options.max.passodds = maxMultiplier * table.bets[betType];
                        }
                        if(betType === 'dontpass'){
                            options.dontpassodds = true;
                            options.max.dontpassodds = maxMultiplier * table.bets[betType];
                        }
                        if(!matchComeBet && betType !== 'pass' && betType !== 'dontpass'){
                            options.returnbets[betType] = true;
                        }
                    }
                }
            }
        }else{
            if(table.bets){
                for(betType in table.bets){
                    if(table.bets.hasOwnProperty(betType)){
                        if(betType.match(/dontcome+[0-9]/)){
                            var notoddsNumber = betType.match(/[0-9]+/i)[0];
                            options['notodds' + notoddsNumber] = true;
                        }
                        if(betType.indexOf('come') === -1 && 
                            betType.indexOf('hard') === -1 && 
                            betType.indexOf('buy') === -1 && 
                            betType.indexOf('place') === -1 &&
                            betType.indexOf('takeodds') === -1 &&
                            betType.indexOf('notodds') === -1){
                            options.returnbets[betType] = true;
                        }
                    }
                }
            }
        }
        return options;
    };

    GameLogic.prototype.getMaxMultiplier = function(thepoint) {
        if(thepoint === 4 || thepoint === 10){
            return 3;
        }
        if(thepoint === 5 || thepoint === 9){
            return 4;
        }
        if(thepoint === 6 || thepoint === 8){
            return 5;
        }
    };

    GameLogic.prototype.getHouseEdge = function(bets){
        var totalWager = 0;
        for(var i in bets){
            if(bets.hasOwnProperty(i) && houseEdges.hasOwnProperty(i)){
                totalWager += bets[i];
            }
        }
        var averageHouseEdge = 0;
        for(var j in bets){
            if(bets.hasOwnProperty(j)){
                if(typeof bets[j] === 'number' && houseEdges[j]){
                    var ratio = bets[j]/totalWager;
                    averageHouseEdge += ratio*houseEdges[j];
                }
            }
        }
        return averageHouseEdge;
    };

    return GameLogic;
};
