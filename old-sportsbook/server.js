'use strict';

var url = require('url');
var optimist = require('optimist');
var io = require('socket.io');

//@TODO make everything https

process.env.PLAYER_SERVER_PORT_3000_TCP = "http://yourmum.com:80"; //@TODO put this in config.json

if (!process.env.PLAYER_SERVER_PORT_3000_TCP)
    throw "You must have the environment variable PLAYER_SERVER_PORT_3000_TCP set to use the player server interface";

var playerServerUrl = url.parse(process.env.PLAYER_SERVER_PORT_3000_TCP);

if (playerServerUrl.hostname === null)
    throw "Malformed PLAYER_SERVER_PORT_3000_TCP variable: " + process.env.PLAYER_SERVER_PORT_3000_TCP;
if (playerServerUrl.port === null)
    throw "Malformed PLAYER_SERVER_PORT_3000_TCP variable: " + process.env.PLAYER_SERVER_PORT_3000_TCP;

var argv = optimist.default({port: 80}).argv;

var App = {
    data: {
        production: process.env.NODE_ENV === 'production',
        serverPort: argv.port,
        playerServerUrl: process.env.PLAYER_SERVER_PORT_3000_TCP+"/"
    }
}

require('./init.js').run(App);

App.Services = {
    PlayerServer: require('./services/player-server.js').generateService(App),
    Queries: require('./services/queries.js').generateService(App)
};

App.Sockets = {
    Main: require('./sockets/main.js').generateSockets(App),
    PlayerServer: require('./sockets/player-server.js').generateSockets(App),
    Olympia: require('./sockets/olympia.js').generateSockets(App)
};

if (App.data.production) {
    App.io = io.listen(argv.port, { log: false }); //@TODO false is probably not the desired behaviour
} else {
    App.io = io.listen(argv.port);
}

App.io.sockets.on('connection', App.Sockets.Main.connection);