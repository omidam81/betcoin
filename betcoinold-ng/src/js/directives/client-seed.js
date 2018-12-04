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
            link: function(scope) {
                scope.setClientSeed = function (){
                    if(scope.initSeedValue){
                        scope.seedValue = scope.initSeedValue;
                        scope.reset = false;
                    }
                };
            }
        };
    }
]);


