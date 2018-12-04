'use strict';

var padNumber = function(number, decimals, zeropad) {
    number = parseFloat(number);
    var output = number.toString();
    decimals = parseInt(decimals, 10);
    var parts;
    if (!isNaN(decimals)) {
        parts = output.split(".");
        if (parts[1]) {
            parts[1] = parts[1].slice(0, decimals);
        } else {
            parts[1] = new Array(decimals + 1).join('0');
        }
        var leftover = decimals - parts[1].length;
        if (leftover > 0) {
            parts[1] += new Array(leftover + 1).join('0');
        }
        output = parts.join('.');
    }
    zeropad = parseInt(zeropad, 10);
    if (!isNaN(zeropad)) {
        parts = output.split(".");
        while(parts[0].length < zeropad) {
            parts[0] = '0' + parts[0];
        }
        output = parts.join(".");
    }
    return output;
};

var addCommas = function(input) {
    var output = input.toString();
    var parts = output.split(".");
    var principal = parts[0];
    var newPrincipalParts = [];
    for(var i = principal.length - 1, iters = 1; i >= 0; i--, iters++) {
        newPrincipalParts.unshift(principal[i]);
        if (i !== 0 && iters % 3 === 0) {
            newPrincipalParts.unshift(",");
        }
    }
    var newPrincipal = newPrincipalParts.join("");
    parts[0] = newPrincipal;
    if (!parts[1]) {
        return newPrincipal;
    } else {
        return parts.join(".");
    }
};

var cryptoFilter = function() {
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
            } else {
                btc = padNumber(btc, decimals, zeropad);
            }
            return addCommas(btc);
        }
    };
};

Application.Filters.filter('btc', cryptoFilter);
Application.Filters.filter('ltc', cryptoFilter);
Application.Filters.filter('xdg', cryptoFilter);
Application.Filters.filter('cryptovalue', cryptoFilter);

Application.Filters.filter('paddednumber', function() {
    return function(input, decimals, zeropad) {
        return addCommas(padNumber(input, decimals, zeropad));
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

Application.Filters.filter('cryptosymbol', function() {
    return function(input) {
        switch (input) {
        case "bitcoin": return "฿";
        case "litecoin": return "Ł";
        case "dogecoin": return "Ð";
        case "ppcoin": return "Ᵽ";
        case "namecoin": return "ℕ";
        }
    };
});

Application.Filters.filter('fiatsymbol', function() {
    return function(input) {
        switch (input) {
        case "USD": return "$";
        case "en_US": return "$";
        case "CNY": return "¥";
        case "RMB": return "¥";
        case "zh_CN": return "¥";
        }
    };
});

Application.Filters.filter('currencyabbreviation', function() {
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
                                     function() {
                                         return function(error) {
                                             if (error) {
                                                 if (error.message) {
                                                     return error.message;
                                                 } else {
                                                     return "Error";
                                                 }
                                             }
                                         };
                                     }
                                    ]);
