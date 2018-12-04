(function(window, angular, Application) {
    'use strict';

    var currencyChooser = function($rootScope, $location) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'tpl/directives/currency-chooser.html',
            scope: {
                currencies: '=',
            },
            link: function(scope) {
                scope.CURRENCIES = $rootScope.CURRENCIES;
                scope.currencies = angular.copy($rootScope.CURRENCIES);
                scope.checkCurrencies = {};
                scope.checkAll = true;
                scope.$watch('checkAll', function(newVal, oldVal) {
                    if (newVal && !oldVal) {
                        scope.currencies = angular.copy(scope.CURRENCIES);
                        scope.currencies.forEach(function(currency) {
                            scope.checkCurrencies[currency] = true;
                        });
                    }
                });

                scope.updateCurrencies = function() {
                    scope.currencies = Object.keys(scope.checkCurrencies).filter(function(currency) {
                        if (scope.checkCurrencies[currency]) {
                            return currency;
                        }
                    });
                    if (scope.currencies.length === scope.CURRENCIES.length) {
                        scope.checkAll = true;
                    } else {
                        scope.checkAll = false;
                    }
                    if (scope.currencies.length === 0) {
                        scope.checkAll = true;
                    }
                    console.log(scope.currencies, scope.checkCurrencies);
                };

                var query = $location.search();
                if (query.currencies) {
                    if (!angular.isArray(query.currencies)) {
                        query.currencies = [query.currencies];
                    }
                    query.currencies.forEach(function(currency) {
                        scope.checkCurrencies[currency] = true;
                    });
                    scope.updateCurrencies();
                }
            }
        };
    };

    Application.Directives.directive('currencyChooserBack', ['$rootScope', '$location', currencyChooser]);
})(window, window.angular, window.Application);
