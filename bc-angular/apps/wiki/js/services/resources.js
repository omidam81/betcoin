'use strict';

var api = "https://office.betcoin.tm:8443";

Application.Services.constant('Api', {
    url: api + "/api/v1/",
    scheme: "https",
    hostname: "office.betcoin.tm",
    port: "8443",
    base: "/api/v1"
});
