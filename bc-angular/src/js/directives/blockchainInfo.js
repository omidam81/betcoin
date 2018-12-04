'use strict';

Application.Directives.directive('blockchainInfo', [
    'PlayerApi',
    function(PlayerApi) {
        return {
            scope: true,
            replace: true,
            template: "<a ng-href=\"{{href}}\" target=\"_blank\">{{displayString}}</a>",
            link: function(scope, element, attrs) {
                attrs.$observe('blockchainInfo', function(searchTerm) {
                    var currency = scope.currency = attrs.currency;
                    if (!currency) {
                        currency = scope.currency = 'bitcoin';
                    }
                    scope.searchTerm = searchTerm;
                    if (currency === 'bitcoin') {
                        if(PlayerApi.lang === 'en_US') {
                            scope.href = "http://blockchain.info/search/" + searchTerm;
                        } else {
                            scope.href = "http://block.oklink.com/btc/search/" + searchTerm;
                        }
                    } else if (currency === 'litecoin') {
                        scope.href = "http://ltc.blockr.io/tx/info/" + searchTerm;
                    } else if (currency === 'ppcoin') {
                        scope.href = "http://ppc.blockr.io/tx/info/" + searchTerm;
                    } else if (currency === 'dogecoin') {
                        scope.href = "http://dogechain.info/tx/" + searchTerm;
                    } else if (currency === 'namecoin') {
                        scope.href = "https://explorer.namecoin.info/tx/" + searchTerm;
                    }
                    if (attrs.chars) {
                        scope.displayString = searchTerm.substring(0, attrs.chars) + "...";
                    } else {
                        scope.displayString = searchTerm;
                    }
                });
            }
        };
    }
]);
