'use strict';

Application.Filters.filter('default', function() {
    return function(input, defaultText) {
        if (!input) {
            return defaultText;
        } else {
            return input;
        }
    };
});
