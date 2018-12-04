(function(window, angular, Application) {
    'use strict';
    var FIAT_CURRENCIES = ['USD', 'CNY'];

    var ExchangeRateFactory = function($http, $rootScope, BCPlayer) {
        var $scope = $rootScope.$new();
        this.$scope = $scope;
        this.rateData = {};
        var self = this;
        $http.get(BCPlayer.urlRoot + '/counter').then(function(result) {
            self.rateData = result.data.exchange;
            $scope.$emit('update', self.rateData);
        });
        BCPlayer.socket.on('counter', function(data) {
            $scope.$apply(function() {
                self.rateData = data.exchange;
                $scope.$emit('update', self.rateData);
            });
        });
    };

    ExchangeRateFactory.prototype.bitcoinValue = function(amount, currency) {
        if (amount === 0) {
            return 0;
        }
        if (currency === 'bitcoin') {
            return amount;
        }
        if (!this.rateData[currency] || !amount) {
            return 0;
        }
        var value = 0;
        if (FIAT_CURRENCIES.indexOf(currency) >= 0) {
            value = (amount / this.rateData[currency]).toSatoshi();
            // console.debug('%d %s = %d bitcoin', amount, currency, value.toBitcoin());
        } else if (this.$scope.currencies.indexOf(currency) >= 0) {
            value = (this.rateData[currency].toBitcoin() * amount.toBitcoin()).toSatoshi();
            // console.debug('%d %s = %d bitcoin', amount.toBitcoin(), currency, value.toBitcoin());
        } else {
            console.error("invalid currency given to exchange rate function");
        }
        return value;
    };

    ExchangeRateFactory.prototype.convert = function(amount, currency) {
        if (amount === 0) {
            return 0;
        }
        if (currency === 'bitcoin') {
            return amount;
        }
        if (!this.rateData[currency] || !amount) {
            return 0;
        }
        var value = 0;
        if (FIAT_CURRENCIES.indexOf(currency) >= 0) {
            value = (amount.toBitcoin() * this.rateData[currency]);
            // console.debug('%d bitcoin = %d %s', amount.toBitcoin(), value, currency);
        } else if (this.$scope.currencies.indexOf(currency) >= 0) {
            value = (this.rateData[currency].toBitcoin() / amount.toBitcoin()).toSatoshi();
            // console.debug('%d bitcoin = %d %s', amount.toBitcoin(), value.toBitcoin(), currency);
        } else {
            console.error("invalid currency given to exchange rate function");
        }
        return value;
    };

    Application.Services.service('exchangeRate', ['$http', '$rootScope', 'BCPlayer', ExchangeRateFactory]);

})(window, window.angular, window.Application);
