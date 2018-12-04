'use strict';

var Ticket = function () {

    
    var mongoose = require('mongoose');
    var TicketsSchema = new mongoose.Schema({
        owner: String,
        email: String,
        subject: String,
        description: String, 
        priority: Number, // low = 1, normal = 2, high = 3,  urgent = 4
        status: {type: Number, default: 3}, // open = 1, closed = 2, pending = 3,  flagged = 4
        dateCreated: {type: Date, default: Date.now},
        comments: [{
            message: String,
            dateModified: {type: Date, default: Date.now},
            isAdmin: {type: Boolean, default: true}
        }],
        ticketType: Number // incident = 1, question = 2, problem = 3,  task = 4
    });

    var Ticket = mongoose.model('Ticket', TicketsSchema);
    
    // creates a ticket
    this.create = function (data, cb){
        var ticket = new Ticket();
        ticket.owner = data.owner;
        ticket.email = data.email;
        ticket.subject = data.subject;
        ticket.description = data.description;
        ticket.priority = data.priority;
        ticket.ticketType = data.type;
        ticket.save(function(err, ticket){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                return cb(null, ticket);
            }
        });
    };

    // updates the ticket with comments
    this.updateWithComment = function (id, comment, cb){
        var commentObj = {};
        commentObj.message = comment.comment;
        commentObj.isAdmin = comment.isAdmin;
        var update = (!comment.isAdmin) ? {$push : {comments: commentObj}} :  {status: comment.status, $push : {comments: commentObj}};
        Ticket.findOneAndUpdate({_id: id}, update, function(err, doc){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                var comments = doc.comments;
                if(comment.isAdmin){
                    var mailer = require('./../lib/mailer').MailNotifier;
                    mailer.sendMessage(doc, function(err){
                        if(err) {
                            return cb(err, false);
                        } else {
                            return cb(null, comments[comments.length - 1]);
                        }
                    });
                } else {
                    return cb(null, comments[comments.length - 1]);
                }          
            }           
        });
    };

    // update ticket
    this.update = function (id, status, cb){
        Ticket.findByIdAndUpdate(id, {$set : {status: status}}, function(err, doc){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                return cb(null, doc);
            }
        });
    };

    // get specific ticket document
    this.read = function (id, cb){
        Ticket.findOne({_id: id}, function(err, doc){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                return cb(null, doc);
            }   
        });
    };

    //get all the tickets based on the status
    this.reads = function(status, cb){
        Ticket.find({status: status}, function(err, docs){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                return cb(null, docs);
            }   
        });
    };
};

exports.Ticket = new Ticket();
