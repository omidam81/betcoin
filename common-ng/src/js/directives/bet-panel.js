'use strict';
Application.Directives.directive('betPanel', [

    function() {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                wager: '=',
                player: '=',
                currencyAbbr: '='
            },
            templateUrl: 'tpl/directives/bet-panel.html',
            link: function(scope) {
                scope.setBet = function(bet) {
                    if (!scope.player || !scope.player.balance.btc) {
                        bet = 0;
                    } else if (bet <= scope.player.balance.btc.toBitcoin()) {
                        bet = bet;
                    } else {
                        bet = scope.player.balance.btc.toBitcoin();
                    }
                    return bet.toSatoshi();
                };
                scope.betPercent = function(bet) {
                    var wager;
                    if (!scope.player || !scope.player.balance.btc) {
                        wager = 0;
                    } else {
                        wager = Math.floor(scope.player.balance.btc * bet);
                    }
                    return Math.ceil(wager);
                };
            }
        };
    }
]);