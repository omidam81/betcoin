'use strict';
/* global bitcoin */
Application.Directives.directive('bcBitcoinIcons', [
    'PlayerApi',
    'BCSession',
    function(PlayerApi, BCSession) {
        return {
            restrict:'E',
            templateUrl: 'tpl/directives/bitcoin-icons.html',
            scope: {
                currency: '='
            },
            link: function(scope,element,attrs) {
                scope.BCSession = BCSession;
                scope.rootUrl = scope.qrcodeUrl = PlayerApi.protocol + '://' + PlayerApi.hostname + ':' + PlayerApi.port;
                attrs.$observe('btcAddress',function(){
                    scope.btcAddress = attrs.btcAddress;
                });
                scope.sendBitcoins = function(address) {
                    bitcoin.sendMoney(address);
                };
            }
        };
    }
]);
