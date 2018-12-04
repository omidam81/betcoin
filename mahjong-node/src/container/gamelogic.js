'use strict';

//var HTTPError = require('httperror-npm');
var provable = require('provably-fair-npm');

module.exports = function() {
    var self = this;

    var seatKeys = ['east','south', 'west', 'north'];
    var defaultSeats = {
        'east': 'Ming',
        'south': 'Wayne',
        'west': 'Katat',
        'north': 'Vince'
    };

    var equal = function(tile1, tile2) {
        return (tile1.suit === tile2.suit && tile1.rank ===tile2.rank);
    };

    var isBonusTile = function(tile) {
        return (tile.suit === 'flower' || tile.suit === 'season');
    };

    this.unshuffledTiles = [
        /* Suited tiles - 3 x 9 x 4*/
        {suit: 'circle', rank: 1},
        {suit: 'circle', rank: 2},
        {suit: 'circle', rank: 3},
        {suit: 'circle', rank: 4},
        {suit: 'circle', rank: 5},
        {suit: 'circle', rank: 6},
        {suit: 'circle', rank: 7},
        {suit: 'circle', rank: 8},
        {suit: 'circle', rank: 9},
        {suit: 'circle', rank: 1},
        {suit: 'circle', rank: 2},
        {suit: 'circle', rank: 3},
        {suit: 'circle', rank: 4},
        {suit: 'circle', rank: 5},
        {suit: 'circle', rank: 6},
        {suit: 'circle', rank: 7},
        {suit: 'circle', rank: 8},
        {suit: 'circle', rank: 9},
        {suit: 'circle', rank: 1},
        {suit: 'circle', rank: 2},
        {suit: 'circle', rank: 3},
        {suit: 'circle', rank: 4},
        {suit: 'circle', rank: 5},
        {suit: 'circle', rank: 6},
        {suit: 'circle', rank: 7},
        {suit: 'circle', rank: 8},
        {suit: 'circle', rank: 9},
        {suit: 'circle', rank: 1},
        {suit: 'circle', rank: 2},
        {suit: 'circle', rank: 3},
        {suit: 'circle', rank: 4},
        {suit: 'circle', rank: 5},
        {suit: 'circle', rank: 6},
        {suit: 'circle', rank: 7},
        {suit: 'circle', rank: 8},
        {suit: 'circle', rank: 9},
        {suit: 'bamboo', rank: 1},
        {suit: 'bamboo', rank: 2},
        {suit: 'bamboo', rank: 3},
        {suit: 'bamboo', rank: 4},
        {suit: 'bamboo', rank: 5},
        {suit: 'bamboo', rank: 6},
        {suit: 'bamboo', rank: 7},
        {suit: 'bamboo', rank: 8},
        {suit: 'bamboo', rank: 9},
        {suit: 'bamboo', rank: 1},
        {suit: 'bamboo', rank: 2},
        {suit: 'bamboo', rank: 3},
        {suit: 'bamboo', rank: 4},
        {suit: 'bamboo', rank: 5},
        {suit: 'bamboo', rank: 6},
        {suit: 'bamboo', rank: 7},
        {suit: 'bamboo', rank: 8},
        {suit: 'bamboo', rank: 9},
        {suit: 'bamboo', rank: 1},
        {suit: 'bamboo', rank: 2},
        {suit: 'bamboo', rank: 3},
        {suit: 'bamboo', rank: 4},
        {suit: 'bamboo', rank: 5},
        {suit: 'bamboo', rank: 6},
        {suit: 'bamboo', rank: 7},
        {suit: 'bamboo', rank: 8},
        {suit: 'bamboo', rank: 9},
        {suit: 'bamboo', rank: 1},
        {suit: 'bamboo', rank: 2},
        {suit: 'bamboo', rank: 3},
        {suit: 'bamboo', rank: 4},
        {suit: 'bamboo', rank: 5},
        {suit: 'bamboo', rank: 6},
        {suit: 'bamboo', rank: 7},
        {suit: 'bamboo', rank: 8},
        {suit: 'bamboo', rank: 9},
        {suit: 'character', rank: 1},
        {suit: 'character', rank: 2},
        {suit: 'character', rank: 3},
        {suit: 'character', rank: 4},
        {suit: 'character', rank: 5},
        {suit: 'character', rank: 6},
        {suit: 'character', rank: 7},
        {suit: 'character', rank: 8},
        {suit: 'character', rank: 9},
        {suit: 'character', rank: 1},
        {suit: 'character', rank: 2},
        {suit: 'character', rank: 3},
        {suit: 'character', rank: 4},
        {suit: 'character', rank: 5},
        {suit: 'character', rank: 6},
        {suit: 'character', rank: 7},
        {suit: 'character', rank: 8},
        {suit: 'character', rank: 9},
        {suit: 'character', rank: 1},
        {suit: 'character', rank: 2},
        {suit: 'character', rank: 3},
        {suit: 'character', rank: 4},
        {suit: 'character', rank: 5},
        {suit: 'character', rank: 6},
        {suit: 'character', rank: 7},
        {suit: 'character', rank: 8},
        {suit: 'character', rank: 9},
        {suit: 'character', rank: 1},
        {suit: 'character', rank: 2},
        {suit: 'character', rank: 3},
        {suit: 'character', rank: 4},
        {suit: 'character', rank: 5},
        {suit: 'character', rank: 6},
        {suit: 'character', rank: 7},
        {suit: 'character', rank: 8},
        {suit: 'character', rank: 9},
        /* Honor tiles - 7 x 4 */
        {suit: 'wind', rank: 'east'},
        {suit: 'wind', rank: 'south'},
        {suit: 'wind', rank: 'west'},
        {suit: 'wind', rank: 'north'},
        {suit: 'wind', rank: 'east'},
        {suit: 'wind', rank: 'south'},
        {suit: 'wind', rank: 'west'},
        {suit: 'wind', rank: 'north'},
        {suit: 'wind', rank: 'east'},
        {suit: 'wind', rank: 'south'},
        {suit: 'wind', rank: 'west'},
        {suit: 'wind', rank: 'north'},
        {suit: 'wind', rank: 'east'},
        {suit: 'wind', rank: 'south'},
        {suit: 'wind', rank: 'west'},
        {suit: 'wind', rank: 'north'},
        {suit: 'dragon', rank: 'red'},
        {suit: 'dragon', rank: 'green'},
        {suit: 'dragon', rank: 'white'},
        {suit: 'dragon', rank: 'red'},
        {suit: 'dragon', rank: 'green'},
        {suit: 'dragon', rank: 'white'},
        {suit: 'dragon', rank: 'red'},
        {suit: 'dragon', rank: 'green'},
        {suit: 'dragon', rank: 'white'},
        {suit: 'dragon', rank: 'red'},
        {suit: 'dragon', rank: 'green'},
        {suit: 'dragon', rank: 'white'},
        /* Flower tiles */
        {suit: 'flower', rank: 'plum'},
        {suit: 'flower', rank: 'orchid'},
        {suit: 'flower', rank: 'chrysan'},
        {suit: 'flower', rank: 'bamboo'},
        /* Season tiles */
        {suit: 'season', rank: 'spring'},
        {suit: 'season', rank: 'summer'},
        {suit: 'season', rank: 'autumn'},
        {suit: 'season', rank: 'winter'}
    ];

    /*var Group = function(tiles) {
        var self = this;
        this.hasTile = function(tile) {
            return this.indexOf(tile) >= 0;
        };
        this.indexOf = function(tile) {
            for(var t = 0; t < this.tiles.length; t++) {
                if(equal(tile, this.tiles[t])) {
                    return t;
                }
            }
            return -1;
        };
        this.lastIndexOf = function(tile) {
            for(var t = this.tiles.length - 1; t >= 0; t--) {
                if(equal(tile, this.tiles[t])) {
                    return t;
                }
            }
            return -1;
        };
        this.count = function(tile) {
            var cnt = 0;
            for(var t = 0; t < this.tiles.length; t++) {
                if(equal(tile, this.tiles[t])) {
                    cnt += 1;
                }
            }
            return cnt;
        };

        this.addTile = function(tile) {
            self.tiles.push(tile);
        };

        //TODO: isKong, isPong, isChow,


        if (tiles && tiles.length > 0) {
            this.tiles = tiles;
        } else {
            this.tiles = [];
        }
    };*/

    var Hand = function() {
        this.melds = [];
        this.unmeldedTiles = []; // Without Bonus - this.unmeldedTiles + this.melds.tilesLength = 13
        this.bonusTiles = [];
        this.newTile = null;
        this.removedTiles = [];
    };

    this.getShuffledTiles = function(seed, tiles) {
        return provable.seededShuffle(seed, tiles);
    };

    this.rolldice = function(seed) {
        var res = provable.seededMatrix(seed, {
            height: 1,
            width: 3,
            min: 1,
            max: 6
        });
        return res[0];
    };

    this.getSeat = function(number) {
        number = number % 4 - 1;
        if (number < 0) {
            number = 3;
        }
        return seatKeys[number];
    };

    this.nextSeat = function(seat) {
        var i = seatKeys.indexOf(seat);
        i = i + 1;
        if (i >= seatKeys.length) {
            i = 0;
        }

        return seatKeys[i];
    };

    this.nextSeats = function(prevSeats) {
        var seats = defaultSeats;
        for(var i = 0;i < seatKeys.length; i++) {
            var seat = seatKeys[i];
            var nextSeat = this.nextSeat(seat);
            seats[seat] = prevSeats[nextSeat];
        }
        return seats;
    };

    this.initHands = function(seed, prevSeats) {
        var dices;
        var seats;
        if (prevSeats === undefined) {
            dices = this.rolldice(seed);
            var sum = (dices[0] + dices[1] + dices[2]) % 4;
            var playerSeat = this.getSeat(sum);
            seats = defaultSeats;
            seats[playerSeat] = 'player';
        } else {
            seats = this.nextSeats(prevSeats);
        }

        var tiles = self.getShuffledTiles(seed, self.unshuffledTiles);
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
                    if (isBonusTile(dealedTiles[wind].unmeldedTilesWithBonus[i])) {
                        dealedTiles[wind].bonusTiles.push(dealedTiles[wind].unmeldedTilesWithBonus[i]);
                    } else {
                        dealedTiles[wind].unmeldedTiles.push(dealedTiles[wind].unmeldedTilesWithBonus[i]);
                    }
                }
                while (dealedTiles[wind].unmeldedTiles.length < 13) {
                    var tile = tiles.pop();
                    if (isBonusTile(tile)) {
                        dealedTiles[wind].bonusTiles.push(tile);
                    } else {
                        dealedTiles[wind].unmeldedTiles.push(tile);
                    }
                }
                delete dealedTiles[wind].unmeldedTilesWithBonus;
            }
        }

        return {
            playersHand: dealedTiles,
            allTiles: allTiles,
            remainingTiles: tiles,
            seats: seats,
            dices: dices
        };
    };

    this.dealNewTile = function(playersHand, remainingTiles, activeSeat) {
        var tile = remainingTiles.pop();
        while (isBonusTile(tile)) {
            playersHand[activeSeat].bonusTiles.push(tile);
            tile = remainingTiles.pop();
        }
        playersHand[activeSeat].newTile = tile;
        return {
            playersHand: playersHand,
            remainingTiles: remainingTiles
        };
    };

    this.removeTile = function(playersHand, activeSeat, tileToBeRemoved) {
        var removed = false;
        for(var i = 0; i < playersHand[activeSeat].unmeldedTiles.length; i++) {
            if (equal(playersHand[activeSeat].unmeldedTiles[i], tileToBeRemoved)) {
                removed = true;
                playersHand[activeSeat].unmeldedTiles.splice(i, 1);
                playersHand[activeSeat].removedTiles.push(tileToBeRemoved);
                break;
            }
        }
        if (!removed) {
            if (equal(playersHand[activeSeat].newTile, tileToBeRemoved)) {
                playersHand[activeSeat].removedTiles.push(tileToBeRemoved);
                playersHand[activeSeat].newTile = null;
            } else {
                //TODO: error;
                return false;
            }
        } else {
            playersHand[activeSeat].unmeldedTiles.push(playersHand[activeSeat].newTile);
            playersHand[activeSeat].newTile = null;
        }

        return playersHand;
    };

    this.play = function(playersHand, seats, activeSeat) {

    };

    /**
     * Returns payout
     * @param wager
     * @param result | compare result
     * @returns {number}
     */
    this.getPayout = function(wager, result) {
        var payout = 0;
        if(result === 1){
            payout = 2 * wager - wager * 0.05; //commission = 5%
        } else if(result === 0){
            payout = wager;
        }
        return payout;
    };

    this.getResult = function(params) {
        var playerHand = new Hand(params.playerHand.tiles);
        var dealerHand = new Hand(params.dealerHand.tiles);
        var wager = params.wager;

        var houseWay = params.houseWay;
        if (houseWay) {
            playerHand.houseWay();
            dealerHand.houseWay();
        } else {
            playerHand.split(params.split);
            dealerHand.houseWay();
        }

        var result = playerHand.compare(dealerHand);
        var payout = this.getPayout(wager, result);

        return {
            playerHand: playerHand,
            dealerHand: dealerHand,
            payout: payout,
            isWin: result === 1,
            isPush: result === 0
        };
    };

    return self;
};
