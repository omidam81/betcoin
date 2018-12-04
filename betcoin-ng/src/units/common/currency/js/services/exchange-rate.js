(function(angular) {
    'use strict';
    var module;
    try {
        module = angular.module('currency.services');
    } catch (e) {
        module = angular.module('currency.services', ['bc.socket', 'bc.server', 'bc.globals']);
    }

    var ExchangeRateFactory = function($http, $rootScope, BCServer, BCSocket, CURRENCIES, FIAT_CURRENCIES) {
        var ExchangeRate = $rootScope.$new();
        $http.get(BCServer.url('/exchange-rate')).then(function(result) {
            ExchangeRate.rateData = result.data;
            console.debug('exchange rate retrieved');
            ExchangeRate.$emit('update', ExchangeRate.rateData);
        });
        BCSocket.on('counter', function(data) {
            ExchangeRate.$apply(function() {
                ExchangeRate.rateData = data.exchange;
                ExchangeRate.$emit('update', ExchangeRate.rateData);
            });
        });

        ExchangeRate.bitcoinValue = function(amount, currency) {
            if (amount === 0) {
                return 0;
            }
            if (currency === 'bitcoin') {
                return amount;
            }
            if (!ExchangeRate.rateData || !ExchangeRate.rateData[currency] || !amount) {
                return 0;
            }
            var value = 0;
            if (FIAT_CURRENCIES.indexOf(currency) >= 0) {
                value = (amount / ExchangeRate.rateData[currency]).toSatoshi();
                // console.debug('%d %s = %d bitcoin', amount, currency, value.toBitcoin());
            } else if (CURRENCIES.indexOf(currency) >= 0) {
                value = (ExchangeRate.rateData[currency].toBitcoin() * amount.toBitcoin()).toSatoshi();
                // console.debug('%d %s = %d bitcoin', amount.toBitcoin(), currency, value.toBitcoin());
            } else {
                console.error("invalid currency given to exchange rate function");
            }
            return value;
        };

        ExchangeRate.convert = function(amount, currency) {
            if (amount === 0) {
                return 0;
            }
            if (currency === 'bitcoin') {
                return amount;
            }
            if (!ExchangeRate.rateData || !ExchangeRate.rateData[currency] || !amount) {
                return 0;
            }
            var value = 0;
            if (FIAT_CURRENCIES.indexOf(currency) >= 0) {
                value = (amount.toBitcoin() * ExchangeRate.rateData[currency]);
                // console.debug('%d bitcoin = %d %s', amount.toBitcoin(), value, currency);
            } else if (CURRENCIES.indexOf(currency) >= 0) {
                value = (ExchangeRate.rateData[currency].toBitcoin() / amount.toBitcoin()).toSatoshi();
                // console.debug('%d bitcoin = %d %s', amount.toBitcoin(), value.toBitcoin(), currency);
            } else {
                console.error("invalid currency given to exchange rate function");
            }
            return value;
        };

        return ExchangeRate;
    };


    module.factory('exchangeRate', [
        '$http',
        '$rootScope',
        'BCServer',
        'BCSocket',
        'CURRENCIES',
        'FIAT_CURRENCIES',
        ExchangeRateFactory
    ]);

})(window.angular);
