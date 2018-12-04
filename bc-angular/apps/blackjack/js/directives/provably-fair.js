'use strict';

var provablyFair = function() {
    return {
        restrict: 'E',
        scope:{
            serverSeed: '@',
            clientSeed: '@',
            initArray: '='
        },
        templateUrl: 'tpl/directives/provably-fair.html',
        link: function(scope) {
            var sha256sum = function(data) {
                var hashObj = new window.jsSHA(data, "TEXT");
                return hashObj.getHash("SHA-256", "HEX");
            };
            var seededShuffle = function(items, seed) {
                var counter = items.length;
                var partialDivisor = (parseInt('ffff', 16) + 1);
                var spinMin = 0;
                var spinMax = items.length - 1;
                while (counter > 0) {
                    var checkHash = sha256sum("" + counter + seed, "TEXT");
                    var partial = checkHash.substring(0, 4);
                    var rand = parseInt(partial, 16) / partialDivisor;
                    var randIndex = Math.floor(rand * (spinMax - spinMin + 1) + spinMin);
                    counter--;
                    var tmp = items[counter];
                    items[counter] = items[randIndex];
                    items[randIndex] = tmp;
                }
                return items;
            };

            var getCardRank = function(order) {
                var cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
                return cards[order];
            };

            var getCardSuit = function(order) {
                var suits = ["C", "D", "H", "S"];
                return suits[order];
            };

            var getUnshuffledCards = function(){
                var cards = [];
                for(var deck=0;deck<8;deck++){
                    for(var cardNum = 0; cardNum < 13; cardNum++){
                        for(var type = 0; type < 4; type++){
                            var suit = "";
                            var rank = "";
                            suit = getCardSuit(type);
                            rank = getCardRank(cardNum);
                            var card = {suit:suit,rank:rank};
                            cards.push(card);
                        }
                    }
                }
                return cards;
            };

            var getShuffledCards = function (seed) {
                var cards = getUnshuffledCards();
                return seededShuffle(cards, seed);
            };

            scope.verify = function(){
                scope.initialHash = sha256sum(scope.serverSeed);
                var finalArray = getShuffledCards(scope.clientSeed + scope.serverSeed);
                scope.finalArray = JSON.stringify(finalArray);
            };
        }
    };
};
Application.Directives.directive('provablyFair', [provablyFair]);