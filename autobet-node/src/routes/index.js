'use strict';


module.exports = function(app, AutobetController, PlayerInterface) {

    app.use(PlayerInterface.extractApiToken);
    app.route('/autobet/games')
        .get(AutobetController.getGames);
    app.route('/autobet/:player_id?')
        .get(AutobetController.read)
        .post(AutobetController.addNewUser);
    app.route('/autobet/:player_id/game/:gameId?')
        .post(AutobetController.addNewGameAutobet)
        .put(AutobetController.updateGameAutobet)
        .delete(AutobetController.removeGameAutobet);
};
