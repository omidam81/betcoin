'use strict';
Application.Filters.filter('diceWinnings', function() {
    return function(input) {
        if(!input){
            return;
        }
        var payout_multiplier;
        if (input.result >= input.gameTarget) {
            payout_multiplier = "0.005";
        } else {
            payout_multiplier = input.payout_multiplier.toString();
        }
        var arr_split = payout_multiplier.split(".");
        var result = arr_split[0]+"."+arr_split[1].substring(0,4);
        return result;

    };
});
