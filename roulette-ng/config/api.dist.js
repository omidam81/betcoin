module.exports = {
    api: {
        host: 'api.betcoin.tm',
        port: '443',
        protocol: 'https',
        base: "roulette"
    },
    socket: {
        host: 'api.betcoin.tm',
        port: '8443',
        protocol: 'https',
        base: "roulette"
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
