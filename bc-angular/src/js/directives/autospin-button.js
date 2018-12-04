'use strict';
Application.Directives.directive('autospinButton', [

    function() {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'tpl/directives/autospin-button.html',
            link: function(scope)
            {
                scope.autoSpin = function() {
                    scope.autospin = scope.autospin ? false : true;
                    clearTimeout(scope.autobetTimer);
                };
            }
        };
    }
]);
