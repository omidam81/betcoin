'use strict';
var api = "https://<%= hostname %>/<%= base %>";
var socket = "https://<%= hostname %>:443/";
Application.Services.factory('Game', ['$resource', function($resource) {
    return $resource( api + '/:action/:type/:target/:id', {id: "@id", action:'bet' }, {
        getActiveLotteries: {
            method: "GET",
            params: {
                action: 'lottery',
                id: 'active'
            },
            isArray: true
        },
        getActiveLottery: {
            method: "GET",
            params: {
                action: 'lottery',
                id: 'active'
            }
        },
        getLottery: {
            method: "GET",
            params: {
                action: 'lottery'
            }
        },
        getLotteries: {
            method: "GET",
            params: {
                action: 'lottery'
            },
            isArray: true
        },
        getActivePlayerLotteries: {
            method: "GET",
            params: {
                action: 'lottery',
                type: 'active',
                target: 'player'
            },
            isArray: true
        },
        newGame: {
            method: "POST",
            params: {
                action: 'bet'
            }
        },
        nextAction: {
            method: "PUT"
        },
        nextGame: {
            method: 'GET',
            params: {
                id: 'next'
            }
        },
        leaderboard: {
            method: 'GET',
            params: {
                id: 'leaderboard',
            },
            isArray: true
        }
    });
}]);

Application.Services.service('GameSocket', ['Socket', function(Socket) {
    return Socket.getConnection(socket);
}]);
