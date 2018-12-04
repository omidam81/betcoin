'use strict';

var provablyFair = function() {
    return {
        restrict: 'E',
        scope:{
            serverSeed: '@',
            ticketPrice: '@',
            bets: '='
        },
        templateUrl: 'tpl/directives/provably-fair.html',
        link: function(scope) {
            var sha256sum = function(data) {
                var hashObj = new window.jsSHA(data, "TEXT");
                return hashObj.getHash("SHA-256", "HEX");
            };
            var sha512hmac = function(data, key) {
                var hashObj = new window.jsSHA(data, "TEXT");
                var checkHash = hashObj.getHMAC(key, "TEXT", "SHA-512", "HEX");
                return checkHash;
            };
            var getJackpot = function(bets) {
                var jackpot = 0;
                var HOUSE_TAKE = 0.18;

                bets.forEach(function(bet) {
                    jackpot += Math.floor(bet.wager * (1 - HOUSE_TAKE));
                });
                return jackpot;
            };

            scope.verify = function(){
                var ticketBin = [];
                var seedString = "";
                var totalTickets = 0;
                var startIndex = 0;
                var endIndex = 0;

                var bets = JSON.parse(JSON.stringify(scope.bets));

                bets.sort(function(a,b){
                    if(a.createdAt > b.createdAt){
                        return 1;
                    }
                    if(a.createdAt < b.createdAt){
                        return -1;
                    }
                    if(a.createdAt === b.createdAt){
                        return 0;
                    }
                }).forEach(function(bet) {
                    var tickets = Math.floor(bet.wager / scope.ticketPrice);
                    // var combined_seed = sha512hmac(bet.client_seed+'', bet.server_seed);
                    seedString += bet.combined_seed;

                    totalTickets += tickets;
                    endIndex = startIndex + tickets;
                    ticketBin.push({
                        player_id: bet.player_id,
                        player_alias: bet.player_alias,
                        start_index: startIndex,
                        end_index: endIndex
                    });
                    startIndex = endIndex + 1;
                });
                var gameHash = sha512hmac(seedString, scope.serverSeed);
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
                var winner, winnerUsername;
                for(var ticket in ticketBin){
                    if(ticketBin.hasOwnProperty(ticket)){
                        if(winIndex >= ticketBin[ticket].start_index && winIndex <= ticketBin[ticket].end_index){
                            winner = ticketBin[ticket].player_id;
                            winnerUsername = ticketBin[ticket].player_alias;
                        }
                    }
                }
                var jackpot = getJackpot(scope.bets);

                scope.lottery = {
                    result: winner,
                    player_alias: winnerUsername,
                    jackpot: jackpot,
                    seed_hash: sha256sum(scope.serverSeed)
                };
            };
        }
    };
};
Application.Directives.directive('provablyFair', [provablyFair]);