'use strict';


module.exports = function(app, HiloController, PlayerInterface) {

    app.use(PlayerInterface.extractApiToken);

    app.get('/hilo/next', HiloController.next);
    app.get('/hilo/leaderboard', HiloController.leaderboard);

    // express 4 style routing. You can set up "mount points" for a
    // route with the different http verbs as methods
    app.route('/hilo/:id?')
        .get(HiloController.read)
        .post(HiloController.play)
        .put(HiloController.nextAction);
};
