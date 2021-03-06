'use strict';
Application.Directives.directive('cashoutButton', ['BCPlayer',

    function(BCPlayer) {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                player: '=',
                game: '='
            },
            templateUrl: 'tpl/directives/cashout-button.html',
            link: function(scope) {
                scope.initiateWithdraw = function() {
                    scope.error = null;
                    if (!scope.player.email) {
                        scope.withdrawPending = true;
                    } else {
                        window.location.replace('/account');
                    }
                };
                scope.cashOut = function() {
                    BCPlayer.User.withdraw({
                        amount: scope.player.balance.btc,
                        currency: 'btc'
                    }, function() {
                        scope.playSound('cashoutSound');
                        window.location.reload();
                    }, function(err) {
                        scope.error = err.data;
                    });
                };
            }
        };
    }
]);