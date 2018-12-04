'use strict';


module.exports = function(app, FantanController, PlayerInterface) {

    app.use(PlayerInterface.extractApiToken);

    app.get('/fantan/next', FantanController.next);
    app.get('/fantan/leaderboard', FantanController.leaderboard);

    // express 4 style routing. You can set up "mount points" for a
    // route with the different http verbs as methods
    app.route('/fantan/:id?')
        .get(FantanController.read)
        .post(FantanController.play);

};
