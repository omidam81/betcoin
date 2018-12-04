'use strict';


module.exports = function(app, MinesweeperController, PlayerInterface) {

    app.use(PlayerInterface.extractApiToken);

    app.get('/minesweeper/next', MinesweeperController.next);
    app.get('/minesweeper/leaderboard', MinesweeperController.leaderboard);

    // express 4 style routing. You can set up "mount points" for a
    // route with the different http verbs as methods
    app.route('/minesweeper/:id?')
        .get(MinesweeperController.read)
        .post(MinesweeperController.play)
        .put(MinesweeperController.nextAction);
};
