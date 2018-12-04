'use strict';

module.exports = function(app, LotteryController, BetController, PlayerInterface) {
    // ping url for newrelic
    app.get('/ping', function(req, res) {
        res.send('pong');
    });

    app.use(PlayerInterface.extractApiToken);

    app.get('/bet/next', BetController.next);

    app.get('/bet/leaderboard', BetController.leaderboard);

    // express 4 style routing. You can set up "mount points" for a
    // route with the different http verbs as methods
    app.route('/bet/:id?')
        .get(BetController.read)
        .post(BetController.play);

    app.get('/lottery/active', function(req, res) { LotteryController.readActive(req, res); });
    app.get('/lottery/active/player', function(req, res) { LotteryController.readPlayerActive(req, res); });
    app.route('/lottery/:id?')
        .get(LotteryController.read);
    

};
