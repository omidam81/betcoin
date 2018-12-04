(function(angular) {
    'use strict';
    var module;
    try {
        module = angular.module('currency.filters');
    } catch (e) {
        module = angular.module('currency.filters', ['currency.services']);
    }

    var SCIENTIFIC_REGEXP = /([0-9]+)e-([0-9]+)/;

    var fixScientific = function(number) {
        var output = number.toString();
        var matches = SCIENTIFIC_REGEXP.exec(output);
        if (matches) {
            output = "0." + new Array(parseInt(matches[2], 10) + 1).join('0') + matches[1];
        } else {
            return output;
        }
    };

    var setDecimals = function(number, decimals) {
        var output = fixScientific(number);
        decimals = parseInt(decimals, 10);
        if (!isNaN(decimals)) {
            var parts = output.split(".");
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
        return output;
    };

    var zeroPad = function(number, zeropad) {
        var output = fixScientific(number);
        zeropad = parseInt(zeropad, 10);
        if (!isNaN(zeropad)) {
            var parts = output.split(".");
            while(parts[0].length < zeropad) {
                parts[0] = '0' + parts[0];
            }
            output = parts.join(".");
        }
        return output;
    };

    var padNumber = function(number, decimals, zeropad) {
        number = setDecimals(number, decimals);
        return zeroPad(number, zeropad);
    };

    var addCommas = function(input) {
        var output = input.toString();
        var parts = output.split(".");
        var isNegative = false;
        var principal = parts[0];
        var principalInt = parseInt(principal);
        if (principalInt < 0) {
            isNegative = true;
        }
        principal = Math.abs(principalInt).toString();
        var newPrincipalParts = [];
        for(var i = principal.length - 1, iters = 1; i >= 0; i--, iters++) {
            newPrincipalParts.unshift(principal[i]);
            if (i !== 0 && iters % 3 === 0) {
                newPrincipalParts.unshift(",");
            }
        }
        var newPrincipal = newPrincipalParts.join("");
        parts[0] = newPrincipal;
        var result;
        if (!parts[1]) {
            result = newPrincipal;
        } else {
            result = parts.join(".");
        }
        if (isNegative) {
            result = '-' + result;
        }
        return result;
    };

    module.filter('paddednumber', function() {
        return function(input, decimals, zeropad) {
            return addCommas(padNumber(input, decimals, zeropad));
        };
    });

})(window.angular);
