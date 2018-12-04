'use strict';

var placebet = function(BCSession) {
    return {
        restrict: 'A',
        link: function(scope,element,attrs) {
            var size = 1;
            if (attrs.size) {
                size = parseInt(attrs.size, 10);
            }
            var neighbours = [];
            if (attrs.neighbours) {
                neighbours = attrs.neighbours.split(",");
            }
            scope.$watch('bets["' + attrs.bet + '"]', function(newBet) {
                if (newBet) {
                    element[0].children[0].style.display = "block";
                    element[0].children[0].innerHTML = newBet;
                } else {
                    element[0].children[0].style.display = "none";
                    element[0].children[0].innerHTML = "";
                }
            });

            var clicked = function() {
                if (scope.isGameInProgress || scope.animating) {
                    return;
                }

                // We'll set a timeout for 600 ms for a long press
                scope.longPressTimeout = setTimeout(function() {
                    scope.longPress = true;
                }, 1250);
            };
            var letgo = function() {
                if (scope.isGameInProgress || scope.animating) {
                    return;
                }
                clearTimeout(scope.longPressTimeout);
                // Prevent the onLongPress event from firing
                if(scope.longPress) {

                    scope.longPress = false;
                    if(scope.wheelSpinning) { return false; }
                    // If the touchend event hasn't fired,
                    // apply the function given in on the element's on-long-press attribute
                    scope.$apply(function() {
                        scope.longPress = false;
                        var s = scope.neighbours.slice();
                        scope.neighbours = [];
                        for(var i = 0; i< s.length; i++) {
                            if (s[i].indexOf(attrs.bet) >= 0) {
                                for (var j = 0; j < s[i].length; j++) {
                                    if (!scope.bets[s[i][j]] || scope.bets[s[i][j]] <= 1) {
                                        delete(scope.bets[s[i][j]]);
                                    } else {
                                        scope.bets[s[i][j]] = scope.bets[s[i][j]] - 1;
                                    }
                                }
                            } else {
                                scope.neighbours.push(s[i]);
                            }
                        }
                        delete(scope.bets[attrs.bet]);
                        scope.calculateTotalBet();
                    });

                }
                else {

                    scope.longPress = false;
                    if(scope.wheelSpinning) { return false; }
                    scope.$apply(function() {
                        var chipvalue = 0;
                        if (scope.bets[attrs.bet]) {
                            chipvalue = scope.bets[attrs.bet];
                        }
                        if(scope.getTotalBet() + (chipvalue+1) * scope.btcWager > BCSession.user.wallets[BCSession.currency].balance) {
                            scope.maxBetErr = true;
                            setTimeout(function() {
                                scope.$apply(function() {
                                    scope.maxBetErr = false;
                                });
                            },5000);
                            return false;
                        }
                        chipvalue += size;
                        if(neighbours.length) {
                            var neighbour = [];
                            neighbour.push(attrs.bet);
                            for(var i = 0; i< neighbours.length; i++) {
                                if (scope.bets[neighbours[i]]) {
                                    scope.bets[neighbours[i]] += size;
                                } else {
                                    scope.bets[neighbours[i]] = size;
                                }
                                neighbour.push(neighbours[i]);
                            }
                            scope.neighbours.push(neighbour);
                        }

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
Application.Directives.directive('placebet', ['BCSession', placebet]);