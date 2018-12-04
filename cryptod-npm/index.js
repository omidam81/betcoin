'use strict';

var cryptoRPC = require('bitcoin');

var SUPPORTED_TYPES = ["bitcoin", "dogecoin", "litecoin"];
var DEFAULT_PORTS = {
    'bitcoin' : {mainnet: 8332,  testnet: 18332},
    'litecoin': {mainnet: 9332,  testnet: 19332},
    'dogecoin': {mainnet: 22555, testnet: 44555},
};

module.exports = function(cryptotype, testnet) {
    if (SUPPORTED_TYPES.indexOf(cryptotype) < 0) throw new Error("Invalid cryptocurrency type " + cryptotype);

    var userEnv = cryptotype.toUpperCase() + "_RPCUSER";
        var passEnv = cryptotype.toUpperCase() + "_RPCPASSWORD";
    var rpcuser = process.env[userEnv];
    var rpcpassword = process.env[passEnv];

    if (!rpcuser) throw new Error("Missing " + userEnv + " from environment");
    if (!rpcpassword) throw new Error("Missing " + passEnv + " from environment");

    var cryptod = cryptoRPC.Client({
        host: cryptotype + 'd',
        port: (testnet) ? DEFAULT_PORTS[cryptotype].testnet : DEFAULT_PORTS[cryptotype].mainnet,
        user: rpcuser,
        pass: rpcpassword
    });
    
    var prepare = require('./lib/prepare')(cryptod);
    var send = require('./lib/send')(cryptod);

    cryptod.prepare = prepare.bind(cryptod);
    cryptod.send = send.bind(cryptod);

    return cryptod;
};
