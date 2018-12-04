'use strict';

/* global Application */
/* global ioLegacy */

var api = "https://d-api.betcoin.tm";
var httpApi = "https://d-api.betcoin.tm";
var socket = "https://d-api.betcoin.tm:443";


Application.Services.factory("Dice", ['$resource', function($resource) {
    // We need to add an update method
    return $resource(api + "/dice/:id", {
        id: "@id"
    }, {
        newGame: {
            method: "POST"
        },
        recent: {
            method: 'GET',
            params: {
                type: 'recent'
            },
            isArray: true
        },
        unconfirmed: {
            method: 'GET',
            params: {
                type: 'unconfirmed'
            },
            isArray: true
        },
        big: {
            method: 'GET',
            params: {
                type: 'big'
            },
            isArray: true
        },
        rare: {
            method: 'GET',
            params: {
                type: 'rare'
            },
            isArray: true
        },
        leaderboard: {
            method: 'GET',
            params: {
                type: 'leaderboard'
            },
            isArray: true
        }
    });
}]);

Application.Services.factory('secretHash', ['$http', function($http) {
    return function(date, cb) {
        var now = new Date();
        now.setUTCHours(0);
        now.setUTCMinutes(0);
        now.setUTCSeconds(0);
        now.setUTCMilliseconds(0);
        if (date.getTime() > (now.getTime() - (24 * 60 * 60 * 1000))) {
            cb(undefined, "HIDDEN");
        } else {
            $http({
                method: 'GET',
                url: httpApi + '/secret.keys/' + date.getTime()
            }).success(function(data) {
                cb(undefined, data);
            }).error(function(data) {
                cb (new Error(data));
            });
        }
    };
}]);

Application.Services.factory('PlayerStats', ['$resource', function($resource) {
    return $resource(api + "/dice/player");
}]);

Application.Services.service('DiceSocket', function() {
    return ioLegacy.connect(socket);
});
