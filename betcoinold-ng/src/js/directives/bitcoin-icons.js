'use strict';
/* global bitcoin */
Application.Directives.directive('bcBitcoinIcons', [
    'PlayerApi',
    function(PlayerApi) {
        return {
            restrict:'E',
            templateUrl: 'tpl/directives/bitcoin-icons.html',
            link: function(scope,element,attrs) {
                attrs.$observe('btcAddress',function(){
                    scope.btcAddress = attrs.btcAddress;
                });
                scope.$watch("showQR", function() {
                    if(scope.showQR) {
                       scope.qrcodeUrl = PlayerApi.protocol + '://' + PlayerApi.hostname + ':' + PlayerApi.port + '/qrcode/'+scope.btcAddress;
                    }
                });

                scope.sendBitcoins = function(address) {
                    bitcoin.sendMoney(address);
                };
            }
        };
    }
]);
