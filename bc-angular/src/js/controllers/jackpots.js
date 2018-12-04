(function(window, Application) {
    'use strict';

    var JackpotService = function($http, PlayerApi) {
        return {
            get: function() {
                return $http.get(PlayerApi.httpUrl + '/jackpots');
            }
        };
    };

    Application.Services.factory('Jackpots', [
        '$http',
        'PlayerApi',
        JackpotService
    ]);

    function JackpotsController($scope, PlayerApi, Jackpots, exchangeRate, BCPlayer) {

        var currency = (PlayerApi.lang === 'en_US') ? 'USD': 'CNY';
        var jackpotsById = {};

        $scope.lang     = PlayerApi.lang;
        $scope.jackpots = [];

        function processJackpotData(data, index) {

            var d, id = data._id, jp = jackpotsById[id];

            if(!jp) {
                jp = {};
                jackpotsById[id] = jp;
                $scope.jackpots[index] = jp;
            }

            for(d in data) {
                jp[d] = data[d];
            }

            jp.fiatWagered = exchangeRate.convert(jp.wagered, currency);
            jp.fiatValue   = exchangeRate.convert(jp.value, currency);

        }

        function processJackpots(data) {
            // jackpot 0 is always VIP
            processJackpotData(data[0], 0);
            // jackpot 1 is always JADE
            processJackpotData(data[1], 1);
        }

        $scope.updateJackpots = function() {
            Jackpots.get().success(function(data) {
                processJackpots(data);
            }).error(function(err) {
                $scope.error = err;
            });
        };

        BCPlayer.socket.on('jackpot', function(data) {
            $scope.$apply(function() {
                processJackpots(data);
            });
        });
        $scope.updateJackpots();

    }

    Application.Controllers.controller('JackpotsController', [
        '$scope',
        'PlayerApi',
        'Jackpots',
        'exchangeRate',
        'BCPlayer',
        JackpotsController
    ]);

})(window, window.Application);
