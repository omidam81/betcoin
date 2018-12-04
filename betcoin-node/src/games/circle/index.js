'use strict';

var express = require('express');

module.exports = function(logger, io, HTTPError, provable, BaseGameController, BaseGameModel) {

    // in the case of circle, we need to loasdd in the game
    // configuration, for other games, there may be other resources to
    // load here as well, just make sure the return at the end of this
    // function works synchronously
    var games = require('./src/games');
    //get the game's model
    var GameModel = require('./src/model')(BaseGameModel, games, logger, HTTPError, provable);
    // and passit it to the game's controller
    var GameController = require('./src/controller')(GameModel, logger, io, HTTPError, BaseGameController);
    var controller = new GameController();
    var router = express.Router();
    // now register routes for the game not sure why we don't have to
    // use `Function#bind()` here, maybe it has something to do with
    // inheritence?
    router.get('/next', controller.next.bind(controller));
    router.get('/leaderboard', controller.leaderboard.bind(controller));

    router.route('/:id?')
        .get(controller.read.bind(controller))
        .post(controller.play.bind(controller));

    var publicRouter = express.Router();
    publicRouter.get('/', function(req, res, next) {
        controller.read(req, res, next);
    });

    return {
        router: router,
        publicRouter: publicRouter,
        controller: GameController,
        model: GameModel
    };

};
