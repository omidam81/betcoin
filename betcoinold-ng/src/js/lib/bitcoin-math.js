'use strict';

Number.prototype.toSatoshi = function() {
    if (isNaN(this)) { return NaN; }
    if (this === 0) { return 0; }
    var str = this.toString();
    var sign = (str.indexOf('-') === 0) ? "-" : "";
    str = str.replace(/^-/, '');
    if (str.indexOf('e') >=0) {
        var retval = parseInt(sign + str.replace(".", "").replace(/e-8/, "").replace(/e-7/, ""), 10);
        return retval;
    } else {
        if (!(/\./).test(str)) { str += ".0"; }
        var parts = str.split(".");
        str = parts[0] + "." + parts[1].slice(0,8);
        while (!(/\.[0-9]{8}/).test(str)) {
            str += "0";
        }
        return parseInt(sign + str.replace(".", "").replace(/^0+/, ""), 10);
    }
};

Number.prototype.toBitcoin = function() {
    if (isNaN(this)) { return NaN; }
    if (this === 0) { return 0; }
    var str = parseInt(this, 10).toString();
    var sign = (str.indexOf('-') === 0) ? "-" : "";
    str = str.replace(/^-/, '');
    var lengthTester = (/[0-9]{8}/);
    while (!lengthTester.test(str)) {
        str = "0" + str;
    }
    str = str.slice(0, str.length - 8) + "." + str.slice(str.length - 8);
    return parseFloat(sign + str);
};
Number.prototype.zeroFill = function(places) {
    if (isNaN(this)) { return NaN; }
    if (!places) {
        places = 8;
    }
    var str = this.toString();
    var parts = str.split(".");
    if (parts.length === 1) {
        parts.push("0");
    }
    var needed = places - parts[1].length;
    for (var i = 0; i < needed; i++) {
        parts[1] += '0';
    }
    return parts[0] + "." + parts[1];
};
