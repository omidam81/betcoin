'use strict';

var card = function() {
    return {
        restrict: 'E',
        scope:{
            card:"=",
            flipped:"="
        },
        templateUrl: 'tpl/directives/card.html',
        link: function(scope) {
            if (scope.flipped) {
                // Blank intended:w
            } else {

            }
        }
    };
};
Application.Directives.directive('card', [card]);
