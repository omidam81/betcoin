(function(angular) {
    'use strict';
    var module;
    try {
        module = angular.module('app.controllers');
    } catch (e) {
        module = angular.module('app.controllers', []);
    }

    var JackpotsController = function($scope, exchangeRate, Jackpots, BCSession, BCSocket) {

        var currency = BCSession.fiat;
        var jackpotsById = {};

        $scope.lang     = BCSession.lang;
        $scope.jackpots = [];

        var processJackpots = function(data) {
            data.forEach(function(data, index) {
                var id = data._id;
                var jackpot = jackpotsById[id];
                if(!jackpot) {
                    jackpot = angular.copy(data);
                    jackpotsById[id] = jackpot;
                    // jackpots must be at the proper index. vip is
                    // always 0 and jade is always 1
                    $scope.jackpots[index] = jackpot;
                }
                jackpot.wagered = data.wagered;
                jackpot.value = data.value;
                jackpot.fiatWagered = exchangeRate.convert(data.wagered, currency);
                jackpot.fiatValue   = exchangeRate.convert(data.value, currency);
            });
        };

        Jackpots.query(processJackpots);

        BCSocket.on('jackpot', processJackpots);

    };

    module.controller('JackpotsController', [
        '$scope',
        'exchangeRate',
        'Jackpots',
        'BCSession',
        'BCSocket',
        JackpotsController
    ]);

})(window.angular);
