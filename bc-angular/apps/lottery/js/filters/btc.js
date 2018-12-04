'use strict';

/* global Application */

Application.Filters.filter('btc', function() {
    return function(input) {
        var satoshi = parseInt(input, 10);
        if (isNaN(satoshi)) { return 0; }
        var btc = satoshi / 100000000;
        var retval = btc;
        return retval;
    };
});

Application.Filters.filter('btctwo', function() {
    return function(inputValue) {
        if (inputValue === undefined) { return ''; }
        var satoshi = parseInt(inputValue, 10);
        if (isNaN(satoshi)) { return 0; }
        var btc = satoshi / 100000000;

        if(!btc || isNaN(btc)) { return 0; }
        var btcArr = btc.toString().split(".");
        var retval = btcArr[0]+"."+btcArr[1].toString().substring(0,3);
        return retval;
    } ;
});


Application.Filters.filter('btcusd',
  [ '$filter',
  function(filter) {
    var currencyFilter = filter('noFractionCurrency');
    return function(amount, exchange) {
      //console.log(amount);
      if(!amount || isNaN(amount)) { return ""; }
      amount = amount/100000000*exchange;
      //console.log(amount);
      var value = currencyFilter(amount);
      return value;
    };
  } ]);


Application.Filters.filter('noFractionCurrency',
  [ '$filter', '$locale',
  function(filter, locale) {
    var currencyFilter = filter('currency');
    var formats = locale.NUMBER_FORMATS;
    return function(amount) {
        if(!amount ) { return "loading..."; }
      var value = currencyFilter(amount, "");
      var sep = value.indexOf(formats.DECIMAL_SEP);
      if(amount >= 0) {
        return value.substring(0, sep);
      }
      return "";
    };
  } ]);
