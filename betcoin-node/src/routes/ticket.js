'use strict';

var express = require('express');

module.exports = function(TicketController, auth, User) {
    var router = express.Router({
        mergeParam: true
    });

    var ticketController = new TicketController();

    router.use(function(req, res, next) {
        auth.checkToken(req, res, function(err) {
            if (err) {
                // here we have an unauthed user sending a ticket,
                // make sure they have the params we need
                req.user = new User({
                    email: req.body.email,
                    username: req.body.owner || "Non VIP",
                    anonymous: true
                });
            }
            next();
        });
    });
    router.route('/:ticketId?')
        .post(ticketController.create.bind(ticketController))
        .all(ticketController.readMiddleware.bind(ticketController))
        .get(ticketController.read.bind(ticketController))
        .put(ticketController.userComment.bind(ticketController));

    return router;
};
