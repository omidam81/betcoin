'use strict';

/* global Application */

Application.Directives.directive("bcBox", function () {
    return {
        restrict: "AE",
        transclude: true,
        scope: {
            title: "@"
        },
        templateUrl: "tpl/directives/box.html"
    };
});