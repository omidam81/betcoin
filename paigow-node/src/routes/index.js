'use strict';


module.exports = function(app, GameController, PlayerInterface) {

    app.use(PlayerInterface.extractApiToken);

    app.get('/paigow/next', GameController.next);
    app.get('/paigow/leaderboard', GameController.leaderboard);

    // express 4 style routing. You can set up "mount points" for a
    // route with the different http verbs as methods
    app.route('/paigow/:id?')
        .get(GameController.read)
        .post(GameController.play)
        .put(GameController.nextAction);
};
