'use strict';

Application.Directives.directive('bcClientSeed', [
    function() {
        return {
            restrict:'E',
            scope: {
                reset: '=',
                seedValue: '=',
                initSeedValue: '='
            },
            templateUrl: 'tpl/directives/client-seed.html',
            link: function(scope, element) {
                if(scope.initSeedValue){
                    scope.seedValue = scope.initSeedValue;
                }
                $(element).find('input.seed').keyup(function(event){
                    scope.seedValue = event.target.value;
                    scope.reset = false;
                });
            }
        };
    }
]);


