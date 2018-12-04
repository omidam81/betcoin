'use strict';

module.exports = {
    Dice: {
        id: 'Dice',
        required: [
            'server_seed',
            'seed_hash',
            'init_time'
        ],
        properties: {
            _id: {
                type: 'string',
                description: 'mongo ObjectID'
            },
            bets: {
                type: 'string',
                description: 'JSON string of bets'
            },
            server_seed: {
                type: 'string',
                description: 'the server seed, hidden until the game is completed'
            },
            seed_hash: {
                type: 'string',
                description: 'hex encoded sha256 sum of the init array and server seed as a json encoded object'
            },
            init_time: {
                type: 'number',
                description: 'timestamp in milliseconds since unix epoch of game init time'
            },
            init_array: {
                type: 'string',
                description: 'initial array (starting point)'
            },
            init_hash: {
                type: 'string',
                description: 'initial array hash (starting point)'
            },
            final_array: {
                type: 'string',
                description: 'final array (starting point)'
            },
            player_id: {
                type: 'string',
                description: 'the player who plays the game, a mongo objectID'
            },
            player_alias: {
                type: 'string',
                description: 'the players alias'
            },
            wager: {
                type: 'number',
                description: 'the amount in satoshi wagered'
            },
            client_seed: {
                type: 'string',
                description: 'the seed set by the client'
            },
            winnings: {
                type: 'number',
                description: 'the winnings in satoshi'
            },
            result: {
                type: 'number',
                description: 'the lucky number'
            },
            payouts: {
                type: 'string',
                description: 'array of payouts by bet'
            },
            payout_multiplier: {
                type: 'number',
                description: 'the multiplier of the winnings'
            },
            ip: {
                type: 'string',
                description: 'the ip address from where the game was played'
            },
            createdAt: {
                type: 'date',
                description: 'a JS Date object for when the game was played (as opposed to created)'
            }
        }
    }
};
