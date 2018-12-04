module.exports = {
    api: {
        host: 'api.betcoin.tm',
        port: '443',
        protocol: 'https',
        base: "hilo"
    },
    socket: {
        host: 'api.betcoin.tm',
        port: '8443',
        protocol: 'https',
        base: "hilo"
    },
    playerServer: {
        host: 'api.betcoin.tm',
        port: 443,
        protocol: 'https',
        base: "account"
    },
    cacheServer: {
        host: 'api.betcoin.tm',
        endpoint: '/counter/statistics/global/latest',
        event: 'global counter'
    }
};
