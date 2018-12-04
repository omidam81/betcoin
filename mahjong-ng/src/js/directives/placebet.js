'use strict';

var placebet = function() {
    return {
        restrict: 'A',
        link: function(scope,element,attrs) {


            var clicked = function() {


                // We'll set a timeout for 600 ms for a long press
                scope.longPressTimeout = setTimeout(function() {
                    scope.longPress = true;
                }, 1250);
            };
            var letgo = function() {
                clearTimeout(scope.longPressTimeout);
                // Prevent the onLongPress event from firing
                if(scope.longPress) {

                    scope.longPress = false;
                    if(scope.wheelSpinning) { return false; }
                    // If the touchend event hasn't fired,
                    // apply the function given in on the element's on-long-press attribute
                    scope.$apply(function() {
                            scope.longPress = false;
                        //scope.$apply(function() {
                            var chips = element[0].children[0];
                            chips.style.display="none";
                            chips.innerHTML = "";
                            delete(scope.bets[attrs.bet]);
                            scope.calculateTotalBet();
                        //});

                    });

                }
                else {

                    scope.longPress = false;
                    if(scope.wheelSpinning) { return false; }
                    scope.$apply(function() {

                        var chips = element[0].children[0];
                        var chipvalue = 0;
                        if(parseInt(chips.innerHTML,10)) {
                            chipvalue = parseInt(chips.innerHTML,10);
                        }
                        if(scope.getTotalBet() + (chipvalue+1) * scope.btcWager > scope.player.balance.btc) {
                            scope.maxBetErr = true;
                            setTimeout(function() {
                                scope.$apply(function() {
                                    scope.maxBetErr = false;
                                });
                            },5000);
                            return false;
                        }
                        chips.style.display="block";
                        chipvalue++;
                        chips.innerHTML = chipvalue;
                        scope.bets[attrs.bet] = chipvalue;
                        scope.calculateTotalBet();
                    });
                }
            };
            element.bind('mousedown', clicked);
            element.bind('mouseup', letgo);
            element.bind('touchstart', clicked);
            element.bind('touchend', letgo);
        }
    };
};
Application.Directives.directive('placebet', [placebet]);