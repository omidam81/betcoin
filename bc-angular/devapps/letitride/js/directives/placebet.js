'use strict';

var placebet = function() {
    return {
        restrict: 'A',
        link: function(scope,element,attrs) {
            scope.$watch('bets.' + attrs.bet, function(newValue) {
                var chips = element[0].children[0];
                if (newValue) {
                    chips.innerHTML = scope.bets[attrs.bet];
                    chips.style.display="block";
                } else {
                    chips.style.display = "none";
                    chips.innerHTML = "";
                }
            });

            var equals = [];
            if (attrs.equal) {
                equals = attrs.equal.split(',');
            }

            var clicked = function(e) {
                if (scope.isGameInProgress || attrs.disabled === "true") {
                    return;
                }
                clearTimeout(scope.longPressTimeout);
                scope.longPress = false;
                // We'll set a timeout for 600 ms for a long press
                scope.longPressTimeout = setTimeout(function() {
                    scope.longPress = true;
                }, 1250);
                e.stopPropagation();
                e.preventDefault();
            };
            var leaved = function(e) {
                if (scope.isGameInProgress || attrs.disabled === "true") {
                    return;
                }
                clearTimeout(scope.longPressTimeout);
                e.stopPropagation();
                e.preventDefault();
            };
            var letgo = function(e) {
                if (scope.isGameInProgress || attrs.disabled === "true") {
                    return;
                }
                
                clearTimeout(scope.longPressTimeout);
                // Prevent the onLongPress event from firing
                if(scope.longPress) {

                    scope.longPress = false;
                    if(scope.wheelSpinning) { return false; }
                    scope.$apply(function() {
                        delete(scope.bets[attrs.bet]);
                        for(var j = 0; j < equals.length; j++) {
                            delete(scope.bets[equals[j]]);
                        }
                        scope.calculateTotalBet();
                    });
                }
                else {

                    scope.longPress = false;
                    if(scope.wheelSpinning) { return false; }
                    scope.$apply(function() {
                        var chipvalue = scope.bets[attrs.bet];
                        if (!chipvalue) {
                            chipvalue = 0;
                        }
                        chipvalue++;
                        scope.bets[attrs.bet] = chipvalue;
                        for(var j = 0; j < equals.length; j++) {
                            scope.bets[equals[j]] = chipvalue;
                        }
                        scope.calculateTotalBet();
                    });
                }
                e.stopPropagation();
                e.preventDefault();
            };
            element.bind('mousedown touchstart', clicked);
            element.bind('mouseup touchend', letgo);
            element.bind('mouseleave', leaved);
        }
    };
};
Application.Directives.directive('placebet', [placebet]);