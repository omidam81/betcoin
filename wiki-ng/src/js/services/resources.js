'use strict';

var api = "<%= api.protocol %>://<%= api.host %>:<%= api.port %>";

Application.Services.constant('Api', {
    url: api + "/api/v1/",
    scheme: "<%= api.protocol %>",
    hostname: "<%= api.host %>",
    port: "<%= api.port %>",
    base: "/api/v1"
});

Application.Services.constant('PlayerApi', {
    hostname: '<%= playerServer.host %>',
    port: '<%= playerServer.port %>',
    protocol: '<%= playerServer.protocol %>',
    base: '<%= playerServer.base %>'
});
