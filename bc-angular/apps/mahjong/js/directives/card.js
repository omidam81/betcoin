'use strict';
var tileNames = [
    /* Color */
    'character1',
    'character2',
    'character3',
    'character4',
    'character5',
    'character6',
    'character7',
    'character8',
    'character9',
    'circle1',
    'circle2',
    'circle3',
    'circle4',
    'circle5',
    'circle6',
    'circle7',
    'circle8',
    'circle9',
    'bamboo1',
    'bamboo2',
    'bamboo3',
    'bamboo4',
    'bamboo5',
    'bamboo6',
    'bamboo7',
    'bamboo8',
    'bamboo9',
    /* Honor */
    'windeast',
    'windsouth',
    'windwest',
    'windnorth',
    'dragonred',
    'dragongreen',
    'dragonwhite',
    /* Bonus */
    'flowerplum',
    'flowerorchid',
    'flowerchrysan',
    'flowerbamboo',
    'seasonspring',
    'seasonsummer',
    'seasonautumn',
    'seasonwinter'
];

var card = function() {
    return {
        restrict: 'E',
        scope:{
            card:"=",
            flipped:"="
        },
        templateUrl: 'tpl/directives/card.html',
        link: function(scope) {
            if (scope.card && scope.card.val >= 0) {
                scope.tileName = tileNames[scope.card.val];
            }

            if (scope.flipped) {
                // Blank intended:w
            } else {

            }
        }
    };
};
Application.Directives.directive('card', [card]);
