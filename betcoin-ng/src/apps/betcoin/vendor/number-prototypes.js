(function() {
    'use strict';

    Number.prototype.toSatoshi = function() {
        if (isNaN(this)) {
            return NaN;
        }
        if (this === 0) {
            return 0;
        }
        var str = this.toString();
        var sign = (str.indexOf('-') === 0) ? "-" : "";
        str = str.replace(/^-/, '');
        if (str.indexOf('e') >=0) {
            return parseInt(sign + str.replace(".", "").replace(/e-8/, "").replace(/e-7/, "0"), 10);
        } else {
            if (!(/\./).test(str)) {
                str += ".0";
            }
            var parts = str.split(".");
            str = parts[0] + "." + parts[1].slice(0,8);
            while (!(/\.[0-9]{8}/).test(str)) {
                str += "0";
            }
            return parseInt(sign + str.replace(".", "").replace(/^0+/, ""), 10);
        }
    };

    Number.prototype.toBitcoinString = function() {
        if (isNaN(this)) {
            return NaN;
        }
        if (this === 0) {
            return 0;
        }
        var str = parseInt(this, 10).toString();
        var sign = (str.indexOf('-') === 0) ? "-" : "";
        str = str.replace(/^-/, '');
        var lengthTester = (/[0-9]{8}/);
        while (!lengthTester.test(str)) {
            str = "0" + str;
        }
        str = str.slice(0, str.length - 8) + "." + str.slice(str.length - 8);
        if (str[0] === '.') {
            str = '0' + str;
        }
        return sign + str;
    };

    Number.prototype.toBitcoin = function() {
        return parseFloat(this.toBitcoinString());
    };

})();
