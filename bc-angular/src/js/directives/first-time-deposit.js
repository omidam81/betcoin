'use strict';

Application.Directives.directive('firstTimeDeposit', ['BCPlayer', 'BCSession', 'PlayerApi', 'exchangeRate', function(BCPlayer, BCSession, PlayerApi, exchangeRate) {
    return {
        restrict:'E',
        templateUrl: 'tpl/directives/first-time-deposit.html',
        link: function(scope) {
            var userUpdate = function(ev, user) {
                if (user) {
                    scope.user = user;
                    BCPlayer.Bonus.query(function(bonuses){
                        bonuses.forEach(function(bonus) {
                            if (bonus.meta && bonus.meta.ftd === true) {
                                if (!bonus.activatedAt) {
                                    scope.nextBonus = bonus;
                                }
                            }
                        });
                    });
                }
            };

            BCPlayer.$on('user update', userUpdate);

            scope.lang = PlayerApi.lang;
            var fiat = (scope.lang === 'en_US') ? 'USD': 'CNY';
            scope.fiat = fiat;

            scope.getExchange = function(btcValue)  {

                var retval = exchangeRate.convert(btcValue, scope.fiat);
                return retval;

            };

        }
    };
}]);
