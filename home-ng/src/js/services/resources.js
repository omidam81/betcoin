'use strict';

Application.Services.constant('PlayerApi', {
    hostname: '<%= playerServer.host %>',
    port: '<%= playerServer.port %>',
    protocol: '<%= playerServer.protocol %>',
    base: '<%= playerServer.base %>'
});
Application.Services.constant('SocketServer', {
    hostname: '<%= socketServer.host %>',
    port: '<%= socketServer.port %>',
    protocol: '<%= socketServer.protocol %>',
    base: '<%= socketServer.base %>'
});
Application.Services.constant('CacheServer', {
    hostname: '<%= cacheServer.host %>',
    port: '<%= cacheServer.port %>',
    protocol: '<%= cacheServer.protocol %>',
    event: '<%= cacheServer.event %>',
    endpoint: '<%= cacheServer.endpoint %>'
});
