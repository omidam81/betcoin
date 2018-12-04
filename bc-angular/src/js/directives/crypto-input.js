(function(window, Application) {
    'use strict';

    Application.Directives.directive('cryptoInput', ['$filter', function($filter) {
        return {
            template: '<span class="input-group-addon">{{symbol}}</span>' +
                '<input class="form-control" type="text" ng-model="displayVal">',
            restrict: 'E',
            scope: {
                intVal: '=model',
                currency: '='
            },
            link: function(scope) {
                scope.$watch('currency', function(newVal) {
                    if (newVal) {
                        scope.symbol = $filter('cryptosymbol')(scope.currency);
                    }
                });
                scope.$watch('intVal', function(newVal) {
                    var val = parseInt(newVal, 10);
                    if (isNaN(val)) {
                        return;
                    } else {
                        scope.displayVal = val.toBitcoin();
                    }
                });
                scope.$watch('displayVal', function(newVal) {
                    var val = parseFloat(newVal);
                    if (isNaN(val)) {
                        return;
                    } else {
                        scope.intVal = val.toSatoshi();
                    }
                });
            }
        };
    }]);

})(window, Application);
