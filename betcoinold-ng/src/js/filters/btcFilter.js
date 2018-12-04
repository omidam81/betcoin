'use strict';

Application.Filters.filter('btc', function() {
    return function(input) {
        if (input === undefined) {
            return 0;
        } else {
            var btc = parseInt(input, 10).toBitcoin();
            if(input < 100 && input > 0) {
                if(this < 10) {
                    btc = "0.0000000"+input;
                } else {
                    btc = "0.000000"+input;
                }
            }
            return btc;
        }
    };
});

Application.Filters.filter('numberk', function() {
    return function(input) {
        //console.log(input);
        if (parseInt(input,10) < 1000) {
            return input;
        } else {
            var retval = (parseInt(input,10)/1000);
            retval = retval + "K";
            return retval;
        }
    };
});

Application.Filters.filter('hidePoints', function() {
    return function(input) {
        console.log(input);
        if (input.pointsAwarded < 2) {
            return false;
        } else {
            return input;
        }
    };
});
Application.Filters.filter('noFractionCurrency', ['$filter', '$locale',
    function(filter, locale) {
        var currencyFilter = filter('currency');
        var formats = locale.NUMBER_FORMATS;
        return function(amount) {
            if (!amount) {
                return "...";
            }
            var value = currencyFilter(amount, "");
            var sep = value.indexOf(formats.DECIMAL_SEP);
            if (amount >= 0) {
                return value.substring(0, sep);
            }
            return "...";
        };
    }
]);

Application.Filters.filter('error', ['ErrorLocalesFactory',
    function(ErrorLocalesFactory) {
        return function(error) {
            if(error && error.errCode){
                return ErrorLocalesFactory.getErrorLocale(error.errCode);
            }
        };
    }
]);
