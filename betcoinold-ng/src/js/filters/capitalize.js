
/* global Application */
'use strict';
Application.Filters.filter('capitalize', function() {  //@TODO move to common once per-project concatenation works
    return function(input) {
        return input.substring(0,1).toUpperCase()+input.substring(1);
    };
});