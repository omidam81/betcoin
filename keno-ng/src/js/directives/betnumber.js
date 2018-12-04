'use strict';

var betnumber = function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {

            var actionEnd = function() {
                scope.$apply(function() {
                    if(scope.hasBet(attrs.bet)) {
                        scope.removeBet(attrs.bet, function() {
                            scope.playSound("dealCard");
                        });
                    } else {
                        scope.addBet(attrs.bet, function() {
                            scope.playSound("dealCard");
                        });
                    }
                });
            };

            scope.$watch("bets", function() {
                if(scope.hasBet(attrs.bet)) {
                    element.addClass("active");
                } else {
                    element.removeClass("active");
                }
            }, true);

            var activationSound = true; // prevents the sound from playing multiple times after the number is active

            scope.$watch("drawn", function() {
                if(scope.wasDrawn(attrs.bet)) {
                    element.addClass("drawn");
                    if(element.hasClass("active") && activationSound) {
                        scope.playSound("winSound");
                        activationSound = false;
                    }
                } else {
                    element.removeClass("drawn");
                    activationSound = true;
                }
            }, true);

            element.bind('mouseup', actionEnd);
            element.bind('touchend', actionEnd);
        }
    };
};
Application.Directives.directive('betnumber', [betnumber]);