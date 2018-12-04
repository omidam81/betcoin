'use strict';
Application.Directives.directive('betPanelFixed', [
    'BCSession',
    function(BCSession) {
        return {
            replace: true,
            restrict: 'E',
            link: function(scope, element) {

                scope.$watch('onlinebets', function(newValue) {
                    if (newValue && Object.keys(newValue).length > 0) {
                        $('input', element).attr('disabled', 'disabled');
                        $('button', element).attr('disabled', 'disabled');
                        $('percent-slider', element).attr('disabled', 'disabled');
                    } else {
                        $('input', element).attr('disabled', null);
                        $('button', element).attr('disabled', null);
                        $('percent-slider', element).attr('disabled', null);
                    }
                });

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