module.exports.generateSockets = function(App) {
    var sockets = {
        connection: function(socket) {
            socket.on('player-server/signup', App.Sockets.PlayerServer.signup);
            socket.on('player-server/login', App.Sockets.PlayerServer.login);
            socket.on('player-server/logout', App.Sockets.PlayerServer.logout);
            socket.on('player-server/getChallengeSignature', App.Sockets.PlayerServer.getChallengeSignature);
            socket.on('player-server/getUserInfo', App.Sockets.PlayerServer.getUserInfo);
            socket.on('player-server/setUserAlias', App.Sockets.PlayerServer.setUserAlias);
            socket.on('player-server/setUserPassword', App.Sockets.PlayerServer.setUserPassword);
            socket.on('player-server/setUserAddress', App.Sockets.PlayerServer.setUserAddress);
            socket.on('player-server/withdraw', App.Sockets.PlayerServer.withdraw);
            socket.on('player-server/checkFaucet', App.Sockets.PlayerServer.checkFaucet);


            socket.on('olympia/doQuery', App.Sockets.Olympia.doQuery);
            //socket.on('olympia/placeBet', App.Sockets.Olympia.placeBet);

            // @TODO discuss: check what happens when anonymous session expires and bets are still on (cancel callback?)

            socket.on('disconnect', App.Sockets.Main.disconnect);
        },
        disconnect: function() {

        }
    };

    return sockets;
}