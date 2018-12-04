'use strict';

var bcHt = function() {
    var coinToText = function(coin) {
        return (coin === 1) ? "Tails" : "Heads";
    };
    
    return {
        restrict: 'E',
        scope:{
            game:"=",
            dobet:"=",
            doresult:"="
        },
        templateUrl: 'tpl/directives/ht.html',
        link: function(scope) {

            scope.c1 = "";
            scope.c2 = "";
            if (scope.game.bet !== undefined) {
                scope.doubleCoins = (scope.game.bet.sides.length === 2);

                if (scope.doresult) {
                    var a = scope.game.result.split(',');
                    scope.c1 = coinToText(+a[0]);
                    if (scope.doubleCoins) {
                        scope.c2 = coinToText(+a[1]);
                    }
                }
                if (scope.dobet) {
                    scope.c1 = coinToText(scope.game.bet.sides[0]);
                    if (scope.doubleCoins) {
                        scope.c2 = coinToText(scope.game.bet.sides[1]);
                    }
                }
            }
        }
    };
};

Application.Directives.directive('bcHt', [bcHt]);

