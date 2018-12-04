'use strict';

Application.Directives.directive('bcGameCounters', [
    '$http',
    function($http) {
        return {
            restrict: 'E',
            templateUrl: 'tpl/directives/gamecounters.html',
            link: function(scope, element, attrs) {
                var updateCounter = function(data){
                    if(!scope.count || scope.count <= data.count){
                        scope.count = data.count;
                    }
                    if(!scope.sum || scope.sum <= data.sum){
                        scope.sum = data.sum;
                    }
                    scope.exchange = data.exchange;
                };
                var socket = window.io.connect(attrs.socketHost);
                $http({method: 'GET', url:attrs.apiEndpoint}).then(function(result){
                    updateCounter(result.data);
                });
                socket.on(attrs.eventName, function(data){
                    scope.$apply(function() {
                        updateCounter(data);
                    });
                });
                scope.$on('game added', function(e, game){
                    scope.count++;
                    scope.sum += game.winnings.toBitcoin();
                });
            }
        };
    }
]);
