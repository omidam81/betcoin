'use strict';


Application.Filters.filter('winnings', function() {
    return function(input,round) {
        if(!input){
            return;
        }

        if(!round) { round = 4; }
        function roundNumber(number, precision){
            precision = Math.abs(parseInt(precision)) || 0;
            var multiplier = Math.pow(10, precision);
            return (Math.round(number * multiplier) / multiplier);
        }
        var result = parseFloat(input.winnings+0,10)/parseFloat(input.wager+0,10);
        if (!result) {
            return "0";
        } else {
            return roundNumber(result,round);
        }
    };
});


Application.Filters.filter('decimals', function() {
    return function(input,round) {
        if(!input){
            return;
        }

        if(!round) { round = 4; }
        function roundNumber(number, precision){
            precision = Math.abs(parseInt(precision)) || 0;
            var multiplier = Math.pow(10, precision);
            return (Math.round(number * multiplier) / multiplier);
        }
        var result = input;
        if (!result) {
            return "0";
        } else {
            return roundNumber(result,round);
        }
    };
});
