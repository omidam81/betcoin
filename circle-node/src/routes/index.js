'use strict';

var swagger = require('swagger-node-express');

module.exports = function(app, container) {
    swagger.setAppHandler(app);
    swagger.addModels(require('../lib/models'));
    container.resolve(function(CircleController, PlayerInterface) {
        app.use(PlayerInterface.extractApiToken);
        swagger.addGet({
            spec: {
                description: "Ping url",
                path: "/ping",
                method: 'GET',
                nickname: 'ping'
            },
            action: function(req, res) {
                res.send("pong");
            }
        });

        swagger.addGet({
            spec: {
                description: 'Get a new circle game with server seed',
                path: '/circle/next',
                notes: 'This endpoint returns an incomplete Circle model, when the game is actually played, it will have the rest of the values filled in.',
                summary: 'Generates a server seed and game id for a specific game, returns hashed values',
                method: 'GET',
                parameters: [
                    swagger.queryParam("game", "The game to generate the new record for", "number")
                ],
                type: 'Circle',
                errorResponses: [
                    swagger.errors.invalid('game'),
                    {code: 400, message: 'missing game from next game request'}
                ],
                nickname: 'next'
            },
            action: CircleController.next
        });
        
        swagger.addGet({
            spec: {
                description: 'Get the leaderboard',
                path: '/circle/leaderboard',
                notes: 'returns 300 players max',
                summary: 'Get a list of leders sorted by BTC bet descending',
                method: 'GET',
                type: 'Circle',
                nickname: 'leaderboard'
            },
            action: CircleController.leaderboard
        });

        swagger.addGet({
            spec: {
                description: 'Get a circle game by id',
                path: '/circle/{id}',
                summary: 'Get a specific game by id',
                method: 'GET',
                parameters: [
                    swagger.pathParam("id", "game id", "string")
                ],
                type: 'Circle',
                nickname: 'read'
            },
            action: CircleController.read
        });

        swagger.addGet({
            spec: {
                description: 'Get a list of circle games',
                path: '/circle',
                notes: 'Default limit is 30',
                summary: 'Get a list of circle games or a specific game by id',
                method: 'GET',
                parameters: [
                    swagger.queryParam("limit", "number of games to return", "number")
                ],
                type: 'Circle',
                nickname: 'read'
            },
            action: CircleController.read
        });

        swagger.addPost({
            spec: {
                description: 'Play a circle game',
                path: '/circle',
                summary: 'Play a circle game',
                method: 'POST',
                parameters: [
                    swagger.formParam("client_seed", "the client set seed", "string"),
                    swagger.formParam("game", "the game being played", "number"),
                    swagger.formParam("wager", "the wager amount in satoshi", "number"),
                    swagger.formParam("player_id", "the mongo object id of the player", "string"),
                    swagger.formParam("game_id", "the mongo object id of the game being played", "string")
                ],
                type: 'Circle',
                consumes: ['application/json'],
                nickname: 'play'
            },
            action: CircleController.play
        });


    });
    // Configures the app's base path and api version.
    swagger.configureSwaggerPaths("", "api-docs", "");
    swagger.configure("/", "1.0.0");
};
