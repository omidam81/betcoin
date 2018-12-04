(function(angular) {
    'use strict';
    var module;
    try {
        module = angular.module('currency.filters');
    } catch (e) {
        module = angular.module('currency.filters', ['currency.services']);
    }

    var cryptoFilter = function($filter) {
        var padNumber = $filter('paddednumber');
        return function(input, decimals, zeropad) {
            if (input === undefined) {
                return 0;
            } else {
                var btc = parseInt(input, 10).toBitcoin();
                if(input < 100 && input > 0) {
                    input = Math.floor(input);
                    if(input < 10) {
                        btc = "0.0000000"+input;
                    } else {
                        btc = "0.000000"+input;
                    }
                }
                return padNumber(btc, decimals, zeropad);
            }
        };
    };

    module.filter('cryptovalue', ['$filter', cryptoFilter]);
    module.filter('cryptoValue', ['$filter', cryptoFilter]);

    var cryptosymbol = function() {
        return function(input) {
            switch (input) {
            case "bitcoin": return "฿";
            case "litecoin": return "Ł";
            case "dogecoin": return "Ð";
            case "ppcoin": return "Ᵽ";
            case "namecoin": return "ℕ";
            }
        };
    };
    module.filter('cryptosymbol', cryptosymbol);
    module.filter('cryptoSymbol', cryptosymbol);

    var fiatsymbol = function() {
        return function(input) {
            switch (input) {
            case "USD": return "$";
            case "en_US": return "$";
            case "CNY": return "¥";
            case "RMB": return "¥";
            case "zh_CN": return "¥";
            }
        };
    };
    module.filter('fiatsymbol', fiatsymbol);
    module.filter('fiatSymbol', fiatsymbol);

    var currencysymbol = function() {
        return function(input) {
            switch (input) {
            case "bitcoin": return "฿";
            case "litecoin": return "Ł";
            case "dogecoin": return "Ð";
            case "ppcoin": return "Ᵽ";
            case "namecoin": return "ℕ";
            case "USD": return "$";
            case "en_US": return "$";
            case "CNY": return "¥";
            case "RMB": return "¥";
            case "zh_CN": return "¥";
            }
        };
    };
    module.filter('currencysymbol', currencysymbol);
    module.filter('currencySymbol', currencysymbol);

    var currencyAbbreviation = function() {
        return function(input) {
            switch (input) {
            case "bitcoin": return "BTC";
            case "litecoin": return "LTC";
            case "dogecoin": return "XDG";
            case "ppcoin": return "PPC";
            case "namecoin": return "NMC";
            case "USD": return "USD";
            case "en_US": return "USD";
            case "CNY": return "RMB";
            case "RMB": return "RMB";
            case "zh_CN": return "RMB";
            }
        };
    };

    module.filter('currencyabbrev', currencyAbbreviation);
    module.filter('currencyabbreviation', currencyAbbreviation);
    module.filter('currencyAbbrev', currencyAbbreviation);
    module.filter('currencyAbbreviation', currencyAbbreviation);

    var exchangeTo = function(exchangeRate) {
        return function(input, currency) {
            if (!currency) {
                throw new Error("currency parmeter is required for exchangeTo filter");
            }
            return exchangeRate.convert(parseFloat(input), currency);
        };
    };
    module.filter('exchangeTo', ['exchangeRate', exchangeTo]);
    module.filter('exchangeto', ['exchangeRate', exchangeTo]);

    var exchangeFrom = function(exchangeRate) {
        return function(input, currency) {
            if (!currency) {
                throw new Error("currency parmeter is required for exchangeFrom filter");
            }
            return exchangeRate.btcValue(parseFloat(input), currency);
        };
    };
    module.filter('exchangeFrom', ['exchangeRate', exchangeFrom]);
    module.filter('exchangefrom', ['exchangeRate', exchangeFrom]);

    module.run(['$rootScope', '$filter', function($rootScope, $filter) {
        // define some convenience methods on the root scope for
        // templating purposes
        $rootScope.currencySymbol = function(input) {
            return $filter('currencysymbol')(input);
        };
        $rootScope.toBitcoin = function(value) { return parseInt(value, 10).toBitcoin(); };
        $rootScope.toSatoshi = function(value) { return parseInt(value, 10).toSatoshi(); };
    }]);

})(window.angular);
