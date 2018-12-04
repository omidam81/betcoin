'use strict';


module.exports = function(app, GameController, PlayerInterface) {

    app.use(PlayerInterface.extractApiToken);

    app.get('/baccpo/next', GameController.next);
    app.get('/baccpo/leaderboard', GameController.leaderboard);

    // express 4 style routing. You can set up "mount points" for a
    // route with the different http verbs as methods
    app.route('/baccpo/:id?')
        .get(GameController.read)
        .post(GameController.play)
        .put(GameController.nextAction);
};
