'use strict';
Application.Directives.directive('walletCurrency', [
    function() {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'tpl/directives/wallet-currency.html',
            scope:{
                wallet: '='
            },
            link: function(){}
        };
    }
]);
