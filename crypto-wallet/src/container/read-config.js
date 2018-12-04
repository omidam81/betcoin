'use strict';

var SUPPORTED_TYPES = [
    'bitcoin',
    'litecoin',
    'dogecoin',
    'ppcoin',
    'namecoin'
];

var DEFAULT_PORTS = {
    'bitcoin' : {mainnet: 8332,  testnet: 18332},
    'litecoin': {mainnet: 9332,  testnet: 19332},
    'dogecoin': {mainnet: 22555, testnet: 44555},
    'ppcoin': {mainnet: 9902, testnet: 9902},
    'namecoin': {mainnet: 8336, testnet: 18336},
};

var fs = require('fs');
var HOME = process.env.HOME;

module.exports = function(logger, CRYPTO_TYPE) {

    if (!CRYPTO_TYPE) {
        throw "missing CRYPTO_TYPE environment variable";
    }

    if (SUPPORTED_TYPES.indexOf(CRYPTO_TYPE) < 0) {
        throw "invalid crypto type, " +
            CRYPTO_TYPE + " given, valid types: " +
            SUPPORTED_TYPES.join("|");
    }

    var confFile = HOME + '/.' + CRYPTO_TYPE + '/' + CRYPTO_TYPE + '.conf';
    logger.debug("reading conf file %s", confFile);
    var conf = fs.readFileSync(confFile).toString().split('\n');

    var host, port, user, pass, testnet;
    var hostReg = /(rpcconnect|bind)=/;
    var portReg = /rpcport=/;
    var userReg = /rpcuser=/;
    var passReg = /rpcpassword=/;
    var testnetReg = /testnet=1/;
    conf.forEach(function(confItem) {
        if (hostReg.test(confItem)) {
            host = confItem.replace(hostReg, "");
        }
        if (portReg.test(confItem)) {
            port = parseInt(confItem.replace(portReg, ""), 10);
        }
        if (userReg.test(confItem)) {
            user = confItem.replace(userReg, "");
        }
        if (passReg.test(confItem)) {
            pass = confItem.replace(passReg, "");
        }
        if (testnetReg.test(confItem)) {
            testnet = true;
        }
    });

    if (!user || !pass) throw "missing rpcuser or rpcpassword from config";

    return {
        host: host || 'localhost',
        port: port || (testnet) ? DEFAULT_PORTS[CRYPTO_TYPE].testnet : DEFAULT_PORTS[CRYPTO_TYPE].mainnet,
        user: user,
        pass: pass
    };

};
