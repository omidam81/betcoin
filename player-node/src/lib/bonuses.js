'use strict';

module.exports = {
    welcome: {
        type: "match",
        app: "player",
        currency: "btc",
        autostart: false,
        unlockMultiplier: 58,
        max: (88).toSatoshi()
    },
    match: {
        type: "match",
        app: "player",
        currency: "btc",
        autostart: false,
        unlockMultiplier: 58,
        max: (88).toSatoshi()
    },
    straight: {
        type: "straight",
        app: "player",
        currency: "btc",
        autostart: true,
        unlockMultiplier: 58,
        initial: (0.5).toSatoshi()
    },
    types: ["match"/*, "straight"*/]
};
