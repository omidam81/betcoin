'use strict';

module.exports = function(app, PlayerInterface) {
    app.get('/ticket/:id', function(req, res) {
        PlayerInterface.getTicket({
            id: req.params.id
        }, function(err, ticket) {
            if (err) return res.json(500, err);
            res.json(200, ticket);
        });
    });
    app.get('/ticket/status/:status', function(req, res) {
        PlayerInterface.getTicketList({
            status: req.params.status
        }, function(err, tickets) {
            if (err) return res.json(500, err);
            res.json(200, tickets);
        });
    });
    app.put('/ticket/:id', function(req, res) {
        PlayerInterface.updateTicketStatus({
            id: req.params.id,
            status: req.body.status
        }, function(err) {
            if(err) return res.json(500, err);
            res.json(200);
        });
    });
    app.put('/ticket/comment/:id', function(req, res) {
        PlayerInterface.updateTicketWithComment({
            id: req.params.id,
            status: req.body.status,
            message: req.body.comment
        }, function(err, ticket) {
            if(err) return res.json(500, err);
            res.json(200, ticket);
        });
    });
};