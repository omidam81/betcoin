'use strict';

var clearBet = function() {
    return {
        restrict: 'A',
        link: function(scope,element) {
            var imgEls = element.children('img');
            var imgArray = [];
            for (var i = 0; i < imgEls.length; i++) {
                imgArray[i] = new Image();
                imgArray[i].src = angular.element(imgEls[i]).prop('src');
            }

            var clicked = function() {
                if (scope.withdrawPending || scope.isGameInProgress) {
                    return;
                }
                if (!element.hasClass('btn-down')) {
                    element.addClass('btn-down');
                } else {
                    return;
                }
            };
            var leaved = function() {
                if (scope.withdrawPending || scope.isGameInProgress) {
                    return;
                }
                if (element.hasClass('btn-down')) {
                    element.removeClass('btn-down');
                }
            };
            var letgo = function() {
                if (scope.withdrawPending || scope.isGameInProgress) {
                    return;
                }
                if (element.hasClass('btn-down')) {
                    element.removeClass('btn-down');
                } else {
                    return;
                }
                scope.clearBets();
            };
            element.bind('mousedown touchstart', clicked);
            element.bind('mouseup touchend', letgo);
            element.bind('mouseleave', leaved);
        }
    };
};
Application.Directives.directive('clearBet', [clearBet]);