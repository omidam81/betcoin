'use strict';

var express = require('express');

module.exports = function(logger, io, HTTPError, provable, BaseGameController, BaseGameModel) {

    //get the game's model
    var GameModel = require('./src/model')(BaseGameModel, logger, HTTPError, provable);
    // and pass it to the game's controller
    var GameController = require('./src/controller')(GameModel, logger, io, HTTPError, BaseGameController);
    var controller = new GameController();

    var router = express.Router();
    // now register routes for the game express for somee reason does
    // not keep the `this` object correct, so we have to bind these
    router.get('/next', controller.next.bind(controller));
    router.get('/leaderboard', controller.leaderboard.bind(controller));

    router.route('/:id?')
        .get(controller.read.bind(controller))
        .post(controller.play.bind(controller));

    var publicRouter = express.Router();
    publicRouter.get('/', controller.read.bind(controller));

    return {
        router: router,
        publicRouter: publicRouter,
        controller: GameController,
        model: GameModel
    };

};
