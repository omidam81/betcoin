'use strict';
// some number prototypes

Number.prototype.toSatoshi = function() {
    if (isNaN(this)) return NaN;
    var str = this.toString();
    if (str.indexOf('e') >=0) {
        return parseInt(str.replace(".", "").replace(/e-8/, "").replace(/e-7/, "0"), 10);
    } else {
        if (!(/\./).test(str)) str += ".0";
        var parts = str.split(".");
        str = parts[0] + "." + parts[1].slice(0,8);
        while (!(/\.[0-9]{8}/).test(str)) {
            str += "0";
        }
        return parseInt(str.replace(".", "").replace(/^0+/, ""), 10);
    }
};

Number.prototype.toBitcoin = function() {
    if (isNaN(this)) return NaN;
    var str = parseInt(this, 10).toString();
    var lengthTester = (/[0-9]{8}/);
    while (!lengthTester.test(str)) {
        str = "0" + str;
    }
    str = str.slice(0, str.length - 8) + "." + str.slice(str.length - 8);
    return parseFloat(str);
};

Number.prototype.noExponents = function() {
    if (isNaN(this)) return NaN;
    var data = String(this).split(/[eE]/);
    if (data.length === 1) return data[0];

    var z = '',
        sign = this < 0 ? '-' : '',
        str = data[0].replace('.', ''),
        mag = Number(data[1]) + 1;

    if (mag < 0) {
        z = sign + '0.';
        while (mag++) z += '0';
        return z + str.replace(/^\-/, '');
    }
    mag -= str.length;
    while (mag--) z += '0';
    return str + z;
};

Number.prototype.zeroPad = function(places) {
    if (isNaN(this)) return NaN;
    if (!places) {
        places = 2;
    }
    var buffer = '';
    for (var i = 0; i < places; i++) {
        buffer += '0';
    }
    buffer += this;
    return buffer.slice(places * -1);
};

var getRandom = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

module.exports.getRandomBitcoin = function(min, max, digits) {
    return getRandomSatoshi(min, max, digits).toBitcoin();
};

var getRandomSatoshi = module.exports.getRandomSatoshi = function(min, max, digits) {
    if (digits === undefined) {
        digits = 2;
    } else {
        digits = parseInt(digits, 10);
        if (isNaN(digits)) {
            throw new Error("digits must be a number");
        }
    }
    var val = getRandom(min, max);
    var valDigits = val.toString().length;
    // how many non zero numbers do you want?
    var evenness = getRandom(1, digits);
    var factor = Math.pow(10, valDigits - evenness);
    return Math.floor(val / factor) * factor;
};
