'use strict';


var util = require('./util');
var mahjong = require('./mahjong');

var vals = util.vals;

module.exports = function(provable, HTTPError) {
    var seatKeys = ['east','south', 'west', 'north'];
    var actions = mahjong.actions;
    var statuses = {
        'no_remaining_tiles': 0,
        'ok': 1,
        'last_tile_of_kong': 2,
        'four_tiles_of_kong': 3,
        'won_by_stealing': 4,
        'won_by_robbing_kong': 5,
        'won_by_self': 6
    };
    var MINIMUM_FAN = 3;
    var MAXIMUM_FAN = 100;

    var basePayments = [
        0, //Zero FAN
        0, //1 FAN
        0, //2 FAN
        1, //3 FAN
        1, //4 FAN
        2, //5 FAN
        2, //6 FAN
        2, //7 FAN
        4, //8 FAN
        4, //9 FAN
        8, //10 FAN
        8, //11 FAN
        16//12 FAN
    ];

    var equalAction = function(action1, action2) {
        if (action1.type === action2.type) {
            if (!action1.tiles && !action2.tiles) {
                return true;
            } else if (action1.tiles && action2.tiles && util.isArrayEquals(action1.tiles, action2.tiles)) {
                return true;
            }
        }
        return false;
    };

    var Action = function(type, tiles) {
        this.type = type;
        if (tiles) {
            this.tiles = tiles.slice();
        }
    };

    var Hand = function() {
        this.melds = [];
        this.unmeldedTiles = []; // Without Bonus - this.unmeldedTiles + this.melds.tilesLength = 13
        this.bonusTiles = [];
        this.newTile = null;
        this.removedTiles = [];
    };

    var GameLogic = function() {

    };

    var getShuffledTiles = function(seed) {
        var tiles = [];
        for (var i = 0; i < 4; i++) {
            for (var j = vals.color_beg; j <= vals.color_end; j++) { //27 tiles
                tiles.push(j);
            }
            for (var k = vals.honor_beg; k <= vals.honor_end; k++) { //7 tiles
                tiles.push(k);
            }
        }
        for (i = vals.bonus_beg; i <= vals.bonus_end; i++) { //8 tiles
            tiles.push(i);
        }

        return provable.seededShuffle(seed, tiles);
    };

    var rolldice = function(seed) {
        var res = provable.seededMatrix(seed, {
            height: 1,
            width: 3,
            min: 1,
            max: 6
        });
        return res[0];
    };

    var defaultSeats = function() {
        return {
            'east': 'AI1',
            'south': 'AI2',
            'west': 'AI3',
            'north': 'AI4'
        };
    };

    var getSeat = function(number) {
        number = number % 4 - 1;
        if (number < 0) {
            number = 3;
        }
        return seatKeys[number];
    };

    var getRoundWind = function(handNumber) {
        //11, 21, 31, 41 : east
        //51, 61, 71, 81 : south
        //91, 101, 111, 121 : west
        //131, 141, 151, 161 : north
        return getSeat(Math.floor(Math.floor(handNumber / 10 - 1) / 4) + 1);
    };

    var nextSeat = function(seat) {
        if (!seat) {
            return seatKeys[0];
        }
        var i = seatKeys.indexOf(seat);
        i = i + 1;
        if (i >= seatKeys.length) {
            i = 0;
        }

        return seatKeys[i];
    };

    var nextSeats = function(prevSeats) {
        var seats = defaultSeats();
        for(var i = 0;i < seatKeys.length; i++) {
            var seat = seatKeys[i];
            seats[seat] = prevSeats[nextSeat(seat)];
        }
        return seats;
    };

    var getNonAISeat = function(seats) {
        for(var key in seats) {
            if (seats[key] === 'player') {
                return key;
            }
        }
        return null;
    };

    GameLogic.prototype.initHands = function(seed, prevSeats, prevHandNumber, prevWinner) {
        var dices;
        var seats;
        var nonAISeat;
        var handNumber;

        if (prevSeats !== undefined) {
            if (prevHandNumber % 10 === 3) { //repeated 3 times
                handNumber = Math.floor(prevHandNumber / 10 + 1) * 10 + 1; //New Hand Number
                seats = nextSeats(prevSeats);
            } else if (prevWinner === null || prevWinner === undefined || prevWinner === 'east') {
                handNumber = Math.floor(prevHandNumber / 10) * 10 + (prevHandNumber % 10 + 1); //Repeat Hand Number
                seats = prevSeats;
            } else {
                handNumber = Math.floor(prevHandNumber / 10 + 1) * 10 + 1; //New Hand Number
                seats = nextSeats(prevSeats);
            }

            if (handNumber / 10 === 17) {
                prevSeats = undefined; //New Match
            }
        }

        if (prevSeats === undefined) {
            dices = rolldice(seed);
            var sum = (dices[0] + dices[1] + dices[2]) % 4;
            nonAISeat = getSeat(sum);
            seats = defaultSeats();
            seats[nonAISeat] = 'player';
            handNumber = 11; //Hand number, Repeat number
        }

        var tiles = getShuffledTiles(seed);
        var allTiles = tiles.slice();
        var dealedTiles = {};
        for (var seat in seats) {
            if (seats.hasOwnProperty(seat)) {
                dealedTiles[seat] = new Hand();
                dealedTiles[seat].unmeldedTilesWithBonus = [];
            }
        }
        //deal 52 tiles
        for(var i = 0;i < 13;i++){
            for (seat in seats) {
                if (seats.hasOwnProperty(seat)) {
                    dealedTiles[seat].unmeldedTilesWithBonus.push(tiles.pop());
                }
            }
        }

        for (var wind in dealedTiles) {
            if (dealedTiles.hasOwnProperty(wind)) {
                for (i = 0; i < 13; i++) {
                    if (util.isBonus(dealedTiles[wind].unmeldedTilesWithBonus[i])) {
                        dealedTiles[wind].bonusTiles.push(dealedTiles[wind].unmeldedTilesWithBonus[i]);
                    } else {
                        dealedTiles[wind].unmeldedTiles.push(dealedTiles[wind].unmeldedTilesWithBonus[i]);
                    }
                }
                while (dealedTiles[wind].unmeldedTiles.length < 13) {
                    var tile = tiles.pop();
                    if (util.isBonus(tile)) {
                        dealedTiles[wind].bonusTiles.push(tile);
                    } else {
                        dealedTiles[wind].unmeldedTiles.push(tile);
                    }
                }
                delete dealedTiles[wind].unmeldedTilesWithBonus;
                dealedTiles[wind].unmeldedTiles.sort(util.sortTile);
            }
        }

        nonAISeat = getNonAISeat(seats);

        return {
            allHands: dealedTiles,
            allTiles: allTiles,
            remainingTiles: tiles,
            seats: seats,
            dices: dices,
            status: 'began',
            playerSeat: nonAISeat,
            activeSeat: null,
            availActions: [],
            handNumber: handNumber
        };
    };

    GameLogic.prototype.dealNewTile = function(allHands, remainingTiles, activeSeat) {
        var status = statuses.ok;
        var n = allHands[activeSeat].melds.length * 3;
        n += allHands[activeSeat].unmeldedTiles.length;
        if (allHands[activeSeat].newTile !== null && allHands[activeSeat].newTile !== undefined) {
            n++;
        }
        if (n >= 14) {
            throw new HTTPError(400, 'invalid dealNewTile');
        }
        if (allHands[activeSeat].newTile !== null) {
            allHands[activeSeat].unmeldedTiles.push(allHands[activeSeat].newTile);
            allHands[activeSeat].unmeldedTiles.sort(util.sortTile);
            allHands[activeSeat].newTile = null;
        }
        if (remainingTiles.length === 0) {
            throw new HTTPError(400, 'no remaining tiles');
        }
        var tile = remainingTiles.pop();
        while (tile !== undefined && util.isBonus(tile)) {
            allHands[activeSeat].bonusTiles.push(tile);
            tile = remainingTiles.pop();
        }
        if (tile === undefined || tile === null) {
            status = statuses.no_remaining_tiles;
        }
        allHands[activeSeat].newTile = tile;

        return {
            status: status,
            allHands: allHands,
            remainingTiles: remainingTiles
        };
    };

    GameLogic.prototype.removeTiles = function(allHands, activeSeat, tilesToBeRemoved) {
        for (var t = 0; t < tilesToBeRemoved.length; t++) {
            var tileToBeRemoved = tilesToBeRemoved[t];
            var i = allHands[activeSeat].unmeldedTiles.indexOf(tileToBeRemoved);
            if (i >= 0) {
                allHands[activeSeat].unmeldedTiles.splice(i, 1);
            } else if (allHands[activeSeat].newTile === tileToBeRemoved) {
                allHands[activeSeat].newTile = null;
            }
        }
        return allHands;
    };

    GameLogic.prototype.removeTile = function(allHands, activeSeat, tileToBeRemoved) {
        var n = allHands[activeSeat].melds.length * 3;
        n += allHands[activeSeat].unmeldedTiles.length;
        if (allHands[activeSeat].newTile !== null && allHands[activeSeat].newTile !== undefined) {
            n++;
        }
        if (n !== 14) {
            throw new HTTPError(400, 'invalid removeTile');
        }
        var i = allHands[activeSeat].unmeldedTiles.indexOf(tileToBeRemoved);
        if (i >= 0) {
            allHands[activeSeat].unmeldedTiles.splice(i, 1);
            allHands[activeSeat].removedTiles.push({val: tileToBeRemoved});

            if (allHands[activeSeat].newTile !== null) {
                allHands[activeSeat].unmeldedTiles.push(allHands[activeSeat].newTile);
                allHands[activeSeat].unmeldedTiles.sort(util.sortTile);
                allHands[activeSeat].newTile = null;
            }
            return allHands;

        } else if (allHands[activeSeat].newTile === tileToBeRemoved) {
            allHands[activeSeat].removedTiles.push({val: tileToBeRemoved});
            allHands[activeSeat].newTile = null;
            return allHands;
        }

        throw new HTTPError(400, 'invalid tileToBeRemoved param');
    };

    GameLogic.prototype.isWinningHand = function(allHands, activeSeat, prevActiveSeat, prevRemovedTileOrNewTile, remainingTiles, roundWind, konged) {
        var hand = allHands[activeSeat];
        var unmeldedTiles = hand.unmeldedTiles.slice();
        unmeldedTiles.push(prevRemovedTileOrNewTile);
        var hist = util.hist(unmeldedTiles);
        var i;
        var ret = false;
        var fan_items = [];

        var fan = 0;
        var result = mahjong.findRegularMahjong(hist);
        if (hand.melds.length === 0 && mahjong.checkSevenPairs(hist)) {
            fan += 4;
            fan_items.push('seven pairs - 4');
        } else if (result && result.length + hand.melds.length === 5) {//4 kong/pong/chow + 1 pair
            var melds = result.concat(hand.melds);

            //A pong/kong of Dragons - 1 FAN
            for (i = 0; i < melds.length; i++) {
                if (melds[i].type >= actions.pong && util.isDragon(melds[i].tiles[0])) {
                    fan += 1;
                    fan_items.push('dragon(' + util.tileNames[melds[i].tiles[0]] + ') pong/kong - 1');
                }
            }

            //A pong/kong of Seat wind or Round wind - 1 FAN
            for (i = 0; i < melds.length; i++) {
                if (melds[i].type >= actions.pong && (melds[i].tiles[0] === util.windTile(activeSeat) || melds[i].tiles[0] === util.windTile(roundWind))) {
                    fan += 1;
                    fan_items.push('seat wind or round wind(' + util.tileNames[melds[i].tiles[0]] + ') pong/kong - 1');
                }
            }

            //All simples - 1 FAN
            var isAllSimples = true;
            for (i = 0; i < melds.length; i++) {
                if (util.isDragon(melds[i].tiles[0]) || util.isWind(melds[i].tiles[0])) {
                    isAllSimples = false;
                    break;
                }
            }
            if (isAllSimples) {
                fan += 1;
                fan_items.push('all simples - 1');
                //All chows and a pair of simples - 1 FAN
                for (i = 0; i < melds.length; i++) {
                    if (melds[i].type !== actions.chow && melds[i].type !== actions.pair) {
                        break;
                    }
                }
                if (i === melds.length) {
                    fan += 1;
                    fan_items.push('only chows and a pair of simples - 1');
                }
            }

            //Only pongs/kongs and any pair (pong hand) - 3 FAN
            for (i = 0; i < melds.length; i++) {
                if (melds[i].type === actions.chow) {
                    break;
                }
            }
            if (i === melds.length) {
                fan += 3;
                fan_items.push('only pongs - 3');
            }

            //Only bamboos with honours, only circles with honours or only characters with honours (clean hand) - 3 FAN
            var color = null;
            for (i = 0; i < melds.length; i++) {
                if (!util.isDragon(melds[i].tiles[0]) && !util.isWind(melds[i].tiles[0])) {
                    if (color !== null && color !== util.suit(melds[i].tiles[0])) {
                        break;
                    } else if (color === null) {
                        color = util.suit(melds[i].tiles[0]);
                    }
                }
            }
            if (color !== null && i === melds.length) {
                fan += 3;
                fan_items.push('clean hand - 3');
            }

            //Three unmelded (hidden) pongs/kongs - 3 FAN
            var hiddenPongKongs = 0;
            for (i = 0; i < result.length; i++) {
                if (result[i].type >= actions.pong) {
                    hiddenPongKongs++;
                }
            }
            if (hiddenPongKongs >= 3) {
                fan += 3;
                fan_items.push('three unmelded pongs/kongs - 3');
            }

            //Three kongs
            var kongs = 0;
            for (i = 0; i < melds.length; i++) {
                if (melds[i].type === actions.kong || melds[i].type === actions.kong_last_tile || melds[i].type === actions.hidden_kong) {
                    kongs++;
                }
            }
            if (kongs === 3) {
                fan += 3;
                fan_items.push('three kongs - 3');
            }

            //Pure hand (of only one suit and no honours: pure circles, pure bamboos or pure characters) - 6 FAN
            color = null;
            for (i = 0; i < melds.length; i++) {
                if (util.isDragon(melds[i].tiles[0]) && util.isWind(melds[i].tiles[0])) {
                    break;
                }
                if (color !== null && color !== util.suit(melds[i].tiles[0])) {
                    break;
                } else if (color === null) {
                    color = util.suit(melds[i].tiles[0]);
                }
            }
            if (color !== null && i === melds.length) {
                fan += 6;
                fan_items.push('pure hand - 6');
            }

            //Little Dragons (two pongs of dragons and a pair of the 3rd dragon) - 12 FAN
            var dragonPongs = 0, windPongs = 0;
            var pairTile = null;
            for (i = 0; i < melds.length; i++) {
                if (melds[i].type === actions.pongs && util.isDragon(melds[i].tiles[0])) {
                    dragonPongs++;
                }
                if (melds[i].type === actions.pongs && util.isWind(melds[i].tiles[0])) {
                    windPongs++;
                }
                if (melds[i].type === actions.pair) {
                    pairTile = melds[i].tiles[0];
                }
            }

            if (dragonPongs === 2 && util.isDragon(pairTile)) {
                fan += 12;
                fan_items.push('little dragons - 12');
            }

            //Little Winds (three pongs of winds and a pair of the 4th wind) - 12 FAN
            if (windPongs === 3 && util.isWind(pairTile)) {
                fan += 12;
                fan_items.push('little winds - 12');
            }
        }

        if (fan >= MINIMUM_FAN) {
            //Winning from the wall - 1 FAN
            if (prevActiveSeat === null) {
                fan += 1;
            }
            //Winning on the last tile from the wall - 1 FAN
            if (prevActiveSeat === null && remainingTiles === 0) {
                fan += 1;
            }
            //LAST DISCARD - 1 FAN
            if (prevActiveSeat !== null && remainingTiles === 0) {
                fan += 1;
            }
            //Robbing the Kong - 1 FAN
            if (prevActiveSeat !== null && konged) {
                fan += 1;
            }

            if (fan >= MINIMUM_FAN) {
                ret = true;
                var flowers = 0, seasons = 0;
                if (hand.bonusTiles) {
                    for (i = 0; i < hand.bonusTiles.length; i++) {
                        if (util.isMyBonus(hand.bonusTiles[i], activeSeat)) {
                            fan += 1;
                        }
                        if (util.isFlower(hand.bonusTiles[i])) {
                            flowers++;
                        }
                        if (util.isSeason(hand.bonusTiles[i])) {
                            seasons++;
                        }
                    }
                    if (flowers === 4) {
                        fan += 4;
                    }
                    if (seasons === 4) {
                        fan += 4;
                    }
                    if (flowers + seasons === 8) {
                        fan = MAXIMUM_FAN; //Maximum point
                    }
                }
            }
        }

        return {
            result: ret,
            fan: fan,
            fan_items: fan_items
        };
    };

    /**
     * Game Rule: Check whether stealing is available
     * @param allHands
     * @param prevActiveSeat
     * @param activeSeat
     * @returns {*[{Action}]}
     */
    GameLogic.prototype.analyzeAvailableActions = function(allHands, prevActiveSeat, activeSeat, isAIPlayer, dontAsk, roundWind) {
        var retActions = [];
        var result;
        if (!prevActiveSeat) {
            if (activeSeat === 'east') {
                retActions.push(new Action(actions.from_deck));
            }
        } else {
            var prevRemovedTile = null;
            var isKonged = false;
            if (allHands[prevActiveSeat].removedTiles.length > 0) {
                prevRemovedTile = allHands[prevActiveSeat].removedTiles[allHands[prevActiveSeat].removedTiles.length - 1].val;
                isKonged = allHands[prevActiveSeat].removedTiles[allHands[prevActiveSeat].removedTiles.length - 1].konged;
            }

            var isNextSeat = false;
            if (activeSeat === prevActiveSeat) {
                if (isKonged) {
                    retActions.push(new Action(actions.from_deck));
                }
            } else if (nextSeat(prevActiveSeat) === activeSeat) {
                if (!isKonged) {
                    retActions.push(new Action(actions.from_deck));
                }
                isNextSeat = true;
            } else {
                retActions.push(new Action(actions.skip));
            }

            if (!dontAsk && prevRemovedTile !== null) {
                if (!isKonged && prevActiveSeat !== activeSeat) {
                    result = mahjong.getAvailableMeldsWithRemovedTile(prevRemovedTile, util.hist(allHands[activeSeat].unmeldedTiles), isNextSeat, allHands[activeSeat].melds, isAIPlayer);
                    for (var i = 0; i < result.length; i++) {
                        retActions.push(new Action(result[i].type, result[i].tiles));
                    }
                }
                result = this.isWinningHand(allHands, activeSeat, prevActiveSeat, prevRemovedTile, roundWind, isKonged);
                if (prevActiveSeat !== activeSeat && result.result === true) {
                    retActions.push(new Action(actions.win, [result.fan, prevActiveSeat, result.fan_items]));
                }
            }
        }
        return retActions;
    };

    GameLogic.prototype.getHandTiles = function(hand) {
        var tiles = [];
        for (var i = 0; i < hand.unmeldedTiles.length; i++) {
            tiles.push(hand.unmeldedTiles[i]);
        }

        for (var j = 0; j < hand.melds.length; j++) {
            //If it's kong, add only three tiles
            for (i = 0; i < hand.melds[j].tiles.length && i < 3; i++) {
                tiles.push(hand.melds[j].tiles[i]);
            }
        }
        if (hand.newTile !== null) {
            tiles.push(hand.newTile);
        }
        return tiles;
    };

    GameLogic.prototype.getRemovedTiles = function(hand) {
        var tiles = [];
        for (var i = 0; i < hand.removedTiles.length; i++) {
            tiles.push(hand.removedTiles[i].val);
        }

        return tiles;
    };

    /**
     * AI: Decide how to get new tile from deck or stealing
     * @param allHands
     * @param prevActiveSeat
     * @param activeSeat
     * @param isAIPlayer
     */
    GameLogic.prototype.play = function(allHands, prevActiveSeat, activeSeat, isAIPlayer, dontAsk, roundWind) {
        var availActions = this.analyzeAvailableActions(allHands, prevActiveSeat, activeSeat, isAIPlayer, dontAsk, roundWind);
        var action;
        var i;
        if (availActions.length > 0) {
            if (isAIPlayer) {
                for (i = 0; i < availActions.length; i++) {
                    if (!action || action.type < availActions[i].type) {
                        action = availActions[i];
                    }
                }
            } else {
                for (i = 0; i < availActions.length; i++) {
                    if (!action || action.type < availActions[i].type) {
                        action = availActions[i];
                    }
                }
            }
        }
        return {
            availActions: availActions,
            actionToDo: action
        };
    };

    GameLogic.prototype.selectTileToBeRemoved = function (allHands, activeSeat, roundWind, nonAISeat) {
        var result = mahjong.getDiscard(util.hist(this.getHandTiles(allHands[activeSeat])), this.getRemovedTiles(allHands[activeSeat]), util.windTile(roundWind), util.windTile(activeSeat));
        var suit, i;
        for (i = 0; i < allHands[activeSeat].melds.length; i++) {
            if (util.isColor(allHands[activeSeat].melds[i].tiles[0])) {
                suit = util.suit(allHands[activeSeat].melds[i].tiles[0]);
            }
        }
        var winningResult;
        for (i = 0; i < allHands[activeSeat].unmeldedTiles.length; i++) {
            if (allHands[activeSeat].unmeldedTiles[i] === result.recommended.discard && (!suit || suit !== util.suit(allHands[activeSeat].unmeldedTiles[i]))) {
                winningResult = this.isWinningHand(allHands, nonAISeat, activeSeat, allHands[activeSeat].unmeldedTiles[i], roundWind, false);
                if (nonAISeat === activeSeat || winningResult.result === false) {
                    return allHands[activeSeat].unmeldedTiles[i];
                }
            }
        }
        var score = result.recommended.score;
        var bestI = -1;
        var bestV = 1000000;
        for (var j = 0; j < allHands[activeSeat].unmeldedTiles.length; j++) {
            i = allHands[activeSeat].unmeldedTiles[j];
            var v = score[i];
            if (v < bestV) {
                winningResult = this.isWinningHand(allHands, nonAISeat, activeSeat, i, roundWind, false);
                if (nonAISeat === activeSeat || winningResult.result === false) {
                    bestV = v;
                    bestI = i;
                }
            }
        }
        if (bestI === -1) {
            bestI = allHands[activeSeat].unmeldedTiles[0];
        }
        return bestI;
    };

    /**
     * Returns payout
     * @param seats
     * @param activeSeat
     * @param status
     * @returns {{winnings: number, is_win: boolean, is_push: boolean}}
     */
    GameLogic.prototype.getPayout = function(seats, activeSeat, status, meta) {
        var nonAISeat = getNonAISeat(seats);
        var result = {
            winnings: 0,
            is_win: false,
            is_push: false
        };
        var payouts = {
            east: 0,
            south: 0,
            west: 0,
            north: 0
        };

        if (status === statuses.no_remaining_tiles) {
            result.is_push = true;
            result.winnings = 1;
        } else if (status === statuses.won_by_self || status === statuses.won_by_stealing || status === statuses.won_by_robbing_kong) {
            result.winner = activeSeat;
            result.fan = meta[0];
            result.fan_items = meta[2];
            var seat;
            if (result.fan >= MAXIMUM_FAN) {
                for(seat in payouts) {
                    if (seat !== activeSeat) {
                        payouts[seat] = -64;
                    }
                }

            } else {
                var basePayment;
                if (result.fan > basePayments.length - 1) {
                    basePayment = basePayments[basePayments.length - 1];
                } else {
                    basePayment = basePayments[result.fan];
                }

                if (status === statuses.won_by_self) {
                    basePayment *= 2;
                }
                if (activeSeat === 'east') {
                    basePayment *= 2;
                }
                for (seat in payouts) {
                    if (seat !== activeSeat) {
                        payouts[seat] = -basePayment;
                        if ((status === statuses.won_by_stealing || status === statuses.won_by_robbing_kong) && seat === meta[1]) {
                            payouts[seat] *= 2;
                        }
                        if (seat === 'east') {
                            payouts[seat] *= 2;
                        }
                    }
                }
            }

            for(seat in payouts) {
                if (seat !== activeSeat) {
                    payouts[activeSeat] += -payouts[seat];
                }
            }

            if (activeSeat === nonAISeat) {
                result.is_win = true;
                result.winnings = payouts[activeSeat] * 0.99 + 1;
            } else {
                result.winnings = payouts[nonAISeat] - 1;
            }
        }
        result.payouts = payouts;

        return result;
    };

    GameLogic.prototype.doAction = function(allHands, remainingTiles, prevActiveSeat, activeSeat, action, actionTile) {
        var result;
        var status = statuses.ok;
        var removedTile;
        if (action.type === actions.remove) {
            allHands = this.removeTile(allHands, activeSeat, actionTile);
        } else if (action.type === actions.from_deck) {
            if (remainingTiles.length === 0) {
                status = statuses.no_remaining_tiles;
            } else {
                result = this.dealNewTile(allHands, remainingTiles, activeSeat);
                status = result.status;
                allHands = result.allHands;
                remainingTiles = result.remainingTiles;
                if (result.status === statuses.ok) {
                    for (var m = 0; m < allHands[activeSeat].melds.length; m++) {
                        if (allHands[activeSeat].melds[m].type === actions.pong && allHands[activeSeat].melds[m].tiles[0] === allHands[activeSeat].newTile) {
                            status = statuses.last_tile_of_kong;
                        }
                    }
                    if (status !== statuses.last_tile_of_kong) {
                        var hist = util.hist(allHands[activeSeat].unmeldedTiles);
                        hist[allHands[activeSeat].newTile]++;
                        for (var i = 0; i < hist.length; i++) {
                            if (hist[i] === 4) {
                                status = statuses.four_tiles_of_kong;
                            }
                        }
                    }
                }
            }
        } else if (action.type === actions.pong || action.type === actions.kong || action.type === actions.chow || action.type === actions.win) {
            removedTile = allHands[prevActiveSeat].removedTiles[allHands[prevActiveSeat].removedTiles.length - 1];
            if (action.type === actions.win && removedTile.konged) {
                for (var n = 0; n < allHands[prevActiveSeat].melds.length; n++) {
                    if (allHands[prevActiveSeat].melds[n].type >= actions.kong && allHands[prevActiveSeat].melds[n].tiles[0] === removedTile.val) {
                        allHands[prevActiveSeat].melds[n].type = actions.kong_stolen;
                        status = statuses.won_by_robbing_kong;
                        break;
                    }
                }
            }
            removedTile.stolen = true;

            allHands[activeSeat].unmeldedTiles.push(removedTile.val);
            allHands[activeSeat].newTile = null;
            if (action.tiles && action.type !== actions.win) {
                allHands = this.removeTiles(allHands, activeSeat, action.tiles);
                allHands[activeSeat].melds.push(mahjong.newMeld(action.type, action.tiles));
            }
            allHands[activeSeat].unmeldedTiles.sort(util.sortTile);
            if (action.type === actions.kong) {
                return this.doAction(allHands, remainingTiles, activeSeat, activeSeat, new Action(actions.from_deck));
            }
        } else if (action.type === actions.kong_last_tile) {
            for(var j = 0; j < allHands[activeSeat].melds.length; j++) {
                if (allHands[activeSeat].melds[j].type === actions.pong && allHands[activeSeat].melds[j].tiles[0] === allHands[activeSeat].newTile) {
                    allHands[activeSeat].melds[j].type = actions.kong_last_tile;
                    allHands = this.removeTile(allHands, activeSeat, allHands[activeSeat].newTile);
                    allHands[activeSeat].melds[j].tiles.push(allHands[activeSeat].melds[j].tiles[0]);
                    allHands[activeSeat].removedTiles[allHands[activeSeat].removedTiles.length - 1].konged = true;
                    if (allHands[activeSeat].newTile !== undefined && allHands[activeSeat].newTile !== null) {
                        allHands[activeSeat].unmeldedTiles.push(allHands[activeSeat].newTile);
                        allHands[activeSeat].unmeldedTiles.sort(util.sortTile);
                    }
                    break;
                }
            }

            if (j === allHands[activeSeat].melds.length) {
                throw new HTTPError(400, "Invalid kong_last_tile action");
            }
        } else if (action.type === actions.hidden_kong) {
            allHands = this.removeTiles(allHands, activeSeat, action.tiles);
            allHands[activeSeat].melds.push(mahjong.newMeld(action.type, action.tiles));
            allHands[activeSeat].unmeldedTiles.sort(util.sortTile);
            allHands[activeSeat].removedTiles.push({val: action.tiles[0],konged: true});
            if (allHands[activeSeat].newTile !== undefined && allHands[activeSeat].newTile !== null) {
                allHands[activeSeat].unmeldedTiles.push(allHands[activeSeat].newTile);
                allHands[activeSeat].unmeldedTiles.sort(util.sortTile);
                allHands[activeSeat].newTile = null;
            }
        }

        if (action.type === actions.swin) {
            allHands[activeSeat].unmeldedTiles.push(allHands[activeSeat].newTile);
            allHands[activeSeat].newTile = null;
            allHands[activeSeat].unmeldedTiles.sort(util.sortTile);

            status = statuses.won_by_self;
        } else if (action.type === actions.win && status !== statuses.won_by_robbing_kong) {
            status = statuses.won_by_stealing;
        }

        if (action.type === actions.win || action.type === actions.swin) {
            var newMelds = mahjong.findRegularMahjong(util.hist(allHands[activeSeat].unmeldedTiles));
            for (var k = 0; k < newMelds.length; k++) {
                allHands[activeSeat].melds.push(newMelds[k]);
            }
            allHands[activeSeat].unmeldedTiles = [];
        }

        return {
            status: status,
            allHands: allHands,
            remainingTiles: remainingTiles
        };
    };

    GameLogic.prototype.shouldKongLastTile = function(allHands, activeSeat, roundWind) {
        var lastNewTile = allHands[activeSeat].newTile;
        var result = mahjong.getDiscard(util.hist(this.getHandTiles(allHands[activeSeat])), this.getRemovedTiles(allHands[activeSeat]), util.windTile(roundWind), util.windTile(activeSeat));
        var score = result.recommended.score;
        var n = 0;
        for (var j = 0; j < score.length; j++) {
            if (score[j] > score[lastNewTile] && j !== lastNewTile) {
                n++;
            }
        }
        if (n > allHands[activeSeat].unmeldedTiles.length / 2) {
            return true;
        }
        return false;
    };

    GameLogic.prototype.shouldKongFourTiles = function(allHands, activeSeat/*, roundWind*/) {
        var should = false;
        var tile = 0;
        var hist = util.hist(allHands[activeSeat].unmeldedTiles);
        if (allHands[activeSeat].newTile !== undefined && allHands[activeSeat].newTile !== null) {
            hist[allHands[activeSeat].newTile]++;
        }
        for (var i = 0; i < hist.length; i++) {
            if (hist[i] === 4) {
                tile = i;
                should = true;
                break;
            }
        }
        return {
            should: should,
            tile: tile
        };
    };

    /**
     * This function implements this action: Get new tile and remove one
     * @param allHands
     * @param remainingTiles
     * @param seats
     * @param prevActiveSeat
     * @param nonAIAction
     * @param nonAIActionTile
     * @param prevAvailableActions
     */
    GameLogic.prototype.getResult = function(allHands, remainingTiles, seats, prevActiveSeat, nonAIAction, nonAIActionTile, prevAvailableActions, handNumber) {
        var activeSeat = nextSeat(prevActiveSeat);
        var nonAISeat = getNonAISeat(seats);
        var status = 'drawn';
        var payout;
        remainingTiles = remainingTiles.slice();
        var availActions;
        var actionResult;

        var roundWind = getRoundWind(handNumber);
        if (nonAIAction && nonAIAction.type !== actions.skip && prevAvailableActions) {
            if (nonAIActionTile === undefined || nonAIActionTile === null) {
                throw new HTTPError(400, 'missing action params');
            }
            for (var a = 0; a < prevAvailableActions.length; a++) {
                if (equalAction(prevAvailableActions[a], nonAIAction)) {
                    break;
                }
            }
            if (a === prevAvailableActions.length) {
                throw new HTTPError(400, 'non available action');
            }
            if (nonAIAction.type === actions.remove) {
                actionResult = this.doAction(allHands, remainingTiles, prevActiveSeat, nonAISeat, nonAIAction, nonAIActionTile);
                remainingTiles = actionResult.remainingTiles;
                allHands = actionResult.allHands;
                activeSeat = nonAISeat;
            } else {
                // if prevAction is a action for getting new tile, then ask him to select which one to remove
                var nonAIAvailActions = this.play(allHands, prevActiveSeat, nonAISeat, false, roundWind);

                for (var j = 0; j < nonAIAvailActions.length; j++) {
                    if (equalAction(nonAIAvailActions[j], nonAIAction)) {
                        break;
                    }
                }
                if (j === nonAIAvailActions.length) {
                    throw new HTTPError(400, 'invalid nonAIAction param');
                }

                actionResult = this.doAction(allHands, remainingTiles, prevActiveSeat, nonAISeat, nonAIAction);
                if (nonAIAction.type === actions.kong_last_tile || nonAIAction.type === actions.hidden_kong) {
                    availActions = [];
                    remainingTiles = actionResult.remainingTiles;
                    allHands = actionResult.allHands;
                    activeSeat = nonAISeat;
                }else if (actionResult.status === statuses.ok) {
                    //hey, player! then please select a tile to remove
                    activeSeat = prevActiveSeat;
                    availActions = [new Action(actions.remove)];
                } else {
                    //game ended by non-AI player? oh, shit!
                    status = 'finished';
                    payout = this.getPayout(seats, nonAISeat, actionResult.status, nonAIAction.tiles);
                }
            }
        } else {
            var dontAsk = false;
            if (nonAIAction && nonAIAction.type === actions.skip) {
                dontAsk = true;
            }

            // Get available actions and to-do for other players
            var seat = prevActiveSeat;
            var allAvailActions = {};
            for(var i = 0; i < 4; i++) {
                seat = nextSeat(seat);
                allAvailActions[seat] = this.play(allHands, prevActiveSeat, seat, seat !== nonAISeat, dontAsk, roundWind);
                if (activeSeat !== seat && allAvailActions[seat] && allAvailActions[seat].actionToDo) {
                    if (!allAvailActions[activeSeat].actionToDo) {
                        activeSeat = seat;
                    } else if (allAvailActions[seat].actionToDo.type > allAvailActions[activeSeat].actionToDo.type) {
                        activeSeat = seat; //Decide next active seat
                    }
                }
            }
            var winResult;
            if (activeSeat === nonAISeat) {
                if (allAvailActions[nonAISeat].availActions.length > 1) {
                    availActions = allAvailActions[nonAISeat].availActions;
                    activeSeat = prevActiveSeat;
                } else {
                    actionResult = this.doAction(allHands, remainingTiles, prevActiveSeat, activeSeat, allAvailActions[activeSeat].actionToDo /*actions.from_deck*/);
                    //hey, player! then please select a tile to remove

                    if (actionResult.status === statuses.ok || actionResult.status === statuses.last_tile_of_kong || actionResult.status === statuses.four_tiles_of_kong) {
                        availActions = [new Action(actions.remove)];
                        if (actionResult.status === statuses.last_tile_of_kong) {
                            availActions.push(new Action(actions.kong_last_tile, [allHands[activeSeat].newTile, allHands[activeSeat].newTile, allHands[activeSeat].newTile, allHands[activeSeat].newTile]));
                        } else if (actionResult.status === statuses.four_tiles_of_kong) {
                            var hist = util.hist(allHands[activeSeat].unmeldedTiles);
                            if (allHands[activeSeat].newTile !== undefined && allHands[activeSeat].newTile !== null) {
                                hist[allHands[activeSeat].newTile]++;
                            }
                            for (var k = 0; k < hist.length; k++) {
                                if (hist[k] === 4) {
                                    availActions.push(new Action(actions.hidden_kong, [k, k, k, k]));
                                }
                            }
                        }
                        winResult = this.isWinningHand(allHands, activeSeat, null, allHands[activeSeat].newTile, roundWind, false);
                        if (winResult.result === true) {
                            availActions.push(new Action(actions.swin, [winResult.fan, null, winResult.fan_items]));
                        }
                        activeSeat = prevActiveSeat;
                    } else {
                        //no remaining tiles
                        status = 'finished';
                        payout = this.getPayout(seats, activeSeat, actionResult.status, allAvailActions[activeSeat].actionToDo.tiles);
                    }
                }

            } else {
                actionResult = this.doAction(allHands, remainingTiles, prevActiveSeat, activeSeat, allAvailActions[activeSeat].actionToDo);

                if (actionResult.status === statuses.ok || actionResult.status === statuses.last_tile_of_kong || actionResult.status === statuses.four_tiles_of_kong) {
                    winResult = this.isWinningHand(allHands, activeSeat, null, allHands[activeSeat].newTile, roundWind, false);
                    if (winResult.result === true) {
                        actionResult = this.doAction(allHands, remainingTiles, prevActiveSeat, activeSeat, new Action(actions.swin));
                        remainingTiles = actionResult.remainingTiles;
                        allHands = actionResult.allHands;
                        status = 'finished';
                        payout = this.getPayout(seats, activeSeat, actionResult.status, [winResult.fan, null, winResult.fan_items]);
                    } else {
                        if (actionResult.status === statuses.last_tile_of_kong && this.shouldKongLastTile(allHands, activeSeat, roundWind)) {
                            actionResult = this.doAction(allHands, remainingTiles, prevActiveSeat, activeSeat, new Action(actions.kong_last_tile, [allHands[activeSeat].newTile, allHands[activeSeat].newTile, allHands[activeSeat].newTile, allHands[activeSeat].newTile]));
                            remainingTiles = actionResult.remainingTiles;
                            allHands = actionResult.allHands;
                        } else if (actionResult.status === statuses.four_tiles_of_kong && this.shouldKongFourTiles(allHands, activeSeat, roundWind).should) {
                            var should = this.shouldKongFourTiles(allHands, activeSeat, roundWind);
                            actionResult = this.doAction(allHands, remainingTiles, prevActiveSeat, activeSeat, new Action(actions.hidden_kong, [should.tile, should.tile, should.tile, should.tile]));
                            remainingTiles = actionResult.remainingTiles;
                            allHands = actionResult.allHands;
                        } else {
                            var tileToBeRemoved;
                            // For testing
                            if (nonAIAction && nonAIAction.type === actions.remove && nonAIActionTile !== null) {
                                tileToBeRemoved = nonAIActionTile;
                            } else {
                                tileToBeRemoved = this.selectTileToBeRemoved(allHands, activeSeat, roundWind, nonAISeat);
                            }
                            actionResult = this.doAction(allHands, remainingTiles, prevActiveSeat, activeSeat, new Action(actions.remove), tileToBeRemoved);
                            remainingTiles = actionResult.remainingTiles;
                            allHands = actionResult.allHands;
                        }
                    }
                } else {
                    //game ended by AI player or no remaining tiles? oh, good!
                    status = 'finished';
                    payout = this.getPayout(seats, activeSeat, actionResult.status, allAvailActions[activeSeat].actionToDo.tiles);
                }
            }
        }

        return {
            availActions: availActions,
            remainingTiles: remainingTiles,
            allHands: allHands,
            activeSeat: activeSeat,
            status: status,
            payout: payout
        };
    };

    return GameLogic;
};
