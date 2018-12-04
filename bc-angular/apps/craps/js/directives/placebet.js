'use strict';

var placebet = function (BCSession) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            scope.$watch('bets.' + attrs.bet, function(newBet) {
                if (newBet) {
                    element[0].children[0].style.display = "block";
                } else {
                    element[0].children[0].style.display = "none";
                }
            });
            var clicked = function () {
                // We'll set a timeout for 600 ms for a long press
                scope.longPressTimeout = setTimeout(function () {
                    scope.longPress = true;
                }, 1250);
            };
            var overMe = function() {
                if (scope.currentBetPanel !== attrs.bet) {
                    scope.$apply(function () {
                        scope.currentBetPanel = attrs.bet;
                    });
                }
            };
            var letgo = function () {
                clearTimeout(scope.longPressTimeout);
                if (scope.animating) {
                    return false;
                } else if (!scope.options[attrs.bet]) {
                    return false;
                } else if (scope.bets[attrs.bet] && scope.onlinebets.hasOwnProperty(attrs.bet) && scope.returnbets && scope.returnbets[attrs.bet] === undefined) {
                    return false;
                }

                // Prevent the onLongPress event from firing
                if (scope.longPress) {
                    scope.longPress = false;
                    // If the touchend event hasn't fired,
                    // apply the function given in on the element's on-long-press attribute
                    scope.$apply(function () {
                        scope.longPress = false;
                        scope.clearOneBet(attrs.bet);
                    });

                }
                else {
                    scope.longPress = false;

                    scope.$apply(function () {
                        var chipvalue = 0;
                        if (scope.bets[attrs.bet]) {
                            chipvalue = scope.bets[attrs.bet];
                        }
                        if (scope.getTotalBet() + (chipvalue + 1) * scope.btcWager > BCSession.user.wallets[BCSession.currency].balance || (scope.max.hasOwnProperty(attrs.bet) && (chipvalue + 1) * scope.btcWager > scope.max[attrs.bet])) {
                            scope.maxBetErr = true;
                            setTimeout(function () {
                                scope.$apply(function () {
                                    scope.maxBetErr = false;
                                });
                            }, 5000);
                            return false;
                        }
                        chipvalue++;
                        scope.bets[attrs.bet] = chipvalue;
                        scope.returnbets[attrs.bet] = true;
                        scope.calculateTotalBet();
                    });
                }
            };
            element.bind('mousedown', clicked);
            element.bind('mouseup', letgo);
            element.bind('touchstart', clicked);
            element.bind('touchend', letgo);
            element.bind('mouseover', overMe);
        }
    };
};
Application.Directives.directive('placebet', ['BCSession', placebet]);