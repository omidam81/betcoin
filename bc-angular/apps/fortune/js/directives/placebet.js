'use strict';

var placebet = function(BCSession) {
    return {
        restrict: 'A',
        link: function(scope,element,attrs) {
            var imgEls = element.children('img');
            var imgArray = [];
            for (var i = 0; i < imgEls.length; i++) {
                imgArray[i] = new Image();
                imgArray[i].src = angular.element(imgEls[i]).prop('src');
            }

            var clicked = function(e) {
                e.stopPropagation();
                e.preventDefault();
                if (scope.isGameInProgress) {
                    return;
                }

                if (!element.hasClass('btn-down')) {
                    element.addClass('btn-down');
                } else {
                    return;
                }
                scope.longPress = false;
                // We'll set a timeout for 600 ms for a long press
                scope.longPressTimeout = setTimeout(function() {
                    scope.longPress = true;
                }, 1250);
            };
            var leaved = function(e) {
                e.stopPropagation();
                e.preventDefault();
                if (scope.isGameInProgress) {
                    return;
                }
                if (element.hasClass('btn-down')) {
                    element.removeClass('btn-down');
                } else {
                    return;
                }
                clearTimeout(scope.longPressTimeout);
            };
            var letgo = function(e) {
                e.stopPropagation();
                e.preventDefault();
                if (scope.isGameInProgress) {
                    return;
                }
                if (element.hasClass('btn-down')) {
                    element.removeClass('btn-down');
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
                        if(scope.getTotalBet() + (chipvalue+1) * scope.btcWager > BCSession.user.wallets[BCSession.currency].balance) {
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
            element.children().on('dragstart', function(e) {
                e.preventDefault();
            });
            element.bind('mousedown touchstart', clicked);
            element.bind('mouseup touchend', letgo);
            element.bind('mouseleave', leaved);
        }
    };
};
Application.Directives.directive('placebet', ['BCSession', placebet]);