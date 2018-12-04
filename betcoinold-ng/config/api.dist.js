module.exports = {
    playerServer: {
        host: 'api.betcoin.tm',
        port: 441,
        protocol: 'https'
    },
    cacheServer: {
        host: 'api.betcoin.tm',
        port: 8444,
        protocol: 'https',
        endpoint: '/statistics/global/latest',
        event: 'global counter'
    }
};
