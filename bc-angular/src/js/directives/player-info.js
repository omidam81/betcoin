'use strict';

Application.Directives.directive('playerInfo', [
    'BCSession',
    function(BCSession) {
        return {
            restrict:'E',
            templateUrl: 'tpl/directives/player-info.html',
            link: function(scope) { //scope,element,attrs
                scope.BCSession = BCSession;
            }
        };
    }
]);
