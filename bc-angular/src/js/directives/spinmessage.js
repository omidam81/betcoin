'use strict';
Application.Directives.directive('spinmessage', [
'BCSession',
function(BCSession) {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'tpl/directives/spinmessage.html',
        link: function(scope){
            scope.BCSession = BCSession;
            scope.hasError = function() {
                return scope.serverMsg || scope.minbetMsg || scope.minconfErr || scope.withdrawErr || scope.maxBetErr || scope.serverErr;
            };
        }
    };
}
]);
