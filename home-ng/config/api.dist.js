module.exports = {
    playerServer: {
        host: 'api.betcoin.tm',
        port: 443,
        protocol: 'https',
        base: 'account'
    },
    socketServer: {
        host: 'api.betcoin.tm',
        port: 8443,
        protocol: 'https',
        base: 'account'
    },
    cacheServer: {
        host: 'api.betcoin.tm',
        port: 443,
        protocol: 'https',
        endpoint: '/counter/statistics/global/latest',
        event: 'global counter'
    }
};
