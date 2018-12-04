'use strict';

var bethistory = function() {
    return {
        restrict: 'E',
        scope: {
            number: '@',
            color: '@'
        },
        templateUrl: 'tpl/directives/bethistory.html',
        link: function() {

        }
    };
};
Application.Directives.directive('bethistory', [bethistory]);