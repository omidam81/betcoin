module.exports = {
    api: {
        host: 'api.betcoin.tm',
        port: '443',
        protocol: 'https',
        base: "baccarat"
    },
    socket: {
        host: 'api.betcoin.tm',
        port: '8443',
        protocol: 'https',
        base: "baccarat"
    },
    playerServer: {
        host: 'api.betcoin.tm',
        port: 443,
        protocol: 'https',
        base: "account"
    },
    cacheServer: {
        host: 'api.betcoin.tm',
        port: 8444,
        protocol: 'https',
        endpoint: '/counter/statistics/global/latest',
        event: 'global counter'
    }
};
