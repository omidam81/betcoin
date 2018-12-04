(function(window, Application) {
    'use strict';

    var InfoBarController = function($scope, BCPlayer, PlayerApi,
                                     Jackpots, exchangeRate, BCSession) {
        $scope.lang = PlayerApi.lang;
        $scope.BCSession = BCSession;
        $scope.displayCurrency = BCSession.currency || 'bitcoin';
        $scope.$watch('BCSession.currency', function(newCurr) {
            if (newCurr) {
                $scope.displayCurrency = newCurr;
            }
        });
        var fiat = ($scope.lang === 'en_US') ? 'USD': 'CNY';
        $scope.fiat = fiat;

        var convertWallets = function() {
            Object.keys($scope.user.wallets).forEach(function(currency) {
                if (!(/coin$/).test(currency)) {
                    return;
                }
                var wallet = $scope.user.wallets[currency];
                var btcValue = exchangeRate.bitcoinValue(wallet.balance, wallet.currency);
                wallet.fiatBalance = exchangeRate.convert(btcValue, fiat);
            });
        };

        var userUpdate = function(ev, user) {
            if (user && user.wallets) {
                $scope.user = user;
                convertWallets();
            }
        };

        BCPlayer.$on('user update', userUpdate);
        BCPlayer.$on('valid wallet', userUpdate);
        BCPlayer.$on('game finished', userUpdate);

        var processJackpots = function(data) {
            $scope.jackpots = data;
            $scope.jackpots.forEach(function(jackpot) {
                jackpot.fiatWagered = exchangeRate.convert(jackpot.wagered, fiat);
                jackpot.fiatValue = exchangeRate.convert(jackpot.value, fiat);
            });
        };
        Jackpots.get().success(function(data) {
            processJackpots(data);
        });
        BCPlayer.socket.on('jackpot', function(data) {
            $scope.$apply(function() {
                processJackpots(data);
            });
        });
        exchangeRate.$scope.$on('update', function() {
            if ($scope.user && $scope.user.wallets) {
                convertWallets();
            }
            if ($scope.jackpots && $scope.jackpots.length) {
                $scope.jackpots.forEach(function(jackpot) {
                    jackpot.fiatWagered = exchangeRate.convert(jackpot.wagered, fiat);
                    jackpot.fiatValue = exchangeRate.convert(jackpot.value, fiat);
                });
            }
        });
    };

    Application.Directives.directive('bcInfoBar', function() {
        return {
            restrict: 'EA',
            controller: [
                '$scope',
                'BCPlayer',
                'PlayerApi',
                'Jackpots',
                'exchangeRate',
                'BCSession',
                InfoBarController
            ],
            templateUrl: 'tpl/directives/info-bar.html'
        };
    });

})(window, window.Application);
