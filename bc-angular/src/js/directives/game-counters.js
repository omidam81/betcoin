'use strict';

Application.Directives.directive('bcGameCounters', [
    '$http', 'BCPlayer', 'PlayerApi', '$rootScope',
    function($http, BCPlayer, PlayerApi, $rootScope) {
        return {
            restrict: 'E',
            templateUrl: 'tpl/directives/gamecounters.html',
            link: function(scope) {
                var updateCounter = function(data){
                    if(!scope.count || scope.count <= data.total){
                        scope.count = data.total;
                    }
                    if(!scope.sum || scope.sum <= data.wagered.toBitcoin()){
                        scope.sum = data.wagered.toBitcoin();
                    }
                    scope.curCode = (PlayerApi.lang === 'en_US') ? 'USD' : 'RMB';
                    scope.exchange = (PlayerApi.lang === 'en_US') ? data.exchange.USD : data.exchange.CNY;
                    scope.fiatSum = scope.exchange * scope.sum;
                    scope.curSym = (PlayerApi.lang === 'en_US') ?  $rootScope.fiatSymbols.USD : $rootScope.fiatSymbols.CNY;
                };
                var loadCounters = function() {
                    $http({method: 'GET', url: BCPlayer.urlRoot + "/counter"}).then(function(result){
                        updateCounter(result.data);
                    });
                };
                loadCounters();
                BCPlayer.socket.on("counter", function(data){
                    scope.$apply(function() {
                        updateCounter(data);
                    });
                });
            }
        };
    }
]);
