'use strict';

var cup = function() {
    return {
        restrict: 'E',
        scope:{
            type: '=',
            confirm: '=',
            timeframe: '=',
            hidecup: '=',
            winner: '='
        },
        templateUrl: 'tpl/directives/game-cups.html',
        link: function() {
        }
    };
};
Application.Directives.directive('cup', [cup]);