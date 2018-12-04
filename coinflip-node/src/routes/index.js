'use strict';


module.exports = function(app, CoinflipController, PlayerInterface) {

    app.use(PlayerInterface.extractApiToken);

    app.get('/coinflip/next', CoinflipController.next);
    app.get('/coinflip/leaderboard', CoinflipController.leaderboard);

    // express 4 style routing. You can set up "mount points" for a
    // route with the different http verbs as methods
    app.route('/coinflip/:id?')
        .get(CoinflipController.read)
        .post(CoinflipController.play);

};
