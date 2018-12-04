'use strict';
Application.Directives.directive('spinmessage', [
                                                 
function() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'tpl/directives/spinmessage.html',
        link: function(scope)
        {
            scope.hasError = function() {
                return scope.serverMsg || scope.minbetMsg || scope.minconfErr || scope.withdrawErr || scope.maxBetErr || scope.serverErr;
            };
        }
    };
}
]);
