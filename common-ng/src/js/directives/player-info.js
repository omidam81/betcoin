'use strict';

Application.Directives.directive('playerInfo', [
    function() {
        return {
            restrict:'E',
            templateUrl: 'tpl/directives/player-info.html',
            link: function() { //scope,element,attrs

            }
        };
    }
]);
