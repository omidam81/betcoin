'use strict';

var api = "https://<%= hostname %>/<%= base %>";
var socket = "https://<%= hostname %>:8443/<%= base %>";

Application.Services.factory('Game', ['$resource', function($resource) {
    return $resource( api + '/minesweeper/:id', {id: "@id" }, {
        newGame: {
            method: "POST"
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
