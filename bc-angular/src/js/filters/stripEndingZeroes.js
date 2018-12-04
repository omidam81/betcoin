

/* global Application */
'use strict';
Application.Filters.filter('stripEndingZeroes', [function () { //@TODO move to common once per-project concatenation works
    return function(input) {
        return !isNaN(parseFloat(input))? parseFloat(input).toString() : "";
        // added the condition to allow more flexible usecases
        // (so it doesn't splat NaN all over the place when fed non-numeric strings)
    };
}]);