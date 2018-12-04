require('../lib/number-prototypes');
module.exports = {
    'bronze': {
        minWagered: 1,
        maxWagered: 99999999,
        threshold: 1
    },
    'silver': {
        minWagered: (1).toSatoshi(),
        maxWagered: (9.99999999).toSatoshi(),
        threshold: (0.01).toSatoshi()
    },
    'gold': {
        minWagered: (10).toSatoshi(),
        maxWagered: (99.99999999).toSatoshi(),
        threshold: (0.1).toSatoshi()
    },
    'platinum': {
        minWagered: (100).toSatoshi(),
        maxWagered: (999.99999999).toSatoshi(),
        threshold: (1).toSatoshi()
    },
    'diamond': {
        minWagered: (1000).toSatoshi(),
        maxWagered: -1,
        threshold: (10).toSatoshi()
    }
};

