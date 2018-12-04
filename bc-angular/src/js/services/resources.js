'use strict';

Application.Services.constant('PlayerApi', {
    hostname: '<%= hostname %>',
    port: 443,
    protocol: 'https',
    base: 'user',
    lang: '<%= lang %>',
    httpUrl: 'https://<%= hostname %>'
});
Application.Services.constant('SocketServer', {
    hostname: '<%= hostname %>',
    port: 443,
    protocol: 'https',
    base: ''
});
Application.Services.constant('CacheServer', {
    hostname: '<%= hostname %>',
    port: 443,
    protocol: 'https',
    event: 'global counter',
    endpoint: '/counter'
});
