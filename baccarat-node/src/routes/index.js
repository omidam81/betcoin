'use strict';


module.exports = function(app, BaccaratController, PlayerInterface) {

    app.use(PlayerInterface.extractApiToken);

    app.get('/baccarat/next', BaccaratController.next);
    app.get('/baccarat/leaderboard', BaccaratController.leaderboard);

    // express 4 style routing. You can set up "mount points" for a
    // route with the different http verbs as methods
    app.route('/baccarat/:id?')
        .get(BaccaratController.read)
        .post(BaccaratController.play);
};
