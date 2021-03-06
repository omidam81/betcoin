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


// Came from the comments here:  https://gist.github.com/maruf-nc/5625869
Application.Filters.filter('titlecase', function() {
    return function (input) {
        var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;

        input = input.toLowerCase();
        return input.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, function(match, index, title) {
            if (index > 0 && index + match.length !== title.length &&
                match.search(smallWords) > -1 && title.charAt(index - 2) !== ":" &&
                (title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-') &&
                title.charAt(index - 1).search(/[^\s-]/) < 0) {
                return match.toLowerCase();
            }

            if (match.substr(1).search(/[A-Z]|\../) > -1) {
                return match;
            }

            return match.charAt(0).toUpperCase() + match.substr(1);
        });
    };
});

Application.Filters.filter('useFilter', ['$filter', function($filter) {
    return function() {
        var filterName = [].splice.call(arguments, 1, 1)[0];
        if (!filterName.length) {
            return arguments[0];
        } else {
            return $filter(filterName).apply(null, arguments);
        }
    };
}]);
