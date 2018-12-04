'use strict';


module.exports = function(app, GameController, PlayerInterface) {

    app.use(PlayerInterface.extractApiToken);

    app.get('/deuceswild/next', GameController.next);
    app.get('/deuceswild/leaderboard', GameController.leaderboard);

    // express 4 style routing. You can set up "mount points" for a
    // route with the different http verbs as methods
    app.route('/deuceswild/:id?')
        .get(GameController.read)
        .post(GameController.play)
        .put(GameController.nextAction);
};
