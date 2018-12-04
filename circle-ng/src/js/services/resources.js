'use strict';

var api = "<%= api.protocol %>://<%= api.host %>\\:<%= api.port %>/<%= api.base %>";
var socket = "<%= socket.protocol %>://<%= socket.host %>:<%= socket.port %>/<%= socket.base %>";

Application.Services.constant('PlayerApi', {
    hostname: '<%= playerServer.host %>',
    port: '<%= playerServer.port %>',
    protocol: '<%= playerServer.protocol %>',
    base: '<%= playerServer.base %>'
});

Application.Services.constant('SocketServer', {
    hostname: '<%= socket.host %>',
    port: '<%= socket.port %>',
    protocol: '<%= socket.protocol %>',
    base: '<%= playerServer.base %>'
});

Application.Services.constant('CacheServer', {
    hostname: '<%= cacheServer.host %>',
    port: '<%= cacheServer.port %>',
    protocol: '<%= cacheServer.protocol %>',
    event: '<%= cacheServer.event %>',
    endpoint: '<%= cacheServer.endpoint %>'
});
Application.Services.factory('Game', ['$resource', function($resource) {
    return $resource( api + '/circle/:id', {id: "@id" }, {
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

Application.Services.service('CircleSocket', ['Socket', function(Socket) {
    return Socket.getConnection(socket);
}]);
