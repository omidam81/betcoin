'use strict';

var express = require('express');

module.exports = function(mongo, BaseModel, BaseGameModel, gameModelStore, logger, io, HTTPError, provable, BaseGameController, NotificationController, Wallet, User) {
    var Games = require('./src/games');
    //get the game's model
    var BetModel = require('./src/bet-model')(BaseGameModel, logger, HTTPError, provable);
    var LotteryModel = require('./src/lottery-model')(BaseModel, gameModelStore, BetModel, logger, HTTPError, new NotificationController(), provable, User);
    // and pass it to the game's controller
    var Scheduler = require('./src/scheduler')(mongo, logger, HTTPError, io, Wallet);
    var GameController = require('./src/controller')(BaseGameController, BetModel, LotteryModel, Scheduler, io, logger, HTTPError);
    var controller = new GameController();

    var setupGames = function() {
        Scheduler.init();
        Games.forEach(function(game) {
            controller.active({interval:game.interval, currency: game.currency}, function(err, lotteries) {
                if (err) throw err;
                if (!lotteries.length) {
                    var config = Scheduler.getStartAndEnd(game.interval);
                    config.interval = game.interval;
                    config.currency = game.currency;
                    controller.create(config, function(err) {
                        if (err) throw err;
                    });
                } else {
                    Scheduler.scheduleLottery(lotteries[0], controller.create);
                }
            });
        });

    };

    var router = express.Router();
    var publicRouter = express.Router();
    var LotteryMiddleware = require('./src/lottery-middleware')(HTTPError, LotteryModel);
    // now register routes for the game express for somee reason does
    // not keep the `this` object correct, so we have to bind these
    router.get('/bet/leaderboard', controller.leaderboard.bind(controller));

    router.get('/bet/next', controller.next.bind(controller));
    router.route('/bet/:id?')
        .get(controller.readBets.bind(controller))
        .post(LotteryMiddleware, controller.play.bind(controller));
    router.route('/lottery/active')
        .get(controller.readActive.bind(controller));
    router.route('/lottery/active/player')
        .get(controller.readPlayerActive.bind(controller));
    router.route('/lottery/:id?')
        .get(controller.read.bind(controller));

    publicRouter.get('/lottery/active', controller.readActive.bind(controller));
    publicRouter.get('/bet', controller.readBets.bind(controller));
    publicRouter.get('/lottery', controller.read.bind(controller));
    return {
        router: router,
        publicRouter: publicRouter,
        controller: GameController,
        model: BetModel,
        serviceSetup: setupGames
    };

};
