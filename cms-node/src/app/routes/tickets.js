'use strict';

var Ticket = function () {

    var ticketModel = require('./../models/tickets').Ticket;
    var admin = require('./../../config/admin');

    // handle the incoming request of creating a ticket
    this.create = function (req, res){
        ticketModel.create(req.body, function(err, doc){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send({result: true, id: doc._id});
            }
        });
    };

    // handle the incoming request of updating a ticket
    this.update = function (req, res){
        var id = req.params.id,
        status = req.body.status;
        // checks if the id is being supplied
        if(typeof id === "undefined" || typeof id === null){
            res.send(400, { message: "Request invalid, missing parameters"} );
        }   
        // checks if the status is being supplied
        if(typeof status === "undefined" || typeof status === null){
            res.send(400, { message: "Request invalid, missing parameters"} );
        }

        ticketModel.update(id, status, function(err){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send({result: true});
            }
        });
    };

    // handle incoming request updating the ticket with comment
    this.updateWithComment = function (req, res){
        var id = req.params.id;
        // checks if the id is being supplied
        if(typeof id === "undefined" || typeof id === null){
            res.send(400, { message: "Request invalid, missing parameters"} );
        }

        ticketModel.updateWithComment(id, req.body, function(err, doc){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send({result: true, data: doc});
            }
        });
    };

    // handle incoming request getting the specific ticket
    this.read = function (req, res){
        var id = req.params.id;
        
        // check if the id is being supplied
        if(typeof id === "undefined" || typeof id === null){
            res.send(400, { message: "Request invalid, missing parameters"} );
        }       
        
        ticketModel.read(id, function(err, doc){
            if(err instanceof Error){
                res.send({result: false});
            } else {
                res.send({result: true, data: doc});
            }           

        });
    };

    //handle for incoming request for getting the tickets based on status
    this.reads = function (req, res){
        var status = req.params.status;
        // check if the status is being supplied    
        if(typeof status === "undefined" || typeof status === null){
            res.send(400, { message: "Request invalid, missing parameters"} );
        }       

        ticketModel.reads(status, function(err, docs){
            if(err instanceof Error){
                console.log(err);
                res.send({result: false});
            } else {
                res.send({result: true, data: docs, length: docs.length});
            }           
        });
    };

    // authenticates;
    this.login = function(req, res) {
        var username = req.body.username || '';
        var password = req.body.password || '';
        if(username === admin.username && password === admin.password && admin.ips.indexOf(req.ip) !== -1){
            console.log('authenticated');
            res.cookie('mycookie', 'bar', { domain: 'localhost:10301' });
            res.send({result: true});
        } else {
            res.send({result: false, message: "Incorrect login details"});
        }   
    };  

    // authenticates;
    this.logout = function(req, res) {
        req.session = null;
        res.send({result: true});
    };  

    this.checkAuthentication = function (req, res, next) {
        if (admin.ips.indexOf(req.ip) < 0) {
            res.send(403);
        } else {
            next();
        }
    };
};

exports.Ticket = new Ticket();
