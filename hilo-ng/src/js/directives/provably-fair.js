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
            var cardRanks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
            var getUnshuffledCards = function(){
                var cards = [];
                for(var index = 0; index < 13; index++){
                    var card = {rank:cardRanks[index]};
                    cards.push(card);
                }
                return cards;
            };

            var makeCardSuits = function (cards, seed) {
                var suits = ['C','D','H','S'];
                var suitsToShuffle = [];
                for(var i=0;i<3;i++){
                    suitsToShuffle = suitsToShuffle.concat(suits);
                }
                var shuffledSuits = seededShuffle(suitsToShuffle, seed);
                for(var cardIndex=0;cardIndex<cards.length;cardIndex++){
                    cards[cardIndex].suit = shuffledSuits[cardIndex];
                }
                return cards;
            };

            var getShuffledCards = function (seed) {
                var cards = getUnshuffledCards();
                cards = seededShuffle(cards, seed);
                var shuffledCards = cards.splice(0,12);
                shuffledCards = makeCardSuits(shuffledCards, seed);
                return shuffledCards;
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