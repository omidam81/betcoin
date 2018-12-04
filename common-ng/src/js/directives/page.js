'use strict';

/* global Application */

Application.Directives.directive("bcPage", function () {
    return {
        restrict: "AE",
        transclude: true,
        scope: {
            loading: "="
        },
        templateUrl: "tpl/directives/page.html"
    };
});