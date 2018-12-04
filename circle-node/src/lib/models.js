'use strict';

module.exports = {
    Circle: {
        id: 'Circle',
        required: [
            'server_seed',
            'init_array',
            'initial_hash',
            'init_time',
            'game'
        ],
        properties: {
            _id: {
                type: 'string',
                description: 'mongo ObjectID'
            },
            server_seed: {
                type: 'string',
                description: 'the server seed, hidden until the game is completed'
            },
            init_array: {
                type: 'string',
                description: 'a comma separated list of the initial spin array'
            },
            initial_hash: {
                type: 'string',
                description: 'hex encoded sha256 sum of the init array and server seed as a json encoded object'
            },
            init_time: {
                type: 'number',
                description: 'timestamp in milliseconds since unix epoch of game init time'
            },
            game: {
                type: 'number',
                description: 'the game (which circle) the game was made for'
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
            result: {
                type: 'number',
                description: 'the spin result, indicating the slot on the wheel that was selected'
            },
            client_seed: {
                type: 'string',
                description: 'the seed set by the client'
            },
            winnings: {
                type: 'number',
                description: 'the winnings in satoshi'
            },
            payout_multiplier: {
                type: 'number',
                description: 'the multiplier of the winnings'
            },
            ip: {
                type: 'string',
                description: 'the ip address from where the game was played'
            },
            final_array: {
                type: 'string',
                description: 'a comma separated list of the result array'
            },
            createdAt: {
                type: 'date',
                description: 'a JS Date object for when the game was played (as opposed to created)'
            }
        }
    }
};
