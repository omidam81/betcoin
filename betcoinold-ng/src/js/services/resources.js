'use strict';

Application.Services.constant('PlayerApi', {
    hostname: '<%= playerServer.host %>',
    port: '<%= playerServer.port %>',
    protocol: '<%= playerServer.protocol %>'
});
Application.Services.constant('CacheServer', {
    hostname: '<%= cacheServer.host %>',
    port: '<%= cacheServer.port %>',
    protocol: '<%= cacheServer.protocol %>',
    event: '<%= cacheServer.event %>',
    endpoint: '<%= cacheServer.endpoint %>'
});