'use strict';

var chips = function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            $(element).hide();
            scope.$watch('game.bets', function (bets) {
                var key = attrs.key;
                if (bets) {
                    var bet = bets[key];
                    if (bet === undefined || bet === '0' || bet === 0) {
                        $(element).hide();
                    } else {
                        $(element).show();
                        $(element).html(bet);
                    }
                }
            });
        }
    };
};
Application.Directives.directive('chips', [chips]);