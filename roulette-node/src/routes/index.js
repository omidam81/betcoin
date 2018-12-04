'use strict';


module.exports = function(app, RouletteController, PlayerInterface) {

    app.use(PlayerInterface.extractApiToken);

    app.get('/roulette/next', RouletteController.next);
    app.get('/roulette/leaderboard', RouletteController.leaderboard);

    // express 4 style routing. You can set up "mount points" for a
    // route with the different http verbs as methods
    app.route('/roulette/:id?')
        .get(RouletteController.read)
        .post(RouletteController.play);

};
