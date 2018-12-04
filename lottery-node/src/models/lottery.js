'use strict';

var modella = require('modella');
var validators = require('modella-validators');
var filter = require('modella-filter');
var provable = require('provably-fair-npm');
var util = require('util');
var HTTPError = require('httperror-npm');

/**
 * The lottery game, change all instances of 'Lottery' and 'lottery' to reflect what you are developing
 * This example represents a coin flip
 */

module.exports = function(modelStore, PlayerInterface, Bet, logger) {


    var Lottery = modella('lottery')
            .attr('_id')
            .attr('server_seed', {required: true, format: /[a-f0-9]{32}/}) // server_seed is always 16 bytes of hex
            .attr('seed_hash', {required: true, format: /[a-f0-9]+/}) // seed_hash is a hex encoded sha256
            .attr('ticket_price', {required: true, type: 'number'})
            .attr('interval', {required: true, format: /[0-9]+[mhdwMy]/}) // interval string, ex: 4d, 12h
            .attr('start', {required: true, type: 'date'}) // start time of the lottery game
            .attr('end', {required: true, type: 'date'}) // end time of the lottery game
            .attr('result', {type: 'string'}) // the winning player id
            .attr('player_alias', {type: 'string'}) // the winning player id
            .attr('jackpot', {type: 'number'})
            .attr('tickets_by_player', {type: 'number'})
            .attr('total_tickets', {type: 'number'})
            .attr('lock');

    Lottery.use(validators);
    Lottery.use(modelStore);
    Lottery.use(filter);

    var HOUSE_TAKE = Lottery.HOUSE_TAKE = 0.12;
    var DEFAULT_TICKET_PRICE = Lottery.DEFAULT_TICKET_PRICE = (0.00001).toSatoshi();

    Lottery.prototype.getBets = function(cb) {
        var self = this;
        var query = {
            lottery_id: this.primary(),
            player_id: {$exists: true}
        };
        Bet.all(query, {sort: {createdAt: 1}}, function(err, bets) {
            if (err) return cb(new HTTPError(500, err.message));
            logger.info("%d bets found for %s lottery (%s)", bets.length, self.interval(), self.primary().toHexString());
            if (bets.length) {
                return cb(undefined, bets);
            } else {
                return cb(undefined, []);
            }
        });
    };

    Lottery.prototype.getCurrentJackpot = function(cb) {
        var players = [];
        this.getBets(function(err, bets) {
            if (err) return cb(err);
            var jackpot = 0;
            var totalWager = 0;
            var returnWager = null;
            bets.forEach(function(bet) {
                if (players.indexOf(bet.player_alias()) === -1){
                    players.push(bet.player_alias());
                }
                jackpot += Math.floor(bet.wager() * (1 - HOUSE_TAKE));
                totalWager += bet.wager();
            });
            if (players.length === 1) {
                returnWager = totalWager;
            }
            return cb(undefined, jackpot, returnWager);
        });
    };

    Lottery.prototype.getPlayerTotal = function(player_id, cb) {
        this.getBets(function(err, bets) {
            if (err) return cb(err);
            var totalPlayerWager = 0;
            var totalWager = 0;
            bets.forEach(function(bet) {
                if (bet.player_id().toString() === player_id){
                    totalPlayerWager += bet.wager();
                }
                totalWager += bet.wager();
            });
            return cb(undefined, totalPlayerWager, totalWager);
        });
    };

    Lottery.prototype.selectWinner = function(cb, notSaveWinner) {
        var self = this;
        var ticketBin = [];
        var totalTickets = 0;
        var ticketsByPlayer = {};
        var seedString = "";
        logger.info("selecting winner for %s lottery (%s)", this.interval(), this.primary(), {});
        self.getBets(function(err, bets) {
            if (err) return cb(err);
            var startIndex = 0;
            var endIndex = 0;
            bets.forEach(function(bet) {
                var tickets = Math.floor(bet.wager() / self.ticket_price());
                endIndex = startIndex + tickets;
                ticketBin.push({
                    player_id:bet.player_id(),
                    player_alias:bet.player_alias(), 
                    start_index: startIndex, 
                    end_index: endIndex
                });
                totalTickets += tickets;
                startIndex = endIndex + 1;
                seedString += bet.combined_seed();
                if(!ticketsByPlayer[bet.player_id()]){
                    ticketsByPlayer[bet.player_id()] = 0;
                }
                ticketsByPlayer[bet.player_id()] += tickets;
            });
            logger.log('info', '%d tickets in bin for %s lottery', totalTickets, self.interval());
            if (!totalTickets) return cb(new HTTPError(411, "no tickets"));
            var gameHash = provable.sha512hmac(seedString, self.server_seed());
            var lucky = NaN;
            var partial = "";
            var winIndex = -1;
            var powerFound = false;
            for (var power = 1; powerFound === false; power++) {
                var maxroll = Math.pow(16, power);
                if (maxroll >= totalTickets) {
                    partial = gameHash.substring(0, power);
                    lucky = parseInt(partial, 16);
                    winIndex = Math.floor((totalTickets / maxroll) * lucky);
                    powerFound = true;
                }
            }
            logger.log('info', 'power: %d, partial: %s, win index: %s', power - 1, partial, winIndex);
            var winner, winnerUsername;
            for(var ticket in ticketBin){
                if(ticketBin.hasOwnProperty(ticket)){
                    if(winIndex >= ticketBin[ticket].start_index && winIndex <= ticketBin[ticket].end_index){
                        winner = ticketBin[ticket].player_id;
                        winnerUsername = ticketBin[ticket].player_alias;
                    }
                }
            }
            self.getCurrentJackpot(function(err, jackpot, returnWager) {
                if (err) return cb(err);
                if (notSaveWinner){
                    self.set({
                        result: winner,
                        player_alias: winnerUsername,
                        tickets_by_player: ticketsByPlayer[winner],
                        total_tickets: totalTickets,
                        jackpot: jackpot
                    });
                    return cb(undefined, self);
                }
                if(returnWager){
                    jackpot = returnWager;
                }
                logger.info('winner selected', {player_id: winner, jackpot: jackpot.toBitcoinString()});
                PlayerInterface.credit(winner, jackpot, {
                    type: "lottery:winnings",
                    refId: "winnings:" + self.primary()
                }, function(err) {
                    if (err) return cb(new HTTPError(500, "error crediting player!: " + err.message));
                    self.set({
                        result: winner,
                        player_alias: winnerUsername,
                        jackpot: jackpot,
                        tickets_by_player: ticketsByPlayer[winner]
                    });
                    self.save(function(err) {
                        if (err) return cb(new HTTPError(500, "error saving win data: " + err.message));
                        var winnerJson = self.filter();
                        winnerJson.type = 'win_lottery';
                        winnerJson.userIds = [winner];
                        winnerJson.sendEmail = winnerJson.type;
                        if(winnerJson.interval.indexOf('m') === -1){
                            PlayerInterface.sendNotifications(winnerJson, function(){});
                        }
                        return cb(undefined, self);
                    });
                });
            });
        });
    };

    /**
     * init
     *
     * set up a new lottery game
     *
     */

    Lottery.init = function(config, cb) {
        logger.debug('Lottery.init');
        if (!config.ticketPrice) config.ticketPrice = DEFAULT_TICKET_PRICE;
        config.ticketPrice = parseInt(config.ticketPrice);
        if (isNaN(config.ticketPrice)) return cb(new HTTPError(400, "invalid ticket price"));
        if (!util.isDate(config.start) || isNaN(config.start.getTime())) return cb(new HTTPError(400, "invalid start date"));
        if (!util.isDate(config.end) || isNaN(config.end.getTime())) return cb(new HTTPError(400, "invalid end date"));
        var server_seed = provable.getRandomSeed();
        var newLottery = new Lottery({
            server_seed: server_seed,
            // hash using the provable library's hashing function
            seed_hash: provable.sha256sum(server_seed),
            start: config.start,
            end: config.end,
            interval: config.interval,
            ticket_price: config.ticketPrice,
            lock: false
        });
        newLottery.save(function(err) {
            if (err) {
                return cb(new HTTPError(500, err.message || err));
            }
            // only return a hash of the server seed and any other init info
            cb(undefined, {
                nextGameId: newLottery.primary(),
                sha256: newLottery.seed_hash()
            });
        });
    };

    Lottery.checkLock = function(gameId, cb) {
        Lottery.find(gameId, function(err, gameData) {
            if (err) return cb(new HTTPError(500, err.message));
            if (!gameData) return cb(new HTTPError(404, 'game not found'));
            if (gameData.lock()) return cb(new HTTPError(423, 'game is already in progress'));
            gameData.lock(true);
            gameData.save(function(err) {
                if (err) return cb(new HTTPError(500, err.message));
                cb(undefined, gameData);
            });
        });
    };

    return Lottery;
};
