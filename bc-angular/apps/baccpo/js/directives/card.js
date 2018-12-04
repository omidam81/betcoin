'use strict';

var card = function() {
    return {
        restrict: 'E',
        scope:{
            card:"=",
            flipped:"=",
        },
        templateUrl: 'tpl/directives/card.html',
        link: function(scope) {
            if (scope.flipped) {
                // Blank intended:w
            } else {
                if(scope.card.suit === "S") {
                    scope.suitsymbol = '♠';
                } else if(scope.card.suit === "C") {
                    scope.suitsymbol = '♣';
                } else if(scope.card.suit === "D") {
                    scope.suitsymbol = '♦';
                } else if(scope.card.suit === "H") {
                    scope.suitsymbol = '♥';
                } else {
                    scope.suitsymbol = '★';
                }
            }
        }
    };
};
Application.Directives.directive('card', [card]);
