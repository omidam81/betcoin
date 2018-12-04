'use strict';
Application.Directives.directive('betPanel', [
    'BCSession',
    function(BCSession) {
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
                scope.BCSession = BCSession;
                scope.setBet = function(bet) {
                    if (!scope.player || !BCSession.user.wallets[BCSession.currency].balance) {
                        bet = 0;
                    } else if (bet <= BCSession.user.wallets[BCSession.currency].balance.toBitcoin()) {
                        bet = bet;
                    } else {
                        bet = 0;
                    }
                    return bet.toSatoshi();
                };
                scope.betPercent = function(bet) {
                    var wager;
                    if (!scope.player || !BCSession.user.wallets[BCSession.currency].balance) {
                        wager = 0;
                    } else {
                        wager = Math.floor(BCSession.user.wallets[BCSession.currency].balance * bet);
                    }
                    return Math.ceil(wager);
                };
            }
        };
    }
]);
