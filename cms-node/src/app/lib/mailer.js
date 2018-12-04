'use strict';

var MailNotifier = function() {

    var mandrill = require('mandrill-api/mandrill');
    var mandrill_client = new mandrill.Mandrill('MGfi-zRR1EKavpVh5LSQOQ');

    this.sendMessage = function(ticketObject, cb){
        var async = false;
        var ip_pool = "Main Pool";
        var send_at = "send_at";
        var adminMessages = ticketObject.comments.filter(function(message) {
            return message.isAdmin;
        });
        var message = {
            "html": "<h3>BetCoin ™ Support</h3><br><hr><br>" +
                "<p>The BetCoin support staff has responded to your support ticket #"+ ticketObject._id + "</p>" + 
                "<p style=\"margin-left: 20px\">" + adminMessages.pop().message + "</p>" + 
                "<p>Click <a href='https://www.betcoin.tm/support/view/" + ticketObject._id+"'> here</a> " +
                "to respond.</p>" +
                "<p>If the above link does not work, you can view the ticket by visiting " +
                "https://www.betcoin.tm/support/view/" + ticketObject._id + " in your web browser</p>" +
                "<p>Thanks,<br>BetCoin ™ Support</p>",
            "subject": "BetCoin ™ Support Ticket Response RE: " + ticketObject.subject,
            "from_email": "support@betcoin.tm",
            "from_name": "Betcoin ™ Support",
            "to": [{
                "email": ticketObject.email,
                "name": ticketObject.name,
                "type": "to"
            }],
            "headers": {
                "Reply-To": "support@betcoin.tm"
            }
        };    

        mandrill_client.messages.send({
            "message": message,
            "async": async,
            "ip_pool": ip_pool,
            "example send_at": send_at
        }, function() {
            return cb(null, true);
        }, function(e) {
            console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
            return cb(e, false);
        });   
    };
};

exports.MailNotifier = new MailNotifier();
