'use strict';


module.exports = function(app, TigerdragonController, PlayerInterface) {

    app.use(PlayerInterface.extractApiToken);

    app.get('/tigerdragon/next', TigerdragonController.next);
    app.get('/tigerdragon/leaderboard', TigerdragonController.leaderboard);

    // express 4 style routing. You can set up "mount points" for a
    // route with the different http verbs as methods
    app.route('/tigerdragon/:id?')
        .get(TigerdragonController.read)
        .post(TigerdragonController.play);
};
