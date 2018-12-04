'use strict';
Application.Directives.directive('totalbets', [
    'BCSession',
    function(BCSession) {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                total: '='
            },
            templateUrl: 'tpl/directives/totalbets.html',
            link: function(scope){
                scope.BCSession = BCSession;
            }
        };
    }
]);
