'use strict';

var path = require('path');
var extend = require('util')._extend;

var fs = require('fs');
var ejs = require('ejs');

var WEB_URL = "www.betcoin.tm";

var emailTemplate = fs.readFileSync(path.normalize(__dirname + '/../templates/email.html')).toString();

var EMAIL = {
    'game_socket_error_report': {
        subject: 'Cache Node Server - Game Socket Error Report',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/game_socket_error_report.html')).toString()
    }
};

var EmailService = function(configs, logger) {
    this.send = function(email, template, options, cb) {
        var mandrill = require('mandrill-api');
        var mail = new mandrill.Mandrill(configs.MANDRILL_KEY);
        if (cb === undefined) cb = function(err) {
            if (err) return logger.log('error', err.message);
        };
        // if (process.env.NODE_ENV === 'test') return cb();
        var subject = EMAIL[template].subject;
        options = extend({ WEB_URL: WEB_URL }, options);
        var body = ejs.render(EMAIL[template].body, options);
        body = ejs.render(emailTemplate, {
            body: body,
            subject: subject
        });
        var message = {
            "html": body,
            "subject": subject,
            "from_email": "noreply@betcoin.tm",
            "from_name": "BetCoin ™ VIP",
            "to": [{
                "email": email,
                "type": "to"
            }]
        };
        mail.messages.send({
            "message": message,
            "async": true,
            "ip_pool": "Main Pool"
        }, function() {
            cb();
        }, function(err) {
            cb(err);
        });
    };
};

module.exports = EmailService;
